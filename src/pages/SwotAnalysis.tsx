import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash, TrendingUp, TrendingDown, Eye, ShieldAlert } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Quadrant = "strength" | "weakness" | "opportunity" | "threat";
type Impact = "low" | "medium" | "high";

interface SwotItem {
  id: string;
  quadrant: Quadrant;
  description: string;
  impact: Impact | null;
  related_action: string | null;
  employee_id: string | null;
  department_id: string | null;
  created_at: string;
}

const quadrantConfig: Record<Quadrant, { label: string; icon: any; color: string; bg: string }> = {
  strength: { label: "Forças", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
  weakness: { label: "Fraquezas", icon: TrendingDown, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
  opportunity: { label: "Oportunidades", icon: Eye, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
  threat: { label: "Ameaças", icon: ShieldAlert, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
};

const impactLabels: Record<Impact, { label: string; variant: "outline" | "destructive" | "default" }> = {
  low: { label: "Baixo", variant: "outline" },
  medium: { label: "Médio", variant: "default" },
  high: { label: "Alto", variant: "destructive" },
};

const SwotAnalysis = () => {
  const { user } = useAuth();
  const { organizationId } = useCurrentOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SwotItem | null>(null);
  const [formData, setFormData] = useState({ quadrant: "strength" as Quadrant, description: "", impact: "medium" as Impact, related_action: "" });
  const [filterEmployee, setFilterEmployee] = useState<string>("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["swot-analysis", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("swot_analysis")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SwotItem[];
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
    mutationFn: async (data: typeof formData & { employee_id?: string }) => {
      const { error } = await supabase.from("swot_analysis").insert({
        organization_id: organizationId!,
        quadrant: data.quadrant,
        description: data.description,
        impact: data.impact,
        related_action: data.related_action || null,
        employee_id: data.employee_id || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swot-analysis"] });
      toast({ title: "Item SWOT criado!" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; description: string; impact: Impact; related_action: string; quadrant: Quadrant }) => {
      const { error } = await supabase.from("swot_analysis").update({
        description: data.description,
        impact: data.impact,
        related_action: data.related_action || null,
        quadrant: data.quadrant,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swot-analysis"] });
      toast({ title: "Item atualizado!" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("swot_analysis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swot-analysis"] });
      toast({ title: "Item removido!" });
    },
  });

  const resetForm = () => {
    setFormData({ quadrant: "strength", description: "", impact: "medium", related_action: "" });
    setEditingItem(null);
  };

  const openCreate = (quadrant: Quadrant) => {
    resetForm();
    setFormData(prev => ({ ...prev, quadrant }));
    setDialogOpen(true);
  };

  const openEdit = (item: SwotItem) => {
    setEditingItem(item);
    setFormData({
      quadrant: item.quadrant,
      description: item.description,
      impact: (item.impact as Impact) || "medium",
      related_action: item.related_action || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.description.trim()) return;
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...formData });
    } else {
      createMutation.mutate({ ...formData, employee_id: filterEmployee !== "all" ? filterEmployee : undefined });
    }
  };

  const filteredItems = filterEmployee === "all" ? items : items.filter(i => i.employee_id === filterEmployee);

  const getQuadrantItems = (q: Quadrant) => filteredItems.filter(i => i.quadrant === q);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Matriz SWOT</h1>
          <p className="text-muted-foreground">Análise estratégica por colaborador ou organização.</p>
        </div>
        <Select value={filterEmployee} onValueChange={setFilterEmployee}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Filtrar por colaborador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda organização</SelectItem>
            {employees.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["strength", "weakness", "opportunity", "threat"] as Quadrant[]).map(q => {
          const config = quadrantConfig[q];
          const Icon = config.icon;
          const qItems = getQuadrantItems(q);
          return (
            <Card key={q} className={`border ${config.bg}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`flex items-center gap-2 text-base ${config.color}`}>
                    <Icon className="size-5" />
                    {config.label}
                    <Badge variant="outline" className="ml-1">{qItems.length}</Badge>
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => openCreate(q)}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                {qItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum item cadastrado.</p>
                ) : (
                  qItems.map(item => (
                    <div key={item.id} className="bg-background/80 rounded-lg p-3 border space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm flex-1">{item.description}</p>
                        <div className="flex gap-1 ml-2 shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                            <Edit className="size-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMutation.mutate(item.id)}>
                            <Trash className="size-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.impact && <Badge variant={impactLabels[item.impact as Impact].variant} className="text-[10px]">{impactLabels[item.impact as Impact].label}</Badge>}
                        {item.related_action && <span className="text-xs text-muted-foreground">→ {item.related_action}</span>}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Item SWOT" : "Novo Item SWOT"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Quadrante</label>
              <Select value={formData.quadrant} onValueChange={(v) => setFormData(p => ({ ...p, quadrant: v as Quadrant }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["strength", "weakness", "opportunity", "threat"] as Quadrant[]).map(q => (
                    <SelectItem key={q} value={q}>{quadrantConfig[q].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Descrição *</label>
              <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Descreva o item..." />
            </div>
            <div>
              <label className="text-sm font-medium">Impacto</label>
              <Select value={formData.impact} onValueChange={(v) => setFormData(p => ({ ...p, impact: v as Impact }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Ação Relacionada</label>
              <Input value={formData.related_action} onChange={e => setFormData(p => ({ ...p, related_action: e.target.value }))} placeholder="Ex: Investir em treinamento" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingItem ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SwotAnalysis;
