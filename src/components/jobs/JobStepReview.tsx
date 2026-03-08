import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDepartments } from "@/hooks/useDepartments";
import { useUnits } from "@/hooks/useUnits";
import { usePositions } from "@/hooks/usePositions";
import {
  WORK_MODEL_LABELS,
  CONTRACT_TYPE_LABELS,
  JOB_SENIORITY_LABELS,
  SALARY_TYPE_LABELS,
  JOB_URGENCY_LABELS,
  EDUCATION_LEVEL_LABELS,
  LANGUAGE_LEVEL_OPTIONS,
} from "@/constants/jobOptions";
import type { JobFormData, JobSeniority, EducationLevel } from "@/types/job";

interface JobStepReviewProps {
  form: UseFormReturn<JobFormData>;
}

export function JobStepReview({ form }: JobStepReviewProps) {
  const values = form.getValues();
  const { data: departments } = useDepartments();
  const { data: units } = useUnits();
  const { data: positions } = usePositions();

  const department = departments?.find((d) => d.id === values.department_id);
  const unit = units?.find((u) => u.id === values.unit_id);
  const position = positions?.find((p) => p.id === values.position_id);

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getLanguageLevelLabel = (level: string) => {
    return LANGUAGE_LEVEL_OPTIONS.find((opt) => opt.value === level)?.label || level;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Revisão</h2>
        <p className="text-muted-foreground">
          Confira as informações antes de publicar a vaga
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <section className="space-y-3">
          <h3 className="text-lg font-medium">Informações Básicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Título:</span>
              <p className="font-medium">{values.title || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Cargo:</span>
              <p className="font-medium">{position?.title || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Departamento:</span>
              <p className="font-medium">{department?.name || "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Unidade:</span>
              <p className="font-medium">
                {unit ? `${unit.name}${unit.city ? ` (${unit.city})` : ""}` : "-"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Modelo de Trabalho:</span>
              <p className="font-medium">
                {WORK_MODEL_LABELS[values.work_model] || "-"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo de Contrato:</span>
              <p className="font-medium">
                {CONTRACT_TYPE_LABELS[values.contract_type] || "-"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Senioridade:</span>
              <p className="font-medium">
                {values.seniority ? JOB_SENIORITY_LABELS[values.seniority as JobSeniority] || values.seniority : "-"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Número de Vagas:</span>
              <p className="font-medium">{values.openings_count}</p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Description */}
        <section className="space-y-3">
          <h3 className="text-lg font-medium">Descrição</h3>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {values.description ? (
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                {values.description}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">Nenhuma descrição informada.</p>
            )}
          </div>
        </section>

        <Separator />

        {/* Requirements */}
        <section className="space-y-3">
          <h3 className="text-lg font-medium">Requisitos</h3>
          <div className="space-y-4">
            <div>
              <span className="text-muted-foreground text-sm">Habilidades Obrigatórias:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {values.required_skills?.length > 0 ? (
                  values.required_skills.map((skill) => (
                    <Badge key={skill} variant="default">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Nenhuma</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">Habilidades Desejáveis:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {values.desired_skills?.length > 0 ? (
                  values.desired_skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Nenhuma</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Anos de Experiência:</span>
                <p className="font-medium">
                  {values.experience_years !== null ? `${values.experience_years} anos` : "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Escolaridade:</span>
                <p className="font-medium">
                  {values.education_level
                    ? EDUCATION_LEVEL_LABELS[values.education_level as EducationLevel] || values.education_level
                    : "-"}
                </p>
              </div>
            </div>
            {values.languages?.length > 0 && (
              <div>
                <span className="text-muted-foreground text-sm">Idiomas:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {values.languages.map((lang, idx) => (
                    <Badge key={idx} variant="outline">
                      {lang.language} - {getLanguageLevelLabel(lang.level)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* Compensation */}
        <section className="space-y-3">
          <h3 className="text-lg font-medium">Remuneração</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Tipo:</span>
              <p className="font-medium">
                {SALARY_TYPE_LABELS[values.salary_type]}
              </p>
            </div>
            {(values.salary_type === "fixed" || values.salary_type === "range") && (
              <div>
                <span className="text-muted-foreground">Valor:</span>
                <p className="font-medium">
                  {values.salary_type === "fixed"
                    ? formatCurrency(values.salary_min)
                    : `${formatCurrency(values.salary_min)} - ${formatCurrency(values.salary_max)}`}
                </p>
              </div>
            )}
          </div>
          {values.benefits?.length > 0 && (
            <div>
              <span className="text-muted-foreground text-sm">Benefícios:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {values.benefits.map((benefit) => (
                  <Badge key={benefit} variant="secondary">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>

        <Separator />

        {/* Process */}
        <section className="space-y-3">
          <h3 className="text-lg font-medium">Processo Seletivo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Data Limite:</span>
              <p className="font-medium">
                {values.application_deadline
                  ? format(values.application_deadline, "PPP", { locale: ptBR })
                  : "-"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Início Previsto:</span>
              <p className="font-medium">
                {values.expected_start_date
                  ? format(values.expected_start_date, "PPP", { locale: ptBR })
                  : "-"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Urgência:</span>
              <p className="font-medium">{JOB_URGENCY_LABELS[values.urgency]}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Carta de Apresentação:</span>
              <p className="font-medium">
                {values.require_cover_letter ? "Obrigatória" : "Opcional"}
              </p>
            </div>
          </div>
          {values.tags?.length > 0 && (
            <div>
              <span className="text-muted-foreground text-sm">Tags:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {values.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
