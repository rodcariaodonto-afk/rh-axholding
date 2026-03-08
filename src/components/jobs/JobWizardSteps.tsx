import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { JOB_WIZARD_STEPS } from "@/constants/jobOptions";

interface JobWizardStepsProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  completedSteps?: number[];
}

export function JobWizardSteps({
  currentStep,
  onStepClick,
  completedSteps = [],
}: JobWizardStepsProps) {
  const progress = ((currentStep - 1) / (JOB_WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative mb-8">
        {/* Background line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
        {/* Progress line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {JOB_WIZARD_STEPS.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isPast = step.id < currentStep;
            const isClickable = onStepClick && (isCompleted || isPast || step.id === currentStep);

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-2 group",
                  isClickable && "cursor-pointer"
                )}
              >
                {/* Step circle */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    "border-2",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isPast && !isCompleted && "border-primary bg-primary text-primary-foreground",
                    !isCurrent && !isCompleted && !isPast && "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>

                {/* Step label - hidden on mobile */}
                <div className="hidden sm:flex flex-col items-center">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current step info - visible on mobile */}
      <div className="sm:hidden text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Passo {currentStep} de {JOB_WIZARD_STEPS.length}
        </p>
        <p className="font-medium">{JOB_WIZARD_STEPS[currentStep - 1]?.title}</p>
        <p className="text-sm text-muted-foreground">
          {JOB_WIZARD_STEPS[currentStep - 1]?.description}
        </p>
      </div>
    </div>
  );
}
