import { useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import JobsList from "@/components/JobsList";
import RecruitmentKPIs from "@/components/recruitment/RecruitmentKPIs";
import RecruitmentFunnel from "@/components/recruitment/RecruitmentFunnel";
import RecruitmentTrends from "@/components/recruitment/RecruitmentTrends";
import ConversionRates from "@/components/recruitment/ConversionRates";
import HiringByDepartment from "@/components/recruitment/HiringByDepartment";
import { useRecruitmentMetrics } from "@/hooks/useRecruitmentMetrics";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";

/** Inline error fallback shown inside metrics tabs when the query fails. */
const MetricsErrorAlert = ({ message }: { message: string }) => (
  <Alert variant="destructive">
    <AlertTriangle className="h-5 w-5" />
    <AlertTitle>Erro ao carregar métricas</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

/**
 * Vagas (Job Openings) Page
 */
const Vagas = () => {
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  const { organization } = useRequireOrganization();
  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    isError: isMetricsError,
  } = useRecruitmentMetrics({ isDemoMode });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vagas</h1>
            <p className="text-muted-foreground">
              Gerencie as vagas abertas e acompanhe as candidaturas
            </p>
          </div>
        </div>

        {/* KPIs — always visible above tabs */}
        <RecruitmentKPIs metrics={metrics} isLoading={isLoadingMetrics} />

        {/* Tabbed Content */}
        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="jobs">Vagas</TabsTrigger>
            <TabsTrigger value="funnel">Funil</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="departments">Departamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <JobsList isDemoMode={isDemoMode} />
          </TabsContent>

          <TabsContent value="funnel" className="space-y-4">
            {isMetricsError ? (
              <MetricsErrorAlert message="Não foi possível carregar os dados do funil de recrutamento." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RecruitmentFunnel
                  pipeline={metrics?.pipelineByStage}
                  isLoading={isLoadingMetrics}
                />
                <ConversionRates
                  metrics={metrics}
                  isLoading={isLoadingMetrics}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {isMetricsError ? (
              <MetricsErrorAlert message="Não foi possível carregar os dados de tendências." />
            ) : (
              <RecruitmentTrends
                monthlyData={metrics?.monthlyData}
                isLoading={isLoadingMetrics}
              />
            )}
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            {isMetricsError ? (
              <MetricsErrorAlert message="Não foi possível carregar os dados por departamento." />
            ) : (
              <HiringByDepartment
                data={metrics?.hiringByDepartment}
                isLoading={isLoadingMetrics}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Vagas;
