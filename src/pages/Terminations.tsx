import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEmployees, type Employee } from "@/hooks/useEmployees";
import { useUpdateEmployee } from "@/hooks/useUpdateEmployee";
import { useDeleteEmployee } from "@/hooks/useDeleteEmployee";
import { useTerminateEmployee } from "@/hooks/useTerminateEmployee";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, MoreHorizontal, UserMinus, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TerminationModal, type TerminationData } from "@/components/TerminationModal";
import { DeleteEmployeeDialog } from "@/components/DeleteEmployeeDialog";
import {
  TERMINATION_REASON_LABELS,
  TERMINATION_DECISION_LABELS,
  TERMINATION_CAUSE_LABELS,
} from "@/constants/terminationOptions";

const Terminations = () => {
  const { data: employees, isLoading } = useEmployees();
  const { mutate: updateEmployee } = useUpdateEmployee();
  const { mutate: deleteEmployee, isPending: isDeleting } = useDeleteEmployee();
  const { mutate: terminateEmployee } = useTerminateEmployee();
  const { isAdmin } = useUserRole();
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showSelectEmployee, setShowSelectEmployee] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const terminatedEmployees = employees?.filter(emp => emp.status === "terminated") || [];
  const activeEmployees = employees?.filter(emp => emp.status === "active") || [];
  const filteredActiveEmployees = activeEmployees.filter(emp =>
    (emp.full_name || emp.email).toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  const handleConfirmEdit = (data: TerminationData) => {
    if (!editingEmployee) return;
    
    updateEmployee({
      id: editingEmployee.id,
      termination_date: data.termination_date,
      termination_reason: data.termination_reason as any,
      termination_decision: data.termination_decision as any,
      termination_cause: data.termination_cause as any,
      termination_cost: data.termination_cost,
      termination_notes: data.termination_notes,
    });
    
    setEditingEmployee(null);
  };

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowSelectEmployee(false);
    setEmployeeSearch("");
  };

  const handleConfirmNewTermination = (data: TerminationData) => {
    if (!selectedEmployee) return;

    terminateEmployee({
      employeeId: selectedEmployee.id,
      terminationDate: data.termination_date,
      terminationReason: data.termination_reason,
      terminationDecision: data.termination_decision,
      terminationCause: data.termination_cause,
      terminationCost: data.termination_cost,
      terminationNotes: data.termination_notes,
    });

    setSelectedEmployee(null);
  };

  const handleDeleteConfirm = (params: {
    confirmationName: string;
    reason: "lgpd_request" | "cadastro_erro" | "other";
    reasonDetails?: string;
  }) => {
    if (employeeToDelete) {
      deleteEmployee({
        employeeId: employeeToDelete.id,
        confirmationName: params.confirmationName,
        reason: params.reason,
        reasonDetails: params.reasonDetails,
      }, {
        onSettled: () => setEmployeeToDelete(null),
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Desligamentos</h1>
          <Button onClick={() => setShowSelectEmployee(true)}>
            <UserMinus className="size-4 mr-2" />
            Novo Desligamento
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Colaboradores Desligados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data Demissão</TableHead>
                  <TableHead>Motivo De Desligamento</TableHead>
                  <TableHead>Decisão De Demissão</TableHead>
                  <TableHead>Motivo De Demissão</TableHead>
                  <TableHead>Valor Da Demissão</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terminatedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhum colaborador desligado encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  terminatedEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.full_name || employee.email}
                      </TableCell>
                      <TableCell>
                        {employee.termination_date
                          ? format(
                              new Date(employee.termination_date + "T00:00:00"),
                              "dd/MM/yyyy",
                              { locale: ptBR }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {employee.termination_reason
                          ? TERMINATION_REASON_LABELS[employee.termination_reason] || employee.termination_reason
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {employee.termination_decision
                          ? TERMINATION_DECISION_LABELS[employee.termination_decision] || employee.termination_decision
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {employee.termination_cause
                          ? TERMINATION_CAUSE_LABELS[employee.termination_cause] || employee.termination_cause
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(employee.termination_cost ?? null)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(employee)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem
                                onClick={() => setEmployeeToDelete(employee)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para selecionar colaborador ativo */}
      <Dialog open={showSelectEmployee} onOpenChange={setShowSelectEmployee}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecionar Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredActiveEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum colaborador ativo encontrado.
                </p>
              ) : (
                filteredActiveEmployees.map((emp) => (
                  <Button
                    key={emp.id}
                    variant="ghost"
                    className="w-full justify-start font-normal"
                    onClick={() => handleSelectEmployee(emp)}
                  >
                    {emp.full_name || emp.email}
                  </Button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de edição de desligamento */}
      <TerminationModal
        open={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onConfirm={handleConfirmEdit}
        employeeName={editingEmployee?.full_name || editingEmployee?.email || ""}
        initialData={editingEmployee ? {
          termination_date: editingEmployee.termination_date || "",
          termination_reason: editingEmployee.termination_reason || "",
          termination_decision: editingEmployee.termination_decision || "",
          termination_cause: editingEmployee.termination_cause || "",
          termination_cost: editingEmployee.termination_cost || 0,
          termination_notes: (editingEmployee as any).termination_notes || "",
        } : null}
        isEdit
      />

      {/* Modal de novo desligamento */}
      <TerminationModal
        open={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onConfirm={handleConfirmNewTermination}
        employeeName={selectedEmployee?.full_name || selectedEmployee?.email || ""}
      />

      {/* Dialog de confirmação de exclusão */}
      <DeleteEmployeeDialog
        open={!!employeeToDelete}
        onOpenChange={(open) => !open && setEmployeeToDelete(null)}
        employeeName={employeeToDelete?.full_name || employeeToDelete?.email || ""}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </Layout>
  );
};

export default Terminations;
