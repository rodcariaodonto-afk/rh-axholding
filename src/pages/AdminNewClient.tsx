import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PlatformAdminRoute from "@/components/PlatformAdminRoute";
import { useCreateClient } from "@/hooks/useClients";
import { usePlans } from "@/hooks/usePlans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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

function NewClientInner() {
  const navigate = useNavigate();
  const create = useCreateClient();
  const { data: plans = [] } = usePlans();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    cnpj: "",
    responsible_name: "",
    responsible_email: "",
    responsible_phone: "",
    plan_slug: "professional",
    status: "trial" as "trial" | "active",
    internal_notes: "",
  });
  const [customModules, setCustomModules] = useState<string[] | null>(null);

  const selectedPlan = plans.find((p) => p.slug === form.plan_slug);
  const modulesToEnable = customModules ?? selectedPlan?.default_modules ?? [];

  const toggleModule = (key: string) => {
    const base = customModules ?? selectedPlan?.default_modules ?? [];
    setCustomModules(base.includes(key) ? base.filter((m) => m !== key) : [...base, key]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await create.mutateAsync({
      ...form,
      modules: customModules ?? undefined,
    });
    if (res?.ok) navigate(`/admin/clientes/${res.organization.id}`);
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo cliente</h1>
        <p className="text-muted-foreground">Cadastre uma nova empresa cliente. Um convite será enviado ao responsável.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Empresa</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Razão social *</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Slug (opcional)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Responsável</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome *</Label>
              <Input required value={form.responsible_name} onChange={(e) => setForm({ ...form, responsible_name: e.target.value })} />
            </div>
            <div>
              <Label>E-mail *</Label>
              <Input required type="email" value={form.responsible_email} onChange={(e) => setForm({ ...form, responsible_email: e.target.value })} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.responsible_phone} onChange={(e) => setForm({ ...form, responsible_phone: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Plano & módulos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Plano</Label>
                <Select value={form.plan_slug} onValueChange={(v) => { setForm({ ...form, plan_slug: v }); setCustomModules(null); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.name} — R$ {(p.price_cents / 100).toFixed(2)}/mês
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status inicial</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial (14 dias)</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Módulos habilitados</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg">
                {ALL_MODULES.map((m) => (
                  <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={modulesToEnable.includes(m.key)} onCheckedChange={() => toggleModule(m.key)} />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Observações internas</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={form.internal_notes}
              onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
              placeholder="Visível apenas para Super Admin AXIS"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/clientes")}>Cancelar</Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Criando..." : "Criar cliente e enviar convite"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function AdminNewClient() {
  return (
    <PlatformAdminRoute>
      <NewClientInner />
    </PlatformAdminRoute>
  );
}
