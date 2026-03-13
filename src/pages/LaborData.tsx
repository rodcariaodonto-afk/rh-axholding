import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, DollarSign, Gift, Landmark } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

const LaborData = () => {
  const { organizationId } = useCurrentOrganization();
  const { data: employees = [], isLoading: empLoading } = useEmployees();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  const activeEmployees = employees.filter((e: any) => e.status === "active");

  const { data: contract, isLoading: contractLoading } = useQuery({
    queryKey: ["employee-contract", selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) return null;
      const { data, error } = await supabase
        .from("employees_contracts")
        .select("*")
        .eq("user_id", selectedEmployeeId)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEmployeeId,
  });

  const { data: schedule } = useQuery({
    queryKey: ["employee-schedule", selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) return null;
      const emp = employees.find((e: any) => e.id === selectedEmployeeId);
      if (!emp?.work_schedule_id) return null;
      const { data, error } = await supabase
        .from("work_schedules")
        .select("*")
        .eq("id", emp.work_schedule_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEmployeeId,
  });

  const selectedEmployee = employees.find((e: any) => e.id === selectedEmployeeId);

  const fmt = (v: number | null) =>
    (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (empLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dados Trabalhistas</h1>
        <p className="text-muted-foreground">
          Escala de trabalho, salário e benefícios dos colaboradores.
        </p>
      </div>

      <div className="max-w-sm">
        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um colaborador" />
          </SelectTrigger>
          <SelectContent>
            {activeEmployees.map((emp: any) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.full_name || emp.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedEmployeeId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Landmark className="size-12 mb-4 opacity-30" />
            <p>Selecione um colaborador para visualizar os dados trabalhistas.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="schedule" className="space-y-4">
          <TabsList>
            <TabsTrigger value="schedule" className="gap-2">
              <CalendarClock className="size-4" />
              Escala de Trabalho
            </TabsTrigger>
            <TabsTrigger value="salary" className="gap-2">
              <DollarSign className="size-4" />
              Salário
            </TabsTrigger>
            <TabsTrigger value="benefits" className="gap-2">
              <Gift className="size-4" />
              Benefícios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Escala de Trabalho</CardTitle>
              </CardHeader>
              <CardContent>
                {schedule ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome da Escala</p>
                      <p className="font-medium">{schedule.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">{schedule.schedule_type || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Carga Semanal</p>
                      <p className="font-medium">{selectedEmployee?.weekly_hours || contract?.weekly_hours || 44}h</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma escala vinculada.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Salário</CardTitle>
              </CardHeader>
              <CardContent>
                {contract ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Salário Base</p>
                      <p className="font-medium text-lg">{fmt(contract.base_salary)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Contrato</p>
                      <Badge variant="secondary">{contract.contract_type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Admissão</p>
                      <p className="font-medium">
                        {new Date(contract.hire_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Carga Horária Semanal</p>
                      <p className="font-medium">{contract.weekly_hours}h</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum contrato ativo encontrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Benefícios</CardTitle>
              </CardHeader>
              <CardContent>
                {contract ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Benefício</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Plano de Saúde</TableCell>
                        <TableCell className="text-right font-mono">{fmt(contract.health_insurance)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Plano Odontológico</TableCell>
                        <TableCell className="text-right font-mono">{fmt(contract.dental_insurance)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Vale Refeição</TableCell>
                        <TableCell className="text-right font-mono">{fmt(contract.meal_voucher)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Vale Transporte</TableCell>
                        <TableCell className="text-right font-mono">{fmt(contract.transportation_voucher)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Outros Benefícios</TableCell>
                        <TableCell className="text-right font-mono">{fmt(contract.other_benefits)}</TableCell>
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right font-mono">
                          {fmt(
                            (contract.health_insurance || 0) +
                            (contract.dental_insurance || 0) +
                            (contract.meal_voucher || 0) +
                            (contract.transportation_voucher || 0) +
                            (contract.other_benefits || 0)
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">Nenhum contrato ativo encontrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default LaborData;
