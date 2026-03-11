import { useState } from "react";
import Layout from "@/components/Layout";
import { useGoals } from "@/hooks/useGoals";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, Plus, Pencil, Trash2 } from "lucide-react";
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

const PERIODS = ["Q1-2026", "Q2-2026", "Q3-2026", "Q4-2026"];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Ativa", variant: "default" },
  completed: { label: "Concluída", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

export default function Goals() {
  const { goals, isLoading, createGoal, updateGoal, deleteGoal, isCreating } = useGoals();
  const { data: employees = [] } = useEmployees();
  const activeEmployees = employees.filter((e) => e.status === "active");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState<any>(null);

  // Form state
  const [form, setForm] = useState({
    employee_id: "",
    title: "",
    description: "",
    target_value: "100",
    period: "Q1-2026",
    due_date: "",
  });

  const resetForm = () => {
    setForm({ employee_id: "", title: "", description: "", target_value: "100", period: "Q1-2026", due_date: "" });
    setEditGoal(null);
  };

  const handleSubmit = () => {
    if (!form.title || !form.employee_id) return;
    createGoal({
      employee_id: form.employee_id,
      title: form.title,
      description: form.description || undefined,
      target_value: parseFloat(form.target_value) || 100,
      period: form.period,
      due_date: form.due_date || undefined,
    });
    setIsDialogOpen(false);
    resetForm();
  };

  const handleProgressUpdate = (goalId: string, currentValue: number, targetValue: number) => {
    const newValue = Math.min(currentValue + 10, targetValue);
    updateGoal({
      id: goalId,
      current_value: newValue,
      status: newValue >= targetValue ? "completed" : "active",
    });
  };

  const [periodFilter, setPeriodFilter] = useState("all");
  const filtered = periodFilter === "all" ? goals : goals.filter((g) => g.period === periodFilter);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Metas & OKRs</h1>
            <p className="text-muted-foreground">Acompanhe as metas trimestrais dos colaboradores</p>
          </div>
          <div className="flex gap-2">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {PERIODS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhuma meta encontrada</h3>
            <p className="text-sm text-muted-foreground">Crie metas para acompanhar o progresso dos colaboradores.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((goal) => {
              const progress = goal.target_value > 0
                ? Math.round((goal.current_value / goal.target_value) * 100)
                : 0;
              const status = statusMap[goal.status] || statusMap.active;

              return (
                <Card key={goal.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{goal.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{goal.employee_name}</p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {goal.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                    )}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{goal.period}</span>
                      <span>{goal.current_value}/{goal.target_value}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      {goal.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleProgressUpdate(goal.id, goal.current_value, goal.target_value)}
                        >
                          <Pencil className="mr-1 h-3 w-3" />
                          +10
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteId(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Colaborador</Label>
                <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor alvo</Label>
                  <Input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data limite (opcional)</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isCreating || !form.title || !form.employee_id}>
                {isCreating ? "Criando..." : "Criar Meta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { if (deleteId) { deleteGoal(deleteId); setDeleteId(null); } }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
