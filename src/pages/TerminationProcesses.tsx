import Layout from "@/components/Layout";
import { useTerminationProcesses, useTerminationAction } from "@/hooks/useTerminationProcess";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  TERMINATION_REASON_LABELS, TERMINATION_DECISION_LABELS, TERMINATION_CAUSE_LABELS,
} from "@/constants/terminationOptions";

const statusLabel: Record<string, string> = {
  iniciado: "Iniciado", aviso_previo: "Aviso prévio", exames: "Exames", calculos: "Cálculos",
  documentos: "Documentos", assinatura: "Assinatura", homologacao: "Homologação",
  pagamento: "Pagamento", concluido: "Concluído", cancelado: "Cancelado",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  concluido: "default", cancelado: "destructive",
};

export default function TerminationProcesses() {
  const navigate = useNavigate();
  const { data, isLoading } = useTerminationProcesses();
  const { data: employees } = useEmployees();
  const action = useTerminationAction();
  const [open, setOpen] = useState(false);

  const activeEmployees = (employees ?? []).filter((e) => e.status === "active");
  const summary = {
    em_andamento: data?.filter((p) => p.status !== "concluido" && p.status !== "cancelado").length ?? 0,
    concluidos: data?.filter((p) => p.status === "concluido").length ?? 0,
    cancelados: data?.filter((p) => p.status === "cancelado").length ?? 0,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Processos de Rescisão</h1>
            <p className="text-muted-foreground">Workflow completo de desligamento (aviso, exames, cálculos, assinatura, homologação)</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4 mr-2" />Novo processo</Button>
            </DialogTrigger>
            <NewProcessDialog employees={activeEmployees} onClose={() => setOpen(false)} action={action} onCreated={(pid) => { setOpen(false); navigate(`/terminations/processes/${pid}`); }} />
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard label="Em andamento" value={summary.em_andamento} />
          <SummaryCard label="Concluídos" value={summary.concluidos} />
          <SummaryCard label="Cancelados" value={summary.cancelados} />
        </div>

        <Card>
          <CardHeader><CardTitle>Processos ({data?.length ?? 0})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : !data?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum processo registrado. Clique em "Novo processo" para iniciar.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Data prevista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((p: any) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/terminations/processes/${p.id}`)}>
                      <TableCell className="font-medium">{p.employee?.full_name ?? "-"}</TableCell>
                      <TableCell>{p.termination_reason ? (TERMINATION_REASON_LABELS as any)[p.termination_reason] ?? p.termination_reason : "-"}</TableCell>
                      <TableCell>{p.termination_date ? format(new Date(p.termination_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "-"}</TableCell>
                      <TableCell><Badge variant={statusVariant[p.status] ?? "outline"}>{statusLabel[p.status]}</Badge></TableCell>
                      <TableCell>{format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell><Button size="sm" variant="ghost">Abrir</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-bold">{value}</p></CardContent></Card>
  );
}

function NewProcessDialog({ employees, onClose, action, onCreated }: { employees: any[]; onClose: () => void; action: any; onCreated: (id: string) => void }) {
  const [form, setForm] = useState<any>({
    employee_id: "", termination_reason: "", termination_decision: "", termination_cause: "",
    notice_type: "worked", notice_start_date: "", termination_date: "", notes: "",
  });
  const submit = async () => {
    if (!form.employee_id) { toast.error("Selecione um colaborador"); return; }
    try {
      const res = await action.mutateAsync({ action: "create", ...form });
      toast.success("Processo criado");
      onCreated(res.process.id);
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle>Novo processo de rescisão</DialogTitle></DialogHeader>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        <div>
          <Label>Colaborador</Label>
          <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Motivo</Label>
            <Select value={form.termination_reason} onValueChange={(v) => setForm({ ...form, termination_reason: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {Object.entries(TERMINATION_REASON_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v as string}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Decisão</Label>
            <Select value={form.termination_decision} onValueChange={(v) => setForm({ ...form, termination_decision: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {Object.entries(TERMINATION_DECISION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v as string}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Causa</Label>
            <Select value={form.termination_cause} onValueChange={(v) => setForm({ ...form, termination_cause: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {Object.entries(TERMINATION_CAUSE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v as string}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Aviso prévio</Label>
            <Select value={form.notice_type} onValueChange={(v) => setForm({ ...form, notice_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="worked">Trabalhado</SelectItem>
                <SelectItem value="indemnified">Indenizado</SelectItem>
                <SelectItem value="waived">Dispensado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Início do aviso</Label><Input type="date" value={form.notice_start_date} onChange={(e) => setForm({ ...form, notice_start_date: e.target.value })} /></div>
          <div><Label>Data prevista da rescisão</Label><Input type="date" value={form.termination_date} onChange={(e) => setForm({ ...form, termination_date: e.target.value })} /></div>
        </div>
        <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit} disabled={action.isPending}>Criar processo</Button>
      </DialogFooter>
    </DialogContent>
  );
}
