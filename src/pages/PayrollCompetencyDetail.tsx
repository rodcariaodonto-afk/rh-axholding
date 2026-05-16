import { useParams, useNavigate, Link } from "react-router-dom";
import { usePayrollCompetency, usePayrollCompetencyAction, usePayrollRubrics } from "@/hooks/usePayrollCompetency";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCw, Plus, Trash2, Lock, Unlock, CheckCircle2, FileDown } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCreateExportJob } from "@/hooks/useExportJobs";

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  aberta: { label: "Aberta", variant: "secondary" },
  em_processamento: { label: "Em processamento", variant: "default" },
  fechada: { label: "Fechada", variant: "outline" },
  paga: { label: "Paga", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PayrollCompetencyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = usePayrollCompetency(id);
  const { data: employees = [] } = useEmployees();
  const { data: rubrics = [] } = usePayrollRubrics();
  const action = usePayrollCompetencyAction();
  const createExport = useCreateExportJob();
  const [openAdd, setOpenAdd] = useState(false);

  const byEmployee = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { employee_id: string; events: any[]; proventos: number; descontos: number }>();
    for (const e of data.events) {
      const k = e.employee_id;
      if (!map.has(k)) map.set(k, { employee_id: k, events: [], proventos: 0, descontos: 0 });
      const row = map.get(k)!;
      row.events.push(e);
      if (e.kind === "provento") row.proventos += Number(e.amount);
      if (e.kind === "desconto") row.descontos += Number(e.amount);
    }
    return [...map.values()].map((r) => ({
      ...r,
      liquido: r.proventos - r.descontos,
      employee: (employees as any[]).find((emp) => emp.id === r.employee_id),
    })).sort((a, b) =>
      (a.employee?.full_name ?? "").localeCompare(b.employee?.full_name ?? "")
    );
  }, [data, employees]);

  const totals = useMemo(() => byEmployee.reduce((acc, r) => ({
    proventos: acc.proventos + r.proventos,
    descontos: acc.descontos + r.descontos,
    liquido: acc.liquido + r.liquido,
  }), { proventos: 0, descontos: 0, liquido: 0 }), [byEmployee]);

  if (isLoading || !data) {
    return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  }

  const { competency } = data;
  const st = STATUS_LABEL[competency.status] ?? { label: competency.status, variant: "secondary" };
  const isLocked = competency.status === "fechada" || competency.status === "paga" || competency.status === "cancelada";

  const handleGenerate = async () => {
    if (data.events.some((e) => e.source === "auto")) {
      if (!confirm("Já existem eventos gerados automaticamente. Regenerar irá sobrescrevê-los. Continuar?")) return;
    }
    try {
      const res = await action.mutateAsync({ action: "generate_base_events", competency_id: id });
      toast.success(`${res.created} eventos gerados para ${res.employees ?? 0} colaboradores`);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/payroll-competencies")}>
            <ArrowLeft className="size-4 mr-2" />Voltar
          </Button>
          <h1 className="text-3xl font-bold mt-2">Folha — {competency.reference_label}</h1>
          <p className="text-muted-foreground">
            <Badge variant={st.variant}>{st.label}</Badge>
            {competency.closed_at && <span className="ml-2 text-sm">Fechada em {new Date(competency.closed_at).toLocaleDateString("pt-BR")}</span>}
            {competency.paid_at && <span className="ml-2 text-sm">Paga em {new Date(competency.paid_at).toLocaleDateString("pt-BR")}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isLocked && (
            <Button variant="outline" onClick={handleGenerate} disabled={action.isPending}>
              <RefreshCw className="size-4 mr-2" />Gerar eventos base
            </Button>
          )}
          {!isLocked && (
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button variant="outline"><Plus className="size-4 mr-2" />Lançar evento</Button>
              </DialogTrigger>
              <AddEventDialog
                competencyId={id!}
                employees={(employees as any[]).filter((e) => e.status === "active")}
                rubrics={rubrics}
                action={action}
                onClose={() => setOpenAdd(false)}
              />
            </Dialog>
          )}
          <Button variant="outline" onClick={() => createExport.mutate({ job_type: "payroll_csv", params: { competency_id: id } })}>
            <FileDown className="size-4 mr-2" />Exportar CSV
          </Button>
          {!isLocked && competency.status !== "aberta" && (
            <Button onClick={() => action.mutate({ action: "close", competency_id: id })}>
              <Lock className="size-4 mr-2" />Fechar competência
            </Button>
          )}
          {competency.status === "fechada" && (
            <>
              <Button variant="outline" onClick={() => action.mutate({ action: "reopen", competency_id: id })}>
                <Unlock className="size-4 mr-2" />Reabrir
              </Button>
              <Button onClick={() => action.mutate({ action: "mark_paid", competency_id: id })}>
                <CheckCircle2 className="size-4 mr-2" />Marcar como paga
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Colaboradores" value={byEmployee.length.toString()} />
        <Kpi label="Total proventos" value={`R$ ${fmt(totals.proventos)}`} />
        <Kpi label="Total descontos" value={`R$ ${fmt(totals.descontos)}`} />
        <Kpi label="Líquido total" value={`R$ ${fmt(totals.liquido)}`} />
      </div>

      <Tabs defaultValue="por_colaborador">
        <TabsList>
          <TabsTrigger value="por_colaborador">Por colaborador</TabsTrigger>
          <TabsTrigger value="todos_eventos">Todos os eventos ({data.events.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="por_colaborador">
          <Card>
            <CardHeader><CardTitle>Resumo por colaborador</CardTitle></CardHeader>
            <CardContent>
              {byEmployee.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum evento lançado. Clique em "Gerar eventos base" para criar a partir dos contratos ativos.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead className="text-right">Proventos</TableHead>
                      <TableHead className="text-right">Descontos</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="text-right">Eventos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byEmployee.map((r) => (
                      <TableRow key={r.employee_id}>
                        <TableCell className="font-medium">{r.employee?.full_name ?? r.employee_id}</TableCell>
                        <TableCell className="text-right">R$ {fmt(r.proventos)}</TableCell>
                        <TableCell className="text-right text-destructive">R$ {fmt(r.descontos)}</TableCell>
                        <TableCell className="text-right font-bold">R$ {fmt(r.liquido)}</TableCell>
                        <TableCell className="text-right">{r.events.length}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">R$ {fmt(totals.proventos)}</TableCell>
                      <TableCell className="text-right">R$ {fmt(totals.descontos)}</TableCell>
                      <TableCell className="text-right">R$ {fmt(totals.liquido)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="todos_eventos">
          <Card>
            <CardHeader><CardTitle>Eventos lançados</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ref.</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.events.map((e: any) => {
                    const emp = (employees as any[]).find((x) => x.id === e.employee_id);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{emp?.full_name ?? e.employee_id.slice(0, 8)}</TableCell>
                        <TableCell><Badge variant="outline">{e.kind}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{e.code}</TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell className="text-right">{e.reference ?? "-"}</TableCell>
                        <TableCell className="text-right">R$ {fmt(Number(e.amount))}</TableCell>
                        <TableCell><Badge variant="secondary">{e.source}</Badge></TableCell>
                        <TableCell className="text-right">
                          {!isLocked && (
                            <Button size="sm" variant="ghost" onClick={() => {
                              if (confirm("Excluir este evento?"))
                                action.mutate({ action: "delete_event", competency_id: id, event_id: e.id });
                            }}>
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></CardContent></Card>;
}

function AddEventDialog({ competencyId, employees, rubrics, action, onClose }: any) {
  const [form, setForm] = useState<any>({
    employee_id: "", rubric_code: "", reference: "", amount: "",
  });
  const rubric = rubrics.find((r: any) => r.code === form.rubric_code);
  const submit = async () => {
    if (!form.employee_id || !rubric || !form.amount) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      await action.mutateAsync({
        action: "add_event", competency_id: competencyId,
        employee_id: form.employee_id, kind: rubric.kind, code: rubric.code,
        description: rubric.description,
        reference: form.reference ? Number(form.reference) : null,
        amount: Number(form.amount),
      });
      toast.success("Evento lançado");
      onClose();
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Lançar evento de folha</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Colaborador</Label>
          <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Rubrica</Label>
          <Select value={form.rubric_code} onValueChange={(v) => setForm({ ...form, rubric_code: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {rubrics.filter((r: any) => r.is_active).map((r: any) => (
                <SelectItem key={r.code} value={r.code}>
                  [{r.kind}] {r.code} — {r.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Referência (dias/horas/%)</Label><Input type="number" step="0.01" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
          <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit} disabled={action.isPending}>Lançar</Button>
      </DialogFooter>
    </DialogContent>
  );
}
