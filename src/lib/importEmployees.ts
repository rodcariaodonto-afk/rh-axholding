import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { SolidesRow, parseDateBR, parseCurrencyBR } from "./parseXLS";

// Mapping types
type GenderType = "male" | "female" | "non_binary" | "prefer_not_to_say";
type MaritalStatusType = "single" | "married" | "divorced" | "widowed" | "domestic_partnership" | "prefer_not_to_say";
type EthnicityType = "white" | "black" | "brown" | "asian" | "indigenous" | "not_declared";
type EducationLevelType = "elementary" | "high_school" | "technical" | "undergraduate" | "postgraduate" | "masters" | "doctorate" | "postdoc";
type ContractType = "clt" | "pj" | "internship" | "temporary" | "other";
type TerminationCauseType = "recebimento_proposta" | "baixo_desempenho" | "corte_custos" | "relocacao" | "insatisfacao" | "problemas_pessoais" | "reestruturacao" | "outros";
type TerminationDecisionType = "pediu_pra_sair" | "foi_demitido";

// Mappings
const genderMap: Record<string, GenderType> = {
  'Masculino': 'male',
  'Feminino': 'female',
  'Não Binário': 'non_binary',
  'Prefiro não informar': 'prefer_not_to_say',
};

const maritalStatusMap: Record<string, MaritalStatusType> = {
  'Solteiro': 'single',
  'Solteiro(a)': 'single',
  'Casado': 'married',
  'Casado(a)': 'married',
  'Divorciado': 'divorced',
  'Divorciado(a)': 'divorced',
  'Viúvo': 'widowed',
  'Viúvo(a)': 'widowed',
  'União Estável': 'domestic_partnership',
  'Prefiro não informar': 'prefer_not_to_say',
};

const ethnicityMap: Record<string, EthnicityType> = {
  'Branca': 'white',
  'Branco': 'white',
  'Preta': 'black',
  'Preto': 'black',
  'Parda': 'brown',
  'Pardo': 'brown',
  'Amarela': 'asian',
  'Amarelo': 'asian',
  'Indígena': 'indigenous',
  'Não declarado': 'not_declared',
  'Prefiro não informar': 'not_declared',
};

const educationMap: Record<string, EducationLevelType> = {
  'fundamental': 'elementary',
  'fundamental_incompleto': 'elementary',
  'fundamental_completo': 'elementary',
  'medio': 'high_school',
  'medio_incompleto': 'high_school',
  'medio_completo': 'high_school',
  'tecnico': 'technical',
  'tecnico_incompleto': 'technical',
  'tecnico_completo': 'technical',
  'superior_cursando': 'undergraduate',
  'superior_incompleto': 'undergraduate',
  'superior_completo': 'undergraduate',
  'pos_graduacao_cursando': 'postgraduate',
  'pos_graduacao_incompleto': 'postgraduate',
  'pos_graduacao_completo': 'postgraduate',
  'mestrado': 'masters',
  'mestrado_cursando': 'masters',
  'mestrado_completo': 'masters',
  'doutorado': 'doctorate',
  'doutorado_cursando': 'doctorate',
  'doutorado_completo': 'doctorate',
  'pos_doutorado': 'postdoc',
};

const contractTypeMap: Record<string, ContractType> = {
  'CLT': 'clt',
  'PJ': 'pj',
  'Estágio': 'internship',
  'Temporário': 'temporary',
  'Outros': 'other',
};

const terminationCauseMap: Record<string, TerminationCauseType> = {
  'Recebimento de proposta': 'recebimento_proposta',
  'Baixo desempenho': 'baixo_desempenho',
  'Corte de custos': 'corte_custos',
  'Reajuste na estrutura': 'reestruturacao',
  'Reestruturação': 'reestruturacao',
  'Relocação': 'relocacao',
  'Insatisfação': 'insatisfacao',
  'Problemas pessoais': 'problemas_pessoais',
  'Outros': 'outros',
};

// Automatic inference: cause → decision
const causeToDecisionMap: Record<TerminationCauseType, TerminationDecisionType | null> = {
  'recebimento_proposta': 'pediu_pra_sair',
  'insatisfacao': 'pediu_pra_sair',
  'relocacao': 'pediu_pra_sair',
  'problemas_pessoais': 'pediu_pra_sair',
  'baixo_desempenho': 'foi_demitido',
  'corte_custos': 'foi_demitido',
  'reestruturacao': 'foi_demitido',
  'outros': null,
};

export interface ImportResult {
  updated: number;
  created: number;
  skipped: number;
  errors: Array<{ name: string; email: string; reason: string }>;
  updatedItems: Array<{ name: string; email: string; fieldsUpdated: string[] }>;
  createdItems: Array<{ name: string; email: string }>;
}

export interface EmployeeMatch {
  id: string;
  email: string;
  fullName: string | null;
  rowData: SolidesRow;
  fieldsToUpdate: string[];
  isTermination: boolean;
}

export interface NotFoundEmployee {
  name: string;
  email: string;
  rowData: SolidesRow;
  isTermination: boolean;
}

export interface ImportPreview {
  matched: EmployeeMatch[];
  notFound: NotFoundEmployee[];
  noEmail: Array<{ name: string }>;
}

export async function previewImport(rows: SolidesRow[]): Promise<ImportPreview> {
  // Fetch all existing employees
  const { data: existingEmployees, error } = await supabase
    .from('employees')
    .select('id, email, full_name');

  if (error) {
    throw new Error('Erro ao buscar colaboradores: ' + error.message);
  }

  // Create email → employee map
  const emailToEmployee = new Map(
    existingEmployees?.map(e => [e.email.toLowerCase().trim(), e]) ?? []
  );

  const matched: EmployeeMatch[] = [];
  const notFound: NotFoundEmployee[] = [];
  const noEmail: Array<{ name: string }> = [];

  for (const row of rows) {
    const email = row['Email Empresarial']?.trim().toLowerCase();
    const name = row['Nome'] || 'Sem nome';

    if (!email) {
      noEmail.push({ name });
      continue;
    }

    const existingEmployee = emailToEmployee.get(email);

    if (existingEmployee) {
      const fieldsToUpdate = getFieldsToUpdate(row);
      const isTermination = !!row['Data de demissão'];

      matched.push({
        id: existingEmployee.id,
        email: existingEmployee.email,
        fullName: existingEmployee.full_name,
        rowData: row,
        fieldsToUpdate,
        isTermination,
      });
    } else {
      const isTermination = !!row['Data de demissão'];
      notFound.push({ name, email, rowData: row, isTermination });
    }
  }

  return { matched, notFound, noEmail };
}

function getFieldsToUpdate(row: SolidesRow): string[] {
  const fields: string[] = [];

  // Personal data
  if (row['Nome']) fields.push('Nome');
  if (row['Data de Nascimento']) fields.push('Data de Nascimento');
  if (row['Gênero']) fields.push('Gênero');
  if (row['Estado Civil']) fields.push('Estado Civil');
  if (row['Raça / Etnia']) fields.push('Etnia');
  if (row['Escolaridade']) fields.push('Escolaridade');
  if (row['Nacionalidade']) fields.push('Nacionalidade');
  if (row['Naturalidade']) fields.push('Naturalidade');

  // Contact data
  if (row['Email Pessoal']) fields.push('Email Pessoal');
  if (row['Celular']) fields.push('Celular');
  if (row['CEP'] || row['Logradouro'] || row['Cidade']) fields.push('Endereço');

  // Contract data
  if (row['Data de admissão']) fields.push('Data de Admissão');
  if (row['Salário']) fields.push('Salário');
  if (row['Tipo de contrato']) fields.push('Tipo de Contrato');

  // Termination
  if (row['Data de demissão']) fields.push('Desligamento');

  return fields;
}

export interface ImportOptions {
  updatePersonalData: boolean;
  updateContactData: boolean;
  updateContractData: boolean;
  processTerminations: boolean;
  createNewEmployees: boolean;
}

export async function executeImport(
  matches: EmployeeMatch[],
  notFoundEmployees: NotFoundEmployee[],
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    updated: 0,
    created: 0,
    skipped: 0,
    errors: [],
    updatedItems: [],
    createdItems: [],
  };

  for (const match of matches) {
    try {
      const fieldsUpdated: string[] = [];

      // Update personal data
      if (options.updatePersonalData) {
        const personalUpdate = buildPersonalDataUpdate(match.rowData);
        if (Object.keys(personalUpdate).length > 0) {
          const { error } = await supabase
            .from('employees')
            .update(personalUpdate)
            .eq('id', match.id);

          if (error) throw error;
          fieldsUpdated.push(...Object.keys(personalUpdate));
        }
      }

      // Update contact data
      if (options.updateContactData) {
        const contactUpdate = buildContactDataUpdate(match.id, match.rowData);
        if (Object.keys(contactUpdate).length > 1) { // More than just user_id
          // Check if contact exists
          const { data: existingContact } = await supabase
            .from('employees_contact')
            .select('user_id')
            .eq('user_id', match.id)
            .maybeSingle();

          if (existingContact) {
            // Update existing contact
            const { error } = await supabase
              .from('employees_contact')
              .update(contactUpdate)
              .eq('user_id', match.id);
            if (error) throw error;
          } else {
            // Insert new contact - need all required fields
            const { error } = await supabase
              .from('employees_contact')
              .insert([contactUpdate as {
                user_id: string;
                country: string;
                zip_code: string;
                state: string;
                city: string;
                street: string;
                number: string;
              }]);
            if (error) throw error;
          }
          fieldsUpdated.push('contact');
        }
      }

      // Update contract data
      if (options.updateContractData) {
        const contractUpdate = buildContractDataUpdate(match.id, match.rowData);
        if (contractUpdate) {
          // First, get existing active contract
          const { data: existingContracts } = await supabase
            .from('employees_contracts')
            .select('id')
            .eq('user_id', match.id)
            .eq('is_active', true)
            .limit(1);

          if (existingContracts && existingContracts.length > 0) {
            // Update existing contract
            const { error } = await supabase
              .from('employees_contracts')
              .update(contractUpdate)
              .eq('id', existingContracts[0].id);

            if (error) throw error;
          } else {
            // Create new contract - only if we have all required fields
            const hireDate = contractUpdate.hire_date as string;
            const baseSalary = (contractUpdate.base_salary as number) ?? 0;
            const contractType = (contractUpdate.contract_type as ContractType) ?? 'clt';

            if (hireDate) {
              const { error } = await supabase
                .from('employees_contracts')
                .insert([{
                  user_id: match.id,
                  is_active: true,
                  hire_date: hireDate,
                  base_salary: baseSalary,
                  contract_type: contractType,
                }]);

              if (error) throw error;
            }
          }
          fieldsUpdated.push('contract');
        }
      }

      // Process termination
      if (options.processTerminations && match.isTermination) {
        const terminationUpdate = buildTerminationUpdate(match.rowData);
        if (Object.keys(terminationUpdate).length > 0) {
          const { error } = await supabase
            .from('employees')
            .update(terminationUpdate)
            .eq('id', match.id);

          if (error) throw error;
          fieldsUpdated.push('termination');

          // Deactivate contract
          await supabase
            .from('employees_contracts')
            .update({ is_active: false })
            .eq('user_id', match.id);
        }
      }

      if (fieldsUpdated.length > 0) {
        result.updated++;
        result.updatedItems.push({
          name: match.fullName || match.email,
          email: match.email,
          fieldsUpdated,
        });
      } else {
        result.skipped++;
      }
    } catch (error) {
      result.errors.push({
        name: match.fullName || match.email,
        email: match.email,
        reason: (error as Error).message,
      });
    }
  }

  // Create new employees if option is enabled
  if (options.createNewEmployees) {
    for (const notFound of notFoundEmployees) {
      try {
        const newEmployeeId = await createNewEmployee(notFound.rowData, notFound.email, options);
        result.created++;
        result.createdItems.push({
          name: notFound.name,
          email: notFound.email,
        });
      } catch (error) {
        result.errors.push({
          name: notFound.name,
          email: notFound.email,
          reason: (error as Error).message,
        });
      }
    }
  }

  return result;
}

function buildPersonalDataUpdate(row: SolidesRow): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  if (row['Nome']) {
    update.full_name = row['Nome'].trim();
  }

  const birthDate = parseDateBR(row['Data de Nascimento']);
  if (birthDate) {
    update.birth_date = birthDate;
  }

  if (row['Gênero'] && genderMap[row['Gênero']]) {
    update.gender = genderMap[row['Gênero']];
  }

  if (row['Estado Civil'] && maritalStatusMap[row['Estado Civil']]) {
    update.marital_status = maritalStatusMap[row['Estado Civil']];
  }

  if (row['Raça / Etnia'] && ethnicityMap[row['Raça / Etnia']]) {
    update.ethnicity = ethnicityMap[row['Raça / Etnia']];
  }

  if (row['Escolaridade'] && educationMap[row['Escolaridade']]) {
    update.education_level = educationMap[row['Escolaridade']];
  }

  if (row['Nacionalidade']) {
    update.nationality = row['Nacionalidade'] === 'Brasileiro' ? 'BR' : row['Nacionalidade'];
  }

  if (row['Naturalidade']) {
    update.birthplace = row['Naturalidade'].trim();
  }

  return update;
}

function buildContactDataUpdate(userId: string, row: SolidesRow): Record<string, unknown> {
  const update: Record<string, unknown> = {
    user_id: userId,
    // Required fields with defaults
    country: 'BR',
    zip_code: row['CEP']?.trim() || '00000-000',
    state: row['Estado']?.trim() || 'SP',
    city: row['Cidade']?.trim() || 'São Paulo',
    street: row['Logradouro']?.trim() || 'A preencher',
    number: row['Número']?.trim() || '0',
  };

  if (row['Email Pessoal']) {
    update.personal_email = row['Email Pessoal'].trim();
  }

  if (row['Celular']) {
    update.mobile_phone = row['Celular'].trim();
  }

  if (row['Telefone de Emergência']) {
    update.emergency_contact_phone = row['Telefone de Emergência'].trim();
  }

  if (row['Complemento']) {
    update.complement = row['Complemento'].trim();
  }

  if (row['Bairro']) {
    update.neighborhood = row['Bairro'].trim();
  }

  return update;
}

function buildContractDataUpdate(userId: string, row: SolidesRow): Record<string, unknown> | null {
  const hireDate = parseDateBR(row['Data de admissão']);
  const salary = parseCurrencyBR(row['Salário']);

  if (!hireDate && !salary && !row['Tipo de contrato']) {
    return null;
  }

  const update: Record<string, unknown> = {};

  if (hireDate) {
    update.hire_date = hireDate;
  }

  if (salary !== null) {
    update.base_salary = salary;
  }

  if (row['Tipo de contrato'] && contractTypeMap[row['Tipo de contrato']]) {
    update.contract_type = contractTypeMap[row['Tipo de contrato']];
  }

  return Object.keys(update).length > 0 ? update : null;
}

function buildTerminationUpdate(row: SolidesRow): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  const terminationDate = parseDateBR(row['Data de demissão']);
  if (terminationDate) {
    update.termination_date = terminationDate;
    update.status = 'terminated';
  }

  const terminationCost = parseCurrencyBR(row['Valor da Rescisão']);
  if (terminationCost !== null) {
    update.termination_cost = terminationCost;
  }

  if (row['Motivo da demissão'] && terminationCauseMap[row['Motivo da demissão']]) {
    const cause = terminationCauseMap[row['Motivo da demissão']];
    update.termination_cause = cause;

    // Automatic inference
    const decision = causeToDecisionMap[cause];
    if (decision) {
      update.termination_decision = decision;
    }
  }

  return update;
}

async function createNewEmployee(row: SolidesRow, email: string, options: ImportOptions): Promise<string> {
  // Build personal data for insert
  const personalData = buildPersonalDataUpdate(row);
  const isTermination = !!row['Data de demissão'];
  
  // Generate a UUID for the new employee
  const newId = crypto.randomUUID();

  // Create the employee insert object
  const employeeInsert: TablesInsert<'employees'> = {
    id: newId,
    email: email,
    full_name: (personalData.full_name as string) || row['Nome'] || email,
    status: isTermination && options.processTerminations ? 'terminated' : 'active',
    employment_type: 'full_time',
  };

  // Add optional personal fields with proper typing
  if (personalData.birth_date) employeeInsert.birth_date = personalData.birth_date as string;
  if (personalData.gender) employeeInsert.gender = personalData.gender as TablesInsert<'employees'>['gender'];
  if (personalData.marital_status) employeeInsert.marital_status = personalData.marital_status as TablesInsert<'employees'>['marital_status'];
  if (personalData.ethnicity) employeeInsert.ethnicity = personalData.ethnicity as TablesInsert<'employees'>['ethnicity'];
  if (personalData.education_level) employeeInsert.education_level = personalData.education_level as TablesInsert<'employees'>['education_level'];
  if (personalData.nationality) employeeInsert.nationality = personalData.nationality as string;
  if (personalData.birthplace) employeeInsert.birthplace = personalData.birthplace as string;

  // Add termination data if applicable
  if (isTermination && options.processTerminations) {
    const terminationData = buildTerminationUpdate(row);
    if (terminationData.termination_date) employeeInsert.termination_date = terminationData.termination_date as string;
    if (terminationData.termination_cause) employeeInsert.termination_cause = terminationData.termination_cause as TablesInsert<'employees'>['termination_cause'];
    if (terminationData.termination_decision) employeeInsert.termination_decision = terminationData.termination_decision as TablesInsert<'employees'>['termination_decision'];
    if (terminationData.termination_cost) employeeInsert.termination_cost = terminationData.termination_cost as number;
  }

  const { error: employeeError } = await supabase
    .from('employees')
    .insert([employeeInsert]);

  if (employeeError) throw employeeError;

  // Insert contact data if enabled
  if (options.updateContactData) {
    const contactData = buildContactDataUpdate(newId, row);
    if (Object.keys(contactData).length > 1) {
      const { error: contactError } = await supabase
        .from('employees_contact')
        .insert([contactData as {
          user_id: string;
          country: string;
          zip_code: string;
          state: string;
          city: string;
          street: string;
          number: string;
        }]);

      if (contactError) {
        console.error('Error inserting contact:', contactError);
        // Don't throw - continue with other data
      }
    }
  }

  // Insert contract data if enabled
  if (options.updateContractData) {
    const contractData = buildContractDataUpdate(newId, row);
    if (contractData) {
      const hireDate = (contractData.hire_date as string) || parseDateBR(row['Data de admissão']) || new Date().toISOString().split('T')[0];
      const baseSalary = (contractData.base_salary as number) ?? 0;
      const contractType = (contractData.contract_type as ContractType) ?? 'clt';

      const { error: contractError } = await supabase
        .from('employees_contracts')
        .insert([{
          user_id: newId,
          is_active: !isTermination,
          hire_date: hireDate,
          base_salary: baseSalary,
          contract_type: contractType,
        }]);

      if (contractError) {
        console.error('Error inserting contract:', contractError);
        // Don't throw - continue
      }
    }
  }

  return newId;
}
