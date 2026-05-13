import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ConsentsTab() {
  const { organizationId } = useCurrentOrganization();

  const { data: consents = [] } = useQuery({
    queryKey: ["consents", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase.from("data_consents").select("*")
        .eq("organization_id", organizationId!).order("updated_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consentimentos e base legal</CardTitle>
        <p className="text-sm text-muted-foreground">
          Registre concessão, revogação e base legal por colaborador ou candidato. Consentimentos novos podem ser
          criados via API/Edge Function (governance-consent-update) ou nos fluxos de candidatura e admissão.
        </p>
      </CardHeader>
      <CardContent>
        {consents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum consentimento registrado.</p>
        ) : (
          <div className="space-y-2">
            {consents.map((c) => (
              <div key={c.id} className="border rounded-md p-3 flex items-center justify-between text-sm flex-wrap gap-2">
                <div>
                  <div className="font-medium">{c.purpose}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.subject_type} · {c.subject_id.slice(0, 8)} · base legal: {c.legal_basis}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.ai_processing_allowed && <Badge variant="outline">IA permitida</Badge>}
                  {c.talent_pool_opt_in && <Badge variant="outline">Banco de talentos</Badge>}
                  <Badge variant={c.consent_status === "granted" ? "default" : c.consent_status === "revoked" ? "destructive" : "secondary"}>
                    {c.consent_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
