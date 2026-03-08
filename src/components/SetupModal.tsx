import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetupProgress } from "@/hooks/useSetupProgress";
import { useSkipSetup } from "@/hooks/useOrganizationSettings";
import { SetupSidebar } from "@/components/setup/SetupSidebar";
import { SetupCategory } from "@/components/setup/SetupCategory";
import { SetupStep } from "@/components/setup/SetupStep";
import { SetupCompanyProfileForm } from "@/components/setup/SetupCompanyProfileForm";
import { SetupWorkPolicyForm } from "@/components/setup/SetupWorkPolicyForm";
import { SetupBenefitsForm } from "@/components/setup/SetupBenefitsForm";
import { SetupIntegrationModal } from "@/components/setup/SetupIntegrationModal";
import { NewEmployeeDialog } from "@/components/NewEmployeeDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PartyPopper, X, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetupModal({ open, onOpenChange }: SetupModalProps) {
  const navigate = useNavigate();
  const { categories, overallPercentage, isComplete, isLoading } = useSetupProgress();
  const skipSetupMutation = useSkipSetup();

  // Active states
  const [activeCategory, setActiveCategory] = useState("config");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Dialog states
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [integrationProvider, setIntegrationProvider] = useState<"anthropic" | "resend" | null>(null);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);

  const currentCategory = categories.find((c) => c.id === activeCategory);

  const handleStepToggle = (stepId: string) => {
    setExpandedStep((prev) => (prev === stepId ? null : stepId));
  };

  const handleStepComplete = () => {
    setExpandedStep(null);
  };

  const handleStepAction = (stepId: string) => {
    switch (stepId) {
      case "employees":
        setShowEmployeeDialog(true);
        break;
      case "departments":
        onOpenChange(false);
        navigate("/departments/new");
        break;
      case "anthropic":
        setIntegrationProvider("anthropic");
        break;
      default:
        handleStepToggle(stepId);
    }
  };

  const renderStepContent = (stepId: string) => {
    switch (stepId) {
      case "profile":
        return <SetupCompanyProfileForm onComplete={handleStepComplete} />;
      case "work_policy":
        return <SetupWorkPolicyForm onComplete={handleStepComplete} />;
      case "benefits":
        return <SetupBenefitsForm onComplete={handleStepComplete} />;
      default:
        return null;
    }
  };

  const handleCloseAttempt = () => {
    if (isComplete) {
      onOpenChange(false);
    } else {
      setShowSkipConfirmation(true);
    }
  };

  const handleConfirmSkip = async () => {
    try {
      await skipSetupMutation.mutateAsync();
      setShowSkipConfirmation(false);
      onOpenChange(false);
    } catch {
      // Error is handled in the mutation
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseAttempt}>
        <DialogContent className="max-w-5xl h-[85vh] max-h-[85vh] p-0 gap-0 overflow-hidden !flex !flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Configuração da Organização</DialogTitle>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex h-full">
              <aside className="w-[280px] border-r p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </aside>
              <main className="flex-1 p-8">
                <Skeleton className="h-8 w-1/2 mb-4" />
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full" />
              </main>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-1">
              <SetupSidebar
                categories={categories}
                overallPercentage={overallPercentage}
                activeCategory={activeCategory}
                onCategoryClick={setActiveCategory}
              />

              <main className="flex-1 overflow-y-auto min-h-0 p-8">
                {isComplete ? (
                  // Completion state
                  <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                    <div className="p-4 rounded-full bg-primary/10 mb-6">
                      <PartyPopper className="size-12 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Setup Completo!</h1>
                    <p className="text-muted-foreground mb-6">
                      Parabéns! Sua organização está configurada e pronta para uso.
                    </p>
                    <Button onClick={() => onOpenChange(false)}>
                      Começar a usar
                    </Button>
                  </div>
                ) : currentCategory ? (
                  <SetupCategory category={currentCategory}>
                    {currentCategory.steps.map((step) => (
                      <SetupStep
                        key={step.id}
                        step={step}
                        isExpanded={expandedStep === step.id && step.action === "inline"}
                        onToggle={() => handleStepAction(step.id)}
                      >
                        {step.action === "inline" && renderStepContent(step.id)}
                      </SetupStep>
                    ))}
                  </SetupCategory>
                ) : null}
              </main>

              {/* Close button - always visible */}
              <button
                onClick={handleCloseAttempt}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </button>

              {/* Skip button - only when not complete */}
              {!isComplete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-12 top-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSkipConfirmation(true)}
                >
                  Pular por agora
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Skip confirmation dialog */}
      <AlertDialog open={showSkipConfirmation} onOpenChange={setShowSkipConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Pular configuração?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Algumas funcionalidades podem estar limitadas até você completar a configuração:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Análise de candidatos com IA</li>
                <li>Relatórios completos</li>
                <li>Integrações automáticas</li>
              </ul>
              <p className="text-sm">
                Você pode completar a configuração depois em{" "}
                <span className="font-medium">Configurações</span>.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar ao setup</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSkip}
              disabled={skipSetupMutation.isPending}
            >
              {skipSetupMutation.isPending ? "Pulando..." : "Pular mesmo assim"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogs */}
      <NewEmployeeDialog
        open={showEmployeeDialog}
        onOpenChange={setShowEmployeeDialog}
      />

      <SetupIntegrationModal
        open={!!integrationProvider}
        onOpenChange={(open) => !open && setIntegrationProvider(null)}
        provider={integrationProvider || "anthropic"}
      />
    </>
  );
}
