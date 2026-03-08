import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetupProgress } from "@/hooks/useSetupProgress";
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
import { PartyPopper, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

export default function Setup() {
  const navigate = useNavigate();
  const { categories, overallPercentage, isComplete, isLoading, completedSteps } = useSetupProgress();

  // Active states
  const [activeCategory, setActiveCategory] = useState("config");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Dialog states
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [integrationProvider, setIntegrationProvider] = useState<"anthropic" | "resend" | null>(null);

  const currentCategory = categories.find((c) => c.id === activeCategory);

  // Detect if this is the first-time setup (no steps completed yet)
  const isFirstTimeSetup = completedSteps === 0;

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

  if (isLoading) {
    return (
      <div className="flex h-screen">
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
    );
  }

  const setupContent = (
    <div className={isFirstTimeSetup ? "flex h-screen bg-background" : "flex h-full bg-background"}>
      <SetupSidebar
        categories={categories}
        overallPercentage={overallPercentage}
        activeCategory={activeCategory}
        onCategoryClick={setActiveCategory}
      />

      <main className="flex-1 overflow-auto p-8">
        {isComplete ? (
          // Completion state
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="p-4 rounded-full bg-green-500/10 mb-6">
              <PartyPopper className="size-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Setup Completo!</h1>
            <p className="text-muted-foreground mb-6">
              Parabéns! Sua organização está configurada e pronta para uso.
              Explore as funcionalidades do Orb RH.
            </p>
            <Button asChild>
              <Link to="/">
                Ir para o Dashboard
                <ArrowRight className="size-4 ml-2" />
              </Link>
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
    </div>
  );

  // First-time setup: full screen experience
  // Returning user: show within standard Layout
  if (isFirstTimeSetup) {
    return setupContent;
  }

  return <Layout>{setupContent}</Layout>;
}
