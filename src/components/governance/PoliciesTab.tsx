import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { Save } from "lucide-react";

export function PoliciesTab() {
  const { organizationId } = useCurrentOrganization();
  const qc = useQueryClient();

  const { data: policy } = useQuery({
    queryKey: ["dgp", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data } = await supabase.from("data_governance_policies").select("*")
        .eq("organization_id", organizationId!).maybeSingle();
      return data;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (policy) setForm(policy); }, [policy]);

  const save = async () => {
    if (!organizationId) return;
    try {
      const { error } = await supabase.from("data_governance_policies")
        .upsert({ ...form, organization_id: organizationId }, { onConflict: "organization_id" });
      if (error) throw error;
      toast.success("Políticas atualizadas.");
      qc.invalidateQueries({ queryKey: ["dgp", organizationId] });
    } catch (e) {
      toast.error("Falha: " + String(e));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upd = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <Card>
      <CardHeader><CardTitle>Políticas de governança</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Retenção de candidatos (dias)</Label>
            <Input type="number" value={form.candidate_retention_days ?? ""} onChange={(e) => upd("candidate_retention_days", Number(e.target.value))} />
          </div>
          <div>
            <Label>Retenção de colab. desligados (dias)</Label>
            <Input type="number" value={form.terminated_employee_retention_days ?? ""} onChange={(e) => upd("terminated_employee_retention_days", Number(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">Recomendado: 1825 (5 anos CLT).</p>
          </div>
          <div>
            <Label>Retenção de documentos (dias)</Label>
            <Input type="number" value={form.document_retention_days ?? ""} onChange={(e) => upd("document_retention_days", Number(e.target.value))} />
          </div>
          <div>
            <Label>TTL link de exportação (dias)</Label>
            <Input type="number" value={form.export_link_ttl_days ?? ""} onChange={(e) => upd("export_link_ttl_days", Number(e.target.value))} />
          </div>
          <div>
            <Label>SLA pedidos LGPD (dias)</Label>
            <Input type="number" value={form.dsr_response_sla_days ?? ""} onChange={(e) => upd("dsr_response_sla_days", Number(e.target.value))} />
          </div>
          <div>
            <Label>Política de IA em recrutamento</Label>
            <select className="mt-1 w-full h-10 rounded-md border bg-background px-3" value={form.ai_recruitment_policy ?? "allowed_with_consent"}
              onChange={(e) => upd("ai_recruitment_policy", e.target.value)}>
              <option value="forbidden">Proibida</option>
              <option value="allowed_with_consent">Permitida com consentimento</option>
              <option value="allowed">Permitida</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <div className="font-medium">Logging de acesso a documentos</div>
              <div className="text-xs text-muted-foreground">Registra cada visualização/download em auditoria.</div>
            </div>
            <Switch checked={!!form.document_access_logging} onCheckedChange={(v) => upd("document_access_logging", v)} />
          </div>
          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <div className="font-medium">Classificação de dados obrigatória</div>
              <div className="text-xs text-muted-foreground">Recursos sem classificação aparecem como issue de conformidade.</div>
            </div>
            <Switch checked={!!form.data_classification_required} onCheckedChange={(v) => upd("data_classification_required", v)} />
          </div>
          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <div className="font-medium">Exportações sensíveis exigem 2FA</div>
              <div className="text-xs text-muted-foreground">Será aplicado quando integração 2FA estiver ativa.</div>
            </div>
            <Switch checked={!!form.sensitive_export_requires_2fa} onCheckedChange={(v) => upd("sensitive_export_requires_2fa", v)} />
          </div>
        </div>

        <Button onClick={save}><Save className="h-4 w-4 mr-2" />Salvar políticas</Button>
      </CardContent>
    </Card>
  );
}
