import { supabase } from "@/integrations/supabase/client";

// Mapeamento de campos para labels em português
export const FIELD_LABELS: Record<string, string> = {
  full_name: "Nome Completo",
  birth_date: "Data de Nascimento",
  gender: "Gênero",
  nationality: "Nacionalidade",
  birthplace: "Naturalidade",
  ethnicity: "Etnia",
  marital_status: "Estado Civil",
  education_level: "Escolaridade",
  education_course: "Curso",
  department_id: "Departamento",
  base_position_id: "Cargo",
  position_level_detail: "Nível",
  unit_id: "Unidade",
  manager_id: "Gestor",
  status: "Status",
  employment_type: "Tipo de Contrato",
  termination_date: "Data de Desligamento",
  termination_reason: "Motivo do Desligamento",
  termination_decision: "Decisão do Desligamento",
  termination_cause: "Causa do Desligamento",
  termination_cost: "Custo do Desligamento",
  photo_url: "Foto",
};

// Mapeamento de valores de enum para português
const ENUM_LABELS: Record<string, Record<string, string>> = {
  gender: {
    male: "Masculino",
    female: "Feminino",
    non_binary: "Não-binário",
    prefer_not_to_say: "Prefiro não informar",
  },
  ethnicity: {
    white: "Branca",
    black: "Preta",
    brown: "Parda",
    asian: "Amarela",
    indigenous: "Indígena",
    not_declared: "Não declarado",
  },
  marital_status: {
    single: "Solteiro(a)",
    married: "Casado(a)",
    divorced: "Divorciado(a)",
    widowed: "Viúvo(a)",
    domestic_partnership: "União Estável",
    prefer_not_to_say: "Prefiro não informar",
  },
  education_level: {
    elementary: "Ensino Fundamental",
    high_school: "Ensino Médio",
    technical: "Técnico",
    undergraduate: "Graduação",
    postgraduate: "Pós-Graduação",
    masters: "Mestrado",
    doctorate: "Doutorado",
    postdoc: "Pós-Doutorado",
  },
  status: {
    active: "Ativo",
    on_leave: "Afastado",
    terminated: "Desligado",
  },
  employment_type: {
    full_time: "CLT",
    part_time: "Meio período",
    contractor: "PJ",
    intern: "Estagiário",
  },
  position_level_detail: {
    junior_i: "Júnior I",
    junior_ii: "Júnior II",
    junior_iii: "Júnior III",
    pleno_i: "Pleno I",
    pleno_ii: "Pleno II",
    pleno_iii: "Pleno III",
    senior_i: "Sênior I",
    senior_ii: "Sênior II",
    senior_iii: "Sênior III",
  },
  termination_reason: {
    pedido_demissao: "Pedido de Demissão",
    sem_justa_causa: "Sem Justa Causa",
    justa_causa: "Justa Causa",
    antecipada_termo_empregador: "Antecipada pelo Empregador",
    fim_contrato: "Fim de Contrato",
    acordo_mutuo: "Acordo Mútuo",
    outros: "Outros",
  },
  termination_decision: {
    pediu_pra_sair: "Pediu para sair",
    foi_demitido: "Foi demitido",
  },
  termination_cause: {
    recebimento_proposta: "Recebimento de proposta",
    baixo_desempenho: "Baixo desempenho",
    corte_custos: "Corte de custos",
    relocacao: "Relocação",
    insatisfacao: "Insatisfação",
    problemas_pessoais: "Problemas pessoais",
    outros: "Outros",
  },
};

export interface FieldChange {
  field: string;
  label: string;
  oldValue: string | null;
  newValue: string | null;
}

export function formatFieldValue(fieldName: string, value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const strValue = String(value);

  // Verifica se é um campo de enum
  if (ENUM_LABELS[fieldName] && ENUM_LABELS[fieldName][strValue]) {
    return ENUM_LABELS[fieldName][strValue];
  }

  // Formata datas
  if (fieldName.includes("date") && strValue.match(/^\d{4}-\d{2}-\d{2}/)) {
    const date = new Date(strValue);
    return date.toLocaleDateString("pt-BR");
  }

  // Formata valores monetários
  if (fieldName.includes("cost") || fieldName.includes("salary")) {
    const num = parseFloat(strValue);
    if (!isNaN(num)) {
      return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    }
  }

  return strValue;
}

export function detectChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): FieldChange[] {
  const changes: FieldChange[] = [];
  const trackedFields = Object.keys(FIELD_LABELS);

  for (const field of trackedFields) {
    const oldValue = oldData[field];
    const newValue = newData[field];

    // Normalizar valores para comparação
    const normalizedOld = oldValue === undefined || oldValue === "" ? null : oldValue;
    const normalizedNew = newValue === undefined || newValue === "" ? null : newValue;

    // Verificar se houve alteração
    if (String(normalizedOld) !== String(normalizedNew)) {
      changes.push({
        field,
        label: FIELD_LABELS[field],
        oldValue: formatFieldValue(field, normalizedOld),
        newValue: formatFieldValue(field, normalizedNew),
      });
    }
  }

  return changes;
}

export async function recordEmployeeChanges(
  employeeId: string,
  changedBy: string,
  changes: FieldChange[]
): Promise<void> {
  if (changes.length === 0) return;

  const records = changes.map((change) => ({
    employee_id: employeeId,
    changed_by: changedBy,
    field_name: change.field,
    field_label: change.label,
    old_value: change.oldValue,
    new_value: change.newValue,
  }));

  const { error } = await supabase.from("employee_changes").insert(records);

  if (error) {
    console.error("Erro ao registrar alterações:", error);
    // Não lançar erro para não interromper o fluxo principal
  }
}
