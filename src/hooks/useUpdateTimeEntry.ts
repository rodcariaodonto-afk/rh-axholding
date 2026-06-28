import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UpdateTimeEntryParams {
  id: string;
  date: string; // YYYY-MM-DD
  clock_in: string; // HH:mm
  lunch_out: string | null; // HH:mm ou null
  lunch_return: string | null; // HH:mm ou null
  clock_out: string | null; // HH:mm ou null
  motivo: string;
}

function timeToISO(date: string, time: string | null): string | null {
  if (!time) return null;
  return `${date}T${time}:00-03:00`;
}

function calcTotalMinutes(
  clockIn: string,
  clockOut: string | null,
  lunchOut: string | null,
  lunchReturn: string | null,
): number | null {
  if (!clockOut) return null;
  let total = (new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 60000;
  if (lunchOut && lunchReturn) {
    total -= (new Date(lunchReturn).getTime() - new Date(lunchOut).getTime()) / 60000;
  }
  return Math.round(total);
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateTimeEntryParams) => {
      // Capturar valores atuais antes do UPDATE para o log de auditoria
      const { data: previous } = await supabase
        .from("time_entries")
        .select("clock_in, lunch_out, lunch_return, clock_out, total_minutes")
        .eq("id", params.id)
        .single();

      const clock_in = timeToISO(params.date, params.clock_in)!;
      const lunch_out = timeToISO(params.date, params.lunch_out);
      const lunch_return = timeToISO(params.date, params.lunch_return);
      const clock_out = timeToISO(params.date, params.clock_out);
      const total_minutes = calcTotalMinutes(clock_in, clock_out, lunch_out, lunch_return);

      const { data, error } = await supabase
        .from("time_entries")
        .update({ clock_in, lunch_out, lunch_return, clock_out, total_minutes })
        .eq("id", params.id)
        .select()
        .single();

      if (error) throw error;

      // Log de auditoria — falha não reverte a edição principal
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { error: auditError } = await (supabase as any)
          .from("time_entry_edits")
          .insert({
            entry_id: params.id,
            edited_by: user?.id ?? null,
            motivo: params.motivo,
            valores_anteriores: previous ?? {},
            valores_novos: { clock_in, lunch_out, lunch_return, clock_out, total_minutes },
          });

        if (auditError) {
          console.warn("[time_entry_edits] Falha ao salvar log de auditoria:", auditError.message);
          toast.warning("Edição salva, mas o log de auditoria não pôde ser registrado.", {
            description: auditError.message,
          });
        }
      } catch (auditEx) {
        console.warn("[time_entry_edits] Exceção ao salvar log de auditoria:", auditEx);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success("Batida de ponto atualizada com sucesso.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar batida de ponto.", { description: error.message });
    },
  });
}
