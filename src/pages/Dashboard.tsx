import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";
import {
  Users, Cake, AlertTriangle, TrendingUp, DollarSign,
  CalendarCheck, Palmtree, Award, Building2, UserPlus
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell
} from "recharts";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(210, 40%, 70%)",
  "hsl(150, 40%, 60%)",
  "hsl(30, 60%, 60%)",
];

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdmin, isPeople } = useUserRole(user?.id);
  const { organization } = useRequireOrganization();
  const isManager = isAdmin || isPeople;

  const {
    headcount, birthdaysThisMonth, anniversariesThisMonth,
    expiringContracts, probationEnding, avgSalary,
    newHiresThisMonth, pendingTimeOffCount, deptBreakdown, isLoading,
  } = useDashboardData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const alerts = [
    ...expiringContracts.map((c: any) => ({
      type: "warning" as const,
      icon: AlertTriangle,
      text: `Contrato de ${c.employee?.full_name} vence em ${c.daysLeft} dias`,
      url: `/employees/${c.user_id}`,
    })),
    ...probationEnding.map((c: any) => ({
      type: "info" as const,
      icon: CalendarCheck,
      text: `Experiência de ${c.employee?.full_name} encerra em ${c.daysLeft} dias`,
      url: `/employees/${c.user_id}`,
    })),
    ...(pendingTimeOffCount > 0
      ? [{ type: "info" as const, icon: Palmtree, text: `${pendingTimeOffCount} solicitações de férias pendentes`, url: "/time-off" }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Visão geral da {organization?.name || "organização"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Headcount</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{headcount}</div>
            <p className="text-xs text-muted-foreground">colaboradores ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novas admissões</CardTitle>
            <UserPlus className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newHiresThisMonth}</div>
            <p className="text-xs text-muted-foreground">neste mês</p>
          </CardContent>
        </Card>

        {isManager && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salário médio</CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgSalary > 0 ? `R$ ${avgSalary.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` : "—"}
              </div>
              <p className="text-xs text-muted-foreground">base mensal</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aniversariantes</CardTitle>
            <Cake className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{birthdaysThisMonth.length}</div>
            <p className="text-xs text-muted-foreground">neste mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-4 text-yellow-500" />
              Alertas e Pendências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 5).map((alert, i) => (
              <Link
                key={i}
                to={alert.url}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <alert.icon className={`size-4 shrink-0 ${alert.type === "warning" ? "text-yellow-500" : "text-primary"}`} />
                <span className="text-sm">{alert.text}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department breakdown chart */}
        {deptBreakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="size-4" />
                Colaboradores por Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptBreakdown}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, count }) => `${name} (${count})`}
                      labelLine
                    >
                      {deptBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Birthdays & Anniversaries */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Cake className="size-4" />
              Aniversariantes do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {birthdaysThisMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum aniversariante</p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto">
                {birthdaysThisMonth.map((emp: any) => (
                  <Link
                    key={emp.id}
                    to={`/employees/${emp.id}`}
                    className="flex items-center gap-3 hover:bg-muted/50 rounded-md p-1.5 transition-colors"
                  >
                    <Avatar className="size-8">
                      {emp.photo_url && <AvatarImage src={emp.photo_url} />}
                      <AvatarFallback className="text-xs">
                        {getInitials(emp.full_name || emp.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{emp.full_name || emp.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(emp.birth_date!), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                    <Cake className="size-4 text-pink-500 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Work Anniversaries */}
        {anniversariesThisMonth.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="size-4" />
                Aniversários de Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[220px] overflow-y-auto">
                {anniversariesThisMonth.map((item: any) => (
                  <Link
                    key={item.user_id}
                    to={`/employees/${item.user_id}`}
                    className="flex items-center gap-3 hover:bg-muted/50 rounded-md p-1.5 transition-colors"
                  >
                    <Avatar className="size-8">
                      {item.employee?.photo_url && <AvatarImage src={item.employee.photo_url} />}
                      <AvatarFallback className="text-xs">
                        {getInitials(item.employee?.full_name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.employee?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{item.years} anos de empresa</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{item.years}a</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
