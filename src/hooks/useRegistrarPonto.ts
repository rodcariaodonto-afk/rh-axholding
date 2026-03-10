import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPosition, haversineDistance } from "@/lib/geolocation";
import { hashSHA256 } from "@/lib/hashSHA256";
import { toBrasiliaDate } from "@/lib/timezone";

interface RegistrarPontoInput {
  locationId: string;
  expectedLat: number;
  expectedLng: number;
  expectedRadius: number;
}

export function useRegistrarPonto() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Get employee's organization
  const { data: employee } = useQuery({
    queryKey: ["employee-org", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("employees")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const registrar = useMutation({
    mutationFn: async (input: RegistrarPontoInput) => {
      if (!user?.id || !employee?.organization_id) throw new Error("Usuário não autenticado");

      // 1. Check rate limit (5 min)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("ponto_registros")
        .select("id")
        .eq("employee_id", user.id)
        .gte("created_at", fiveMinAgo)
        .limit(1);

      if (recent && recent.length > 0) {
        throw new Error("Aguarde 5 minutos entre registros de ponto.");
      }

      // 2. Validate location exists
      const { data: location, error: locError } = await supabase
        .from("organization_locations")
        .select("*")
        .eq("id", input.locationId)
        .eq("is_active", true)
        .maybeSingle();

      if (locError || !location) {
        throw new Error("Local não encontrado ou inativo.");
      }

      // 3. Get GPS position
      const position = await getCurrentPosition();

      // 4. Calculate distance
      const distance = haversineDistance(
        position.latitude,
        position.longitude,
        location.latitude,
        location.longitude
      );

      // 5. Check if within radius
      if (distance > location.radius_meters) {
        // Log failed attempt
        await supabase.from("auditoria_ponto").insert({
          organization_id: employee.organization_id,
          user_id: user.id,
          acao: "registro_negado_fora_geocerca",
          detalhes: {
            location_id: input.locationId,
            distance_meters: Math.round(distance),
            radius_meters: location.radius_meters,
            gps_lat: position.latitude,
            gps_lng: position.longitude,
          },
        });

        throw new Error(
          `Você está a ${Math.round(distance)}m do local autorizado (raio máximo: ${location.radius_meters}m).`
        );
      }

      // 6. Generate SHA-256 hash
      const now = new Date().toISOString();
      const hashInput = `${user.id}|${input.locationId}|${now}|${position.latitude}|${position.longitude}`;
      const hash = await hashSHA256(hashInput);

      // 7. Insert ponto_registros record
      const { data: registro, error: insertError } = await supabase
        .from("ponto_registros")
        .insert({
          organization_id: employee.organization_id,
          employee_id: user.id,
          location_id: input.locationId,
          gps_latitude: position.latitude,
          gps_longitude: position.longitude,
          gps_accuracy: position.accuracy,
          distance_meters: Math.round(distance),
          hash_sha256: hash,
          metodo_registro: "qrcode_gps",
          status: "registrado",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 8. Also create a time_entries record so it appears in the main system
      // Use Brasília timezone for the date
      const brasiliaDate = toBrasiliaDate(new Date().toISOString());
      const today = brasiliaDate.getFullYear() + '-' + 
        String(brasiliaDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(brasiliaDate.getDate()).padStart(2, '0');
      const clockInTime = new Date().toISOString();

      // Check if there's an open time entry (no clock_out) for today
      const { data: openEntry } = await supabase
        .from("time_entries")
        .select("id, clock_in")
        .eq("employee_id", user.id)
        .eq("date", today)
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (openEntry) {
        // Clock out the open entry
        const clockIn = new Date(openEntry.clock_in);
        const clockOut = new Date();
        const totalMinutes = Math.round((clockOut.getTime() - clockIn.getTime()) / 60000);

        await supabase
          .from("time_entries")
          .update({
            clock_out: clockInTime,
            total_minutes: totalMinutes,
          })
          .eq("id", openEntry.id);
      } else {
        // Clock in - create new entry
        const { error: timeEntryError } = await supabase
          .from("time_entries")
          .insert({
            employee_id: user.id,
            organization_id: employee.organization_id,
            date: today,
            clock_in: clockInTime,
            clock_in_latitude: position.latitude,
            clock_in_longitude: position.longitude,
            clock_in_accuracy: position.accuracy,
            clock_in_within_fence: true,
          });

        if (timeEntryError) {
          console.error("Erro ao criar time_entry:", timeEntryError);
        }
      }

      // 8. Audit log
      await supabase.from("auditoria_ponto").insert({
        organization_id: employee.organization_id,
        user_id: user.id,
        acao: "registro_ponto_qrcode",
        detalhes: {
          registro_id: registro.id,
          location_id: input.locationId,
          location_name: location.name,
          distance_meters: Math.round(distance),
        },
        hash_atual: hash,
      });

      return { registro, distance: Math.round(distance), locationName: location.name };
    },
    onSuccess: (data) => {
      toast({
        title: "Ponto registrado!",
        description: `Local: ${data.locationName} · Distância: ${data.distance}m`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar ponto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { registrar, organizationId: employee?.organization_id };
}
