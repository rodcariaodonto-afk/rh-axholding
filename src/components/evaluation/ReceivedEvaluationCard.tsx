import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import type { MyReceivedEvaluation } from "@/types/evaluation";
import { StarRatingDisplay } from "./StarRatingDisplay";
import { RELATIONSHIP_LABELS } from "@/constants/evaluationOptions";

interface ReceivedEvaluationCardProps {
  evaluation: MyReceivedEvaluation;
}

export function ReceivedEvaluationCard({ evaluation }: ReceivedEvaluationCardProps) {
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMM yyyy", { locale: ptBR });
  };

  const relationships = [
    { key: 'manager', data: evaluation.by_relationship.manager },
    { key: 'peer', data: evaluation.by_relationship.peer },
    { key: 'direct_report', data: evaluation.by_relationship.direct_report },
    { key: 'self', data: evaluation.by_relationship.self },
  ].filter(r => r.data.count > 0);

  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{evaluation.cycle_name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>{formatDate(evaluation.cycle_start_date)} - {formatDate(evaluation.cycle_end_date)}</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2">
              <StarRatingDisplay value={evaluation.overall_average} maxValue={5} size="md" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Média geral</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>{evaluation.total_evaluators} avaliadores</span>
        </div>
        
        {/* Breakdown by relationship */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {relationships.map(({ key, data }) => (
            <div 
              key={key}
              className="text-center p-2 rounded-lg bg-muted/50"
            >
              <p className="text-xs text-muted-foreground mb-1">
                {RELATIONSHIP_LABELS[key]}
              </p>
              <p className="font-semibold">
                {data.average !== null ? data.average.toFixed(1) : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.count} {data.count === 1 ? 'resp.' : 'resps.'}
              </p>
            </div>
          ))}
        </div>
        
        <Button asChild variant="outline" className="w-full">
          <Link to={`/my-evaluations/received/${evaluation.cycle_id}`}>
            Ver detalhes
            <ArrowRight className="size-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
