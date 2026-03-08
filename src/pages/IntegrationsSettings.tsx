import { useState } from "react";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { 
  useOrganizationIntegrations, 
  useSaveIntegration, 
  useDeleteIntegration,
  useTestIntegration 
} from "@/hooks/useOrganizationIntegrations";
import { IntegrationCard } from "@/components/IntegrationCard";
import { ResendEmailConfig } from "@/components/ResendEmailConfig";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plug, Shield, Bot, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Provider configuration
const PROVIDERS = [
  {
    id: "resend",
    name: "Resend",
    description: "Envio de emails transacionais personalizados (convites, notificações)",
    placeholder: "re_...",
    icon: <Mail className="h-5 w-5 text-primary" />,
    helpUrl: "https://resend.com/api-keys",
    helpText: "Obter API key",
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    description: "Análise inteligente de entrevistas com IA",
    placeholder: "sk-ant-...",
    icon: <Bot className="h-5 w-5 text-primary" />,
    helpUrl: "https://console.anthropic.com/settings/keys",
    helpText: "Obter API key",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4, embeddings e outras funcionalidades de IA",
    placeholder: "sk-...",
    icon: <Bot className="h-5 w-5 text-primary" />,
    helpUrl: "https://platform.openai.com/api-keys",
    helpText: "Obter API key",
  },
];

export default function IntegrationsSettings() {
  const { organizationId, isLoading: isLoadingOrg } = useCurrentOrganization();
  
  const { 
    data: integrations, 
    isLoading: isLoadingIntegrations,
    refetch 
  } = useOrganizationIntegrations(organizationId);
  
  const saveIntegration = useSaveIntegration();
  const deleteIntegration = useDeleteIntegration();
  const testIntegration = useTestIntegration();
  
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  const handleSave = async (provider: string, apiKey: string, testConnection: boolean) => {
    if (!organizationId) return;
    
    setSavingProvider(provider);
    try {
      await saveIntegration.mutateAsync({
        organization_id: organizationId,
        provider,
        api_key: apiKey,
        test_connection: testConnection,
      });
    } finally {
      setSavingProvider(null);
    }
  };

  const handleDelete = async (integrationId: string, provider: string) => {
    if (!organizationId) return;
    
    setDeletingProvider(provider);
    try {
      await deleteIntegration.mutateAsync({
        organization_id: organizationId,
        id: integrationId,
      });
    } finally {
      setDeletingProvider(null);
    }
  };

  const handleTest = async (integrationId: string, provider: string) => {
    if (!organizationId) return;
    
    setTestingProvider(provider);
    try {
      await testIntegration.mutateAsync({
        organization_id: organizationId,
        id: integrationId,
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const isLoading = isLoadingOrg || isLoadingIntegrations;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Plug className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Integrações</h1>
            <p className="text-muted-foreground">
              Configure as integrações externas da sua organização
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
        <Shield className="h-5 w-5 text-primary mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Suas chaves estão seguras</p>
          <p className="text-muted-foreground">
            As API keys são criptografadas com AES-256-GCM e nunca são expostas após salvas. 
            Apenas os últimos 4 caracteres são exibidos para identificação.
          </p>
        </div>
      </div>

      {/* Integration Cards */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {PROVIDERS.map((provider) => {
            const integration = integrations?.find(i => i.provider === provider.id);
            return (
              <div key={provider.id} className="space-y-4">
                <IntegrationCard
                  provider={provider.id}
                  meta={provider}
                  integration={integration}
                  onSave={(apiKey, testConnection) => 
                    handleSave(provider.id, apiKey, testConnection)
                  }
                  onDelete={() => 
                    integration ? handleDelete(integration.id, provider.id) : Promise.resolve()
                  }
                  onTest={integration ? () => handleTest(integration.id, provider.id) : undefined}
                  isSaving={savingProvider === provider.id}
                  isDeleting={deletingProvider === provider.id}
                  isTesting={testingProvider === provider.id}
                />
                {/* Show email config when Resend is connected */}
                {provider.id === "resend" && integration && organizationId && (
                  <ResendEmailConfig organizationId={organizationId} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">💡 Dicas de segurança:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Gere chaves de API com permissões mínimas necessárias</li>
          <li>Nunca compartilhe suas chaves de API</li>
          <li>Rotacione suas chaves periodicamente</li>
          <li>Em caso de vazamento, substitua a chave imediatamente</li>
        </ul>
      </div>
    </div>
  );
}
