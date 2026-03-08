export type JobStatus = "active" | "closed" | "draft" | "on_hold";
export type WorkModel = "remote" | "hybrid" | "onsite";
export type JobContractType = "clt" | "pj" | "internship" | "temporary" | "freelancer";
export type JobSeniority = "intern" | "junior" | "pleno" | "senior" | "specialist" | "lead" | "manager" | "director";
export type SalaryType = "not_disclosed" | "negotiable" | "fixed" | "range";
export type JobUrgency = "low" | "medium" | "high" | "urgent";
export type DescriptionTone = "startup" | "corporate" | "balanced" | "creative";
export type EducationLevel = "elementary" | "high_school" | "technical" | "undergraduate" | "postgraduate" | "masters" | "doctorate" | "postdoc";

export interface JobLanguage {
  language: string;
  level: string;
}

export interface Job {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  position_id: string | null;
  department_id: string | null;
  organization_id: string | null;
  status: JobStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  // New wizard fields
  unit_id: string | null;
  work_model: WorkModel | null;
  contract_type: JobContractType | null;
  seniority: string | null;
  openings_count: number | null;
  required_skills: string[] | null;
  desired_skills: string[] | null;
  experience_years: number | null;
  education_level: string | null;
  languages: JobLanguage[] | null;
  salary_type: SalaryType | null;
  salary_min: number | null;
  salary_max: number | null;
  benefits: string[] | null;
  description_tone: DescriptionTone | null;
  description_context: string | null;
  application_deadline: string | null;
  expected_start_date: string | null;
  urgency: JobUrgency | null;
  require_cover_letter: boolean | null;
  tags: string[] | null;
  // Joined relations
  positions?: {
    id: string;
    title: string;
  } | null;
  departments?: {
    id: string;
    name: string;
  } | null;
  units?: {
    id: string;
    name: string;
    city: string | null;
  } | null;
}

export interface JobApplication {
  id: string;
  job_id: string;
  candidate_name: string;
  candidate_email: string;
  resume_url: string | null;
  status: string;
  notes: string | null;
  applied_at: string;
  updated_at: string;
}

export interface JobFormData {
  // Step 1: Basic Info
  title: string;
  department_id: string;
  unit_id: string;
  work_model: WorkModel;
  contract_type: JobContractType;
  seniority: JobSeniority | "";
  openings_count: number;
  position_id: string;
  // Step 2: Description
  description_tone: DescriptionTone | "";
  description_context: string;
  description: string;
  // Step 3: Requirements
  required_skills: string[];
  desired_skills: string[];
  experience_years: number | null;
  education_level: EducationLevel | "";
  languages: JobLanguage[];
  requirements: string;
  // Step 4: Compensation
  salary_type: SalaryType;
  salary_min: number | null;
  salary_max: number | null;
  benefits: string[];
  // Step 5: Process
  application_deadline: Date | null;
  expected_start_date: Date | null;
  urgency: JobUrgency;
  require_cover_letter: boolean;
  tags: string[];
  // Final
  status: JobStatus;
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  active: "Ativa",
  closed: "Encerrada",
  draft: "Rascunho",
  on_hold: "Em Análise",
};

export const JOB_STATUS_VARIANTS: Record<JobStatus, "success" | "neutral" | "warning" | "info"> = {
  active: "success",
  closed: "neutral",
  draft: "warning",
  on_hold: "info",
};

// Default description template for new jobs
export const DEFAULT_JOB_DESCRIPTION_TEMPLATE = `### Sobre a Empresa

[Descreva brevemente sua empresa, cultura e valores]

### Sobre a Vaga

[Descreva as responsabilidades e o dia-a-dia da posição]

### O que buscamos

[Liste as características desejadas no candidato ideal]

### O que oferecemos

[Destaque os benefícios e diferenciais da vaga]
`;

export const DEFAULT_JOB_FORM_DATA: JobFormData = {
  title: "",
  department_id: "",
  unit_id: "",
  work_model: "onsite",
  contract_type: "clt",
  seniority: "",
  openings_count: 1,
  position_id: "",
  description_tone: "",
  description_context: "",
  description: DEFAULT_JOB_DESCRIPTION_TEMPLATE,
  required_skills: [],
  desired_skills: [],
  experience_years: null,
  education_level: "",
  languages: [],
  requirements: "",
  salary_type: "not_disclosed",
  salary_min: null,
  salary_max: null,
  benefits: [],
  application_deadline: null,
  expected_start_date: null,
  urgency: "medium",
  require_cover_letter: false,
  tags: [],
  status: "draft",
};
