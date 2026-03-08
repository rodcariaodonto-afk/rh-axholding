import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Save, Send, AlertTriangle, Settings } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { JobWizardSteps } from "@/components/jobs/JobWizardSteps";
import { JobStepBasicInfo } from "@/components/jobs/JobStepBasicInfo";
import { JobStepRequirements } from "@/components/jobs/JobStepRequirements";
import { JobStepCompensation } from "@/components/jobs/JobStepCompensation";
import { JobStepDescription } from "@/components/jobs/JobStepDescription";
import { JobStepProcess } from "@/components/jobs/JobStepProcess";
import { JobStepReview } from "@/components/jobs/JobStepReview";
import { useCreateJob } from "@/hooks/useCreateJob";
import { useUpdateJob } from "@/hooks/useUpdateJob";
import { useJobById } from "@/hooks/useJobById";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";
import { useOrganizationIntegrations } from "@/hooks/useOrganizationIntegrations";
import {
  EDUCATION_LEVEL_LABELS,
  JOB_SENIORITY_LABELS,
  JOB_WIZARD_STEPS,
} from "@/constants/jobOptions";
import {
  DEFAULT_JOB_FORM_DATA,
  type EducationLevel,
  type JobFormData,
  type JobSeniority,
} from "@/types/job";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  department_id: z.string(),
  unit_id: z.string(),
  work_model: z.enum(["remote", "hybrid", "onsite"]),
  contract_type: z.enum(["clt", "pj", "internship", "temporary", "freelancer"]),
  seniority: z.string(),
  openings_count: z.number().min(1),
  position_id: z.string(),
  description_tone: z.string(),
  description_context: z.string(),
  description: z.string(),
  required_skills: z.array(z.string()),
  desired_skills: z.array(z.string()),
  experience_years: z.number().nullable(),
  education_level: z.string(),
  languages: z.array(z.object({ language: z.string(), level: z.string() })),
  requirements: z.string(),
  salary_type: z.enum(["not_disclosed", "negotiable", "fixed", "range"]),
  salary_min: z.number().nullable(),
  salary_max: z.number().nullable(),
  benefits: z.array(z.string()),
  application_deadline: z.date().nullable(),
  expected_start_date: z.date().nullable(),
  urgency: z.enum(["low", "medium", "high", "urgent"]),
  require_cover_letter: z.boolean(),
  tags: z.array(z.string()),
  status: z.enum(["active", "closed", "draft", "on_hold"]),
});

const isJobSeniority = (
  value: string | null | undefined
): value is JobSeniority =>
  !!value && Object.prototype.hasOwnProperty.call(JOB_SENIORITY_LABELS, value);

const isEducationLevel = (
  value: string | null | undefined
): value is EducationLevel =>
  !!value &&
  Object.prototype.hasOwnProperty.call(EDUCATION_LEVEL_LABELS, value);

const JobFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(1);

  const { organization } = useRequireOrganization();
  const { data: existingJob, isLoading: isLoadingJob } = useJobById(id);
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const { data: integrations, isLoading: isLoadingIntegrations } = useOrganizationIntegrations(
    organization?.id || null
  );

  const hasAnthropicIntegration = integrations?.some(
    (i) => i.provider === "anthropic" && i.is_active
  );

  const form = useForm<JobFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_JOB_FORM_DATA,
  });

  // Populate form when editing existing job
  useEffect(() => {
    if (existingJob && isEditing) {
      form.reset({
        title: existingJob.title || "",
        department_id: existingJob.department_id || "",
        unit_id: existingJob.unit_id || "",
        work_model: existingJob.work_model || "onsite",
        contract_type: existingJob.contract_type || "clt",
        seniority: isJobSeniority(existingJob.seniority)
          ? existingJob.seniority
          : "",
        openings_count: existingJob.openings_count || 1,
        position_id: existingJob.position_id || "",
        description_tone: existingJob.description_tone || "",
        description_context: "",
        description: existingJob.description || "",
        required_skills: existingJob.required_skills || [],
        desired_skills: existingJob.desired_skills || [],
        experience_years: existingJob.experience_years,
        education_level: isEducationLevel(existingJob.education_level)
          ? existingJob.education_level
          : "",
        languages: existingJob.languages || [],
        requirements: existingJob.requirements || "",
        salary_type: existingJob.salary_type || "not_disclosed",
        salary_min: existingJob.salary_min,
        salary_max: existingJob.salary_max,
        benefits: existingJob.benefits || [],
        application_deadline: existingJob.application_deadline
          ? new Date(existingJob.application_deadline)
          : null,
        expected_start_date: existingJob.expected_start_date
          ? new Date(existingJob.expected_start_date)
          : null,
        urgency: existingJob.urgency || "medium",
        require_cover_letter: existingJob.require_cover_letter || false,
        tags: existingJob.tags || [],
        status: existingJob.status || "draft",
      });
    }
  }, [existingJob, isEditing, form]);

  const totalSteps = JOB_WIZARD_STEPS.length;
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  const handleNext = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: (keyof JobFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["title"];
        break;
      case 2:
        fieldsToValidate = ["required_skills"];
        break;
      case 4:
        fieldsToValidate = ["description"];
        break;
      // Other steps have no required fields
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Allow navigation to any visited step
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleSaveDraft = async () => {
    const values = form.getValues();
    await submitJob(values, "draft");
  };

  const handlePublish = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    await submitJob(values, "active");
  };

  const submitJob = async (values: JobFormData, status: "draft" | "active") => {
    const jobData = {
      title: values.title,
      description: values.description || null,
      requirements: values.requirements || null,
      position_id: values.position_id || null,
      department_id: values.department_id || null,
      status,
      unit_id: values.unit_id || null,
      work_model: values.work_model,
      contract_type: values.contract_type,
      seniority: values.seniority || null,
      openings_count: values.openings_count,
      description_tone: values.description_tone || null,
      required_skills: values.required_skills,
      desired_skills: values.desired_skills,
      experience_years: values.experience_years,
      education_level: values.education_level || null,
      languages: values.languages,
      salary_type: values.salary_type,
      salary_min: values.salary_min,
      salary_max: values.salary_max,
      benefits: values.benefits,
      application_deadline: values.application_deadline?.toISOString().split("T")[0] || null,
      expected_start_date: values.expected_start_date?.toISOString().split("T")[0] || null,
      urgency: values.urgency,
      require_cover_letter: values.require_cover_letter,
      tags: values.tags,
    };

    try {
      if (isEditing && id) {
        await updateJob.mutateAsync({ id, ...jobData });
      } else {
        await createJob.mutateAsync(jobData as any);
      }
      navigate("/vagas");
    } catch (error) {
      console.error("Error saving job:", error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <JobStepBasicInfo form={form} />;
      case 2:
        return <JobStepRequirements form={form} />;
      case 3:
        return <JobStepCompensation form={form} />;
      case 4:
        return <JobStepDescription form={form} />;
      case 5:
        return <JobStepProcess form={form} />;
      case 6:
        return <JobStepReview form={form} />;
      default:
        return null;
    }
  };

  const isPending = createJob.isPending || updateJob.isPending;

  if (isEditing && isLoadingJob) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/vagas">Vagas</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isEditing ? "Editar Vaga" : "Nova Vaga"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Editar Vaga" : "Criar Nova Vaga"}
            </h1>
            <p className="text-muted-foreground">
              {JOB_WIZARD_STEPS[currentStep - 1]?.description}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Passo {currentStep} de {totalSteps}
          </div>
        </div>

        {/* Warning Banner: Anthropic Integration Missing (only on description step) */}
        {currentStep === 4 && !isLoadingIntegrations && !hasAnthropicIntegration && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-600 dark:text-amber-400">
              Geração de IA desabilitada
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Configure a integração com Anthropic para habilitar a geração automática de
                descrições.
              </span>
              <Button asChild variant="outline" size="sm" className="ml-4 shrink-0">
                <Link to="/company-settings/integrations">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Steps */}
        <JobWizardSteps
          currentStep={currentStep}
          onStepClick={handleStepClick}
          completedSteps={Array.from({ length: currentStep - 1 }, (_, i) => i + 1)}
        />

        {/* Form */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <Card>
              <CardContent className="pt-6">{renderStep()}</CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/vagas")}
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
                      Publicar Vaga
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
};

export default JobFormPage;
