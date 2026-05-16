import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, CheckCircle2 } from "lucide-react";
import { useMyPayslips, useAcknowledgePayslip, downloadPayslip } from "@/hooks/usePayslips";

export default function MyPayslips() {
  const { data = [], isLoading } = useMyPayslips();
  const ack = useAcknowledgePayslip();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meus Holerites</h1>
        <p className="text-muted-foreground">Acesse seus holerites por competência</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum holerite publicado.</p>
          ) : (
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
                {data.map((p: any) => (
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
    </div>
  );
}
