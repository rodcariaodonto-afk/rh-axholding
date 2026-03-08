import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeEntry {
  id: string;
  clock_in: string;
  clock_out: string | null;
  date: string;
  total_minutes: number | null;
  notes: string | null;
  employees?: {
    full_name: string | null;
    email: string;
    photo_url: string | null;
  } | null;
}

interface TimeEntriesTableProps {
  entries: TimeEntry[];
  showEmployee?: boolean;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}min`;
}

export function TimeEntriesTable({ entries, showEmployee = true }: TimeEntriesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showEmployee && <TableHead>Colaborador</TableHead>}
            <TableHead>Data</TableHead>
            <TableHead>Entrada</TableHead>
            <TableHead>Saída</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showEmployee ? 6 : 5} className="text-center text-muted-foreground py-8">
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow key={entry.id}>
                {showEmployee && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarImage src={entry.employees?.photo_url || ""} />
                        <AvatarFallback className="text-xs">
                          {(entry.employees?.full_name || entry.employees?.email || "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {entry.employees?.full_name || entry.employees?.email || "—"}
                      </span>
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-sm">
                  {format(new Date(entry.date + "T12:00:00"), "dd/MM/yyyy")}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {format(new Date(entry.clock_in), "HH:mm")}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {entry.total_minutes != null ? formatMinutes(entry.total_minutes) : "—"}
                </TableCell>
                <TableCell>
                  {entry.clock_out ? (
                    <Badge variant="secondary" className="text-xs">Finalizado</Badge>
                  ) : (
                    <Badge className="text-xs bg-green-500/10 text-green-600 border-green-200">Em andamento</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
