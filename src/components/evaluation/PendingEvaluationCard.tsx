import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import type { MyPendingEvaluation } from "@/types/evaluation";
import { RELATIONSHIP_LABELS, RELATIONSHIP_COLORS, PARTICIPANT_STATUS_LABELS, PARTICIPANT_STATUS_COLORS } from "@/constants/evaluationOptions";
import { cn } from "@/lib/utils";

interface PendingEvaluationCardProps {
  evaluation: MyPendingEvaluation;
}

export function PendingEvaluationCard({ evaluation }: PendingEvaluationCardProps) {
  const daysRemaining = differenceInDays(new Date(evaluation.cycle_end_date), new Date());
  const isUrgent = daysRemaining <= 3 && daysRemaining >= 0;
  const isOverdue = daysRemaining < 0;
  const isCompleted = evaluation.status === 'completed';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      isOverdue && !isCompleted && "border-destructive/50",
      isUrgent && !isCompleted && "border-amber-500/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-12">
            <AvatarImage src={evaluation.evaluated_photo || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(evaluation.evaluated_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium truncate">{evaluation.evaluated_name}</h4>
              <Badge className={cn("text-xs", RELATIONSHIP_COLORS[evaluation.relationship])}>
                {RELATIONSHIP_LABELS[evaluation.relationship]}
              </Badge>
              <Badge className={cn("text-xs", PARTICIPANT_STATUS_COLORS[evaluation.status])}>
                {PARTICIPANT_STATUS_LABELS[evaluation.status]}
              </Badge>
            </div>
            
            {evaluation.evaluated_position && (
              <p className="text-sm text-muted-foreground truncate">
                {evaluation.evaluated_position}
              </p>
            )}
            
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                Prazo: {format(new Date(evaluation.cycle_end_date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
              
              {!isCompleted && (
                <span className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-destructive",
                  isUrgent && "text-amber-600"
                )}>
                  <Clock className="size-3" />
                  {isOverdue 
                    ? `${Math.abs(daysRemaining)} dias atrasado` 
                    : `${daysRemaining} dias restantes`
                  }
                </span>
              )}
            </div>
          </div>
          
          <Button 
            asChild 
            variant={isCompleted ? "outline" : "default"}
            size="sm"
            disabled={isCompleted}
          >
            <Link to={`/my-evaluations/${evaluation.cycle_id}/${evaluation.participant_id}`}>
              {isCompleted ? "Ver" : "Avaliar"}
              <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
