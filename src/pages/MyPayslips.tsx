import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, CheckCircle2 } from "lucide-react";
import { useMyPayslips, useAcknowledgePayslip, downloadPayslip } from "@/hooks/usePayslips";
import { useMyPayrollReceipts, downloadReceipt } from "@/hooks/usePayrollBatches";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  holerite: "Holerite", recibo: "Recibo", decimo_terceiro: "13º salário", ferias: "Férias", rescisao: "Rescisão",
};

export default function MyPayslips() {
  const { data: legacy = [], isLoading: l1 } = useMyPayslips();
  const { data: receipts = [], isLoading: l2 } = useMyPayrollReceipts();
  const ack = useAcknowledgePayslip();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meus Holerites</h1>
        <p className="text-muted-foreground">Acesse seus holerites e recibos por competência</p>
      </div>

      <Tabs defaultValue="receipts">
        <TabsList>
          <TabsTrigger value="receipts">Recibos publicados ({receipts.length})</TabsTrigger>
          <TabsTrigger value="legacy">Histórico ({legacy.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="receipts">
          <Card>
            <CardHeader><CardTitle>Recibos disponíveis</CardTitle></CardHeader>
            <CardContent>
              {l2 ? <p className="text-sm text-muted-foreground">Carregando…</p>
                : receipts.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum recibo publicado.</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competência</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ciência</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((r) => {
                      const batch = (r as { payroll_receipt_batches?: { competency: string; receipt_type: string } }).payroll_receipt_batches;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{batch?.competency || "—"}</TableCell>
                          <TableCell>{typeLabels[batch?.receipt_type || ""] || "—"}</TableCell>
                          <TableCell>
                            {r.acknowledged_at
                              ? <Badge><CheckCircle2 className="size-3 mr-1" />Confirmado</Badge>
                              : <Badge variant="outline">Pendente</Badge>}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button size="sm" variant="outline"
                              onClick={() => downloadReceipt(r.id, !r.acknowledged_at).catch((e) => toast.error(e.message))}>
                              <Download className="size-3.5 mr-1" />
                              {r.acknowledged_at ? "Baixar" : "Baixar e dar ciência"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legacy">
          <Card>
            <CardHeader><CardTitle>Histórico (folha individual)</CardTitle></CardHeader>
            <CardContent>
              {l1 ? <p className="text-sm text-muted-foreground">Carregando…</p>
                : legacy.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum holerite publicado.</p> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competência</TableHead>
                      <TableHead>Líquido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {legacy.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.payroll_competencies?.reference_label ?? "—"}</TableCell>
                        <TableCell>{p.net_amount ? `R$ ${Number(p.net_amount).toFixed(2)}` : "—"}</TableCell>
                        <TableCell><Badge variant="outline">{p.ack_status}</Badge></TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => downloadPayslip(p.file_path, p.id)}>
                            <Download className="size-3.5 mr-1" />Baixar
                          </Button>
                          {p.ack_status !== "acknowledged" && p.ack_status !== "signed" && (
                            <Button size="sm" onClick={() => ack.mutate(p.id)}>
                              <CheckCircle2 className="size-3.5 mr-1" />Dar ciência
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
