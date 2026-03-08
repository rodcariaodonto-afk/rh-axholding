import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Users, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Pencil, 
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EvaluationCycle } from "@/types/evaluation";
import { 
  EVALUATION_STATUS_LABELS, 
  EVALUATION_STATUS_COLORS,
  EVALUATION_TYPE_OPTIONS,
} from "@/constants/evaluationOptions";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface EvaluationCycleCardProps {
  cycle: EvaluationCycle;
  participantsCount?: number;
  completedCount?: number;
  onActivate?: (id: string) => void;
  onPause?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function EvaluationCycleCard({
  cycle,
  participantsCount = 0,
  completedCount = 0,
  onActivate,
  onPause,
  onComplete,
  onCancel,
  onDelete,
}: EvaluationCycleCardProps) {
  const typeOption = EVALUATION_TYPE_OPTIONS.find(t => t.id === cycle.evaluation_type);
  const progress = participantsCount > 0 ? (completedCount / participantsCount) * 100 : 0;

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMM yyyy", { locale: ptBR });
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{cycle.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>{formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={cn(EVALUATION_STATUS_COLORS[cycle.status])}>
              {EVALUATION_STATUS_LABELS[cycle.status]}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/performance-evaluation/${cycle.id}/edit`}>
                    <Pencil className="size-4 mr-2" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                
                {cycle.status === 'draft' && onActivate && (
                  <DropdownMenuItem onClick={() => onActivate(cycle.id)}>
                    <Play className="size-4 mr-2" />
                    Ativar
                  </DropdownMenuItem>
                )}
                
                {cycle.status === 'active' && onPause && (
                  <DropdownMenuItem onClick={() => onPause(cycle.id)}>
                    <Pause className="size-4 mr-2" />
                    Pausar
                  </DropdownMenuItem>
                )}
                
                {cycle.status === 'active' && onComplete && (
                  <DropdownMenuItem onClick={() => onComplete(cycle.id)}>
                    <CheckCircle2 className="size-4 mr-2" />
                    Concluir
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {cycle.status !== 'cancelled' && onCancel && (
                  <DropdownMenuItem 
                    onClick={() => onCancel(cycle.id)}
                    className="text-amber-600"
                  >
                    <XCircle className="size-4 mr-2" />
                    Cancelar
                  </DropdownMenuItem>
                )}
                
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(cycle.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="size-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {cycle.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {cycle.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="font-mono">
                {typeOption?.name || cycle.evaluation_type}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-4" />
              <span>{participantsCount} participantes</span>
            </div>
          </div>
          
          {participantsCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {completedCount}/{participantsCount}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
