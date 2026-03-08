import { UseFormReturn } from "react-hook-form";
import { Sparkles, Loader2, Rocket, Building2, Scale, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { WORK_MODEL_LABELS, CONTRACT_TYPE_LABELS, JOB_SENIORITY_LABELS } from "@/constants/jobOptions";
import { useGeneratePositionDescription } from "@/hooks/useGeneratePositionDescription";
import { useOrganizationIntegrations } from "@/hooks/useOrganizationIntegrations";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";
import type { JobFormData, DescriptionTone, JobSeniority } from "@/types/job";
import { cn } from "@/lib/utils";

interface JobStepDescriptionProps {
  form: UseFormReturn<JobFormData>;
}

const TONE_OPTIONS: {
  value: DescriptionTone;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "startup",
    label: "Startup",
    description: "Informal, ousado e energético",
    icon: Rocket,
  },
  {
    value: "corporate",
    label: "Corporativo",
    description: "Formal e tradicional",
    icon: Building2,
  },
  {
    value: "balanced",
    label: "Equilibrado",
    description: "Profissional mas humano",
    icon: Scale,
  },
  {
    value: "creative",
    label: "Criativo",
    description: "Divertido e irreverente",
    icon: Palette,
  },
];

export function JobStepDescription({ form }: JobStepDescriptionProps) {
  const navigate = useNavigate();
  const { mutateAsync: generateDescription, isPending: isGenerating } = useGeneratePositionDescription();
  const { organizationId } = useCurrentOrganization();
  const { data: integrations } = useOrganizationIntegrations(organizationId);

  const hasAnthropicIntegration = integrations?.some(
    (i) => i.provider === "anthropic" && i.is_active
  );

  const handleGenerateWithAI = async () => {
    const values = form.getValues();

    if (!values.title) {
      return;
    }

    if (!hasAnthropicIntegration) {
      toast.error("Integração com IA não configurada", {
        description: "Configure a chave da Anthropic para gerar descrições com IA.",
        action: {
          label: "Configurar",
          onClick: () => navigate("/company-settings/integrations"),
        },
      });
      return;
    }

    try {
      const result = await generateDescription({
        title: values.title,
        expected_profile_code: values.description_tone || undefined,
        activities: values.description_context || undefined,
      });

      if (result?.description) {
        form.setValue("description", result.description);
      }
    } catch (error) {
      // Error handled by the hook
    }
  };

  const selectedTone = form.watch("description_tone");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Descrição da Vaga</h2>
        <p className="text-muted-foreground">
          Crie uma descrição atrativa para os candidatos
        </p>
      </div>

      <div className="grid gap-6">
        {/* Tone Selection Cards */}
        <FormField
          control={form.control}
          name="description_tone"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Tom da Descrição
              </FormLabel>
              <p className="text-sm text-muted-foreground">
                Escolha o estilo de comunicação que melhor representa sua empresa
              </p>
              <FormControl>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TONE_OPTIONS.map((tone) => {
                    const Icon = tone.icon;
                    const isSelected = field.value === tone.value;
                    return (
                      <button
                        key={tone.value}
                        type="button"
                        onClick={() => field.onChange(isSelected ? "" : tone.value)}
                        className={cn(
                          "flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all text-left",
                          "hover:border-primary/50 hover:bg-accent/50",
                          isSelected
                            ? "border-primary bg-accent"
                            : "border-border bg-card"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">{tone.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {tone.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Context Field */}
        <FormField
          control={form.control}
          name="description_context"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contexto adicional (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Informações extras para a IA considerar na geração..."
                  className="resize-none"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description Editor with embedded AI button */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição da Vaga *</FormLabel>
              <FormControl>
                <div className="relative">
                  {/* AI Generate Button - positioned inside */}
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleGenerateWithAI}
                      disabled={isGenerating || !form.getValues("title")}
                      className="shadow-sm"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          Gerar com IA
                        </>
                      )}
                    </Button>
                  </div>

                  <RichTextEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Descreva a vaga em detalhes..."
                    className="min-h-[400px]"
                    contentClassName="pt-12"
                  />
                </div>
              </FormControl>
              {!form.getValues("title") && (
                <p className="text-xs text-muted-foreground">
                  Preencha o título da vaga na etapa "Básico" para usar a geração com IA.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
