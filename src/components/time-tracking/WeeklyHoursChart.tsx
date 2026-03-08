import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeEntry {
  date: string;
  total_minutes: number | null;
  employee_id?: string;
}

interface WeeklyHoursChartProps {
  entries: TimeEntry[];
  weekStart: string;
  weekEnd: string;
  expectedDailyHours?: number;
}

const COLORS = {
  normal: "hsl(142, 71%, 45%)",
  overtime: "hsl(217, 91%, 60%)",
  deficit: "hsl(0, 0%, 85%)",
  weekend: "hsl(45, 93%, 55%)",
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{data.dayName}</p>
      <p className="text-muted-foreground">{data.date}</p>
      <div className="mt-1 space-y-0.5">
        {data.normal > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ background: COLORS.normal }} />
            <span>Normal: {data.normal.toFixed(1)}h</span>
          </div>
        )}
        {data.overtime > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ background: COLORS.overtime }} />
            <span>Hora extra: {data.overtime.toFixed(1)}h</span>
          </div>
        )}
        {data.deficit > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ background: COLORS.deficit }} />
            <span>Déficit: {data.deficit.toFixed(1)}h</span>
          </div>
        )}
        {data.weekend > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ background: COLORS.weekend }} />
            <span>Fim de semana: {data.weekend.toFixed(1)}h</span>
          </div>
        )}
        <div className="border-t border-border mt-1 pt-1 font-medium">
          Total: {data.totalHours.toFixed(1)}h / {data.expected}h
        </div>
      </div>
    </div>
  );
}

export function WeeklyHoursChart({ entries, weekStart, weekEnd, expectedDailyHours = 8 }: WeeklyHoursChartProps) {
  const data = useMemo(() => {
    const days = eachDayOfInterval({
      start: parseISO(weekStart),
      end: parseISO(weekEnd),
    });

    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayEntries = entries.filter((e) => e.date === dateStr);
      const totalMinutes = dayEntries.reduce((sum, e) => sum + (e.total_minutes || 0), 0);
      const totalHours = totalMinutes / 60;
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const expected = isWeekend ? 0 : expectedDailyHours;

      let normal = 0, overtime = 0, deficit = 0, weekend = 0;
      if (isWeekend) {
        weekend = totalHours;
      } else if (totalHours >= expected) {
        normal = expected;
        overtime = totalHours - expected;
      } else {
        normal = totalHours;
        deficit = expected - totalHours;
      }

      return {
        name: format(day, "dd/MM"),
        dayName: format(day, "EEEE", { locale: ptBR }),
        date: format(day, "dd/MM"),
        normal: +normal.toFixed(2),
        overtime: +overtime.toFixed(2),
        deficit: +deficit.toFixed(2),
        weekend: +weekend.toFixed(2),
        totalHours: +totalHours.toFixed(2),
        expected,
      };
    });
  }, [entries, weekStart, weekEnd, expectedDailyHours]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Controle Semanal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={{ className: "stroke-border" }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                unit="h"
                tickLine={false}
                axisLine={{ className: "stroke-border" }}
                domain={[0, "auto"]}
              />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
              <ReferenceLine
                y={expectedDailyHours}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: `Meta ${expectedDailyHours}h`,
                  position: "right",
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <Bar dataKey="normal" stackId="hours" fill={COLORS.normal} maxBarSize={32} name="Normal" />
              <Bar dataKey="overtime" stackId="hours" fill={COLORS.overtime} maxBarSize={32} name="Hora extra" />
              <Bar dataKey="deficit" stackId="hours" fill={COLORS.deficit} maxBarSize={32} name="Déficit" />
              <Bar dataKey="weekend" stackId="hours" fill={COLORS.weekend} radius={[2, 2, 0, 0]} maxBarSize={32} name="Fim de semana" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: COLORS.normal }} />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: COLORS.overtime }} />
            <span>Hora extra</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: COLORS.deficit }} />
            <span>Déficit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: COLORS.weekend }} />
            <span>Fim de semana</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
