import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AuditTab() {
  const { organizationId } = useCurrentOrganization();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<string>("all");

  const { data: logs = [] } = useQuery({
    queryKey: ["audit-logs-gov", organizationId, severity],
    enabled: !!organizationId,
    queryFn: async () => {
      let q = supabase.from("audit_log").select("*")
        .eq("organization_id", organizationId!)
        .order("created_at", { ascending: false }).limit(200);
      if (severity !== "all") q = q.eq("severity", severity);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const filtered = logs.filter((l) =>
    !search || l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.resource_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <CardTitle>Auditoria — últimos 200 eventos</CardTitle>
        <div className="flex gap-2">
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="all">Todas severidades</option>
            <option value="critical">Críticos</option>
            <option value="warn">Avisos</option>
            <option value="info">Informativos</option>
          </select>
          <Input placeholder="Buscar ação/recurso…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quando</TableHead>
              <TableHead>Severidade</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs">{format(new Date(l.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}</TableCell>
                <TableCell>
                  <Badge variant={l.severity === "critical" ? "destructive" : l.severity === "warn" ? "secondary" : "outline"}>
                    {l.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{l.resource_type}</TableCell>
                <TableCell className="text-sm font-medium">{l.action}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.user_id?.slice(0, 8) ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{(l.ip_address as string | null) ?? "—"}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sem eventos.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
