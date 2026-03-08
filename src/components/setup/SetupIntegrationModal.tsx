import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { IntegrationCard } from "@/components/IntegrationCard";
import { Bot, Mail } from "lucide-react";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import {
  useOrganizationIntegrations,
  useSaveIntegration,
  useDeleteIntegration,
  useTestIntegration,
} from "@/hooks/useOrganizationIntegrations";

interface SetupIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: "anthropic" | "resend";
}

const PROVIDER_META = {
  anthropic: {
    name: "Anthropic (Claude)",
    description: "IA para análise de candidatos",
    placeholder: "sk-ant-...",
    icon: <Bot className="size-6 text-orange-500" />,
    helpUrl: "https://console.anthropic.com/settings/keys",
    helpText: "Obter API Key",
  },
  resend: {
    name: "Resend",
    description: "Envio de emails transacionais personalizados",
    placeholder: "re_...",
    icon: <Mail className="size-6 text-blue-500" />,
    helpUrl: "https://resend.com/api-keys",
    helpText: "Obter API Key",
  },
};

export function SetupIntegrationModal({
  open,
  onOpenChange,
  provider,
}: SetupIntegrationModalProps) {
  const { data: org } = useOrganizationSettings();
  const { data: integrations } = useOrganizationIntegrations(org?.id ?? null);
  const { mutateAsync: saveIntegration, isPending: isSaving } = useSaveIntegration();
  const { mutateAsync: deleteIntegration, isPending: isDeleting } = useDeleteIntegration();
  const { mutateAsync: testIntegration, isPending: isTesting } = useTestIntegration();

  const integration = integrations?.find((i) => i.provider === provider);
  const meta = PROVIDER_META[provider];

  const handleSave = async (apiKey: string, testConnection: boolean) => {
    if (!org?.id) return;
    await saveIntegration({
      organization_id: org.id,
      provider,
      api_key: apiKey,
      display_name: meta.name,
      test_connection: testConnection,
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!org?.id || !integration) return;
    await deleteIntegration({
      organization_id: org.id,
      id: integration.id,
    });
    onOpenChange(false);
  };

  const handleTest = async () => {
    if (!org?.id || !integration) return;
    await testIntegration({
      organization_id: org.id,
      id: integration.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {meta.icon}
            Conectar {meta.name}
          </DialogTitle>
          <DialogDescription>
            Configure sua chave de API para habilitar esta integração.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <IntegrationCard
            provider={provider}
            meta={meta}
            integration={integration}
            onSave={handleSave}
            onDelete={handleDelete}
            onTest={integration ? handleTest : undefined}
            isSaving={isSaving}
            isDeleting={isDeleting}
            isTesting={isTesting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
