import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRatingDisplay } from "./StarRatingDisplay";
import { RELATIONSHIP_LABELS, RELATIONSHIP_COLORS } from "@/constants/evaluationOptions";
import type { CompetencyResult } from "@/types/evaluation";

interface CompetencyResultCardProps {
  result: CompetencyResult;
  maxScore: 4 | 5;
}

export function CompetencyResultCard({ result, maxScore }: CompetencyResultCardProps) {
  const averagePercentage = (result.average / maxScore) * 100;

  return (
    <Card>
      <CardHeader className="bg-muted/50 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base">{result.competency_name}</CardTitle>
            {result.competency_description && (
              <p className="text-sm text-muted-foreground mt-1">{result.competency_description}</p>
            )}
          </div>
          <Badge variant="outline">
            {result.competency_type === 'soft_skill' ? 'Soft Skill' : 'Hard Skill'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Overall Average */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Média Geral</p>
            <div className="flex items-center gap-2 mt-1">
              <StarRatingDisplay value={result.average} maxValue={maxScore} size="md" showValue={false} />
              <span className="text-lg font-semibold">{result.average.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">/ {maxScore}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${averagePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Individual Responses */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Avaliações Recebidas ({result.responses.length})</h4>
          <div className="space-y-3">
            {result.responses.map((response, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-medium">{response.evaluator_name}</p>
                    <Badge variant="outline" className={`mt-1 ${RELATIONSHIP_COLORS[response.evaluator_relationship]}`}>
                      {RELATIONSHIP_LABELS[response.evaluator_relationship]}
                    </Badge>
                  </div>
                  <StarRatingDisplay 
                    value={response.score} 
                    maxValue={maxScore} 
                    size="sm"
                    showValue={true}
                  />
                </div>
                {response.comment && (
                  <p className="text-sm text-muted-foreground italic">{response.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
