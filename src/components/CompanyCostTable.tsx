import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { EmployeeWithCost } from "@/hooks/useCompanyCosts";

type SortField = "name" | "department" | "position" | "salary" | "benefits" | "total" | "charges" | "provisions";
type SortDirection = "asc" | "desc";

interface CompanyCostTableProps {
  employees: EmployeeWithCost[];
}

export const CompanyCostTable = ({ employees }: CompanyCostTableProps) => {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    
    switch (sortField) {
      case "name":
        return (a.full_name || a.email).localeCompare(b.full_name || b.email) * multiplier;
      case "department":
        return ((a.department || "").localeCompare(b.department || "")) * multiplier;
      case "position":
        return ((a.position || "").localeCompare(b.position || "")) * multiplier;
      case "salary":
        return (a.cost.base_salary - b.cost.base_salary) * multiplier;
      case "benefits":
        return (a.cost.benefits - b.cost.benefits) * multiplier;
      case "total":
        return (a.cost.total_with_charges - b.cost.total_with_charges) * multiplier;
      case "charges":
        return (a.cost.total_charges - b.cost.total_charges) * multiplier;
      case "provisions":
        return (a.cost.total_provisions - b.cost.total_provisions) * multiplier;
      default:
        return 0;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhamento por Colaborador</CardTitle>
        <CardDescription>
          Visão completa dos custos individuais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="payroll" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payroll">Folha</TabsTrigger>
            <TabsTrigger value="without_taxes">Sem Impostos</TabsTrigger>
            <TabsTrigger value="total">Total com Encargos</TabsTrigger>
          </TabsList>

          {/* Tab: Folha */}
          <TabsContent value="payroll">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("name")} className="h-8 p-0 font-semibold">
                        Colaborador
                        {getSortIcon("name")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("department")} className="h-8 p-0 font-semibold">
                        Departamento
                        {getSortIcon("department")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("position")} className="h-8 p-0 font-semibold">
                        Cargo
                        {getSortIcon("position")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort("salary")} className="h-8 p-0 font-semibold ml-auto">
                        Salário Bruto
                        {getSortIcon("salary")}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEmployees.map((emp) => (
                    <TableRow key={emp.employee_id}>
                      <TableCell className="font-medium">
                        {emp.full_name || emp.email}
                      </TableCell>
                      <TableCell>{emp.department || "-"}</TableCell>
                      <TableCell>{emp.position || "-"}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(emp.cost.base_salary)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tab: Sem Impostos */}
          <TabsContent value="without_taxes">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("name")} className="h-8 p-0 font-semibold">
                        Colaborador
                        {getSortIcon("name")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort("salary")} className="h-8 p-0 font-semibold ml-auto">
                        Salário
                        {getSortIcon("salary")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort("benefits")} className="h-8 p-0 font-semibold ml-auto">
                        Benefícios
                        {getSortIcon("benefits")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort("total")} className="h-8 p-0 font-semibold ml-auto">
                        Total
                        {getSortIcon("total")}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEmployees.map((emp) => (
                    <TableRow key={emp.employee_id}>
                      <TableCell className="font-medium">
                        {emp.full_name || emp.email}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(emp.cost.base_salary)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(emp.cost.benefits)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(emp.cost.values_without_taxes)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tab: Total com Encargos */}
          <TabsContent value="total">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("name")} className="h-8 p-0 font-semibold">
                        Colaborador
                        {getSortIcon("name")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort("salary")} className="h-8 p-0 font-semibold ml-auto">
                        Base
                        {getSortIcon("salary")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort("benefits")} className="h-8 p-0 font-semibold ml-auto">
                        Benefícios
                        {getSortIcon("benefits")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort("charges")} className="h-8 p-0 font-semibold ml-auto">
                        Encargos
                        {getSortIcon("charges")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort("provisions")} className="h-8 p-0 font-semibold ml-auto">
                        Provisões
                        {getSortIcon("provisions")}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button variant="ghost" onClick={() => handleSort("total")} className="h-8 p-0 font-semibold ml-auto">
                        Total
                        {getSortIcon("total")}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEmployees.map((emp) => (
                    <TableRow key={emp.employee_id}>
                      <TableCell className="font-medium">
                        {emp.full_name || emp.email}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(emp.cost.base_salary)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(emp.cost.benefits)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(emp.cost.total_charges)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(emp.cost.total_provisions)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(emp.cost.total_with_charges)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
