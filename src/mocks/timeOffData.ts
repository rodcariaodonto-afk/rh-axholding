export interface MockTimeOffRequest {
  id: string;
  employee_id: string;
  policy_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: "pending_people" | "approved" | "rejected" | "cancelled";
  notes: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface MockTimeOffPolicy {
  id: string;
  name: string;
}

export interface MockTimeOffEmployee {
  id: string;
  full_name: string;
  email: string;
}

const today = new Date();
const formatDate = (daysOffset: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split("T")[0];
};

export const mockTimeOffPolicies: MockTimeOffPolicy[] = [
  { id: "policy-1", name: "Férias" },
  { id: "policy-2", name: "Licença Médica" },
  { id: "policy-3", name: "Licença Maternidade" },
  { id: "policy-4", name: "Folga Compensatória" },
];

export const mockTimeOffEmployees: MockTimeOffEmployee[] = [
  { id: "demo-emp-1", full_name: "Ana Silva", email: "ana.silva@demo.com" },
  { id: "demo-emp-2", full_name: "Carlos Santos", email: "carlos.santos@demo.com" },
  { id: "demo-emp-3", full_name: "Mariana Costa", email: "mariana.costa@demo.com" },
  { id: "demo-emp-4", full_name: "Pedro Oliveira", email: "pedro.oliveira@demo.com" },
  { id: "demo-emp-5", full_name: "Lucas Ferreira", email: "lucas.ferreira@demo.com" },
  { id: "demo-emp-6", full_name: "Julia Mendes", email: "julia.mendes@demo.com" },
];

export const mockTimeOffRequests: MockTimeOffRequest[] = [
  {
    id: "demo-to-1",
    employee_id: "demo-emp-1",
    policy_id: "policy-1",
    start_date: formatDate(-3),
    end_date: formatDate(7),
    total_days: 10,
    status: "approved",
    notes: "Férias de verão em família",
    review_notes: "Aprovado conforme planejamento do time",
    reviewed_by: "demo-emp-6",
    reviewed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-to-8",
    employee_id: "demo-emp-5",
    policy_id: "policy-1",
    start_date: formatDate(-2),
    end_date: formatDate(12),
    total_days: 14,
    status: "approved",
    notes: "Viagem internacional",
    review_notes: "Aprovado",
    reviewed_by: "demo-emp-6",
    reviewed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-to-2",
    employee_id: "demo-emp-2",
    policy_id: "policy-1",
    start_date: formatDate(15),
    end_date: formatDate(25),
    total_days: 10,
    status: "pending_people",
    notes: "Viagem programada",
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-to-3",
    employee_id: "demo-emp-3",
    policy_id: "policy-4",
    start_date: formatDate(5),
    end_date: formatDate(6),
    total_days: 2,
    status: "pending_people",
    notes: "Compensação de horas extras",
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-to-4",
    employee_id: "demo-emp-4",
    policy_id: "policy-1",
    start_date: formatDate(30),
    end_date: formatDate(50),
    total_days: 20,
    status: "approved",
    notes: "Férias anuais",
    review_notes: "Aprovado",
    reviewed_by: "demo-emp-6",
    reviewed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-to-5",
    employee_id: "demo-emp-5",
    policy_id: "policy-2",
    start_date: formatDate(-10),
    end_date: formatDate(-5),
    total_days: 5,
    status: "approved",
    notes: "Licença para procedimento médico",
    review_notes: "Aprovado mediante apresentação de atestado",
    reviewed_by: "demo-emp-6",
    reviewed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-to-6",
    employee_id: "demo-emp-2",
    policy_id: "policy-1",
    start_date: formatDate(-60),
    end_date: formatDate(-50),
    total_days: 10,
    status: "rejected",
    notes: "Férias em dezembro",
    review_notes: "Período de alta demanda, reagendar para janeiro",
    reviewed_by: "demo-emp-6",
    reviewed_at: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-to-7",
    employee_id: "demo-emp-3",
    policy_id: "policy-1",
    start_date: formatDate(60),
    end_date: formatDate(75),
    total_days: 15,
    status: "pending_people",
    notes: "Férias planejadas para o segundo semestre",
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockTimeOffStats = {
  onVacation: 1,
  pending: 3,
  approved: 3,
  rejected: 1,
};
