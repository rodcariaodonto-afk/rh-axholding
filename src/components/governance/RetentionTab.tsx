import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Trash2, PlayCircle } from "lucide-react";

export function RetentionTab() {
  const { organizationId } = useCurrentOrganization();
  const qc = useQueryClient();

  const { data: jobs = [] } = useQuery({
    queryKey: ["retention-jobs", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase.from("retention_jobs").select("*")
        .eq("organization_id", organizationId!).order("scheduled_for", { ascending: true }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: policies } = useQuery({
    queryKey: ["dgp", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data } = await supabase.from("data_governance_policies").select("*")
        .eq("organization_id", organizationId!).maybeSingle();
      return data;
    },
  });

  const runAll = async () => {
    try {
      const { error } = await supabase.functions.invoke("governance-retention-run", {
        body: { organization_id: organizationId },
      });
      if (error) throw error;
      toast.success("Jobs de retenção executados.");
      qc.invalidateQueries({ queryKey: ["retention-jobs", organizationId] });
    } catch (e) {
      toast.error("Falha: " + String(e));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Política atual</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><div className="text-muted-foreground">Candidatos</div><div className="font-bold">{policies?.candidate_retention_days ?? 730} dias</div></div>
          <div><div className="text-muted-foreground">Desligados</div><div className="font-bold">{policies?.terminated_employee_retention_days ?? 1825} dias</div></div>
          <div><div className="text-muted-foreground">Documentos</div><div className="font-bold">{policies?.document_retention_days ?? 1825} dias</div></div>
          <div><div className="text-muted-foreground">TTL exportações</div><div className="font-bold">{policies?.export_link_ttl_days ?? 7} dias</div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Jobs de retenção</CardTitle>
          <Button onClick={runAll} size="sm"><PlayCircle className="h-4 w-4 mr-2" />Executar pendentes</Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum job agendado. Itens classificados como obrigação legal são preservados.</p>
          ) : (
            <div className="space-y-2">
              {jobs.map((j) => (
                <div key={j.id} className="flex items-center justify-between border rounded-md p-3 text-sm">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      <Trash2 className="h-3 w-3" />
                      {j.action} → {j.target_table} / {j.target_id.slice(0, 8)}
                    </div>
                    <div className="text-muted-foreground text-xs">Agendado: {new Date(j.scheduled_for).toLocaleString("pt-BR")}</div>
                  </div>
                  <Badge variant={j.status === "completed" ? "default" : j.status === "failed" ? "destructive" : "secondary"}>
                    {j.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
