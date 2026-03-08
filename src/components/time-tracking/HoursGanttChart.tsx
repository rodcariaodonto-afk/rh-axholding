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
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeEntry {
  date: string;
  total_minutes: number | null;
  employee_id: string;
  employees?: {
    full_name: string | null;
    email: string;
  } | null;
}

interface HoursGanttChartProps {
  entries: TimeEntry[];
  startDate: string;
  endDate: string;
  expectedDailyHours?: number;
}

// Colors for the stacked segments
const COLORS = {
  normal: "hsl(142, 71%, 45%)",    // green — within expected
  overtime: "hsl(217, 91%, 60%)",   // blue — hours above expected
  deficit: "hsl(0, 0%, 85%)",       // light gray — missing hours (gap to expected)
  weekend: "hsl(45, 93%, 55%)",     // amber/yellow — weekend work
};

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium mb-1">{data.label}</p>
      <p className="text-muted-foreground">{data.fullDate}</p>
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
          Total: {data.totalHours.toFixed(1)}h / {data.expected.toFixed(0)}h esperadas
        </div>
      </div>
    </div>
  );
}

export function HoursGanttChart({ entries, startDate, endDate, expectedDailyHours = 8 }: HoursGanttChartProps) {
  const data = useMemo(() => {
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    });

    // Aggregate all employees' minutes per day
    const dayMinutes = new Map<string, number>();
    for (const entry of entries) {
      const prev = dayMinutes.get(entry.date) || 0;
      dayMinutes.set(entry.date, prev + (entry.total_minutes || 0));
    }

    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const totalMinutes = dayMinutes.get(dateStr) || 0;
      const totalHours = totalMinutes / 60;
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const expected = isWeekend ? 0 : expectedDailyHours;

      let normal = 0;
      let overtime = 0;
      let deficit = 0;
      let weekend = 0;

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
        label: format(day, "EEE", { locale: ptBR }),
        fullDate: format(day, "EEEE, dd 'de' MMMM", { locale: ptBR }),
        normal: +normal.toFixed(2),
        overtime: +overtime.toFixed(2),
        deficit: +deficit.toFixed(2),
        weekend: +weekend.toFixed(2),
        totalHours: +totalHours.toFixed(2),
        expected,
      };
    });
  }, [entries, startDate, endDate, expectedDailyHours]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gantt de Horas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Gantt de Horas — Visão Diária</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[340px]">
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

              {/* Stacked bars: normal (green) at bottom, then overtime (blue) or deficit (gray) on top */}
              <Bar dataKey="normal" stackId="hours" fill={COLORS.normal} radius={[0, 0, 0, 0]} maxBarSize={32} name="Normal" />
              <Bar dataKey="overtime" stackId="hours" fill={COLORS.overtime} radius={[0, 0, 0, 0]} maxBarSize={32} name="Hora extra" />
              <Bar dataKey="deficit" stackId="hours" fill={COLORS.deficit} radius={[0, 0, 0, 0]} maxBarSize={32} name="Déficit" />
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
