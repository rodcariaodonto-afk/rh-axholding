import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parseISO, eachDayOfInterval, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TimeEntry {
  date: string;
  total_minutes: number | null;
}

interface MonthlyHeatmapProps {
  entries: TimeEntry[];
  monthStart: string;
  monthEnd: string;
}

function getHeatColor(hours: number, maxHours: number): string {
  if (hours === 0) return "bg-muted";
  const ratio = hours / Math.max(maxHours, 1);
  if (ratio <= 0.25) return "bg-emerald-200 dark:bg-emerald-900/40";
  if (ratio <= 0.5) return "bg-emerald-300 dark:bg-emerald-700/60";
  if (ratio <= 0.75) return "bg-emerald-500 dark:bg-emerald-600";
  return "bg-emerald-700 dark:bg-emerald-500";
}

export function MonthlyHeatmap({ entries, monthStart, monthEnd }: MonthlyHeatmapProps) {
  const { days, maxHours, dayMap } = useMemo(() => {
    const allDays = eachDayOfInterval({
      start: parseISO(monthStart),
      end: parseISO(monthEnd),
    });

    const map = new Map<string, number>();
    for (const entry of entries) {
      const prev = map.get(entry.date) || 0;
      map.set(entry.date, prev + (entry.total_minutes || 0));
    }

    let max = 0;
    for (const mins of map.values()) {
      const h = mins / 60;
      if (h > max) max = h;
    }

    return { days: allDays, maxHours: max, dayMap: map };
  }, [entries, monthStart, monthEnd]);

  // Pad start with empty cells to align weekday columns
  const firstDayOfWeek = getDay(days[0]); // 0=Sun
  const adjustedStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon=0

  const weekDayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Heatmap Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 mb-1">
          {weekDayLabels.map((d) => (
            <div key={d} className="w-8 h-5 text-[10px] text-muted-foreground flex items-center justify-center">
              {d}
            </div>
          ))}
        </div>
        <TooltipProvider delayDuration={100}>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: adjustedStart }).map((_, i) => (
              <div key={`pad-${i}`} className="w-8 h-8" />
            ))}
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const totalMinutes = dayMap.get(dateStr) || 0;
              const hours = +(totalMinutes / 60).toFixed(1);
              const colorClass = getHeatColor(hours, maxHours);

              return (
                <Tooltip key={dateStr}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-sm cursor-default flex items-center justify-center text-[10px] font-medium transition-colors",
                        colorClass,
                        hours > 0 ? "text-emerald-950 dark:text-emerald-100" : "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p className="font-medium">{format(day, "EEEE, dd/MM", { locale: ptBR })}</p>
                    <p>{hours > 0 ? `${hours}h trabalhadas` : "Sem registros"}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground">
          <span>Menos</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/40" />
            <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700/60" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
            <div className="w-3 h-3 rounded-sm bg-emerald-700 dark:bg-emerald-500" />
          </div>
          <span>Mais</span>
        </div>
      </CardContent>
    </Card>
  );
}
