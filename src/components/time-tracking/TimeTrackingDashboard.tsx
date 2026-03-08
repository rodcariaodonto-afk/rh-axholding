import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, TrendingUp, Timer } from "lucide-react";
import { useTimeTrackingDashboard } from "@/hooks/useTimeTrackingDashboard";
import { Skeleton } from "@/components/ui/skeleton";

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export function TimeTrackingDashboard() {
  const { totalActiveNow, totalTodayCompleted, avgMinutesToday, isLoading } = useTimeTrackingDashboard();

  const kpis = [
    {
      title: "Trabalhando agora",
      value: totalActiveNow.toString(),
      icon: Users,
      description: "colaboradores com ponto aberto",
    },
    {
      title: "Registros hoje",
      value: totalTodayCompleted.toString(),
      icon: Clock,
      description: "pontos finalizados",
    },
    {
      title: "Média de horas",
      value: formatMinutes(avgMinutesToday),
      icon: Timer,
      description: "por colaborador hoje",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-20" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className="text-xs text-muted-foreground">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
