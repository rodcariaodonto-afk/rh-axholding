import { Link } from "react-router-dom";
import { usePayrollBatches } from "@/hooks/usePayrollBatches";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Eye } from "lucide-react";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "outline" },
  matching: { label: "Em análise", variant: "secondary" },
  ready: { label: "Pronto", variant: "secondary" },
  published: { label: "Publicado", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const typeLabels: Record<string, string> = {
  holerite: "Holerite", recibo: "Recibo", decimo_terceiro: "13º salário", ferias: "Férias", rescisao: "Rescisão",
};

export default function Holerites() {
  const { data: batches = [], isLoading } = usePayrollBatches();

  const counts = {
    total: batches.length,
    draft: batches.filter((b) => ["draft", "matching"].includes(b.status)).length,
    published: batches.filter((b) => b.status === "published").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Holerites — Lotes</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload em lote com matching automático por CPF no nome do arquivo.</p>
        </div>
        <Button asChild><Link to="/holerites/novo"><Plus className="size-4 mr-2" />Novo lote</Link></Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Total", value: counts.total }, { label: "Em rascunho", value: counts.draft }, { label: "Publicados", value: counts.published }].map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{c.label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{c.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Lotes</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : batches.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="size-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-foreground">Nenhum lote criado</p>
              <p className="text-sm mt-1">Crie um novo lote para começar a publicar holerites em massa.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Arquivos</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => {
                  const st = statusLabels[b.status] || { label: b.status, variant: "outline" as const };
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.competency}</TableCell>
                      <TableCell>{typeLabels[b.receipt_type] || b.receipt_type}</TableCell>
                      <TableCell>{b.total_files}</TableCell>
                      <TableCell>
                        <span className="text-green-700 font-medium">{b.matched_count}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className="text-red-700">{b.unmatched_count}</span>
                      </TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost"><Link to={`/holerites/${b.id}`}><Eye className="size-4" /></Link></Button>
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
