import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Lock, CheckCircle2, FileDown, ListChecks, Tags } from "lucide-react";
import {
  usePayrollCompetencies,
  useCreatePayrollCompetency,
  useUpdateCompetencyStatus,
} from "@/hooks/usePayrollCompetencies";
import { useCreateExportJob } from "@/hooks/useExportJobs";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  aberta: { label: "Aberta", variant: "secondary" },
  em_processamento: { label: "Em processamento", variant: "default" },
  fechada: { label: "Fechada", variant: "outline" },
  paga: { label: "Paga", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

export default function PayrollCompetencies() {
  const navigate = useNavigate();
  const { data: comps = [], isLoading } = usePayrollCompetencies();
  const create = useCreatePayrollCompetency();
  const updateStatus = useUpdateCompetencyStatus();
  const createExport = useCreateExportJob();
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Folha de Pagamento — Competências</h1>
          <p className="text-muted-foreground">Gestão de competências mensais e fechamento</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-1.5" />Nova competência</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Abrir competência</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              <div>
                <label className="text-xs text-muted-foreground">Mês</label>
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ano</label>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[year - 1, year, year + 1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={async () => {
                  await create.mutateAsync({ year, month });
                  setOpen(false);
                }}
                disabled={create.isPending}
              >
                Abrir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Competências</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : comps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma competência aberta.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aberta em</TableHead>
                  <TableHead>Fechada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comps.map((c: any) => {
                  const st = STATUS_LABEL[c.status] ?? { label: c.status, variant: "secondary" };
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.reference_label}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell className="text-sm">{c.opened_at ? new Date(c.opened_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-sm">{c.closed_at ? new Date(c.closed_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm" variant="outline"
                          onClick={() => createExport.mutate({ job_type: "payroll_csv", params: { competency_id: c.id } })}
                        >
                          <FileDown className="size-3.5 mr-1" />CSV
                        </Button>
                        {c.status === "aberta" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: c.id, status: "fechada" })}>
                            <Lock className="size-3.5 mr-1" />Fechar
                          </Button>
                        )}
                        {c.status === "fechada" && (
                          <Button size="sm" onClick={() => updateStatus.mutate({ id: c.id, status: "paga" })}>
                            <CheckCircle2 className="size-3.5 mr-1" />Marcar pago
                          </Button>
                        )}
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
