import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTimeInconsistencies, useResolveInconsistency, type InconsistencyStatus, type InconsistencySeverity } from "@/hooks/useTimeInconsistencies";
import { AlertTriangle, Loader2 } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  falta: "Falta",
  atraso: "Atraso",
  saida_antecipada: "Saída antecipada",
  marcacao_faltante: "Marcação faltante",
  marcacao_excedente: "Marcação excedente",
  jornada_nao_cumprida: "Jornada não cumprida",
  fora_da_cerca: "Fora da cerca virtual",
  intervalo_insuficiente: "Intervalo insuficiente",
  duplicado: "Duplicado",
  horas_extras_nao_autorizadas: "HE não autorizada",
};

const STATUS_LABEL: Record<InconsistencyStatus, string> = {
  open: "Aberta",
  in_review: "Em análise",
  resolved: "Resolvida",
  justified: "Justificada",
  ignored: "Ignorada",
};

const SEVERITY_VARIANT: Record<InconsistencySeverity, "default" | "secondary" | "destructive"> = {
  info: "secondary",
  warning: "default",
  critical: "destructive",
};

export default function TimeInconsistencies() {
  const [status, setStatus] = useState<InconsistencyStatus | "all">("open");
  const { data, isLoading } = useTimeInconsistencies(status === "all" ? {} : { status });
  const resolve = useResolveInconsistency();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="size-6 text-amber-500" />
            Inconsistências de Ponto
          </h1>
          <p className="text-muted-foreground">
            Falhas, marcações faltantes ou divergências detectadas automaticamente no processamento das marcações.
          </p>
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as never)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="open">Abertas</SelectItem>
            <SelectItem value="in_review">Em análise</SelectItem>
            <SelectItem value="resolved">Resolvidas</SelectItem>
            <SelectItem value="justified">Justificadas</SelectItem>
            <SelectItem value="ignored">Ignoradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data?.length ?? 0} registros</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : !data?.length ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma inconsistência encontrada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{format(new Date(i.day), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{TYPE_LABEL[i.type] ?? i.type}</TableCell>
                    <TableCell><Badge variant={SEVERITY_VARIANT[i.severity]}>{i.severity}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{STATUS_LABEL[i.status]}</Badge></TableCell>
                    <TableCell className="max-w-md truncate">{i.description ?? "—"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {i.status === "open" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: i.id, status: "justified" })}>Justificar</Button>
                          <Button size="sm" onClick={() => resolve.mutate({ id: i.id, status: "resolved" })}>Resolver</Button>
                        </>
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
