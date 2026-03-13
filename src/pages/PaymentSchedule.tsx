import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Check, X, CreditCard, DollarSign, Clock, CheckCircle, Calendar, List } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DatePickerWithYearMonth } from "@/components/ui/date-picker-with-year-month";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentCalendarView } from "@/components/PaymentCalendarView";

type PaymentStatus = "pending" | "paid" | "cancelled";
type PaymentMethod = "pix" | "transfer" | "deposit" | "cash";

const statusConfig: Record<PaymentStatus, { label: string; variant: "outline" | "success" | "destructive" }> = {
  pending: { label: "Pendente", variant: "outline" },
  paid: { label: "Pago", variant: "success" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const methodLabels: Record<PaymentMethod, string> = {
  pix: "PIX",
  transfer: "Transferência",
  deposit: "Depósito",
  cash: "Dinheiro",
};

const PaymentSchedule = () => {
  const { user } = useAuth();
  const { organizationId } = useCurrentOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    employee_id: "",
    amount: "",
    payment_method: "pix" as PaymentMethod,
    payment_date: null as Date | null,
    description: "",
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payment-schedule", organizationId, statusFilter],
    queryFn: async () => {
      if (!organizationId) return [];
      let query = supabase
        .from("payment_schedule")
        .select("*, employee:employee_id(id, full_name)")
        .eq("organization_id", organizationId)
        .order("payment_date", { ascending: true });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-list", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name")
        .eq("organization_id", organizationId)
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!formData.employee_id || !formData.amount || !formData.payment_date) throw new Error("Preencha campos obrigatórios");
      const { error } = await supabase.from("payment_schedule").insert({
        organization_id: organizationId!,
        employee_id: formData.employee_id,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_date: format(formData.payment_date, "yyyy-MM-dd"),
        description: formData.description || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-schedule"] });
      toast({ title: "Pagamento agendado!" });
      setDialogOpen(false);
      setFormData({ employee_id: "", amount: "", payment_method: "pix", payment_date: null, description: "" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PaymentStatus }) => {
      const updateData: any = { status };
      if (status === "paid") updateData.paid_at = new Date().toISOString();
      const { error } = await supabase.from("payment_schedule").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-schedule"] });
      toast({ title: "Status atualizado!" });
    },
  });

  const totalPending = payments.filter((p: any) => p.status === "pending").reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const totalPaid = payments.filter((p: any) => p.status === "paid").reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Programação de Pagamento</h1>
          <p className="text-muted-foreground">Calendário de pagamentos agendados e status.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Agendar Pagamento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="size-4" /> Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="size-4" /> Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">R$ {totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="size-4" /> Total Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <List className="size-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="size-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum pagamento agendado.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.employee?.full_name || "—"}</TableCell>
                    <TableCell>R$ {Number(p.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{methodLabels[p.payment_method as PaymentMethod]}</TableCell>
                    <TableCell>{format(new Date(p.payment_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{p.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[p.status as PaymentStatus]?.variant || "outline"}>
                        {statusConfig[p.status as PaymentStatus]?.label || p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Marcar como pago"
                            onClick={() => updateStatusMutation.mutate({ id: p.id, status: "paid" })}>
                            <Check className="size-4 text-emerald-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Cancelar"
                            onClick={() => updateStatusMutation.mutate({ id: p.id, status: "cancelled" })}>
                            <X className="size-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <PaymentCalendarView payments={payments} />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Colaborador *</label>
              <Select value={formData.employee_id} onValueChange={v => setFormData(p => ({ ...p, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Valor (R$) *</label>
                <Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} placeholder="0,00" />
              </div>
              <div>
                <label className="text-sm font-medium">Método</label>
                <Select value={formData.payment_method} onValueChange={v => setFormData(p => ({ ...p, payment_method: v as PaymentMethod }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                    <SelectItem value="deposit">Depósito</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Data do Pagamento *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.payment_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.payment_date ? format(formData.payment_date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePickerWithYearMonth selected={formData.payment_date} onSelect={(d: Date) => setFormData(p => ({ ...p, payment_date: d }))} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Ex: Salário mensal" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Agendar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentSchedule;
