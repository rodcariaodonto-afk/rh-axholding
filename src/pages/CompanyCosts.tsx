import { DollarSign } from "lucide-react";
import { CompanyCostSettingsPanel } from "@/components/CompanyCostSettingsPanel";
import { CompanyCostSummary } from "@/components/CompanyCostSummary";
import { CompanyCostCharts } from "@/components/CompanyCostCharts";
import { CompanyCostTable } from "@/components/CompanyCostTable";
import { useCompanyCosts } from "@/hooks/useCompanyCosts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CompanyCosts = () => {
  const { employees, consolidated, isLoading } = useCompanyCosts();

  return (
    <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Custo da Empresa</h1>
              <p className="text-muted-foreground">
                Análise de custos com colaboradores (encargos e provisões)
              </p>
            </div>
          </div>
          <CompanyCostSettingsPanel />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96" />
          </div>
        )}

        {/* Conteúdo */}
        {!isLoading && (
          <>
            {employees.length === 0 ? (
              <Alert>
                <AlertTitle>Nenhum contrato ativo encontrado</AlertTitle>
                <AlertDescription>
                  Para visualizar os custos, é necessário ter pelo menos um colaborador com contrato ativo.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <CompanyCostSummary consolidated={consolidated} />
                <CompanyCostCharts employees={employees} consolidated={consolidated} />
                <CompanyCostTable employees={employees} />
              </>
            )}
          </>
        )}
    </div>
  );
};

export default CompanyCosts;
