import { useReceipts } from "@/hooks/useReceipts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const typeLabel: Record<string, string> = {
  vale: "Vale",
  adiantamento: "Adiantamento",
  epi: "EPI",
  uniforme: "Uniforme",
  ferramenta: "Ferramenta",
  treinamento: "Treinamento",
  outro: "Outro",
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  pendente: "outline",
  aguardando_assinatura: "secondary",
  assinado: "default",
  cancelado: "outline",
};

export default function Receipts() {
  const { list } = useReceipts();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Recibos</h1>
        <p className="text-muted-foreground">Vale, EPI, uniforme, ferramentas e demais recibos com ciência</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recibos ({list.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : !list.data?.length ? (
            <p className="text-muted-foreground text-sm">Nenhum recibo registrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employee?.full_name ?? "-"}</TableCell>
                    <TableCell>{typeLabel[r.receipt_type]}</TableCell>
                    <TableCell>{r.description}</TableCell>
                    <TableCell className="text-right">{r.amount ? `R$ ${Number(r.amount).toFixed(2)}` : "-"}</TableCell>
                    <TableCell>{r.delivered_at ? new Date(r.delivered_at).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell><Badge variant={statusVariant[r.status]}>{r.status.replace(/_/g, " ")}</Badge></TableCell>
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
