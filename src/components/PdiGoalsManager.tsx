import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { GoalCard } from "./GoalCard";
import { GoalDialog } from "./GoalDialog";

interface PdiGoalsManagerProps {
  pdiId: string;
  pdi: any;
}

export const PdiGoalsManager = ({ pdiId, pdi }: PdiGoalsManagerProps) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);

  const isFinalized = pdi?.finalized_at !== null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Metas do PDI</h3>
        {!isFinalized && (
          <Button onClick={() => setIsGoalDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Meta
          </Button>
        )}
      </div>

      {pdi?.goals?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma meta adicionada. Crie a primeira meta para este PDI.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pdi?.goals?.map((goal: any) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              pdiId={pdiId}
              isFinalized={isFinalized}
              onEdit={() => {
                setSelectedGoalId(goal.id);
                setIsGoalDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <GoalDialog
        pdiId={pdiId}
        goalId={selectedGoalId}
        open={isGoalDialogOpen}
        onOpenChange={(open) => {
          setIsGoalDialogOpen(open);
          if (!open) setSelectedGoalId(null);
        }}
      />
    </div>
  );
};
