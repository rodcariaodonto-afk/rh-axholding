import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Download, FileWarning, ShieldCheck, Users, UserMinus, FileText, KeyRound, Activity, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function OverviewTab() {
  const { organizationId } = useCurrentOrganization();

  const { data, isLoading } = useQuery({
    queryKey: ["governance-overview", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
      const [lastExport, dsrOpen, retentionPending, criticalEvents, policies, activeEmps, candidates, owners] = await Promise.all([
        supabase.from("data_exports").select("*").eq("organization_id", organizationId!).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("data_subject_requests").select("id", { count: "exact", head: true }).eq("organization_id", organizationId!).not("status", "in", "(resolved,rejected)"),
        supabase.from("retention_jobs").select("id", { count: "exact", head: true }).eq("organization_id", organizationId!).eq("status", "pending"),
        supabase.from("audit_log").select("id", { count: "exact", head: true }).eq("organization_id", organizationId!).eq("severity", "critical").gte("created_at", since30),
        supabase.from("data_governance_policies").select("*").eq("organization_id", organizationId!).maybeSingle(),
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("organization_id", organizationId!).eq("status", "active"),
        supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("organization_id", organizationId!),
        supabase.from("organization_members").select("user_id", { count: "exact", head: true }).eq("organization_id", organizationId!).eq("is_owner", true),
      ]);
      return {
        lastExport: lastExport.data,
        dsrOpen: dsrOpen.count ?? 0,
        retentionPending: retentionPending.count ?? 0,
        criticalEvents: criticalEvents.count ?? 0,
        policies: policies.data,
        activeEmps: activeEmps.count ?? 0,
        candidates: candidates.count ?? 0,
        owners: owners.count ?? 0,
      };
    },
  });

  if (isLoading || !data) return <div className="text-muted-foreground">Carregando indicadores…</div>;

  const cards = [
    { icon: Download, label: "Última exportação", value: data.lastExport ? format(new Date(data.lastExport.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "Nenhuma", sub: data.lastExport?.status },
    { icon: AlertTriangle, label: "Pedidos LGPD em aberto", value: data.dsrOpen, critical: data.dsrOpen > 0 },
    { icon: Trash2, label: "Exclusões pendentes", value: data.retentionPending },
    { icon: Activity, label: "Eventos críticos (30d)", value: data.criticalEvents, critical: data.criticalEvents > 5 },
    { icon: ShieldCheck, label: "Política de retenção", value: data.policies ? "Configurada" : "Não configurada", critical: !data.policies },
    { icon: Users, label: "Colaboradores ativos", value: data.activeEmps },
    { icon: UserMinus, label: "Candidatos em base", value: data.candidates },
    { icon: KeyRound, label: "Owners", value: data.owners },
    { icon: FileText, label: "Retenção colab. desligados (dias)", value: data.policies?.terminated_employee_retention_days ?? "—" },
    { icon: FileWarning, label: "SLA pedidos LGPD (dias)", value: data.policies?.dsr_response_sla_days ?? "—" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            <c.icon className={`h-4 w-4 ${c.critical ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{c.value}</div>
            {c.sub && <Badge variant="outline" className="mt-2">{c.sub}</Badge>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
