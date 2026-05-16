import { useState } from "react";
import { Link } from "react-router-dom";
import PlatformAdminRoute from "@/components/PlatformAdminRoute";
import { useClients } from "@/hooks/useClients";
import { usePlans } from "@/hooks/usePlans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2, ShieldCheck, Pause, Clock } from "lucide-react";

const statusColor: Record<string, string> = {
  active: "bg-green-500/15 text-green-600",
  trial: "bg-blue-500/15 text-blue-600",
  suspended: "bg-amber-500/15 text-amber-600",
  cancelled: "bg-zinc-500/15 text-zinc-600",
  pending_deletion: "bg-red-500/15 text-red-600",
  deleted: "bg-zinc-700/15 text-zinc-700",
};

function ClientsInner() {
  const { data: clients = [], isLoading } = useClients();
  const { data: plans = [] } = usePlans();
  const [search, setSearch] = useState("");

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.responsible_email?.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    trial: clients.filter((c) => c.status === "trial").length,
    suspended: clients.filter((c) => c.status === "suspended").length,
  };

  const planName = (id: string | null) => plans.find((p) => p.id === id)?.name ?? "—";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AXIS Admin · Clientes</h1>
          <p className="text-muted-foreground">Empresas cliente do RHAXIS</p>
        </div>
        <Button asChild>
          <Link to="/admin/clientes/novo">
            <Plus className="mr-2 h-4 w-4" /> Novo cliente
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={Building2} />
        <StatCard label="Ativos" value={stats.active} icon={ShieldCheck} />
        <StatCard label="Trial" value={stats.trial} icon={Clock} />
        <StatCard label="Suspensos" value={stats.suspended} icon={Pause} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum cliente cadastrado. Use <strong>Novo cliente</strong> para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.slug}</div>
                    </TableCell>
                    <TableCell>
                      <div>{c.responsible_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{c.responsible_email ?? "—"}</div>
                    </TableCell>
                    <TableCell>{planName(c.plan_id)}</TableCell>
                    <TableCell>
                      <Badge className={statusColor[c.status] ?? ""}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/admin/clientes/${c.id}`}>Gerenciar</Link>
                      </Button>
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

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function AdminClients() {
  return (
    <PlatformAdminRoute>
      <ClientsInner />
    </PlatformAdminRoute>
  );
}
