import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditoriaPonto } from "@/hooks/useAuditoriaPonto";
import { useEmployees } from "@/hooks/useEmployees";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShieldCheck } from "lucide-react";

const ACAO_LABELS: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  registro_ponto_qrcode: { label: "Registro OK", variant: "default" },
  registro_negado_fora_geocerca: { label: "Fora da geocerca", variant: "destructive" },
};

export function AuditoriaPonto() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  const { data: logs = [], isLoading } = useAuditoriaPonto({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    userId: userFilter !== "all" ? userFilter : undefined,
  });

  const { data: employees = [] } = useEmployees();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="size-4" />
          Auditoria de Ponto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {employees
                .filter((e) => e.status === "active")
                .map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name || e.email}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum log de auditoria encontrado.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => {
                  const acaoInfo = ACAO_LABELS[log.acao] ?? { label: log.acao, variant: "secondary" as const };
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.employees?.full_name || log.employees?.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={acaoInfo.variant}>{acaoInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {log.detalhes ? JSON.stringify(log.detalhes) : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground max-w-[120px] truncate">
                        {log.hash_atual || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
