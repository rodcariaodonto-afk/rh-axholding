import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Send, Save } from "lucide-react";
import { CompetencyRatingCard } from "@/components/evaluation/CompetencyRatingCard";
import { useEvaluationToAnswer } from "@/hooks/useEvaluationToAnswer";
import { useSubmitEvaluation } from "@/hooks/useSubmitEvaluation";
import { RELATIONSHIP_LABELS, RELATIONSHIP_COLORS } from "@/constants/evaluationOptions";
import { supabase } from "@/integrations/supabase/client";
import { useSoftSkills } from "@/hooks/useSoftSkills";
import type { EvaluationCompetencyResponse } from "@/types/evaluation";

export default function EvaluationAnswerPage() {
  const navigate = useNavigate();
  const { cycleId, participantId } = useParams();
  const { data: evaluation, isLoading, organizationId } = useEvaluationToAnswer(cycleId, participantId);
  const { data: dbSoftSkills } = useSoftSkills(organizationId ?? undefined);
  const { submitEvaluation, saveDraft, isSubmitting, isSaving } = useSubmitEvaluation({
    participantId: participantId || "",
    onSuccess: () => navigate("/my-evaluations"),
  });

  const [responses, setResponses] = useState<EvaluationCompetencyResponse[]>([]);
  const [generalComment, setGeneralComment] = useState("");
  const initializedRef = useRef(false);

  // Fetch existing draft responses
  const { data: existingResponses } = useQuery({
    queryKey: ["evaluation-draft", participantId],
    queryFn: async () => {
      if (!participantId) return null;

      const { data: savedResponses } = await supabase
        .from("evaluation_responses")
        .select("competency_id, competency_type, score, comment")
        .eq("participant_id", participantId);

      const { data: savedComment } = await supabase
        .from("evaluation_general_comments")
        .select("comment")
        .eq("participant_id", participantId)
        .maybeSingle();

      return { responses: savedResponses || [], generalComment: savedComment?.comment || "" };
    },
    enabled: !!participantId,
  });

  // Initialize responses with draft data merged in
  useEffect(() => {
    if (!evaluation || !dbSoftSkills?.length || initializedRef.current) return;

    const draftMap = new Map(
      (existingResponses?.responses || []).map((r) => [
        `${r.competency_type}-${r.competency_id}`,
        r,
      ])
    );

    setResponses(
      dbSoftSkills.map((skill) => {
        const draft = draftMap.get(`soft_skill-${skill.id}`);
        return {
          competency_id: skill.id,
          competency_name: skill.name,
          competency_type: "soft_skill" as const,
          score: draft?.score ?? null,
          comment: draft?.comment || "",
        };
      })
    );

    if (existingResponses?.generalComment) {
      setGeneralComment(existingResponses.generalComment);
    }

    initializedRef.current = true;
  }, [evaluation, existingResponses, dbSoftSkills]);

  const handleScoreChange = (competencyId: string, score: number) => {
    setResponses(
      responses.map((r) =>
        r.competency_id === competencyId ? { ...r, score } : r
      )
    );
  };

  const handleCommentChange = (competencyId: string, comment: string) => {
    setResponses(
      responses.map((r) =>
        r.competency_id === competencyId ? { ...r, comment } : r
      )
    );
  };

  const filledCount = responses.filter((r) => r.score !== null).length;
  const totalCount = responses.length;
  const progressPercent = totalCount > 0 ? (filledCount / totalCount) * 100 : 0;

  const isComplete = responses.every(
    (r) =>
      r.score !== null &&
      (!evaluation?.require_general_comments || generalComment.trim().length > 0)
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!evaluation) {
    return (
      <Layout>
        <div className="container py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Avaliação não encontrada</p>
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
        <div className="container max-w-5xl">
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

            <div className="rounded-lg p-6 bg-background border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  {evaluation.evaluated_photo ? (
                    <img
                      src={evaluation.evaluated_photo}
                      alt={evaluation.evaluated_name}
                      className="size-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-14 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground">
                      {evaluation.evaluated_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Ciclo: {evaluation.cycle_name}
                    </p>
                    <h1 className="text-2xl font-bold">
                      Avaliar {evaluation.evaluated_name}
                    </h1>
                    {evaluation.evaluated_position && (
                      <p className="text-muted-foreground text-sm mt-0.5">
                        {evaluation.evaluated_position}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className={RELATIONSHIP_COLORS[evaluation.relationship]}>
                  {RELATIONSHIP_LABELS[evaluation.relationship]}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">
                    {filledCount} de {totalCount} competências preenchidas
                  </p>
                  <p className="text-muted-foreground">
                    Encerramento: {new Date(evaluation.cycle_end_date).toLocaleDateString()}
                  </p>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>
          </div>

          {/* Competencies - 2 column grid */}
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            {responses.map((response) => (
              <CompetencyRatingCard
                key={response.competency_id}
                competencyId={response.competency_id}
                competencyName={response.competency_name}
                competencyType={response.competency_type}
                score={response.score}
                comment={response.comment}
                onScoreChange={(score) =>
                  handleScoreChange(response.competency_id, score)
                }
                onCommentChange={(comment) =>
                  handleCommentChange(response.competency_id, comment)
                }
                scaleLevels={evaluation.scale_levels}
                scaleLabels={evaluation.scale_labels}
                requireComment={evaluation.require_comments}
              />
            ))}
          </div>

          {/* General Comments */}
          {evaluation.require_general_comments && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Comentário Geral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="general-comment">
                    Observações adicionais *
                  </Label>
                  <Textarea
                    id="general-comment"
                    value={generalComment}
                    onChange={(e) => setGeneralComment(e.target.value)}
                    placeholder="Adicione suas observações gerais sobre o desempenho..."
                    className="min-h-[120px] resize-none mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 justify-end sticky bottom-4">
            <Button
              variant="outline"
              onClick={() =>
                saveDraft({
                  responses,
                  generalComment,
                })
              }
              disabled={isSaving || isSubmitting}
            >
              <Save className="size-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button
              onClick={() =>
                submitEvaluation({
                  responses,
                  generalComment,
                })
              }
              disabled={!isComplete || isSubmitting || isSaving}
            >
              <Send className="size-4 mr-2" />
              Enviar Avaliação
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
