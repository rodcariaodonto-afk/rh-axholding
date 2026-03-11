import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useEmployees } from "@/hooks/useEmployees";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useCompanyCostSettings } from "@/hooks/useCompanyCostSettings";
import { Download, DollarSign, Users, TrendingUp, Calculator } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// INSS employee brackets 2024
function calcINSSEmployee(salary: number): number {
  if (salary <= 1412.00) return salary * 0.075;
  if (salary <= 2666.68) return 1412.00 * 0.075 + (salary - 1412.00) * 0.09;
  if (salary <= 4000.03) return 1412.00 * 0.075 + (2666.68 - 1412.00) * 0.09 + (salary - 2666.68) * 0.12;
  if (salary <= 7786.02) return 1412.00 * 0.075 + (2666.68 - 1412.00) * 0.09 + (4000.03 - 2666.68) * 0.12 + (salary - 4000.03) * 0.14;
  return 1412.00 * 0.075 + (2666.68 - 1412.00) * 0.09 + (4000.03 - 2666.68) * 0.12 + (7786.02 - 4000.03) * 0.14;
}

// IRRF brackets 2024
function calcIRRF(salary: number, inss: number): number {
  const base = salary - inss;
  if (base <= 2259.20) return 0;
  if (base <= 2826.65) return base * 0.075 - 169.44;
  if (base <= 3751.05) return base * 0.15 - 381.44;
  if (base <= 4664.68) return base * 0.225 - 662.77;
  return base * 0.275 - 896.00;
}

export default function Payroll() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { organizationId } = useCurrentOrganization();
  const yearOptions = [selectedYear - 1, selectedYear, selectedYear + 1];

  const { data: employees = [], isLoading: loadingEmp } = useEmployees();
  const activeEmployees = useMemo(() => employees.filter((e) => e.status === "active"), [employees]);

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["payroll-contracts", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees_contracts")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });

  const { settings } = useCompanyCostSettings();

  // Build payroll data
  const payrollData = useMemo(() => {
    return activeEmployees.map((emp) => {
      const contract = contracts.find((c) => c.user_id === emp.id);
      if (!contract) return null;

      const salary = contract.base_salary || 0;
      const vt = contract.transportation_voucher || 0;
      const vr = contract.meal_voucher || 0;
      const healthIns = contract.health_insurance || 0;
      const dentalIns = contract.dental_insurance || 0;
      const otherBenefits = contract.other_benefits || 0;
      const totalBenefits = vt + vr + healthIns + dentalIns + otherBenefits;

      // Employee deductions
      const inssEmployee = calcINSSEmployee(salary);
      const irrf = calcIRRF(salary, inssEmployee);
      const totalDeductions = inssEmployee + irrf;
      const netSalary = salary - totalDeductions;

      // Employer charges
      const fgtsRate = settings?.fgts_rate ?? 8;
      const inssEmployerRate = settings?.inss_employer_rate ?? 20;
      const ratRate = settings?.rat_rate ?? 2;
      const systemSRate = settings?.system_s_rate ?? 5.8;

      const fgts = salary * (fgtsRate / 100);
      const inssEmployer = salary * (inssEmployerRate / 100);
      const rat = salary * (ratRate / 100);
      const systemS = salary * (systemSRate / 100);
      const totalCharges = fgts + inssEmployer + rat + systemS;

      // Provisions
      const thirteenth = salary / 12;
      const vacation = salary / 12;
      const vacationBonus = vacation / 3;
      const totalProvisions = thirteenth + vacation + vacationBonus;

      const totalCost = salary + totalBenefits + totalCharges + totalProvisions;

      return {
        id: emp.id,
        name: emp.full_name || emp.email,
        salary,
        totalBenefits,
        inssEmployee,
        irrf,
        totalDeductions,
        netSalary,
        fgts,
        inssEmployer,
        totalCharges,
        totalProvisions,
        totalCost,
        contractType: contract.contract_type,
      };
    }).filter(Boolean) as any[];
  }, [activeEmployees, contracts, settings]);

  const totals = useMemo(() => {
    return payrollData.reduce(
      (acc, row) => ({
        salary: acc.salary + row.salary,
        deductions: acc.deductions + row.totalDeductions,
        netSalary: acc.netSalary + row.netSalary,
        charges: acc.charges + row.totalCharges,
        totalCost: acc.totalCost + row.totalCost,
      }),
      { salary: 0, deductions: 0, netSalary: 0, charges: 0, totalCost: 0 }
    );
  }, [payrollData]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const isLoading = loadingEmp || loadingContracts;

  const handleExportCSV = () => {
    if (payrollData.length === 0) return;
    const header = "Colaborador,Salário Bruto,INSS,IRRF,Total Descontos,Salário Líquido,FGTS,Custo Total\n";
    const rows = payrollData.map((r) =>
      `"${r.name}",${fmt(r.salary)},${fmt(r.inssEmployee)},${fmt(r.irrf)},${fmt(r.totalDeductions)},${fmt(r.netSalary)},${fmt(r.fgts)},${fmt(r.totalCost)}`
    );
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `folha-${MONTHS[selectedMonth]}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Folha de Pagamento</h1>
          <p className="text-muted-foreground">Simulação de folha com cálculos CLT</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={payrollData.length === 0}>
          <Download className="size-4 mr-1.5" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Mês</label>
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Ano</label>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="h-8 text-xs">
              {payrollData.length} colaboradores CLT
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folha Bruta</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">R$ {fmt(totals.salary)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descontos</CardTitle>
            <Calculator className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">R$ {fmt(totals.deductions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Líquido Total</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">R$ {fmt(totals.netSalary)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">R$ {fmt(totals.totalCost)}</div>
            <p className="text-xs text-muted-foreground">com encargos e provisões</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : payrollData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum colaborador com contrato ativo encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead className="text-right">Salário Bruto</TableHead>
                <TableHead className="text-right">INSS</TableHead>
                <TableHead className="text-right">IRRF</TableHead>
                <TableHead className="text-right">Descontos</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
                <TableHead className="text-right">FGTS</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right text-sm">R$ {fmt(row.salary)}</TableCell>
                  <TableCell className="text-right text-sm text-destructive">R$ {fmt(row.inssEmployee)}</TableCell>
                  <TableCell className="text-right text-sm text-destructive">R$ {fmt(row.irrf)}</TableCell>
                  <TableCell className="text-right text-sm font-medium text-destructive">R$ {fmt(row.totalDeductions)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">R$ {fmt(row.netSalary)}</TableCell>
                  <TableCell className="text-right text-sm">R$ {fmt(row.fgts)}</TableCell>
                  <TableCell className="text-right text-sm font-bold">R$ {fmt(row.totalCost)}</TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">R$ {fmt(totals.salary)}</TableCell>
                <TableCell className="text-right" colSpan={2} />
                <TableCell className="text-right text-destructive">R$ {fmt(totals.deductions)}</TableCell>
                <TableCell className="text-right">R$ {fmt(totals.netSalary)}</TableCell>
                <TableCell className="text-right" />
                <TableCell className="text-right">R$ {fmt(totals.totalCost)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground text-center">
            ⚠️ Esta é uma <strong>simulação</strong> para fins de planejamento. Os valores podem divergir da folha oficial
            processada pelo contador/eSocial. Consulte sempre o responsável pelo departamento pessoal para valores definitivos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
