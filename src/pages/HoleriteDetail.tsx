import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePayrollBatch, usePayrollBatchAction, downloadReceipt } from "@/hooks/usePayrollBatches";
import { useEmployees } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Trash2, Send, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function HoleriteDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = usePayrollBatch(id);
  const { data: employees = [] } = useEmployees();
  const action = usePayrollBatchAction();
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched">("all");

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/holerites"><ArrowLeft className="size-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Lote {batch.competency}</h1>
          <p className="text-sm text-muted-foreground">{batch.receipt_type} · {batch.total_files} arquivo(s)</p>
        </div>
        <Badge>{batch.status}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{batch.total_files}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Match OK</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-700">{batch.matched_count}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Pendentes</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-700">{batch.unmatched_count}</p></CardContent></Card>
      </div>

      <Card>
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
        <div className="flex justify-end gap-2 pt-4 border-t">
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
  );
}
