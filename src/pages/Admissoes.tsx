import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdmissions, useCreateAdmission } from "@/hooks/useAdmissions";
import { useDepartments } from "@/hooks/useDepartments";
import { usePositions } from "@/hooks/usePositions";
import { useUnits } from "@/hooks/useUnits";
import { useEmployees } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Mail, Calendar, Eye } from "lucide-react";
import { toast } from "sonner";

const CONTRACT_TYPE_OPTIONS = [
  { value: "full_time", label: "CLT - Tempo Integral" },
  { value: "part_time", label: "Meio Período" },
  { value: "contractor", label: "PJ / Contratado" },
  { value: "intern", label: "Estagiário" },
];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "outline" },
  invited: { label: "Convidado", variant: "secondary" },
  in_progress: { label: "Em andamento", variant: "default" },
  review: { label: "Em revisão", variant: "default" },
  signed: { label: "Assinado", variant: "default" },
  completed: { label: "Concluído", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const EMPTY_FORM = {
  candidate_name: "",
  candidate_email: "",
  candidate_phone: "",
  contract_type: "",
  expected_start_date: "",
  department_id: "",
  unit_id: "",
  base_position_id: "",
  manager_id: "",
  notes: "",
};

export default function Admissoes() {
  const navigate = useNavigate();
  const { data: admissions = [], isLoading } = useAdmissions();
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  const { data: units = [] } = useUnits();
  const { data: employees = [] } = useEmployees();
  const create = useCreateAdmission();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const set = (field: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const counts = {
    total: admissions.length,
    in_progress: admissions.filter((a) => ["invited", "in_progress", "review"].includes(a.status)).length,
    completed: admissions.filter((a) => a.status === "completed").length,
    cancelled: admissions.filter((a) => a.status === "cancelled").length,
  };

  const activeEmployees = (employees as { id: string; full_name?: string; email: string; status: string }[])
    .filter((e) => e.status === "active");

  const handleCreate = async () => {
    if (!form.candidate_name || !form.candidate_email) {
      toast.error("Preencha nome e e-mail do candidato");
      return;
    }
    try {
      const payload = {
        candidate_name: form.candidate_name,
        candidate_email: form.candidate_email,
        candidate_phone: form.candidate_phone || undefined,
        contract_type: form.contract_type || undefined,
        expected_start_date: form.expected_start_date || undefined,
        department_id: form.department_id || undefined,
        unit_id: form.unit_id || undefined,
        base_position_id: form.base_position_id || undefined,
        manager_id: form.manager_id || undefined,
        notes: form.notes || undefined,
      };
      const process = await create.mutateAsync(payload);
      toast.success("Admissão criada com sucesso");
      setOpen(false);
      setForm(EMPTY_FORM);
      navigate(`/admissoes/${process.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admissão Digital</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie processos admissionais ponta-a-ponta: do convite ao candidato até a criação do colaborador.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="size-4 mr-2" />Nova admissão</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Iniciar nova admissão</DialogTitle>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 space-y-6 py-2 pr-1">
              {/* Seção 1 — Dados do Candidato */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Dados do Candidato
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Nome completo *</Label>
                    <Input
                      className="mt-1"
                      value={form.candidate_name}
                      onChange={(e) => set("candidate_name")(e.target.value)}
                      placeholder="Nome do candidato"
                    />
                  </div>
                  <div>
                    <Label>E-mail *</Label>
                    <Input
                      className="mt-1"
                      type="email"
                      value={form.candidate_email}
                      onChange={(e) => set("candidate_email")(e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      className="mt-1"
                      value={form.candidate_phone}
                      onChange={(e) => set("candidate_phone")(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-border" />

              {/* Seção 2 — Posição e Contrato */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Posição e Contrato
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo de Contrato</Label>
                    <Select value={form.contract_type} onValueChange={set("contract_type")}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTRACT_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Início previsto</Label>
                    <Input
                      className="mt-1"
                      type="date"
                      value={form.expected_start_date}
                      onChange={(e) => set("expected_start_date")(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Departamento</Label>
                    <Select value={form.department_id} onValueChange={set("department_id")}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {(departments as { id: string; name: string }[]).map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Select value={form.unit_id} onValueChange={set("unit_id")}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {(units as { id: string; name: string }[]).map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cargo</Label>
                    <Select value={form.base_position_id} onValueChange={set("base_position_id")}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {(positions as { id: string; title: string }[]).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gestor Direto</Label>
                    <Select value={form.manager_id} onValueChange={set("manager_id")}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeEmployees.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <hr className="border-border" />

              {/* Seção 3 — Observações */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Observações
                </h3>
                <Textarea
                  value={form.notes}
                  onChange={(e) => set("notes")(e.target.value)}
                  placeholder="Informações adicionais sobre o processo ou candidato (opcional)"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={create.isPending}>
                {create.isPending ? "Criando..." : "Criar admissão"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.total },
          { label: "Em andamento", value: counts.in_progress },
          { label: "Concluídas", value: counts.completed },
          { label: "Canceladas", value: counts.cancelled },
        ].map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{c.label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{c.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Processos</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : admissions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <UserPlus className="size-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-foreground">Nenhuma admissão ainda</p>
              <p className="text-sm mt-1">Comece criando o primeiro processo admissional.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Início previsto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admissions.map((a) => {
                  const st = statusLabels[a.status] || { label: a.status, variant: "outline" as const };
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.candidate_name}</TableCell>
                      <TableCell className="text-muted-foreground"><Mail className="inline size-3 mr-1" />{a.candidate_email}</TableCell>
                      <TableCell><Calendar className="inline size-3 mr-1" />{a.expected_start_date ? new Date(a.expected_start_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost"><Link to={`/admissoes/${a.id}`}><Eye className="size-4" /></Link></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
