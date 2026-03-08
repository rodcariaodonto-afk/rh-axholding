import { useMemo } from "react";
import { Settings, Plug, type LucideIcon } from "lucide-react";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { useOrganizationIntegrations } from "@/hooks/useOrganizationIntegrations";
import { useEmployees } from "@/hooks/useEmployees";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isOptional?: boolean;
  action: "inline" | "dialog" | "modal";
}

export interface SetupCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  steps: SetupStep[];
  completedCount: number;
  totalRequired: number;
  percentage: number;
}

export interface SetupProgress {
  categories: SetupCategory[];
  overallPercentage: number;
  completedSteps: number;
  totalRequired: number;
  isComplete: boolean;
  isSkipped: boolean;
  isLoading: boolean;
}

export function useSetupProgress(): SetupProgress {
  const { organization, isLoading: contextLoading } = useRequireOrganization();
  const { data: org, isLoading: orgLoading } = useOrganizationSettings();
  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { data: integrations, isLoading: integrationsLoading } = useOrganizationIntegrations(org?.id ?? null);

  const isLoading = contextLoading || !organization?.id || orgLoading || employeesLoading || integrationsLoading;

  const categories = useMemo(() => {
    // Calculations
    const hasProfile = !!org?.description;
    const hasWorkPolicy = !!org?.work_policy;
    const hasBenefits = (org?.benefits?.length || 0) >= 1;
    
    const employeeCount = employees?.filter(e => e.status === "active").length || 0;
    const hasAnthropic = integrations?.some(
      i => i.provider === "anthropic" && i.is_active
    ) ?? false;

    const categoriesData: SetupCategory[] = [
      {
        id: "config",
        title: "Configuração Inicial",
        icon: Settings,
        steps: [
          {
            id: "profile",
            title: "Completar perfil da empresa",
            description: "Adicione uma descrição da empresa",
            isCompleted: hasProfile,
            action: "inline",
          },
          {
            id: "work_policy",
            title: "Definir política de trabalho",
            description: "Configure se é remoto, híbrido ou presencial",
            isCompleted: hasWorkPolicy,
            action: "inline",
          },
          {
            id: "benefits",
            title: "Configurar benefícios",
            description: "Liste os benefícios oferecidos pela empresa",
            isCompleted: hasBenefits,
            action: "inline",
          },
          {
            id: "employees",
            title: "Convidar colaboradores",
            description: "Adicione membros da equipe",
            isCompleted: employeeCount > 1,
            action: "dialog",
          },
        ],
        completedCount: 0,
        totalRequired: 0,
        percentage: 0,
      },
      {
        id: "integrations",
        title: "Integrações",
        icon: Plug,
        steps: [
          {
            id: "anthropic",
            title: "Conectar IA (Anthropic)",
            description: "Configure a API para análise de candidatos",
            isCompleted: hasAnthropic,
            action: "modal",
          },
        ],
        completedCount: 0,
        totalRequired: 0,
        percentage: 0,
      },
    ];

    // Calculate percentages for each category
    return categoriesData.map((category) => {
      const requiredSteps = category.steps.filter((s) => !s.isOptional);
      const completedSteps = requiredSteps.filter((s) => s.isCompleted);
      return {
        ...category,
        completedCount: completedSteps.length,
        totalRequired: requiredSteps.length,
        percentage: requiredSteps.length > 0
          ? Math.round((completedSteps.length / requiredSteps.length) * 100)
          : 100,
      };
    });
  }, [org, employees, integrations]);

  // Check if setup was skipped
  const isSkipped = org?.settings?.setup_skipped === true;

  // Overall progress calculation
  const requiredSteps = categories.flatMap((c) =>
    c.steps.filter((s) => !s.isOptional)
  );
  const completedSteps = requiredSteps.filter((s) => s.isCompleted);
  const overallPercentage =
    requiredSteps.length > 0
      ? Math.round((completedSteps.length / requiredSteps.length) * 100)
      : 100;

  return {
    categories,
    overallPercentage,
    completedSteps: completedSteps.length,
    totalRequired: requiredSteps.length,
    isComplete: completedSteps.length === requiredSteps.length,
    isSkipped,
    isLoading,
  };
}
