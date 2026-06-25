import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Calendar, RefreshCw } from "lucide-react";
import { useFeriados, useDeleteFeriado, type FeriadoTipo } from "@/hooks/useFeriados";
import { FeriadoDialog } from "@/components/FeriadoDialog";

const TIPO_LABELS: Record<FeriadoTipo, string> = {
  nacional: "Nacional",
  estadual: "Estadual",
  municipal: "Municipal",
  facultativo: "Ponto Facultativo",
};

const TIPO_VARIANTS: Record<FeriadoTipo, "default" | "secondary" | "outline"> = {
  nacional: "default",
  estadual: "secondary",
  municipal: "outline",
  facultativo: "outline",
};

function formatData(data: string, recorrente: boolean): string {
  const [, month, day] = data.split("-");
  if (recorrente) return `${day}/${month}`;
  return new Date(data + "T12:00:00Z").toLocaleDateString("pt-BR");
}

const Feriados = () => {
  const { data: feriados = [], isLoading } = useFeriados();
  const deleteMutation = useDeleteFeriado();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feriados</h1>
          <p className="text-muted-foreground">Cadastro e gestão de feriados nacionais, estaduais e municipais.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Novo Feriado
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : feriados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <Calendar className="size-10 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">Nenhum feriado cadastrado.</p>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Cadastrar primeiro feriado
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Recorrente</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feriados.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatData(f.data, f.recorrente)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={TIPO_VARIANTS[f.tipo]}>{TIPO_LABELS[f.tipo]}</Badge>
                    </TableCell>
                    <TableCell>
                      {f.recorrente ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <RefreshCw className="size-3" />Sim
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(f.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <FeriadoDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
};

export default Feriados;
