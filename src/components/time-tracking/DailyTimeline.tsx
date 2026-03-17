import { formatTimeBrasilia } from "@/lib/timezone";
import { Clock, LogIn, LogOut, UtensilsCrossed, Coffee } from "lucide-react";

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string | null;
  lunch_out?: string | null;
  lunch_return?: string | null;
  total_minutes: number | null;
  notes: string | null;
}

interface DailyTimelineProps {
  entries: TimeEntry[];
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}min`;
}

export function DailyTimeline({ entries }: DailyTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="size-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum registro de ponto hoje</p>
      </div>
    );
  }

  const totalMinutes = entries.reduce((sum, e) => sum + (e.total_minutes || 0), 0);

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="p-3 rounded-lg border bg-card space-y-2">
          {/* Row 1: Entrada → Saída Almoço */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 min-w-[100px]">
              <LogIn className="size-4 text-green-500" />
              <span className="font-mono text-sm font-medium">
                {formatTimeBrasilia(entry.clock_in)}
              </span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2 min-w-[100px]">
              {entry.lunch_out ? (
                <>
                  <UtensilsCrossed className="size-4 text-amber-500" />
                  <span className="font-mono text-sm font-medium">
                    {formatTimeBrasilia(entry.lunch_out)}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground italic">—</span>
              )}
            </div>
          </div>

          {/* Row 2: Retorno Almoço → Saída */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 min-w-[100px]">
              {entry.lunch_return ? (
                <>
                  <Coffee className="size-4 text-emerald-500" />
                  <span className="font-mono text-sm font-medium">
                    {formatTimeBrasilia(entry.lunch_return)}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground italic ml-6">—</span>
              )}
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2 min-w-[100px]">
              {entry.clock_out ? (
                <>
                  <LogOut className="size-4 text-destructive" />
                  <span className="font-mono text-sm font-medium">
                    {formatTimeBrasilia(entry.clock_out)}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground italic">Em aberto</span>
              )}
            </div>
          </div>

          {entry.total_minutes != null && (
            <div className="text-right">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {formatMinutes(entry.total_minutes)}
              </span>
            </div>
          )}
        </div>
      ))}

      {totalMinutes > 0 && (
        <div className="text-right text-sm font-medium text-muted-foreground">
          Total: {formatMinutes(totalMinutes)}
        </div>
      )}
    </div>
  );
}
