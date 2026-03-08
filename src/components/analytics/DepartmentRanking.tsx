import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DepartmentRankingItem } from "@/hooks/useTrainingAnalytics";

interface DepartmentRankingProps {
  ranking: DepartmentRankingItem[];
}

function getMedalColor(position: number) {
  switch (position) {
    case 1:
      return "text-yellow-500";
    case 2:
      return "text-gray-400";
    case 3:
      return "text-amber-600";
    default:
      return "text-muted-foreground";
  }
}

function getPositionBadge(position: number) {
  if (position <= 3) {
    return (
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-full",
          position === 1 && "bg-yellow-100",
          position === 2 && "bg-gray-100",
          position === 3 && "bg-amber-100"
        )}
      >
        {position === 1 ? (
          <Trophy className={cn("size-4", getMedalColor(position))} />
        ) : (
          <Medal className={cn("size-4", getMedalColor(position))} />
        )}
      </div>
    );
  }
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
      {position}
    </div>
  );
}

export function DepartmentRanking({ ranking }: DepartmentRankingProps) {
  if (ranking.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Trophy className="size-5 text-amber-500" />
            Ranking de Departamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado de treinamento disponível para gerar o ranking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Trophy className="size-5 text-amber-500" />
          Ranking de Departamentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ranking.map((item) => (
            <div
              key={item.departmentId}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-3 transition-colors",
                item.position === 1 && "border-yellow-200 bg-yellow-50/50",
                item.position === 2 && "border-gray-200 bg-gray-50/50",
                item.position === 3 && "border-amber-200 bg-amber-50/50"
              )}
            >
              {getPositionBadge(item.position)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{item.departmentName}</p>
                  <span className="text-sm font-semibold text-primary">
                    {item.score.toFixed(0)} pts
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>% Certificados</span>
                    <span className="font-medium">{item.certifiedPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={item.certifiedPercentage} className="h-1.5" />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Média treinamentos/pessoa</span>
                  <span className="font-medium">{item.avgTrainingsPerEmployee.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
