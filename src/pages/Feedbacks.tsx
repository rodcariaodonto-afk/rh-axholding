import { useSearchParams } from "react-router-dom";
import { useAllFeedbacks, Feedback } from "@/hooks/useFeedbacks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Eye, MessageSquare, X, CalendarIcon, ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SendFeedbackDialog } from "@/components/SendFeedbackDialog";
import { useAuth } from "@/hooks/useAuth";

const getFeedbackBadge = (type: "positive" | "neutral" | "negative") => {
  const config = {
    positive: { label: "Positivo", variant: "default" as const, className: "bg-green-500 hover:bg-green-600" },
    neutral: { label: "Neutro", variant: "default" as const, className: "bg-yellow-500 hover:bg-yellow-600 text-black" },
    negative: { label: "Negativo", variant: "destructive" as const, className: "" },
  };
  return config[type];
};

export default function Feedbacks() {
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  const { data: feedbacks, isLoading } = useAllFeedbacks(isDemoMode);
  const { user } = useAuth();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  
  // Filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  
  // Sorting states
  type SortField = "date" | "receiver" | "sender" | "type";
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Get unique employees for filter dropdown
  const employees = useMemo(() => {
    if (!feedbacks) return [];
    const employeeMap = new Map<string, { id: string; name: string }>();
    
    feedbacks.forEach((f) => {
      if (f.sender) {
        employeeMap.set(f.sender_id, {
          id: f.sender_id,
          name: f.sender.full_name || f.sender.email,
        });
      }
      if (f.receiver) {
        employeeMap.set(f.receiver_id, {
          id: f.receiver_id,
          name: f.receiver.full_name || f.receiver.email,
        });
      }
    });
    
    return Array.from(employeeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [feedbacks]);

  // Filter and sort feedbacks
  const sortedAndFilteredFeedbacks = useMemo(() => {
    if (!feedbacks) return [];
    
    let result = feedbacks.filter((f) => {
      // Date filter
      if (dateFrom) {
        const feedbackDate = new Date(f.created_at);
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (feedbackDate < fromDate) return false;
      }
      
      if (dateTo) {
        const feedbackDate = new Date(f.created_at);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (feedbackDate > toDate) return false;
      }
      
      // Type filter
      if (typeFilter !== "all" && f.feedback_type !== typeFilter) return false;
      
      // Employee filter (matches sender OR receiver)
      if (employeeFilter !== "all") {
        if (f.sender_id !== employeeFilter && f.receiver_id !== employeeFilter) return false;
      }
      
      return true;
    });

    // Sort
    if (sortField) {
      result = [...result].sort((a, b) => {
        let valueA: string = "";
        let valueB: string = "";

        switch (sortField) {
          case "date":
            valueA = a.created_at;
            valueB = b.created_at;
            break;
          case "receiver":
            valueA = (a.receiver?.full_name || a.receiver?.email || "").toLowerCase();
            valueB = (b.receiver?.full_name || b.receiver?.email || "").toLowerCase();
            break;
          case "sender":
            valueA = (a.sender?.full_name || a.sender?.email || "").toLowerCase();
            valueB = (b.sender?.full_name || b.sender?.email || "").toLowerCase();
            break;
          case "type":
            valueA = a.feedback_type;
            valueB = b.feedback_type;
            break;
        }

        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [feedbacks, dateFrom, dateTo, typeFilter, employeeFilter, sortField, sortDirection]);

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setTypeFilter("all");
    setEmployeeFilter("all");
  };

  const hasActiveFilters = dateFrom || dateTo || typeFilter !== "all" || employeeFilter !== "all";

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Feedbacks
          </h1>
          {user && <SendFeedbackDialog currentUserId={user.id} />}
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center justify-between">
              <span>Todos os Feedbacks</span>
              {feedbacks && (
                <span className="text-sm font-normal text-muted-foreground ml-4">
                  {sortedAndFilteredFeedbacks.length} de {feedbacks.length}
                </span>
              )}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] h-9 justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] h-9 justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="positive">Positivo</SelectItem>
                  <SelectItem value="neutral">Neutro</SelectItem>
                  <SelectItem value="negative">Negativo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Colaborador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !sortedAndFilteredFeedbacks || sortedAndFilteredFeedbacks.length === 0 ? (
              <p className="text-muted-foreground">
                {hasActiveFilters 
                  ? "Nenhum feedback encontrado com os filtros aplicados." 
                  : "Nenhum feedback encontrado."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center">
                        Data {getSortIcon("date")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("receiver")}
                    >
                      <div className="flex items-center">
                        Quem Recebeu {getSortIcon("receiver")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("sender")}
                    >
                      <div className="flex items-center">
                        Quem Enviou {getSortIcon("sender")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center">
                        Status {getSortIcon("type")}
                      </div>
                    </TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredFeedbacks.map((feedback) => {
                    const badge = getFeedbackBadge(feedback.feedback_type);
                    return (
                      <TableRow key={feedback.id}>
                        <TableCell>
                          {format(new Date(feedback.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {feedback.receiver?.full_name || feedback.receiver?.email || "—"}
                        </TableCell>
                        <TableCell>
                          {feedback.sender?.full_name || feedback.sender?.email || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={badge.className} variant={badge.variant}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedFeedback(feedback)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Feedback</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data</p>
                <p>{format(new Date(selectedFeedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quem Enviou</p>
                <p>{selectedFeedback.sender?.full_name || selectedFeedback.sender?.email || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quem Recebeu</p>
                <p>{selectedFeedback.receiver?.full_name || selectedFeedback.receiver?.email || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={getFeedbackBadge(selectedFeedback.feedback_type).className}>
                  {getFeedbackBadge(selectedFeedback.feedback_type).label}
                </Badge>
              </div>
              {selectedFeedback.message && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mensagem</p>
                  <p className="whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}