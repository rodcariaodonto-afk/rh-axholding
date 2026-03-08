import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SetupStep as SetupStepType } from "@/hooks/useSetupProgress";

interface SetupStepProps {
  step: SetupStepType;
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

export function SetupStep({ step, isExpanded, onToggle, children }: SetupStepProps) {
  return (
    <div
      className={cn(
        "border rounded-lg transition-all",
        isExpanded ? "border-primary shadow-sm" : "border-border",
        step.isCompleted && !isExpanded && "bg-muted/30"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div
          className={cn(
            "size-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
            step.isCompleted
              ? "bg-green-500 border-green-500 text-white"
              : "border-muted-foreground/30"
          )}
        >
          {step.isCompleted && <Check className="size-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "font-medium",
                step.isCompleted && !isExpanded && "text-muted-foreground"
              )}
            >
              {step.title}
            </p>
            {step.isOptional && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                opcional
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>

        {step.isCompleted && !isExpanded ? (
          <Badge variant="outline" className="border-green-500 text-green-600">
            <Check className="size-3 mr-1" />
            Concluído
          </Badge>
        ) : (
          <ChevronRight
            className={cn(
              "size-5 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && children && (
        <div className="px-4 pb-4 pt-0 border-t">
          <div className="pt-4">{children}</div>
        </div>
      )}

      {/* Configure Button (when not expanded and not completed) */}
      {!isExpanded && !step.isCompleted && (
        <div className="px-4 pb-4">
          <Button onClick={onToggle} size="sm" variant="outline">
            Configurar
          </Button>
        </div>
      )}
    </div>
  );
}
