import PlatformAdminRoute from "@/components/PlatformAdminRoute";
import { usePlatformAudit } from "@/hooks/usePlatformAudit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function AuditInner() {
  const { data: logs = [], isLoading } = usePlatformAudit(300);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Auditoria global AXIS</h1>
        <p className="text-muted-foreground">Registro de todas as ações administrativas da plataforma</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Últimas {logs.length} ações</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum registro ainda.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Organização</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                    <TableCell className="text-xs">{l.target_organization_id?.slice(0, 8) ?? "—"}</TableCell>
                    <TableCell><pre className="text-[10px] max-w-md overflow-auto">{JSON.stringify(l.metadata, null, 2)}</pre></TableCell>
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

export default function AdminAudit() {
  return (
    <PlatformAdminRoute>
      <AuditInner />
    </PlatformAdminRoute>
  );
}
