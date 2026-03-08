import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeBalance {
  id: string;
  reference_month: string;
  expected_minutes: number;
  worked_minutes: number;
  balance_minutes: number;
  overtime_minutes: number;
  employees?: {
    full_name: string | null;
    email: string;
    photo_url: string | null;
  } | null;
}

interface TimeBalanceTableProps {
  balances: TimeBalance[];
}

function formatMinutes(minutes: number): string {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}h${m.toString().padStart(2, "0")}min`;
}

export function TimeBalanceTable({ balances }: TimeBalanceTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Colaborador</TableHead>
            <TableHead>Mês</TableHead>
            <TableHead>Esperado</TableHead>
            <TableHead>Trabalhado</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>Horas Extras</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {balances.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhum registro de banco de horas
              </TableCell>
            </TableRow>
          ) : (
            balances.map((balance) => (
              <TableRow key={balance.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7">
                      <AvatarImage src={balance.employees?.photo_url || ""} />
                      <AvatarFallback className="text-xs">
                        {(balance.employees?.full_name || balance.employees?.email || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {balance.employees?.full_name || balance.employees?.email || "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(balance.reference_month + "T12:00:00"), "MMMM yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-sm">{formatMinutes(balance.expected_minutes)}</TableCell>
                <TableCell className="text-sm">{formatMinutes(balance.worked_minutes)}</TableCell>
                <TableCell>
                  <Badge variant={balance.balance_minutes >= 0 ? "secondary" : "destructive"} className="text-xs">
                    {formatMinutes(balance.balance_minutes)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{formatMinutes(balance.overtime_minutes)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
