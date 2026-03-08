import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimeEntry {
  employee_id: string;
  total_minutes: number | null;
  employees?: {
    full_name: string | null;
    email: string;
    photo_url: string | null;
  } | null;
}

interface TeamHoursRankingProps {
  entries: TimeEntry[];
  expectedMonthlyHours?: number;
}

export function TeamHoursRanking({ entries, expectedMonthlyHours = 176 }: TeamHoursRankingProps) {
  const data = useMemo(() => {
    const byEmployee = new Map<string, { name: string; totalMinutes: number }>();

    for (const entry of entries) {
      const key = entry.employee_id;
      const existing = byEmployee.get(key);
      const name = entry.employees?.full_name || entry.employees?.email || "Desconhecido";
      if (existing) {
        existing.totalMinutes += entry.total_minutes || 0;
      } else {
        byEmployee.set(key, { name, totalMinutes: entry.total_minutes || 0 });
      }
    }

    return Array.from(byEmployee.values())
      .map((e) => ({
        name: e.name.length > 18 ? e.name.slice(0, 18) + "…" : e.name,
        hours: +(e.totalMinutes / 60).toFixed(1),
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 15);
  }, [entries]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ranking de Horas no Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  const chartHeight = Math.max(200, data.length * 36);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Ranking de Horas no Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} className="fill-muted-foreground" unit="h" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} className="fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background))",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}h`, "Horas"]}
              />
              <ReferenceLine x={expectedMonthlyHours} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Meta", position: "top", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
