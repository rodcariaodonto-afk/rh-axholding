import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useEmployees } from "@/hooks/useEmployees";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShieldCheck, History, Search } from "lucide-react";

const ACTION_COLORS: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  invite: "outline",
  login: "outline",
  role_change: "destructive",
};

function useAuditLog(filters: { startDate?: string; endDate?: string; resourceType?: string; userId?: string }) {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["audit-log", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];
      let query = supabase
        .from("audit_log")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters.startDate) query = query.gte("created_at", filters.startDate);
      if (filters.endDate) query = query.lte("created_at", filters.endDate + "T23:59:59");
      if (filters.resourceType && filters.resourceType !== "all") query = query.eq("resource_type", filters.resourceType);
      if (filters.userId && filters.userId !== "all") query = query.eq("user_id", filters.userId);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });
}

function usePontoAudit(filters: { startDate?: string; endDate?: string; userId?: string }) {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["auditoria-ponto-page", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];
      let query = supabase
        .from("auditoria_ponto")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters.startDate) query = query.gte("created_at", filters.startDate);
      if (filters.endDate) query = query.lte("created_at", filters.endDate + "T23:59:59");
      if (filters.userId && filters.userId !== "all") query = query.eq("user_id", filters.userId);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });
}

export default function Audit() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [resourceType, setResourceType] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: employees = [] } = useEmployees();
  const activeEmployees = useMemo(() => employees.filter((e) => e.status === "active"), [employees]);

  // Employees map for name lookup
  const employeeMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of employees) m.set(e.id, e.full_name || e.email);
    return m;
  }, [employees]);

  const { data: auditLogs = [], isLoading: loadingAudit } = useAuditLog({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    resourceType,
    userId: userFilter !== "all" ? userFilter : undefined,
  });

  const { data: pontoLogs = [], isLoading: loadingPonto } = usePontoAudit({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    userId: userFilter !== "all" ? userFilter : undefined,
  });

  const filteredAuditLogs = useMemo(() => {
    if (!searchTerm) return auditLogs;
    const lower = searchTerm.toLowerCase();
    return auditLogs.filter(
      (log: any) =>
        log.action?.toLowerCase().includes(lower) ||
        log.resource_type?.toLowerCase().includes(lower) ||
        employeeMap.get(log.user_id)?.toLowerCase().includes(lower)
    );
  }, [auditLogs, searchTerm, employeeMap]);

  const resourceTypes = useMemo(() => {
    const set = new Set<string>();
    for (const log of auditLogs as any[]) if (log.resource_type) set.add(log.resource_type);
    return Array.from(set).sort();
  }, [auditLogs]);

  const ACAO_LABELS: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
    registro_ponto_qrcode: { label: "Registro OK", variant: "default" },
    registro_negado_fora_geocerca: { label: "Fora da geocerca", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-muted-foreground">Acompanhe todas as ações e alterações realizadas no sistema</p>
      </div>

      {/* Shared Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Data Início</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Data Fim</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Colaborador</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {activeEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ação, recurso..."
                  className="pl-8 w-52"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="system">
        <TabsList>
          <TabsTrigger value="system" className="gap-1.5">
            <History className="size-3.5" />
            Ações do Sistema
          </TabsTrigger>
          <TabsTrigger value="ponto" className="gap-1.5">
            <ShieldCheck className="size-3.5" />
            Auditoria de Ponto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tipo de recurso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {resourceTypes.map((rt) => (
                  <SelectItem key={rt} value={rt}>{rt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{filteredAuditLogs.length} registros</span>
          </div>

          {loadingAudit ? (
            <Skeleton className="h-64 w-full" />
          ) : filteredAuditLogs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum log de auditoria encontrado.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Alterações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuditLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {employeeMap.get(log.user_id) || "Sistema"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ACTION_COLORS[log.action] ?? "secondary"}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-medium">{log.resource_type}</span>
                        {log.resource_id && (
                          <span className="text-xs text-muted-foreground ml-1 font-mono">
                            ({log.resource_id.slice(0, 8)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {log.changes ? JSON.stringify(log.changes) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ponto" className="space-y-4">
          <span className="text-xs text-muted-foreground">{pontoLogs.length} registros</span>

          {loadingPonto ? (
            <Skeleton className="h-64 w-full" />
          ) : pontoLogs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum log de auditoria de ponto encontrado.
              </CardContent>
            </Card>
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
                  {pontoLogs.map((log: any) => {
                    const acaoInfo = ACAO_LABELS[log.acao] ?? { label: log.acao, variant: "secondary" as const };
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {employeeMap.get(log.user_id) || "—"}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
