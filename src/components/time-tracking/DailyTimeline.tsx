import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, LogIn, LogOut } from "lucide-react";

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string | null;
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
        <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <div className="flex items-center gap-2 min-w-[100px]">
            <LogIn className="size-4 text-green-500" />
            <span className="font-mono text-sm font-medium">
              {format(new Date(entry.clock_in), "HH:mm")}
            </span>
          </div>

          <div className="flex-1 h-px bg-border" />

          <div className="flex items-center gap-2 min-w-[100px]">
            {entry.clock_out ? (
              <>
                <LogOut className="size-4 text-destructive" />
                <span className="font-mono text-sm font-medium">
                  {format(new Date(entry.clock_out), "HH:mm")}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground italic">Em aberto</span>
            )}
          </div>

          {entry.total_minutes != null && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {formatMinutes(entry.total_minutes)}
            </span>
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
