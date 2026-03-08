import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useEmployees, type Employee } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { usePositions } from "@/hooks/usePositions";
import { useUserRole } from "@/hooks/useUserRole";
import { useDeleteEmployee } from "@/hooks/useDeleteEmployee";
import { DeleteEmployeeDialog } from "@/components/DeleteEmployeeDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, Edit, ArrowUpDown, ArrowUp, ArrowDown, Plus, Trash2, MoreHorizontal, List, LayoutGrid, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ProfilerDetailModal from "@/components/ProfilerDetailModal";
import EmployeeDashboard from "@/components/EmployeeDashboard";
import { NewEmployeeDialog } from "@/components/NewEmployeeDialog";
import { EmployeeCard } from "@/components/EmployeeCard";
import { getProfilerInitials } from "@/lib/profiler/utils";
import { getProfileByCode } from "@/lib/profiler/profiles";
import { generateCsv, downloadCsv, formatDateBR } from "@/lib/exportCsv";

type StatusFilter = "all" | "active" | "inactive";
type ViewMode = "table" | "cards";
type SortField = "name" | "email" | "status" | "type" | "hire_date" | "profiler" | "department" | "position";
type SortDirection = "asc" | "desc";

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "CLT",
  part_time: "Part-time",
  contractor: "PJ",
  intern: "Estágio",
};

const getInitials = (name?: string | null): string => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function Employees() {
  const { data: employees, isLoading } = useEmployees();
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const { isAdmin, isPeople } = useUserRole();
  const { mutate: deleteEmployee, isPending: isDeleting } = useDeleteEmployee();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>("all");
  const [profilerFilter, setProfilerFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showNewEmployeeDialog, setShowNewEmployeeDialog] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const canEdit = isAdmin || isPeople;

  // Get unique profiler codes for filter
  const uniqueProfilerCodes = useMemo(() => {
    if (!employees) return [];
    const codes = new Set<string>();
    employees.forEach(emp => {
      if (emp.profiler_result_code) {
        codes.add(emp.profiler_result_code);
      }
    });
    return Array.from(codes).sort();
  }, [employees]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
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

  const handleExportCsv = () => {
    const columns = [
      { header: 'Nome', accessor: (e: Employee) => e.full_name },
      { header: 'Email', accessor: (e: Employee) => e.email },
      { header: 'Departamento', accessor: (e: Employee) => e.department_name },
      { header: 'Cargo', accessor: (e: Employee) => e.position_title },
      { header: 'Status', accessor: (e: Employee) => 
        e.status === 'active' ? 'Ativo' : 
        e.status === 'pending' ? 'Pendente' :
        e.status === 'on_leave' ? 'Afastado' : 'Inativo' 
      },
      { header: 'Tipo Contrato', accessor: (e: Employee) => EMPLOYMENT_TYPE_LABELS[e.employment_type || ''] || e.employment_type },
      { header: 'Data Admissão', accessor: (e: Employee) => formatDateBR(e.hire_date) },
      { header: 'Data Nascimento', accessor: (e: Employee) => formatDateBR(e.birth_date) },
      { header: 'Profiler', accessor: (e: Employee) => e.profiler_result_code ? getProfilerInitials(e.profiler_result_code) : '' },
    ];
    
    const csv = generateCsv(sortedAndFilteredEmployees, columns);
    const date = new Date().toISOString().split('T')[0];
    downloadCsv(csv, `colaboradores_${date}.csv`);
  };

  const sortedAndFilteredEmployees = useMemo(() => {
    let result = employees?.filter((emp) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        emp.full_name?.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower);
      
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && (emp.status === "active" || emp.status === "pending")) ||
        (statusFilter === "inactive" && emp.status !== "active" && emp.status !== "pending");

      const matchesDepartment =
        departmentFilter === "all" || emp.department_id === departmentFilter;

      const matchesPosition =
        positionFilter === "all" || emp.base_position_id === positionFilter;

      const matchesEmploymentType =
        employmentTypeFilter === "all" || emp.employment_type === employmentTypeFilter;

      const matchesProfiler =
        profilerFilter === "all" || emp.profiler_result_code === profilerFilter;
      
      return matchesSearch && matchesStatus && matchesDepartment && matchesPosition && matchesEmploymentType && matchesProfiler;
    }) || [];

    if (sortField) {
      result = [...result].sort((a, b) => {
        let valueA: string | null = null;
        let valueB: string | null = null;

        switch (sortField) {
          case "name":
            valueA = a.full_name?.toLowerCase() || "";
            valueB = b.full_name?.toLowerCase() || "";
            break;
          case "email":
            valueA = a.email.toLowerCase();
            valueB = b.email.toLowerCase();
            break;
          case "status":
            valueA = a.status || "";
            valueB = b.status || "";
            break;
          case "type":
            valueA = a.employment_type || "";
            valueB = b.employment_type || "";
            break;
          case "hire_date":
            valueA = a.hire_date || "";
            valueB = b.hire_date || "";
            break;
          case "profiler":
            valueA = a.profiler_result_code || "";
            valueB = b.profiler_result_code || "";
            break;
          case "department":
            valueA = a.department_name?.toLowerCase() || "";
            valueB = b.department_name?.toLowerCase() || "";
            break;
          case "position":
            valueA = a.position_title?.toLowerCase() || "";
            valueB = b.position_title?.toLowerCase() || "";
            break;
        }

        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [employees, search, statusFilter, departmentFilter, positionFilter, employmentTypeFilter, profilerFilter, sortField, sortDirection]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const colCount = canEdit ? 8 : 7;

  return (
    <>
      <div className="space-y-6">
        <EmployeeDashboard employees={employees || []} />

        <Card>
          <CardHeader className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Lista de Colaboradores</CardTitle>
              <div className="flex items-center gap-2">
                <ToggleGroup 
                  type="single" 
                  value={viewMode} 
                  onValueChange={(v) => v && setViewMode(v as ViewMode)}
                  className="border rounded-md"
                >
                  <ToggleGroupItem value="table" aria-label="Visualização em tabela" size="sm">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="cards" aria-label="Visualização em cards" size="sm">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
                {canEdit && (
                  <Button size="sm" onClick={() => setShowNewEmployeeDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Convidar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleExportCsv}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-[180px] h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-full sm:w-[120px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-9">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-full sm:w-[130px] h-9">
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {positions?.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                <SelectTrigger className="w-full sm:w-[120px] h-9">
                  <SelectValue placeholder="Contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="full_time">CLT</SelectItem>
                  <SelectItem value="contractor">PJ</SelectItem>
                  <SelectItem value="intern">Estágio</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={profilerFilter} onValueChange={setProfilerFilter}>
                <SelectTrigger className="w-full sm:w-[120px] h-9">
                  <SelectValue placeholder="Profiler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueProfilerCodes.map((code) => (
                    <SelectItem key={code} value={code}>
                      {getProfilerInitials(code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "table" ? (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Nome {getSortIcon("name")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("department")}
                    >
                      <div className="flex items-center">
                        Departamento {getSortIcon("department")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("position")}
                    >
                      <div className="flex items-center">
                        Cargo {getSortIcon("position")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        Status {getSortIcon("status")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("hire_date")}
                    >
                      <div className="flex items-center">
                        Admissão {getSortIcon("hire_date")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("profiler")}
                    >
                      <div className="flex items-center">
                        Profiler {getSortIcon("profiler")}
                      </div>
                    </TableHead>
                    {canEdit && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredEmployees?.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Link to={`/employees/${employee.id}`}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={employee.photo_url || undefined} alt={employee.full_name || ""} />
                            <AvatarFallback className="text-xs">
                              {getInitials(employee.full_name)}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link to={`/employees/${employee.id}`} className="hover:underline">
                          {employee.full_name || "—"}
                        </Link>
                      </TableCell>
                      <TableCell>{employee.department_name || "—"}</TableCell>
                      <TableCell>{employee.position_title || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={
                          employee.status === "active" ? "success" : 
                          employee.status === "pending" ? "outline" :
                          employee.status === "on_leave" ? "warning" : "error"
                        }>
                          {employee.status === "active" ? "Ativo" : 
                           employee.status === "pending" ? "Pendente" :
                           employee.status === "on_leave" ? "Afastado" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {employee.hire_date
                          ? employee.hire_date.split('T')[0].split('-').reverse().join('/')
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {employee.profiler_result_code ? (
                          (() => {
                            const profile = getProfileByCode(employee.profiler_result_code);
                            return (
                              <Badge 
                                variant="outline" 
                                className="cursor-pointer hover:opacity-80 transition-opacity font-medium"
                                style={{
                                  borderColor: profile?.color,
                                  color: profile?.color,
                                  backgroundColor: profile ? `${profile.color.replace(')', ', 0.1)')}` : undefined
                                }}
                                onClick={() => setSelectedEmployee(employee)}
                              >
                                {getProfilerInitials(employee.profiler_result_code)}
                              </Badge>
                            );
                          })()
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/employees/${employee.id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </Link>
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
                      )}
                    </TableRow>
                  ))}
                  {sortedAndFilteredEmployees?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={colCount + 1} className="text-center text-muted-foreground">
                        Nenhum colaborador encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={colCount + 1} className="text-center font-medium">
                      Total: {sortedAndFilteredEmployees?.length || 0} {sortedAndFilteredEmployees?.length === 1 ? 'colaborador' : 'colaboradores'}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sortedAndFilteredEmployees?.map((employee) => (
                    <EmployeeCard 
                      key={employee.id} 
                      employee={employee}
                      onProfilerClick={setSelectedEmployee}
                    />
                  ))}
                </div>
                {sortedAndFilteredEmployees?.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum colaborador encontrado
                  </p>
                )}
                <p className="text-center text-sm text-muted-foreground border-t pt-4">
                  Total: {sortedAndFilteredEmployees?.length || 0} {sortedAndFilteredEmployees?.length === 1 ? 'colaborador' : 'colaboradores'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de detalhes do Profiler */}
      <ProfilerDetailModal
        open={!!selectedEmployee}
        onOpenChange={(open) => !open && setSelectedEmployee(null)}
        employeeId={selectedEmployee?.id}
        employeeName={selectedEmployee?.full_name}
        currentProfileCode={selectedEmployee?.profiler_result_code}
        currentProfileDetail={selectedEmployee?.profiler_result_detail}
        currentCompletedAt={selectedEmployee?.profiler_completed_at}
      />

      {/* Dialog para novo funcionário */}
      <NewEmployeeDialog
        open={showNewEmployeeDialog}
        onOpenChange={setShowNewEmployeeDialog}
      />

      {/* Dialog de confirmação de exclusão */}
      <DeleteEmployeeDialog
        open={!!employeeToDelete}
        onOpenChange={(open) => !open && setEmployeeToDelete(null)}
        employeeName={employeeToDelete?.full_name || employeeToDelete?.email || ""}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
