import { useSearchParams, Link } from "react-router-dom";
import { AlertTriangle, Settings } from "lucide-react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import JobsList from "@/components/JobsList";
import RecruitmentKPIs from "@/components/recruitment/RecruitmentKPIs";
import RecruitmentFunnel from "@/components/recruitment/RecruitmentFunnel";
import RecruitmentTrends from "@/components/recruitment/RecruitmentTrends";
import ConversionRates from "@/components/recruitment/ConversionRates";
import HiringByDepartment from "@/components/recruitment/HiringByDepartment";
import { useRecruitmentMetrics } from "@/hooks/useRecruitmentMetrics";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";
import { useOrganizationIntegrations } from "@/hooks/useOrganizationIntegrations";

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
 *
 * Layout:
 *   - KPIs: Always visible above tabs as a summary bar
 *   - Tabs:
 *     - Vagas (default): Job listings with card/list view, filters, and CRUD
 *     - Funil: Funnel pipeline and conversion rates
 *     - Tendências: Monthly recruitment trends chart
 *     - Departamentos: Hiring breakdown by department
 *
 * Metrics are always fetched (KPIs are permanently visible) with a 5-min
 * staleTime so the query is not refetched on every window focus.
 *
 * Demo mode: Access with ?demo=true to see mock data
 */
const Vagas = () => {
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  const { organization } = useRequireOrganization();
  const { data: integrations, isLoading: isLoadingIntegrations } =
    useOrganizationIntegrations(organization?.id || null);
  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    isError: isMetricsError,
  } = useRecruitmentMetrics({ isDemoMode });

  // Verificar se Anthropic está configurada e ativa
  const hasAnthropicIntegration = integrations?.some(
    (i) => i.provider === "anthropic" && i.is_active
  );

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

        {/* Warning Banner: Anthropic Integration Missing */}
        {!isLoadingIntegrations && !hasAnthropicIntegration && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-600 dark:text-amber-400">
              Análise de IA desabilitada
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Configure a integração com Anthropic para habilitar a análise
                automática de currículos e candidatos.
              </span>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="ml-4 shrink-0"
              >
                <Link to="/company-settings/integrations">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar integração
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
