import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useOrganizationLocations } from "@/hooks/useOrganizationLocations";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Trash2 } from "lucide-react";
import { AddLocationDialog } from "./AddLocationDialog";
import { useState } from "react";

export function LocationSettings() {
  const { locations, isLoading, createLocation, updateLocation, deleteLocation } = useOrganizationLocations();
  const { organizationId } = useCurrentOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: orgSettings } = useQuery({
    queryKey: ["org-geolocation-settings", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("geolocation_required")
        .eq("id", organizationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const handleToggleRequired = async (checked: boolean) => {
    if (!organizationId) return;
    const { error } = await supabase
      .from("organizations")
      .update({ geolocation_required: checked })
      .eq("id", organizationId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: checked ? "Geolocalização ativada" : "Geolocalização desativada" });
      queryClient.invalidateQueries({ queryKey: ["org-geolocation-settings"] });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="size-4" />
            Geolocalização no Ponto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Exigir localização</p>
              <p className="text-xs text-muted-foreground">
                Quando ativo, colaboradores precisam estar em um local autorizado para registrar o ponto
              </p>
            </div>
            <Switch
              checked={orgSettings?.geolocation_required ?? false}
              onCheckedChange={handleToggleRequired}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Locais Autorizados</CardTitle>
          <AddLocationDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            isPending={createLocation.isPending}
            onSubmit={(data) => {
              createLocation.mutate(data, {
                onSuccess: () => setDialogOpen(false),
              });
            }}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : locations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum local cadastrado. Adicione locais para habilitar a geocerca.
            </p>
          ) : (
            <div className="space-y-3">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{loc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} · raio {loc.radius_meters}m
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={loc.is_active ? "default" : "secondary"}>
                      {loc.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Switch
                      checked={loc.is_active}
                      onCheckedChange={(checked) =>
                        updateLocation.mutate({ id: loc.id, is_active: checked })
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteLocation.mutate(loc.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
