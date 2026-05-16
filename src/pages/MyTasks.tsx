import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMyPendingTasks, useUpdateTaskStatus, type PendingTaskPriority } from "@/hooks/usePendingTasks";
import { CheckCircle2, Inbox, Loader2 } from "lucide-react";

const PRIORITY_LABEL: Record<PendingTaskPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

const PRIORITY_VARIANT: Record<PendingTaskPriority, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
};

export default function MyTasks() {
  const { data, isLoading } = useMyPendingTasks();
  const update = useUpdateTaskStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Inbox className="size-6" />
          Minhas Tarefas
        </h1>
        <p className="text-muted-foreground">
          Tudo que precisa da sua ação no RHAXIS: aprovações, inconsistências, documentos e pendências.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data?.length ?? 0} tarefas abertas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : !data?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="size-12 mx-auto mb-2 text-emerald-500" />
              Tudo em dia. Sem pendências.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell><Badge variant={PRIORITY_VARIANT[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{t.module}</Badge></TableCell>
                    <TableCell>
                      <div className="font-medium">{t.title}</div>
                      {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                    </TableCell>
                    <TableCell>{t.due_at ? format(new Date(t.due_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {t.action_url && (
                        <Button size="sm" variant="outline" asChild><Link to={t.action_url}>Abrir</Link></Button>
                      )}
                      <Button size="sm" onClick={() => update.mutate({ id: t.id, status: "done" })}>Concluir</Button>
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
