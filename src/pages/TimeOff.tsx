import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useEmployees } from "@/hooks/useEmployees";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Palmtree, Check, X, Clock, MoreHorizontal, Plus, Eye, Pencil, Trash2, CalendarDays } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { TimeOffRequestDialog } from "@/components/TimeOffRequestDialog";
import { 
  mockTimeOffRequests, 
  mockTimeOffPolicies, 
  mockTimeOffEmployees,
  type MockTimeOffRequest 
} from "@/mocks/timeOffData";

type TimeOffStatus = "pending_people" | "approved" | "rejected" | "cancelled";

interface TimeOffRequest {
  id: string;
  employee_id: string;
  policy_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: TimeOffStatus;
  notes: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<TimeOffStatus, string> = {
  pending_people: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<TimeOffStatus, "warning" | "success" | "error" | "neutral"> = {
  pending_people: "warning",
  approved: "success",
  rejected: "error",
  cancelled: "neutral",
};

export default function TimeOff() {
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  
  const { user } = useAuth();
  const { isAdmin, isPeople } = useUserRole(user?.id);
  const { data: employees } = useEmployees();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<TimeOffStatus | "all">("all");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<TimeOffRequest | null>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "approved">("requests");
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    request: TimeOffRequest | null;
    action: "approve" | "reject" | null;
  }>({ open: false, request: null, action: null });
  const [reviewNotes, setReviewNotes] = useState("");
  const [viewModal, setViewModal] = useState<{
    open: boolean;
    request: TimeOffRequest | null;
  }>({ open: false, request: null });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    request: TimeOffRequest | null;
  }>({ open: false, request: null });

  // Check if user is admin or people role
  const isManager = isAdmin || isPeople;
  const canManage = !isDemoMode && isManager;

  const { data: requests, isLoading } = useQuery({
    queryKey: ["time-off-requests", isDemoMode, user?.id, isManager],
    queryFn: async () => {
      if (isDemoMode) {
        // In demo mode, for regular users, filter to show only their mock requests
        if (!isManager) {
          return mockTimeOffRequests.filter(r => r.employee_id === "emp-001") as TimeOffRequest[];
        }
        return mockTimeOffRequests as TimeOffRequest[];
      }
      
      // RLS will automatically filter - regular users only see their own requests
      const { data, error } = await supabase
        .from("time_off_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TimeOffRequest[];
    },
  });

  const { data: policies } = useQuery({
    queryKey: ["time-off-policies", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return mockTimeOffPolicies;
      }
      
      const { data, error } = await supabase
        .from("time_off_policies")
        .select("id, name")
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ requestId, status, notes }: { 
      requestId: string; 
      status: TimeOffStatus; 
      notes: string;
    }) => {
      const { error } = await supabase
        .from("time_off_requests")
        .update({
          status,
          review_notes: notes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-off-requests"] });
      toast({
        title: "Solicitação atualizada",
        description: reviewModal.action === "approve" 
          ? "Férias aprovadas com sucesso." 
          : "Solicitação rejeitada.",
      });
      setReviewModal({ open: false, request: null, action: null });
      setReviewNotes("");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a solicitação.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("time_off_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-off-requests"] });
      toast({
        title: "Férias excluídas",
        description: "As férias foram excluídas com sucesso.",
      });
      setDeleteModal({ open: false, request: null });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir as férias.",
        variant: "destructive",
      });
    },
  });

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    if (statusFilter === "all") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  // Get only approved requests for the approved table
  const approvedRequests = useMemo(() => {
    if (!requests) return [];
    return requests
      .filter((r) => r.status === "approved")
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }, [requests]);

  const getEmployeeName = (employeeId: string) => {
    if (isDemoMode) {
      const demoEmployee = mockTimeOffEmployees.find((e) => e.id === employeeId);
      return demoEmployee?.full_name || demoEmployee?.email || "—";
    }
    const employee = employees?.find((e) => e.id === employeeId);
    return employee?.full_name || employee?.email || "—";
  };

  const getPolicyName = (policyId: string) => {
    const policy = policies?.find((p) => p.id === policyId);
    return policy?.name || "—";
  };

  const handleReview = (request: TimeOffRequest, action: "approve" | "reject") => {
    setReviewModal({ open: true, request, action });
  };

  const handleEdit = (request: TimeOffRequest) => {
    setEditingRequest(request);
    setRequestDialogOpen(true);
  };

  const handleDelete = (request: TimeOffRequest) => {
    setDeleteModal({ open: true, request });
  };

  const confirmDelete = () => {
    if (!deleteModal.request) return;
    deleteMutation.mutate(deleteModal.request.id);
  };

  const confirmReview = () => {
    if (!reviewModal.request || !reviewModal.action) return;
    
    reviewMutation.mutate({
      requestId: reviewModal.request.id,
      status: reviewModal.action === "approve" ? "approved" : "rejected",
      notes: reviewNotes,
    });
  };

  // Get employees currently on vacation with their info
  const employeesOnVacation = useMemo(() => {
    if (!requests) return [];
    const today = new Date();
    return requests.filter((r) => {
      if (r.status !== "approved") return false;
      const start = parseISO(r.start_date);
      const end = parseISO(r.end_date);
      return isWithinInterval(today, { start, end });
    }).map((r) => ({
      ...r,
      employeeName: getEmployeeName(r.employee_id),
      policyName: getPolicyName(r.policy_id),
    }));
  }, [requests, employees, policies, isDemoMode]);

  const onVacationCount = employeesOnVacation.length;

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{isManager ? "Gestão de Férias" : "Minhas Férias"}</h1>
          {!isDemoMode && (
            <Button onClick={() => setRequestDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {isManager ? "Nova Solicitação" : "Solicitar Férias"}
            </Button>
          )}
        </div>

        {/* Dashboard Cards - Different for managers vs regular users */}
        {isManager ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Férias Agora</CardTitle>
                <Palmtree className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onVacationCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requests?.filter((r) => r.status === "pending_people").length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
                <Check className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requests?.filter((r) => r.status === "approved").length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
                <X className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requests?.filter((r) => r.status === "rejected").length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Minhas Solicitações</CardTitle>
                <Palmtree className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{requests?.length || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requests?.filter((r) => r.status === "pending_people").length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
                <Check className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {requests?.filter((r) => r.status === "approved").length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Employees Currently on Vacation - Only visible to managers */}
        {isManager && employeesOnVacation.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palmtree className="h-5 w-5 text-primary" />
                Colaboradores em Férias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {employeesOnVacation.map((vacation) => (
                  <div
                    key={vacation.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Palmtree className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{vacation.employeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(vacation.start_date), "dd/MM", { locale: ptBR })} - {format(parseISO(vacation.end_date), "dd/MM", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {vacation.policyName}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === "requests" ? "default" : "ghost"}
            className="rounded-b-none"
            onClick={() => setActiveTab("requests")}
          >
            <Clock className="h-4 w-4 mr-2" />
            Solicitações
          </Button>
          <Button
            variant={activeTab === "approved" ? "default" : "ghost"}
            className="rounded-b-none"
            onClick={() => setActiveTab("approved")}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Férias Aprovadas
          </Button>
        </div>

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>{isManager ? "Solicitações de Férias" : "Minhas Solicitações"}</CardTitle>
                <Select 
                  value={statusFilter} 
                  onValueChange={(v) => setStatusFilter(v as TimeOffStatus | "all")}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending_people">Pendentes</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="rejected">Rejeitados</SelectItem>
                    <SelectItem value="cancelled">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma solicitação encontrada.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isManager && <TableHead>Colaborador</TableHead>}
                      <TableHead>Tipo</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        {isManager && (
                          <TableCell className="font-medium">
                            {getEmployeeName(request.employee_id)}
                          </TableCell>
                        )}
                        <TableCell>{getPolicyName(request.policy_id)}</TableCell>
                        <TableCell>
                          {format(parseISO(request.start_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(request.end_date), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{request.total_days}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_COLORS[request.status]}>
                            {STATUS_LABELS[request.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isManager ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {request.status === "pending_people" && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleReview(request, "approve")}>
                                      <Check className="h-4 w-4 mr-2 text-success" />
                                      Aprovar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleReview(request, "reject")}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Rejeitar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem onClick={() => handleEdit(request)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(request)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            // Regular user actions - can only edit/cancel pending requests
                            request.status === "pending_people" ? (
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEdit(request)}
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(request)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setViewModal({ open: true, request })}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Approved Vacations Tab */}
        {activeTab === "approved" && (
          <Card>
            <CardHeader>
              <CardTitle>{isManager ? "Férias Aprovadas" : "Minhas Férias Aprovadas"}</CardTitle>
            </CardHeader>
            <CardContent>
              {approvedRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {isManager ? "Nenhuma férias aprovada encontrada." : "Você ainda não tem férias aprovadas."}
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        {isManager && <TableHead className="font-semibold">Colaborador</TableHead>}
                        <TableHead className="font-semibold">Data de Início</TableHead>
                        <TableHead className="font-semibold">Data de Término</TableHead>
                        <TableHead className="font-semibold">Número de Dias</TableHead>
                        <TableHead className="font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold">Opções</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedRequests.map((request, index) => (
                        <TableRow 
                          key={request.id}
                          className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                        >
                          {isManager && (
                            <TableCell className="font-medium">
                              {getEmployeeName(request.employee_id)}
                            </TableCell>
                          )}
                          <TableCell>
                            {format(parseISO(request.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {format(parseISO(request.end_date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">{request.total_days}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getPolicyName(request.policy_id)}</Badge>
                          </TableCell>
                          <TableCell>
                            {isManager ? (
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setViewModal({ open: true, request })}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Visualizar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleEdit(request)}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => handleDelete(request)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Excluir
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setViewModal({ open: true, request })}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver Detalhes
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Modal */}
      <Dialog 
        open={reviewModal.open} 
        onOpenChange={(open) => {
          if (!open) {
            setReviewModal({ open: false, request: null, action: null });
            setReviewNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewModal.action === "approve" ? "Aprovar Férias" : "Rejeitar Solicitação"}
            </DialogTitle>
          </DialogHeader>
          
          {reviewModal.request && (
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <p><strong>Colaborador:</strong> {getEmployeeName(reviewModal.request.employee_id)}</p>
                <p><strong>Período:</strong> {format(parseISO(reviewModal.request.start_date), "dd/MM/yyyy")} - {format(parseISO(reviewModal.request.end_date), "dd/MM/yyyy")}</p>
                <p><strong>Dias:</strong> {reviewModal.request.total_days}</p>
                {reviewModal.request.notes && (
                  <p><strong>Observações do colaborador:</strong> {reviewModal.request.notes}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  Observações (opcional)
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Adicione uma observação..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewModal({ open: false, request: null, action: null });
                setReviewNotes("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant={reviewModal.action === "approve" ? "default" : "destructive"}
              onClick={confirmReview}
              disabled={reviewMutation.isPending}
            >
              {reviewModal.action === "approve" ? "Aprovar" : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New/Edit Request Dialog */}
      <TimeOffRequestDialog 
        open={requestDialogOpen} 
        onOpenChange={(open) => {
          setRequestDialogOpen(open);
          if (!open) setEditingRequest(null);
        }}
        editRequest={editingRequest}
      />

      {/* View Approved Request Modal */}
      <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, request: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes das Férias</DialogTitle>
          </DialogHeader>
          {viewModal.request && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Colaborador</p>
                  <p className="text-sm">{getEmployeeName(viewModal.request.employee_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                  <p className="text-sm">{getPolicyName(viewModal.request.policy_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
                  <p className="text-sm">{format(parseISO(viewModal.request.start_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Término</p>
                  <p className="text-sm">{format(parseISO(viewModal.request.end_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Dias</p>
                  <p className="text-sm font-semibold">{viewModal.request.total_days} dias</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="success">Aprovado</Badge>
                </div>
              </div>
              {viewModal.request.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="text-sm mt-1">{viewModal.request.notes}</p>
                </div>
              )}
              {viewModal.request.review_notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notas da Aprovação</p>
                  <p className="text-sm mt-1">{viewModal.request.review_notes}</p>
                </div>
              )}
              {viewModal.request.reviewed_by && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aprovado por</p>
                  <p className="text-sm">{getEmployeeName(viewModal.request.reviewed_by)}</p>
                </div>
              )}
              {viewModal.request.reviewed_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data da Aprovação</p>
                  <p className="text-sm">{format(parseISO(viewModal.request.reviewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModal({ open: false, request: null })}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, request: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir as férias de{" "}
            <strong>{deleteModal.request ? getEmployeeName(deleteModal.request.employee_id) : ""}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, request: null })}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
