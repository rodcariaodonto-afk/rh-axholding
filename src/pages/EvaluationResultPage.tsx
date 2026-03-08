import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { EvaluationProgressRing } from "@/components/evaluation/EvaluationProgressRing";
import { CompetencyResultCard } from "@/components/evaluation/CompetencyResultCard";
import { useEvaluationResults } from "@/hooks/useEvaluationResults";
import { RELATIONSHIP_LABELS, RELATIONSHIP_COLORS } from "@/constants/evaluationOptions";

export default function EvaluationResultPage() {
  const navigate = useNavigate();
  const { cycleId } = useParams();
  const { data: results, isLoading } = useEvaluationResults(cycleId);
  const [includeSelf, setIncludeSelf] = useState(true);

  // Calculate per-relationship averages
  const relationshipAverages = useMemo(() => {
    if (!results) return {};
    const byRelationship: Record<string, { total: number; count: number }> = {};

    results.competencies.forEach(comp => {
      comp.responses.forEach(r => {
        if (!includeSelf && r.evaluator_relationship === 'self') return;

        if (!byRelationship[r.evaluator_relationship]) {
          byRelationship[r.evaluator_relationship] = { total: 0, count: 0 };
        }
        byRelationship[r.evaluator_relationship].total += r.score;
        byRelationship[r.evaluator_relationship].count += 1;
      });
    });

    return Object.fromEntries(
      Object.entries(byRelationship).map(([rel, data]) => [rel, data.total / data.count])
    );
  }, [results, includeSelf]);

  // Calculate overall average (filtered by includeSelf)
  const overallAverage = useMemo(() => {
    if (!results) return 0;
    let totalScore = 0;
    let totalCount = 0;

    results.competencies.forEach(comp => {
      comp.responses.forEach(r => {
        if (!includeSelf && r.evaluator_relationship === 'self') return;
        totalScore += r.score;
        totalCount += 1;
      });
    });

    return totalCount > 0 ? totalScore / totalCount : 0;
  }, [results, includeSelf]);

  // Check if there's self-evaluation data
  const hasSelfEvaluation = useMemo(() => {
    if (!results) return false;
    return results.competencies.some(comp =>
      comp.responses.some(r => r.evaluator_relationship === 'self')
    );
  }, [results]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!results) {
    return (
      <Layout>
        <div className="container py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Resultados não encontrados</p>
              <Button 
                variant="outline" 
                onClick={() => navigate("/my-evaluations")}
                className="mt-4"
              >
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/my-evaluations")}
              className="mb-4"
            >
              <ChevronLeft className="size-4 mr-2" />
              Voltar
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">Resultados da Avaliação</h1>
            <p className="text-muted-foreground">
              Análise completa do seu desempenho neste ciclo
            </p>
          </div>

          {/* Overall Score */}
          <Card className="mb-8">
            <CardContent className="p-8">
              {/* Progress Rings */}
              <div className="flex flex-wrap items-end justify-center gap-8 mb-8">
                <EvaluationProgressRing
                  value={overallAverage}
                  maxValue={5}
                  label="Média Geral"
                  size="lg"
                />
                {Object.entries(relationshipAverages).map(([rel, avg]) => (
                  <EvaluationProgressRing
                    key={rel}
                    value={avg}
                    maxValue={5}
                    label={RELATIONSHIP_LABELS[rel]}
                    size="md"
                  />
                ))}
              </div>

              {/* Self-evaluation toggle */}
              {hasSelfEvaluation && (
                <div className="flex items-center justify-center gap-2 pb-6 border-b">
                  <Switch
                    id="include-self"
                    checked={includeSelf}
                    onCheckedChange={setIncludeSelf}
                  />
                  <Label htmlFor="include-self" className="cursor-pointer">
                    Considerar autoavaliação na média
                  </Label>
                </div>
              )}

              {results.generalComments.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <h3 className="font-semibold mb-4">Feedbacks Gerais</h3>
                  <div className="space-y-4">
                    {results.generalComments.map((comment, idx) => (
                      <div key={idx} className="p-4 bg-white dark:bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {comment.evaluator_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{comment.evaluator_name}</span>
                          <Badge variant="outline" className={RELATIONSHIP_COLORS[comment.evaluator_relationship]}>
                            {RELATIONSHIP_LABELS[comment.evaluator_relationship]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground italic">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competency Results */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Competências Avaliadas</h2>
            {results.competencies.map((competency) => (
              <CompetencyResultCard
                key={competency.competency_id}
                result={competency}
                maxScore={5}
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
