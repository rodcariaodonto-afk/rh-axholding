import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash, ChevronDown, ChevronRight, Check } from "lucide-react";
import { useState } from "react";
import { useUpdateGoalChecklist } from "@/hooks/useUpdateGoalChecklist";
import { useDeletePdiGoal } from "@/hooks/useDeletePdiGoal";
import { useUpdatePdiGoal } from "@/hooks/useUpdatePdiGoal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GoalCardProps {
  goal: any;
  pdiId: string;
  isFinalized: boolean;
  onEdit: () => void;
}

export const GoalCard = ({ goal, pdiId, isFinalized, onEdit }: GoalCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const updateChecklist = useUpdateGoalChecklist();
  const deleteGoal = useDeletePdiGoal();
  const updateGoal = useUpdatePdiGoal();

  const handleChecklistToggle = (itemId: string) => {
    if (isFinalized) return;

    const updatedItems = goal.checklist_items.map((item: any) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    updateChecklist.mutate({
      goalId: goal.id,
      pdiId,
      checklist_items: updatedItems,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "outline" | "info" | "success"; label: string }> = {
      pendente: { variant: "outline", label: "Pendente" },
      em_andamento: { variant: "info", label: "Em Andamento" },
      concluida: { variant: "success", label: "Concluída" },
    };
    const config = variants[status] || variants.pendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const types: Record<string, { variant: "purple" | "teal" | "amber" | "cyan"; label: string }> = {
      tecnico: { variant: "purple", label: "Técnico" },
      comportamental: { variant: "teal", label: "Comportamental" },
      lideranca: { variant: "amber", label: "Liderança" },
      carreira: { variant: "cyan", label: "Carreira" },
    };
    const config = types[type] || { variant: "purple" as const, label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <h4 className="font-semibold">{goal.title}</h4>
            </div>
            <div className="flex items-center gap-2 ml-8">
              {getStatusBadge(goal.status)}
              {getTypeBadge(goal.goal_type)}
              <span className="text-xs text-muted-foreground">
                Peso: {goal.weight} | Prazo: {format(new Date(goal.due_date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
          {!isFinalized && (
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (confirm("Tem certeza que deseja excluir esta meta?")) {
                    deleteGoal.mutate({ goalId: goal.id, pdiId });
                  }
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="ml-8 mt-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Progresso</span>
            <span className="font-semibold">{goal.completion_ratio?.toFixed(0)}%</span>
          </div>
          <Progress value={goal.completion_ratio || 0} />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="ml-8 space-y-3">
          {goal.description && (
            <div>
              <p className="text-sm font-medium">Descrição:</p>
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            </div>
          )}

          {goal.action_plan && (
            <div>
              <p className="text-sm font-medium">Plano de Ação:</p>
              <p className="text-sm text-muted-foreground">{goal.action_plan}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Checklist:</p>
            {goal.checklist_items?.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Nenhum item no checklist.</p>
                {!isFinalized && goal.status !== "concluida" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      updateGoal.mutate({
                        id: goal.id,
                        pdi_id: pdiId,
                        checklist_items: [{ id: "auto", text: "Concluído", completed: true }],
                      });
                    }}
                    disabled={updateGoal.isPending}
                  >
                    <Check className="h-4 w-4" />
                    Marcar como Concluída
                  </Button>
                )}
                {goal.status === "concluida" && (
                  <Badge variant="success">Concluída</Badge>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {goal.checklist_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => handleChecklistToggle(item.id)}
                      disabled={isFinalized}
                    />
                    <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
