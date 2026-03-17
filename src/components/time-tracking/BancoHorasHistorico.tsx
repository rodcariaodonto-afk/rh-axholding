import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useEmployees } from "@/hooks/useEmployees";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function minutesToHm(mins: number) {
  const sign = mins < 0 ? "-" : "";
  const abs = Math.abs(mins);
  return `${sign}${Math.floor(abs / 60)}h${String(abs % 60).padStart(2, "0")}`;
}

export function BancoHorasHistorico() {
  const { organizationId } = useCurrentOrganization();
  const [employeeId, setEmployeeId] = useState<string>("");
  const { data: employees = [] } = useEmployees();
  const activeEmployees = useMemo(() => (employees || []).filter((e) => e.status === "active"), [employees]);

  const { data: historico = [], isLoading } = useQuery({
    queryKey: ["historico-saldo", organizationId, employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_saldo_banco_horas")
        .select("*")
        .eq("organization_id", organizationId!)
        .eq("employee_id", employeeId)
        .order("ano", { ascending: true })
        .order("mes", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId && !!employeeId,
  });

  const chartData = useMemo(
    () => historico.map((h: any) => ({
      name: `${MONTHS_SHORT[h.mes - 1]}/${h.ano}`,
      saldo: h.saldo_atual,
    })),
    [historico]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Colaborador</label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {activeEmployees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!employeeId ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione um colaborador.</CardContent></Card>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : historico.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum histórico de saldo registrado.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Evolução do Saldo</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis tickFormatter={(v) => minutesToHm(v)} className="text-xs" />
                  <Tooltip formatter={(v: number) => minutesToHm(v)} />
                  <Area type="monotone" dataKey="saldo" className="fill-primary/20 stroke-primary" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês/Ano</TableHead>
                    <TableHead>Saldo Anterior</TableHead>
                    <TableHead>Acumulado Mês</TableHead>
                    <TableHead>Compensadas</TableHead>
                    <TableHead>Saldo Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((h: any) => (
                    <TableRow key={h.id}>
                      <TableCell>{MONTHS_SHORT[h.mes - 1]}/{h.ano}</TableCell>
                      <TableCell>{minutesToHm(h.saldo_anterior)}</TableCell>
                      <TableCell>{minutesToHm(h.horas_acumuladas_mes)}</TableCell>
                      <TableCell>{minutesToHm(h.horas_compensadas)}</TableCell>
                      <TableCell className={h.saldo_atual < 0 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                        {minutesToHm(h.saldo_atual)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
