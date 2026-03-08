import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, CheckCircle, Globe, Copy, ExternalLink } from "lucide-react";
import { useJobStats } from "@/hooks/useJobs";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";
import { toast } from "sonner";

interface JobsDashboardProps {
  isDemoMode?: boolean;
}

const JobsDashboard = ({ isDemoMode = false }: JobsDashboardProps) => {
  const { data: stats, isLoading } = useJobStats(isDemoMode);
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

  const metrics = [
    {
      title: "Vagas Ativas",
      value: stats?.activeJobs ?? 0,
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total de Candidaturas",
      value: stats?.totalApplications ?? 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Candidaturas Processadas",
      value: stats?.processedApplications ?? 0,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${metric.bgColor}`}>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{metric.value}</p>
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
              size="icon-sm"
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

export default JobsDashboard;
