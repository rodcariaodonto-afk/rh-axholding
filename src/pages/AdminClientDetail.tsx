import { useParams, Link } from "react-router-dom";
import PlatformAdminRoute from "@/components/PlatformAdminRoute";
import { useClient, useClientAction, useUpdateClientPlan } from "@/hooks/useClients";
import { usePlans, useOrgModules } from "@/hooks/usePlans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pause, Play, X, Trash2, Mail, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";

const ALL_MODULES = [
  { key: "employees", label: "Colaboradores" },
  { key: "time_tracking", label: "Ponto" },
  { key: "documents", label: "Documentos" },
  { key: "organogram", label: "Organograma" },
  { key: "payroll", label: "Folha" },
  { key: "recruitment", label: "Recrutamento" },
  { key: "pdi", label: "PDI" },
  { key: "training", label: "Treinamentos" },
  { key: "signature", label: "Assinatura eletrônica" },
  { key: "culture", label: "Cultura" },
  { key: "governance", label: "Governança/LGPD" },
  { key: "audit", label: "Auditoria" },
];

function ClientDetailInner() {
  const { id } = useParams();
  const { data: client, isLoading } = useClient(id);
  const { data: plans = [] } = usePlans();
  const { data: orgModules = [] } = useOrgModules(id);
  const action = useClientAction();
  const updatePlan = useUpdateClientPlan();

  const [planSlug, setPlanSlug] = useState<string>("");
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    if (client && plans.length) {
      const current = plans.find((p) => p.id === client.plan_id)?.slug ?? "starter";
      setPlanSlug(current);
    }
  }, [client, plans]);

  useEffect(() => {
    const enabled = orgModules.filter((m: any) => m.enabled).map((m: any) => m.module_key);
    setModules(enabled);
  }, [orgModules]);

  if (isLoading || !client) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  const toggle = (k: string) => setModules((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <Button asChild variant="ghost" size="sm">
        <Link to="/admin/clientes"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span>{client.slug}</span>
            <span>·</span>
            <Badge>{client.status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Responsável</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Nome:</strong> {client.responsible_name ?? "—"}</div>
            <div><strong>E-mail:</strong> {client.responsible_email ?? "—"}</div>
            <div><strong>Telefone:</strong> {client.responsible_phone ?? "—"}</div>
            <div><strong>Último acesso:</strong> {client.last_access_at ? new Date(client.last_access_at).toLocaleString("pt-BR") : "—"}</div>
            <div><strong>Trial até:</strong> {client.trial_ends_at ? new Date(client.trial_ends_at).toLocaleDateString("pt-BR") : "—"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ações administrativas</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {client.status === "active" || client.status === "trial" ? (
              <Button variant="outline" onClick={() => action.mutate({ organization_id: client.id, action: "suspend" })}>
                <Pause className="mr-2 h-4 w-4" /> Suspender
              </Button>
            ) : (
              <Button variant="outline" onClick={() => action.mutate({ organization_id: client.id, action: "reactivate" })}>
                <Play className="mr-2 h-4 w-4" /> Reativar
              </Button>
            )}
            <Button variant="outline" onClick={() => action.mutate({ organization_id: client.id, action: "resend_invite" })}>
              <Mail className="mr-2 h-4 w-4" /> Reenviar convite
            </Button>
            <Button variant="outline" onClick={() => action.mutate({ organization_id: client.id, action: "cancel" })}>
              <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
            {client.status !== "pending_deletion" ? (
              <Button variant="destructive" onClick={() => {
                if (confirm("Agendar exclusão em 30 dias?")) {
                  action.mutate({ organization_id: client.id, action: "schedule_deletion", days: 30 });
                }
              }}>
                <Trash2 className="mr-2 h-4 w-4" /> Agendar exclusão
              </Button>
            ) : (
              <Button variant="outline" onClick={() => action.mutate({ organization_id: client.id, action: "cancel_deletion" })}>
                <RotateCcw className="mr-2 h-4 w-4" /> Cancelar exclusão
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Plano & módulos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Select value={planSlug} onValueChange={setPlanSlug}>
              <SelectTrigger className="max-w-md"><SelectValue /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg">
            {ALL_MODULES.map((m) => (
              <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={modules.includes(m.key)} onCheckedChange={() => toggle(m.key)} />
                {m.label}
              </label>
            ))}
          </div>
          <Button onClick={() => updatePlan.mutate({ organization_id: client.id, plan_slug: planSlug, modules })} disabled={updatePlan.isPending}>
            {updatePlan.isPending ? "Salvando..." : "Salvar plano & módulos"}
          </Button>
        </CardContent>
      </Card>

      {client.internal_notes && (
        <Card>
          <CardHeader><CardTitle>Observações internas</CardTitle></CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">{client.internal_notes}</CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminClientDetail() {
  return (
    <PlatformAdminRoute>
      <ClientDetailInner />
    </PlatformAdminRoute>
  );
}
