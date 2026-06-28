import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, FileText } from "lucide-react";
import { formatTimeBrasilia, formatDateBrasilia } from "@/lib/timezone";
import { EditTimeEntryDialog } from "./EditTimeEntryDialog";
import { EspelhoPontoDialog } from "./EspelhoPontoDialog";

interface TimeEntry {
  id: string;
  employee_id?: string;
  clock_in: string;
  clock_out: string | null;
  lunch_out?: string | null;
  lunch_return?: string | null;
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

function getStatus(entry: TimeEntry) {
  if (entry.clock_out) return { label: "Finalizado", variant: "secondary" as const };
  if (entry.lunch_return) return { label: "Trabalhando", variant: "default" as const };
  if (entry.lunch_out) return { label: "Almoço", variant: "outline" as const };
  return { label: "Em andamento", variant: "default" as const };
}

export function TimeEntriesTable({ entries, showEmployee = true }: TimeEntriesTableProps) {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [espelhoEmployee, setEspelhoEmployee] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {showEmployee && <TableHead>Colaborador</TableHead>}
              <TableHead>Data</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead>Saída Almoço</TableHead>
              <TableHead>Retorno Almoço</TableHead>
              <TableHead>Saída</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showEmployee ? 9 : 8} className="text-center text-muted-foreground py-8">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const status = getStatus(entry);
                return (
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
                      {formatDateBrasilia(entry.date + "T12:00:00Z")}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatTimeBrasilia(entry.clock_in)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry.lunch_out ? formatTimeBrasilia(entry.lunch_out) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry.lunch_return ? formatTimeBrasilia(entry.lunch_return) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry.clock_out ? formatTimeBrasilia(entry.clock_out) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.total_minutes != null ? formatMinutes(entry.total_minutes) : "—"}
                    </TableCell>
                    <TableCell>
                      {status.label === "Finalizado" ? (
                        <Badge variant="secondary" className="text-xs">Finalizado</Badge>
                      ) : status.label === "Almoço" ? (
                        <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-200">Almoço</Badge>
                      ) : (
                        <Badge className="text-xs bg-green-500/10 text-green-600 border-green-200">{status.label}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {showEmployee && entry.employee_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            title="Ver Espelho de Ponto"
                            onClick={() =>
                              setEspelhoEmployee({
                                id: entry.employee_id!,
                                name: entry.employees?.full_name || entry.employees?.email || "Funcionário",
                              })
                            }
                          >
                            <FileText className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => setEditingEntry(entry)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <EditTimeEntryDialog
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
      />

      {espelhoEmployee && (
        <EspelhoPontoDialog
          open={!!espelhoEmployee}
          onClose={() => setEspelhoEmployee(null)}
          employeeId={espelhoEmployee.id}
          employeeName={espelhoEmployee.name}
        />
      )}
    </>
  );
}
