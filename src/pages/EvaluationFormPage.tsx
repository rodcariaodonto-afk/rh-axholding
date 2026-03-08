import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronLeft, ChevronRight, Save, Send } from "lucide-react";
import { EvaluationWizardSteps } from "@/components/evaluation/EvaluationWizardSteps";
import { EvaluationStepBasicInfo } from "@/components/evaluation/EvaluationStepBasicInfo";
import { EvaluationStepScales } from "@/components/evaluation/EvaluationStepScales";
import { EvaluationStepConfig } from "@/components/evaluation/EvaluationStepConfig";
import { EvaluationStepParticipants } from "@/components/evaluation/EvaluationStepParticipants";
import { EVALUATION_WIZARD_STEPS } from "@/constants/evaluationOptions";
import { useCreateEvaluationCycle, useEvaluationCycleById, useUpdateEvaluationCycle } from "@/hooks/useEvaluationCycles";
import { useEmployees } from "@/hooks/useEmployees";
import { defaultEvaluationFormData } from "@/types/evaluation";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const STEP_FIELDS: Record<number, string[]> = {
  1: ["name", "start_date", "end_date", "description"],
  2: ["scale_levels", "scale_label_type", "custom_labels"],
  3: ["evaluation_type", "allow_self_evaluation", "include_self_in_average", "require_competency_comments", "competency_comments_required", "require_general_comments", "admission_cutoff_date", "contract_types"],
  4: ["participants"],
};

const participantSchema = z.object({
  evaluator_id: z.string(),
  evaluated_id: z.string(),
  relationship: z.string(),
});

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().nullable(),
  start_date: z.date({ required_error: "Data de início é obrigatória", invalid_type_error: "Data de início é obrigatória" }),
  end_date: z.date({ required_error: "Data de término é obrigatória", invalid_type_error: "Data de término é obrigatória" }),
  scale_levels: z.number().refine((v) => v === 4 || v === 5, { message: "Selecione 4 ou 5 níveis" }),
  scale_label_type: z.string(),
  custom_labels: z.array(z.string()),
  evaluation_type: z.string(),
  allow_self_evaluation: z.boolean(),
  include_self_in_average: z.boolean(),
  require_competency_comments: z.boolean(),
  competency_comments_required: z.boolean(),
  require_general_comments: z.boolean(),
  admission_cutoff_date: z.date().optional().nullable(),
  contract_types: z.array(z.string()),
  participants: z.array(participantSchema),
});

export default function EvaluationFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { organizationId } = useCurrentOrganization();
  const [currentStep, setCurrentStep] = useState(1);

  const { data: employees } = useEmployees();
  const { mutateAsync: createCycle, isPending: isCreating } = useCreateEvaluationCycle();
  const { mutateAsync: updateCycle, isPending: isUpdating } = useUpdateEvaluationCycle();
  const { data: existingCycle } = useEvaluationCycleById(id);
  const isPending = isCreating || isUpdating;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultEvaluationFormData as any,
  });

  // Populate form when editing an existing cycle
  useEffect(() => {
    if (!existingCycle) return;

    form.reset({
      name: existingCycle.name || '',
      description: existingCycle.description || '',
      start_date: existingCycle.start_date ? new Date(existingCycle.start_date + 'T00:00:00') : null,
      end_date: existingCycle.end_date ? new Date(existingCycle.end_date + 'T00:00:00') : null,
      scale_levels: existingCycle.scale_levels as 4 | 5,
      scale_label_type: existingCycle.scale_label_type || 'concordancia',
      custom_labels: Array.isArray(existingCycle.custom_labels) ? existingCycle.custom_labels : ['', '', '', '', ''],
      evaluation_type: existingCycle.evaluation_type || '90',
      allow_self_evaluation: existingCycle.allow_self_evaluation ?? false,
      include_self_in_average: existingCycle.include_self_in_average ?? false,
      require_competency_comments: existingCycle.require_competency_comments ?? false,
      competency_comments_required: existingCycle.competency_comments_required ?? false,
      require_general_comments: existingCycle.require_general_comments ?? false,
      admission_cutoff_date: existingCycle.admission_cutoff_date ? new Date(existingCycle.admission_cutoff_date + 'T00:00:00') : null,
      contract_types: existingCycle.contract_types || [],
      participants: [],
    });

    // Also load existing participants
    if (id) {
      supabase
        .from("evaluation_participants")
        .select("evaluator_id, evaluated_id, relationship")
        .eq("cycle_id", id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            form.setValue("participants", data as any);
          }
        });
    }
  }, [existingCycle, id]);

  const totalSteps = EVALUATION_WIZARD_STEPS.length;
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  const onSubmit = async (data: any, status: 'draft' | 'active' = 'draft') => {
    if (!organizationId) return;

    const user = await supabase.auth.getUser();
    const { participants, ...cycleData } = data;

    const payload = {
      ...cycleData,
      status,
      organization_id: organizationId,
      created_by: user.data.user?.id || "",
      start_date: data.start_date?.toISOString().split("T")[0],
      end_date: data.end_date?.toISOString().split("T")[0],
      admission_cutoff_date: data.admission_cutoff_date?.toISOString().split("T")[0] || null,
    };

    try {
      let cycleId: string;

      if (id) {
        // Update existing cycle
        await updateCycle({ id, ...payload } as any);
        cycleId = id;

        // Replace participants: delete old, insert new
        await supabase.from("evaluation_participants").delete().eq("cycle_id", id);
      } else {
        // Create new cycle
        const cycle = await createCycle(payload as any);
        cycleId = cycle?.id;
      }

      if (participants.length > 0 && cycleId) {
        const participantRows = participants.map((p: any) => ({
          cycle_id: cycleId,
          evaluator_id: p.evaluator_id,
          evaluated_id: p.evaluated_id,
          relationship: p.relationship,
        }));

        const { error: pError } = await supabase
          .from("evaluation_participants")
          .insert(participantRows);

        if (pError) {
          toast({
            title: "Erro ao adicionar participantes",
            description: pError.message,
            variant: "destructive",
          });
          return;
        }
      }

      navigate("/performance-evaluation");
    } catch {
      // Error already handled by mutation's onError
    }
  };

  const handleNext = async () => {
    const fields = STEP_FIELDS[currentStep] || [];
    const isValid = await form.trigger(fields as any);
    if (!isValid) return;
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleSaveDraft = async () => {
    // Validate only basic fields (step 1) for draft
    const isValid = await form.trigger(STEP_FIELDS[1] as any);
    if (!isValid) {
      setCurrentStep(1);
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o nome e as datas para salvar o rascunho.",
        variant: "destructive",
      });
      return;
    }
    const data = form.getValues();
    onSubmit(data, 'draft');
  };

  const handlePublish = async () => {
    // Check participants first (separate from Zod since schema allows empty for drafts)
    const participants = form.getValues("participants");
    if (!participants || participants.length === 0) {
      setCurrentStep(4);
      toast({
        title: "Participantes obrigatórios",
        description: "Adicione pelo menos um participante antes de publicar.",
        variant: "destructive",
      });
      return;
    }

    const isValid = await form.trigger();
    if (!isValid) {
      const errors = form.formState.errors;
      if (errors.name || errors.description || errors.start_date || errors.end_date) {
        setCurrentStep(1);
      } else if (errors.scale_levels || errors.scale_label_type || errors.custom_labels) {
        setCurrentStep(2);
      } else if (errors.evaluation_type || errors.allow_self_evaluation || errors.admission_cutoff_date || errors.contract_types) {
        setCurrentStep(3);
      } else {
        setCurrentStep(4);
      }
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de publicar.",
        variant: "destructive",
      });
      return;
    }
    const data = form.getValues();
    onSubmit(data, 'active');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/performance-evaluation">Avaliação de desempenho</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {id ? "Editar avaliação" : "Nova avaliação"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {id ? "Editar Ciclo de Avaliação" : "Criar Ciclo de Avaliação"}
            </h1>
            <p className="text-muted-foreground">
              {EVALUATION_WIZARD_STEPS[currentStep - 1]?.description}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Passo {currentStep} de {totalSteps}
          </div>
        </div>

        {/* Progress Steps */}
        <EvaluationWizardSteps
          currentStep={currentStep}
          onStepClick={handleStepClick}
          completedSteps={Array.from({ length: currentStep - 1 }, (_, i) => i + 1)}
        />

        {/* Form */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <Card>
              <CardContent className="pt-6">
                {currentStep === 1 && <EvaluationStepBasicInfo form={form} />}
                {currentStep === 2 && <EvaluationStepScales form={form} />}
                {currentStep === 3 && <EvaluationStepConfig form={form} />}
                {currentStep === 4 && (
                  <EvaluationStepParticipants
                    form={form}
                    employees={(employees || []).map(e => ({
                      id: e.id,
                      full_name: e.full_name || "Desconhecido",
                      manager_id: e.manager_id || null,
                      hire_date: e.hire_date || null,
                      contract_type: e.contract_type || null,
                    }))}
                  />
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/performance-evaluation")}
              >
                Cancelar
              </Button>

              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Voltar
                  </Button>
                )}

                {isLastStep ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Rascunho
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePublish}
                      disabled={isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Publicar Avaliação
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={handleNext}>
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
