import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Trash2, History } from "lucide-react";
import { useEmployeeChanges, type EmployeeChange } from "@/hooks/useEmployeeChanges";
import { useDeleteEmployeeChange } from "@/hooks/useDeleteEmployeeChange";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";
import { generateCsv, downloadCsv, formatDateBR } from "@/lib/exportCsv";

interface EmployeeChangesHistoryProps {
  employeeId: string;
}

const ITEMS_PER_PAGE = 10;

export function EmployeeChangesHistory({ employeeId }: EmployeeChangesHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: changes, isLoading } = useEmployeeChanges(employeeId);
  const { mutate: deleteChange, isPending: isDeleting } = useDeleteEmployeeChange();
  const { isAdmin } = useUserRole();
  const canDelete = isAdmin;

  const totalPages = Math.ceil((changes?.length || 0) / ITEMS_PER_PAGE);
  const paginatedChanges = changes?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("pt-BR"),
      time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const getChangedByName = (change: EmployeeChange) => {
    return change.changed_by_name || "—";
  };

  const handleExportCsv = () => {
    if (!changes || changes.length === 0) return;

    const csvContent = generateCsv(changes, [
      { header: "Data", accessor: (c) => formatDateBR(c.created_at) },
      { header: "Hora", accessor: (c) => formatDateTime(c.created_at).time },
      { header: "Campo alterado", accessor: (c) => c.field_label },
      { header: "Alterado por", accessor: (c) => getChangedByName(c) },
      { header: "Valor anterior", accessor: (c) => c.old_value || "—" },
      { header: "Alterado para", accessor: (c) => c.new_value || "—" },
    ]);

    downloadCsv(csvContent, `historico-alteracoes-${employeeId}.csv`);
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico do Colaborador
        </CardTitle>
        {changes && changes.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="h-4 w-4 mr-2" />
            Exportar .csv
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!changes || changes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma alteração registrada para este colaborador.
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead className="w-[80px]">Hora</TableHead>
                    <TableHead>Campo alterado</TableHead>
                    <TableHead>Alterado por</TableHead>
                    <TableHead>Valor anterior</TableHead>
                    <TableHead>Alterado para</TableHead>
                    {canDelete && <TableHead className="w-[80px]">Opções</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedChanges?.map((change) => {
                    const { date, time } = formatDateTime(change.created_at);
                    return (
                      <TableRow key={change.id}>
                        <TableCell className="font-medium">{date}</TableCell>
                        <TableCell>{time}</TableCell>
                        <TableCell>{change.field_label}</TableCell>
                        <TableCell>{getChangedByName(change)}</TableCell>
                        <TableCell className="max-w-[150px] truncate" title={change.old_value || "—"}>
                          {change.old_value || "—"}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={change.new_value || "—"}>
                          {change.new_value || "—"}
                        </TableCell>
                        {canDelete && (
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover registro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. O registro de alteração
                                    será removido permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteChange(change.id)}
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
