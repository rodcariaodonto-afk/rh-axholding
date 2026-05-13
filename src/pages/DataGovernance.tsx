import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { useGovernancePermissions } from "@/hooks/useGovernancePermissions";
import { OverviewTab } from "@/components/governance/OverviewTab";
import { ExportsTab } from "@/components/governance/ExportsTab";
import { AuditTab } from "@/components/governance/AuditTab";
import { RetentionTab } from "@/components/governance/RetentionTab";
import { ComplianceTab } from "@/components/governance/ComplianceTab";
import { DsrTab } from "@/components/governance/DsrTab";
import { ConsentsTab } from "@/components/governance/ConsentsTab";
import { PoliciesTab } from "@/components/governance/PoliciesTab";

export default function DataGovernance() {
  const { canAccess, isLoading } = useGovernancePermissions();

  if (isLoading) return <div className="p-6 text-muted-foreground">Carregando…</div>;

  if (!canAccess) {
    return (
      <Card className="m-6">
        <CardContent className="p-8 text-center space-y-3">
          <ShieldAlert className="h-10 w-10 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Acesso restrito</h2>
          <p className="text-muted-foreground">
            Apenas Owners, Admins e RH com permissão explícita podem acessar a Governança de Dados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Governança de Dados</h1>
        <p className="text-sm text-muted-foreground">
          Auditoria, exportações, retenção, consentimentos e conformidade LGPD para dados de RH.
        </p>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="exports">Exportações</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="retention">Retenção & Exclusão</TabsTrigger>
          <TabsTrigger value="compliance">Conformidade</TabsTrigger>
          <TabsTrigger value="dsr">Pedidos dos titulares</TabsTrigger>
          <TabsTrigger value="consents">Consentimentos</TabsTrigger>
          <TabsTrigger value="policies">Políticas</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
        <TabsContent value="exports" className="mt-6"><ExportsTab /></TabsContent>
        <TabsContent value="audit" className="mt-6"><AuditTab /></TabsContent>
        <TabsContent value="retention" className="mt-6"><RetentionTab /></TabsContent>
        <TabsContent value="compliance" className="mt-6"><ComplianceTab /></TabsContent>
        <TabsContent value="dsr" className="mt-6"><DsrTab /></TabsContent>
        <TabsContent value="consents" className="mt-6"><ConsentsTab /></TabsContent>
        <TabsContent value="policies" className="mt-6"><PoliciesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
