import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { usePayrollBatch, usePayrollBatchAction, downloadReceipt } from "@/hooks/usePayrollBatches";
import { useEmployees } from "@/hooks/useEmployees";
import { useMonthlyTimeEntries } from "@/hooks/useMonthlyTimeEntries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Trash2, Send, Ban, CheckCircle2, Printer, Clock } from "lucide-react";
import { toast } from "sonner";

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, "0")}min`;
}

export default function HoleriteDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = usePayrollBatch(id);
  const { data: employees = [] } = useEmployees();
  const action = usePayrollBatchAction();
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched">("all");

  // Parse competency "YYYY-MM" → Date for useMonthlyTimeEntries
  const referenceDate = useMemo(() => {
    if (!data?.batch?.competency) return new Date();
    const [year, month] = data.batch.competency.split("-");
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  }, [data?.batch?.competency]);

  const { monthEntries, isLoading: hoursLoading } = useMonthlyTimeEntries({ referenceDate });

  // Aggregate hours per employee for the competency period
  const hoursByEmployee = useMemo(() => {
    return monthEntries.reduce(
      (acc: Record<string, { minutes: number; days: number; extraMinutes: number }>, entry: any) => {
        const eid = entry.employee_id;
        if (!eid) return acc;
        if (!acc[eid]) acc[eid] = { minutes: 0, days: 0, extraMinutes: 0 };
        const mins = entry.total_minutes ?? 0;
        acc[eid].minutes += mins;
        acc[eid].days += 1;
        // Overtime estimated at >480min (8h) per day
        if (mins > 480) acc[eid].extraMinutes += mins - 480;
        return acc;
      },
      {},
    );
  }, [monthEntries]);

  const totalMinutes = useMemo(
    () => Object.values(hoursByEmployee).reduce((sum, e) => sum + e.minutes, 0),
    [hoursByEmployee],
  );
  const totalExtraMinutes = useMemo(
    () => Object.values(hoursByEmployee).reduce((sum, e) => sum + e.extraMinutes, 0),
    [hoursByEmployee],
  );
  const totalDays = useMemo(
    () => Object.values(hoursByEmployee).reduce((sum, e) => sum + e.days, 0),
    [hoursByEmployee],
  );

  if (isLoading || !data) {
    return <div className="space-y-3"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full" /></div>;
  }
  const { batch, receipts } = data;
  const filtered = receipts.filter((r) =>
    filter === "all" ? true : filter === "matched" ? r.match_status === "matched" : r.match_status !== "matched",
  );
  const activeEmployees = (employees as { id: string; full_name?: string; email?: string; status: string }[])
    .filter((e) => e.status !== "terminated");

  const doAction = async (payload: Record<string, unknown>, msg: string) => {
    try { await action.mutateAsync({ batch_id: id, ...payload }); toast.success(msg); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <>
      {/* Print styles — hidden from screen, applied only when printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          aside, nav, [data-sidebar], .no-print { display: none !important; }
          body { font-size: 11px; }
          .print-section { break-inside: avoid; }
          main { padding: 0 !important; margin: 0 !important; }
        }
      ` }} />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="no-print"><Link to="/holerites"><ArrowLeft className="size-4" /></Link></Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Lote {batch.competency}</h1>
            <p className="text-sm text-muted-foreground">{batch.receipt_type} · {batch.total_files} arquivo(s)</p>
          </div>
          <Badge>{batch.status}</Badge>
          <Button variant="outline" size="sm" className="no-print" onClick={() => window.print()}>
            <Printer className="size-4 mr-1.5" />Exportar PDF
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{batch.total_files}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Match OK</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-700">{batch.matched_count}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Pendentes</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-700">{batch.unmatched_count}</p></CardContent></Card>
        </div>

        {/* Seção de Horas Trabalhadas */}
        <Card className="print-section">
          <CardHeader className="flex flex-row items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Horas Trabalhadas — {batch.competency}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hoursLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ) : monthEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum registro de ponto encontrado para a competência {batch.competency}.
              </p>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Total de horas no mês</p>
                    <p className="text-lg font-bold mt-0.5">{formatMinutes(totalMinutes)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Horas extras (est.)</p>
                    <p className="text-lg font-bold mt-0.5 text-amber-600">{formatMinutes(totalExtraMinutes)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Dias registrados</p>
                    <p className="text-lg font-bold mt-0.5">{totalDays}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Colaboradores com ponto</p>
                    <p className="text-lg font-bold mt-0.5">{Object.keys(hoursByEmployee).length}</p>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  * Horas extras estimadas com base em 8h/dia de referência. Banco de horas e faltas são calculados conforme parametrização de jornada individual.
                </p>

                {/* Per-employee breakdown */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Total Horas</TableHead>
                      <TableHead>HE Estimada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts
                      .filter((r) => r.match_status === "matched" && r.employee_id && hoursByEmployee[r.employee_id])
                      .map((r) => {
                        const emp = r.employees as { full_name?: string; email?: string } | null;
                        const hours = hoursByEmployee[r.employee_id!];
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{emp?.full_name || emp?.email || "—"}</TableCell>
                            <TableCell>{hours.days}</TableCell>
                            <TableCell className="font-mono text-sm">{formatMinutes(hours.minutes)}</TableCell>
                            <TableCell className="font-mono text-sm text-amber-600">
                              {hours.extraMinutes > 0 ? formatMinutes(hours.extraMinutes) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {receipts.filter((r) => r.match_status === "matched" && r.employee_id && hoursByEmployee[r.employee_id]).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-4">
                          Nenhum colaborador vinculado tem registros de ponto para este período.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="no-print">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recibos</CardTitle>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="matched">Com match</SelectItem>
                <SelectItem value="unmatched">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? <p className="text-sm text-muted-foreground p-4">Nenhum recibo.</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>CPF detectado</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs max-w-xs truncate">{r.file_name}</TableCell>
                      <TableCell className="text-xs font-mono">{r.cpf_lookup || "—"}</TableCell>
                      <TableCell>
                        {batch.status === "published" ? (
                          (r.employees as { full_name?: string; email?: string } | null)?.full_name || "—"
                        ) : (
                          <Select
                            value={r.employee_id || ""}
                            onValueChange={(v) => doAction({ action: "reassign", receipt_id: r.id, employee_id: v }, "Atribuído")}
                          >
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Atribuir…" /></SelectTrigger>
                            <SelectContent>
                              {activeEmployees.map((e) => (
                                <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.match_status === "matched" ? "default" : r.match_status === "ambiguous" ? "secondary" : "outline"}>
                          {r.match_status}
                        </Badge>
                        {r.published && <Badge variant="default" className="ml-1">publicado</Badge>}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => downloadReceipt(r.id).catch((e) => toast.error(e.message))}>
                          <Download className="size-3" />
                        </Button>
                        {batch.status !== "published" && (
                          <Button size="sm" variant="ghost" onClick={() => doAction({ action: "delete_receipt", receipt_id: r.id }, "Removido")}>
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {batch.status !== "published" && batch.status !== "cancelled" && (
          <div className="flex justify-end gap-2 pt-4 border-t no-print">
            <Button variant="outline" onClick={() => doAction({ action: "cancel" }, "Lote cancelado")}>
              <Ban className="size-4 mr-1" />Cancelar
            </Button>
            <Button onClick={() => doAction({ action: "publish" }, "Lote publicado para colaboradores")}
              disabled={batch.matched_count === 0}>
              <Send className="size-4 mr-1" />Publicar {batch.matched_count} recibo(s)
            </Button>
          </div>
        )}
        {batch.status === "published" && (
          <div className="flex items-center justify-center text-sm text-muted-foreground gap-2 pt-2">
            <CheckCircle2 className="size-4 text-green-600" />
            Publicado em {batch.published_at ? new Date(batch.published_at).toLocaleString("pt-BR") : "—"}
          </div>
        )}
      </div>
    </>
  );
}
