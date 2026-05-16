import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, RefreshCw } from "lucide-react";
import { useExportJobs, useCreateExportJob, downloadExportFile, type ExportJobType } from "@/hooks/useExportJobs";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const TYPE_LABEL: Record<string, string> = {
  payroll_csv: "Folha (CSV)",
  payroll_pdf: "Folha (PDF)",
  time_entries_csv: "Apontamentos (CSV)",
  absenteeism_csv: "Absenteísmo (CSV)",
  inconsistencies_csv: "Inconsistências (CSV)",
  employees_csv: "Colaboradores (CSV)",
  audit_csv: "Auditoria (CSV)",
  custom: "Personalizado",
};

const STATUS_VARIANT: Record<string, any> = {
  queued: "secondary",
  processing: "default",
  completed: "default",
  failed: "destructive",
  cancelled: "outline",
};

const QUICK_EXPORTS: { type: ExportJobType; label: string }[] = [
  { type: "time_entries_csv", label: "Apontamentos do mês" },
  { type: "absenteeism_csv", label: "Absenteísmo do mês" },
  { type: "inconsistencies_csv", label: "Inconsistências em aberto" },
  { type: "employees_csv", label: "Colaboradores ativos" },
];

export default function Exports() {
  const { data: jobs = [], isLoading, refetch } = useExportJobs();
  const create = useCreateExportJob();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Central de Exportações</h1>
          <p className="text-muted-foreground">Solicite e baixe relatórios processados assincronamente</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="size-4 mr-1.5" />Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Exportações rápidas</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {QUICK_EXPORTS.map((q) => (
            <Button
              key={q.type} variant="outline" size="sm"
              onClick={() => create.mutate({ job_type: q.type })}
              disabled={create.isPending}
            >
              <FileText className="size-4 mr-1.5" />{q.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma exportação ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitado</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j: any) => (
                  <TableRow key={j.id}>
                    <TableCell>{TYPE_LABEL[j.job_type] ?? j.job_type}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[j.status]}>{j.status}</Badge>
                      {j.error_message && <p className="text-xs text-destructive mt-1">{j.error_message}</p>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(j.created_at), { addSuffix: true, locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {j.result_size_bytes ? `${(j.result_size_bytes / 1024).toFixed(1)} KB` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {j.status === "completed" && j.result_path && (
                        <Button size="sm" variant="outline" onClick={() => downloadExportFile(j.result_path)}>
                          <Download className="size-3.5 mr-1" />Baixar
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
