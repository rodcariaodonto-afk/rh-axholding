import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, ClipboardList } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PdiActionPlanTabProps {
  pdiId: string;
  pdi: any;
}

interface ActionPlan {
  id: string;
  action: string;
  responsible: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  notes: string | null;
  goal_id: string | null;
}

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const STATUS_BADGE: Record<string, "outline" | "info" | "success" | "destructive"> = {
  pendente: "outline",
  em_andamento: "info",
  concluido: "success",
  cancelado: "destructive",
};

export const PdiActionPlanTab = ({ pdiId, pdi }: PdiActionPlanTabProps) => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ActionPlan | null>(null);
  const [formData, setFormData] = useState({
    action: "",
    responsible: "",
    start_date: "",
    end_date: "",
    status: "pendente",
    notes: "",
    goal_id: "",
  });

  const isFinalized = pdi?.finalized_at !== null;

  const { data: actionPlans = [], isLoading } = useQuery({
    queryKey: ["pdi-action-plans", pdiId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_action_plans")
        .select("*")
        .eq("pdi_id", pdiId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ActionPlan[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingPlan) {
        const { error } = await supabase
          .from("pdi_action_plans")
          .update(data)
          .eq("id", editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pdi_action_plans")
          .insert({ ...data, pdi_id: pdiId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdi-action-plans", pdiId] });
      toast({ title: editingPlan ? "Ação atualizada!" : "Ação adicionada!" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pdi_action_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdi-action-plans", pdiId] });
      toast({ title: "Ação excluída!" });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPlan(null);
    setFormData({ action: "", responsible: "", start_date: "", end_date: "", status: "pendente", notes: "", goal_id: "" });
  };

  const openEdit = (plan: ActionPlan) => {
    setEditingPlan(plan);
    setFormData({
      action: plan.action,
      responsible: plan.responsible,
      start_date: plan.start_date || "",
      end_date: plan.end_date || "",
      status: plan.status,
      notes: plan.notes || "",
      goal_id: plan.goal_id || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.action.trim() || !formData.responsible.trim()) {
      toast({ title: "Preencha ação e responsável", variant: "destructive" });
      return;
    }
    upsertMutation.mutate({
      action: formData.action,
      responsible: formData.responsible,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      status: formData.status,
      notes: formData.notes || null,
      goal_id: formData.goal_id || null,
    });
  };

  const getGoalTitle = (goalId: string | null) => {
    if (!goalId) return "—";
    const goal = pdi?.goals?.find((g: any) => g.id === goalId);
    return goal?.title || "—";
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Plano de Ação
          </h3>
          {!isFinalized && (
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Ação
            </Button>
          )}
        </div>

        {actionPlans.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma ação cadastrada. Adicione ações para acompanhar o plano de desenvolvimento.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Meta Vinculada</TableHead>
                    <TableHead>Status</TableHead>
                    {!isFinalized && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionPlans.map(plan => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{plan.action}</TableCell>
                      <TableCell>{plan.responsible}</TableCell>
                      <TableCell>{plan.start_date ? format(new Date(plan.start_date), "dd/MM/yy") : "—"}</TableCell>
                      <TableCell>{plan.end_date ? format(new Date(plan.end_date), "dd/MM/yy") : "—"}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{getGoalTitle(plan.goal_id)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE[plan.status] || "outline"}>
                          {STATUS_OPTIONS.find(s => s.value === plan.status)?.label || plan.status}
                        </Badge>
                      </TableCell>
                      {!isFinalized && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(plan)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (confirm("Excluir esta ação?")) deleteMutation.mutate(plan.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar Ação" : "Nova Ação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Ação *</label>
              <Textarea
                value={formData.action}
                onChange={(e) => setFormData(f => ({ ...f, action: e.target.value }))}
                placeholder="Descreva a ação..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Responsável *</label>
              <Input
                value={formData.responsible}
                onChange={(e) => setFormData(f => ({ ...f, responsible: e.target.value }))}
                placeholder="Nome do responsável"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data Início</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(f => ({ ...f, start_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data Fim</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(f => ({ ...f, end_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status} onValueChange={(v) => setFormData(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Meta Vinculada</label>
                <Select value={formData.goal_id} onValueChange={(v) => setFormData(f => ({ ...f, goal_id: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {pdi?.goals?.map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                placeholder="Observações adicionais..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
              {editingPlan ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
