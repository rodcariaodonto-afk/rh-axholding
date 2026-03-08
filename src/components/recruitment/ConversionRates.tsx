import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";
import type { RecruitmentMetrics } from "@/types/recruitment";

interface ConversionRatesProps {
  metrics?: RecruitmentMetrics;
  isLoading?: boolean;
}

const ConversionRates = ({ metrics, isLoading }: ConversionRatesProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Taxas de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const conversions = [
    {
      from: "Candidatura",
      to: "Entrevista",
      rate: metrics.applicationToInterviewRate,
      benchmark: 40,
      description: "% de candidatos que avançam para entrevista",
    },
    {
      from: "Entrevista",
      to: "Proposta",
      rate: metrics.interviewToOfferRate,
      benchmark: 30,
      description: "% de entrevistados que recebem proposta",
    },
    {
      from: "Proposta",
      to: "Contratação",
      rate: metrics.offerAcceptanceRate,
      benchmark: 90,
      description: "% de propostas aceitas",
    },
  ];

  const getProgressColor = (rate: number, benchmark: number) => {
    if (rate >= benchmark) return "bg-green-500";
    if (rate >= benchmark * 0.7) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxas de Conversão</CardTitle>
        <CardDescription>
          Eficiência de cada etapa do processo seletivo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {conversions.map((conversion) => (
            <div key={conversion.from + conversion.to} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{conversion.from}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <span className="font-medium">{conversion.to}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{conversion.rate}%</span>
                  <span className="text-xs text-muted-foreground">
                    (meta: {conversion.benchmark}%)
                  </span>
                </div>
              </div>
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all ${getProgressColor(conversion.rate, conversion.benchmark)}`}
                  style={{ width: `${Math.min(conversion.rate, 100)}%` }}
                />
                {/* Benchmark marker */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-foreground/40"
                  style={{ left: `${conversion.benchmark}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{conversion.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionRates;
