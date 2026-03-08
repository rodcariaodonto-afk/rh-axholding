import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Target, CheckCircle, TrendingUp, TrendingDown, Minus, Globe, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";
import type { RecruitmentMetrics } from "@/types/recruitment";

interface RecruitmentKPIsProps {
  metrics?: RecruitmentMetrics;
  isLoading?: boolean;
}

const RecruitmentKPIs = ({ metrics, isLoading }: RecruitmentKPIsProps) => {
  const { organization } = useRequireOrganization();
  const careersUrl = organization?.slug 
    ? `${window.location.origin}/carreiras/${organization.slug}`
    : null;

  const handleCopyLink = () => {
    if (careersUrl) {
      navigator.clipboard.writeText(careersUrl);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const handleOpenCareers = () => {
    if (careersUrl) {
      window.open(careersUrl, "_blank");
    }
  };

  const kpis = [
    {
      title: "Tempo Médio de Fechamento",
      value: metrics?.avgTimeToFill || 0,
      suffix: "dias",
      icon: Clock,
      color: "text-primary",
      bgColor: "bg-primary/10",
      benchmark: 42,
      benchmarkLabel: "Benchmark SHRM: 42 dias",
    },
    {
      title: "Tempo Médio de Contratação",
      value: metrics?.avgTimeToHire || 0,
      suffix: "dias",
      icon: Target,
      color: "text-secondary-foreground",
      bgColor: "bg-secondary",
      benchmark: 23,
      benchmarkLabel: "Benchmark: 23 dias",
    },
    {
      title: "Candidatos por Vaga",
      value: metrics?.avgCandidatesPerJob || 0,
      suffix: "média",
      icon: Users,
      color: "text-accent-foreground",
      bgColor: "bg-accent",
      benchmark: null,
      benchmarkLabel: null,
    },
    {
      title: "Taxa de Aceitação",
      value: metrics?.offerAcceptanceRate || 0,
      suffix: "%",
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
      benchmark: 90,
      benchmarkLabel: "Meta: 90%",
    },
  ];

  const getTrendIcon = (value: number, benchmark: number | null) => {
    if (!benchmark) return null;
    if (value < benchmark) return <TrendingUp className="size-4 text-primary" />;
    if (value > benchmark) return <TrendingDown className="size-4 text-destructive" />;
    return <Minus className="size-4 text-muted-foreground" />;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${kpi.bgColor}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{kpi.value}</span>
                  <span className="text-sm text-muted-foreground">{kpi.suffix}</span>
                  {kpi.benchmark && getTrendIcon(kpi.value, kpi.benchmark)}
                </div>
                {kpi.benchmarkLabel && (
                  <p className="text-xs text-muted-foreground">{kpi.benchmarkLabel}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Careers Page Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Página de Carreiras
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Pública
            </Badge>
          </div>
          <div className="p-2 rounded-full bg-primary/10">
            <Globe className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Compartilhe suas vagas abertas
          </p>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 bg-background rounded-md text-xs font-mono truncate border">
              {careersUrl}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopyLink}
              title="Copiar link"
            >
              <Copy className="size-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-primary hover:text-primary"
            onClick={handleOpenCareers}
          >
            <ExternalLink className="size-4 mr-2" />
            Visualizar página
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecruitmentKPIs;
