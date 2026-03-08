import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGE_LABELS, type PipelineByStage } from "@/types/recruitment";

interface RecruitmentFunnelProps {
  pipeline?: PipelineByStage;
  isLoading?: boolean;
}

const RecruitmentFunnel = ({ pipeline, isLoading }: RecruitmentFunnelProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funil de Seleção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pipeline) return null;

  // Define funnel stages in order (excluding rejected and talent bank)
  const funnelStages: (keyof PipelineByStage)[] = [
    "selecao",
    "fit_cultural",
    "fit_tecnico",
    "pre_admissao",
    "contratado",
  ];

  const totalCandidates = funnelStages.reduce((acc, stage) => acc + pipeline[stage], 0);
  const maxCount = Math.max(...funnelStages.map(stage => pipeline[stage]), 1);

  // Calculate conversion rates between stages
  const getConversionRate = (currentStage: keyof PipelineByStage, nextStage: keyof PipelineByStage) => {
    const current = pipeline[currentStage];
    const next = pipeline[nextStage];
    if (current === 0) return 0;
    return Math.round((next / current) * 100);
  };

  // Using semantic design tokens via CSS classes
  const stageColors = [
    "bg-chart-1",
    "bg-chart-2",
    "bg-chart-3",
    "bg-chart-4",
    "bg-chart-5",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Seleção</CardTitle>
        <CardDescription>
          {totalCandidates} candidatos em processo ativo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {funnelStages.map((stage, index) => {
            const count = pipeline[stage];
            const percentage = totalCandidates > 0 ? Math.round((count / totalCandidates) * 100) : 0;
            const barWidth = (count / maxCount) * 100;

            return (
              <div key={stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{STAGE_LABELS[stage]}</span>
                  <span className="text-muted-foreground">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${stageColors[index]} transition-all duration-500 ease-out flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(barWidth, 2)}%` }}
                  >
                    {barWidth > 15 && (
                      <span className="text-xs font-medium text-primary-foreground">{count}</span>
                    )}
                  </div>
                </div>
                {index < funnelStages.length - 1 && (
                  <div className="flex justify-center">
                    <span className="text-xs text-muted-foreground">
                      ↓ {getConversionRate(stage, funnelStages[index + 1])}% conversão
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional stats */}
        <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{pipeline.rejeitado}</p>
            <p className="text-xs text-muted-foreground">Rejeitados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">{pipeline.banco_talentos}</p>
            <p className="text-xs text-muted-foreground">Banco de Talentos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecruitmentFunnel;
