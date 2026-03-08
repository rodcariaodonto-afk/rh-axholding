# Plano: Reestruturação de Dados Sensíveis (Arquitetura Híbrida 4 Tabelas) — v2

## Objetivo

Reorganizar os dados sensíveis dos funcionários em 4 tabelas com níveis de acesso granulares, seguindo o princípio de minimização da LGPD (Art. 6, III) e melhorando a segurança do sistema.

---

## Diagnóstico do Estado Atual

### Problemas de segurança identificados

| # | Problema | Severidade | Tabela afetada |
|---|---------|-----------|----------------|
| 1 | Gestores veem dados demográficos (gênero, etnia, estado civil, nascimento) de subordinados via policy `managers_select_direct_reports` | **Alta** | `employees` |
| 2 | CPF, RG e dados bancários misturados com endereço/contato — mesma policy cobre tudo | **Alta** | `employees_contact` |
| 3 | Nenhum mascaramento de dados sensíveis (CPF, conta bancária exibidos integralmente) | **Média** | `employees_contact` |
| 4 | `FORCE ROW LEVEL SECURITY` pode não estar aplicado em todas as tabelas (table owner bypassa RLS) | **Média** | Todas |
| 5 | Sem criptografia em repouso para dados críticos (CPF, dados bancários) | **Baixa** (roadmap) | `employees_contact` |

---

## Arquitetura Proposta

```text
┌─────────────────────────────────────────────────────────────────────┐
│  employees (operacional)                                            │
│  Campos: id, email, full_name, status, employment_type,            │
│          department_id, manager_id, unit_id, base_position_id,     │
│          photo_url, termination_*, position_level_detail,          │
│          profiler_*, organization_id                                │
│  Acesso: Admin, People, Gestor (subordinados), Próprio             │
├─────────────────────────────────────────────────────────────────────┤
│  employees_demographics (NOVA — dados LGPD sensíveis)               │
│  Campos: user_id, gender, ethnicity, marital_status,               │
│          birth_date, number_of_children, nationality,              │
│          birthplace, education_level, education_course             │
│  Acesso: Admin, People, Próprio (gestor NÃO vê)                    │
├─────────────────────────────────────────────────────────────────────┤
│  employees_contact (endereço + contato — limpa)                     │
│  Campos: user_id, personal_email, mobile_phone, home_phone,        │
│          emergency_contact_*, country, zip_code, state, city,      │
│          neighborhood, street, number, complement                   │
│  Acesso: Admin, People, Próprio                                     │
├─────────────────────────────────────────────────────────────────────┤
│  employees_legal_docs (NOVA — documentos + financeiro)              │
│  Campos: user_id, cpf, rg, rg_issuer,                              │
│          bank_name, bank_agency, bank_account,                      │
│          bank_account_type, pix_key                                 │
│  Acesso: Admin, People (CRUD), Próprio (READ mascarado, UPDATE)     │
│  View mascarada: employees_legal_docs_masked (para o próprio)       │
├─────────────────────────────────────────────────────────────────────┤
│  employees_contracts (financeiro com histórico — sem alteração)      │
│  Campos: sem alteração                                              │
│  Acesso: Admin, People                                              │
└─────────────────────────────────────────────────────────────────────┘
```

> **Nota sobre nomenclatura:** Usar `employees_legal_docs` (não `employees_documents`) para evitar confusão com a tabela existente `employee_documents` que gerencia uploads de arquivos/PDFs.

---

## Mudanças no Banco de Dados

### 1. Criar tabela `employees_demographics`

```sql
CREATE TABLE public.employees_demographics (
  user_id UUID PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  gender gender_type,
  ethnicity ethnicity_type,
  marital_status marital_status_type,
  birth_date DATE,
  number_of_children INTEGER,
  nationality TEXT DEFAULT 'BR',
  birthplace TEXT,
  education_level education_level_type,
  education_course TEXT,
  modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para queries analíticas de diversidade
CREATE INDEX idx_demographics_gender ON employees_demographics(gender);
CREATE INDEX idx_demographics_ethnicity ON employees_demographics(ethnicity);
CREATE INDEX idx_demographics_birth_date ON employees_demographics(birth_date);

ALTER TABLE public.employees_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees_demographics FORCE ROW LEVEL SECURITY;

-- Trigger para set_modified_by e updated_at
CREATE TRIGGER set_demographics_modified_by
  BEFORE UPDATE ON public.employees_demographics
  FOR EACH ROW EXECUTE FUNCTION set_modified_by();

CREATE TRIGGER set_demographics_updated_at
  BEFORE UPDATE ON public.employees_demographics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: Admin, People, Próprio (gestor NÃO vê)
CREATE POLICY "demographics_select" ON public.employees_demographics
  FOR SELECT USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'people')
  );

CREATE POLICY "demographics_insert" ON public.employees_demographics
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'people')
  );

CREATE POLICY "demographics_update" ON public.employees_demographics
  FOR UPDATE USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'people')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'people')
  );

CREATE POLICY "demographics_delete" ON public.employees_demographics
  FOR DELETE USING (
    has_role(auth.uid(), 'admin')
  );
```

### 2. Criar tabela `employees_legal_docs`

```sql
CREATE TABLE public.employees_legal_docs (
  user_id UUID PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  cpf TEXT,
  rg TEXT,
  rg_issuer TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  bank_account_type TEXT,
  pix_key TEXT,
  modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.employees_legal_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees_legal_docs FORCE ROW LEVEL SECURITY;

-- Trigger para set_modified_by e updated_at
CREATE TRIGGER set_legal_docs_modified_by
  BEFORE UPDATE ON public.employees_legal_docs
  FOR EACH ROW EXECUTE FUNCTION set_modified_by();

CREATE TRIGGER set_legal_docs_updated_at
  BEFORE UPDATE ON public.employees_legal_docs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: Admin e People têm CRUD completo
CREATE POLICY "legal_docs_select_admin_people" ON public.employees_legal_docs
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'people')
  );

CREATE POLICY "legal_docs_modify_admin_people" ON public.employees_legal_docs
  FOR ALL USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'people')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'people')
  );

-- RLS: Próprio funcionário pode ATUALIZAR seus dados (ex: trocar banco/PIX)
CREATE POLICY "legal_docs_update_own" ON public.employees_legal_docs
  FOR UPDATE USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- View mascarada para o próprio funcionário ver seus dados (READ)
-- Usa security_invoker para respeitar RLS do caller
CREATE VIEW public.employees_legal_docs_masked
  WITH (security_invoker = true)
AS
SELECT
  user_id,
  CASE WHEN cpf IS NOT NULL
    THEN '***.***.***-' || RIGHT(cpf, 2)
    ELSE NULL
  END AS cpf,
  CASE WHEN rg IS NOT NULL
    THEN '******' || RIGHT(rg, 2)
    ELSE NULL
  END AS rg,
  rg_issuer,
  bank_name,
  CASE WHEN bank_agency IS NOT NULL
    THEN '****'
    ELSE NULL
  END AS bank_agency,
  CASE WHEN bank_account IS NOT NULL
    THEN '******' || RIGHT(bank_account, 4)
    ELSE NULL
  END AS bank_account,
  bank_account_type,
  CASE WHEN pix_key IS NOT NULL
    THEN '********'
    ELSE NULL
  END AS pix_key
FROM public.employees_legal_docs
WHERE user_id = auth.uid();
```

> **Mudança vs. plano original:** Adicionada policy `legal_docs_update_own` para que o próprio funcionário possa atualizar dados bancários (troca de banco, nova chave PIX). A view mascarada usa `security_invoker = true` (PostgreSQL 15+) e filtra por `auth.uid()` para defesa em profundidade.

### 3. Garantir FORCE RLS nas tabelas existentes

```sql
-- Verificar e aplicar FORCE RLS em todas as tabelas de employees
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees_contact FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees_contracts FORCE ROW LEVEL SECURITY;
```

### 4. View agregada para transição (facilita analytics)

```sql
-- View que reconstrói a "visão antiga" para facilitar migração gradual
-- Útil para useAnalyticsData e outros hooks durante a transição
CREATE VIEW public.employees_full AS
SELECT
  e.*,
  d.gender,
  d.ethnicity,
  d.marital_status,
  d.birth_date,
  d.number_of_children,
  d.nationality,
  d.birthplace,
  d.education_level,
  d.education_course
FROM public.employees e
LEFT JOIN public.employees_demographics d ON d.user_id = e.id;

-- A view herda o RLS do caller (security_invoker)
-- Admin/People verão todos; gestor verá apenas subordinados (sem demographics por RLS)
```

### 5. Migrar dados existentes

```sql
-- FASE 1: Copiar dados (sem remover originais ainda)

-- Mover dados demográficos de employees → employees_demographics
INSERT INTO employees_demographics (
  user_id, gender, ethnicity, marital_status, birth_date,
  number_of_children, nationality, birthplace,
  education_level, education_course
)
SELECT
  id, gender, ethnicity, marital_status, birth_date,
  number_of_children, nationality, birthplace,
  education_level, education_course
FROM employees
WHERE id IS NOT NULL;

-- Mover documentos/bancário de employees_contact → employees_legal_docs
INSERT INTO employees_legal_docs (
  user_id, cpf, rg, rg_issuer,
  bank_name, bank_agency, bank_account,
  bank_account_type, pix_key
)
SELECT
  user_id, cpf, rg, rg_issuer,
  bank_name, bank_agency, bank_account,
  bank_account_type, pix_key
FROM employees_contact
WHERE user_id IS NOT NULL;
```

### Queries de validação (pós-migração Fase 1)

```sql
-- Comparar contagens
SELECT 'employees' AS source, count(*) FROM employees WHERE gender IS NOT NULL
UNION ALL
SELECT 'demographics', count(*) FROM employees_demographics WHERE gender IS NOT NULL;

SELECT 'contact' AS source, count(*) FROM employees_contact WHERE cpf IS NOT NULL
UNION ALL
SELECT 'legal_docs', count(*) FROM employees_legal_docs WHERE cpf IS NOT NULL;

-- Verificar integridade (nenhum registro órfão)
SELECT user_id FROM employees_demographics
WHERE user_id NOT IN (SELECT id FROM employees);

SELECT user_id FROM employees_legal_docs
WHERE user_id NOT IN (SELECT id FROM employees);
```

### 6. Remover colunas antigas (FASE 3 — após validação completa do código)

```sql
-- SOMENTE executar após Fase 2 (código) estar 100% funcionando
-- e após período de validação em produção (mínimo 2 semanas)

-- Remover demográficos de employees
ALTER TABLE employees DROP COLUMN IF EXISTS gender;
ALTER TABLE employees DROP COLUMN IF EXISTS ethnicity;
ALTER TABLE employees DROP COLUMN IF EXISTS marital_status;
ALTER TABLE employees DROP COLUMN IF EXISTS birth_date;
ALTER TABLE employees DROP COLUMN IF EXISTS number_of_children;
ALTER TABLE employees DROP COLUMN IF EXISTS nationality;
ALTER TABLE employees DROP COLUMN IF EXISTS birthplace;
ALTER TABLE employees DROP COLUMN IF EXISTS education_level;
ALTER TABLE employees DROP COLUMN IF EXISTS education_course;

-- Remover docs/bancário de employees_contact
ALTER TABLE employees_contact DROP COLUMN IF EXISTS cpf;
ALTER TABLE employees_contact DROP COLUMN IF EXISTS rg;
ALTER TABLE employees_contact DROP COLUMN IF EXISTS rg_issuer;
ALTER TABLE employees_contact DROP COLUMN IF EXISTS bank_name;
ALTER TABLE employees_contact DROP COLUMN IF EXISTS bank_agency;
ALTER TABLE employees_contact DROP COLUMN IF EXISTS bank_account;
ALTER TABLE employees_contact DROP COLUMN IF EXISTS bank_account_type;
ALTER TABLE employees_contact DROP COLUMN IF EXISTS pix_key;

-- Dropar view de transição (não mais necessária)
DROP VIEW IF EXISTS public.employees_full;
```

---

## Mudanças no Código

### Arquivos a Modificar — Lista Completa

| Arquivo | Mudança | Prioridade |
|---------|---------|-----------|
| `src/hooks/useEmployeeDemographics.ts` | **CRIAR** — Hook para dados demográficos (query + upsert) | P0 |
| `src/hooks/useEmployeeLegalDocs.ts` | **CRIAR** — Hook para documentos/bancários (query + upsert) | P0 |
| `src/hooks/useEmployeeContact.ts` | **MODIFICAR** — Remover campos CPF/RG/bancários | P0 |
| `src/hooks/useEmployeeById.ts` | **MODIFICAR** — Remover campos demográficos da query principal; orquestrar com demographics | P0 |
| `src/hooks/useUpdateEmployee.ts` | **MODIFICAR** — Remover update de campos demográficos (migram para `useEmployeeDemographics`) | P0 |
| `src/hooks/useEmployees.ts` | **MODIFICAR** — Remover `birth_date` da query (não está mais em `employees`) | P0 |
| `src/hooks/useAnalyticsData.ts` | **MODIFICAR** — Fazer JOIN com `employees_demographics` ou usar view `employees_full` durante transição | P0 |
| `src/lib/employeeChangeTracking.ts` | **MODIFICAR** — Adaptar tracking de campos demográficos para nova tabela | P1 |
| `src/lib/importEmployees.ts` | **MODIFICAR** — Refatorar `buildPersonalDataUpdate()` para escrever em `employees_demographics`; criar `buildLegalDocsUpdate()` para escrever em `employees_legal_docs` | P1 |
| `src/components/PersonalInfoForm.tsx` | **MODIFICAR** — Separar em seções: dados pessoais (demographics), documentos (legal_docs), bancário (legal_docs) | P1 |
| `src/components/ContactInfoForm.tsx` | **MODIFICAR** — Remover seções de CPF/RG/bancário | P1 |
| `src/components/EmployeeDialog.tsx` | **MODIFICAR** — Ajustar validação e submissão para usar novos hooks | P1 |
| `src/components/EmployeeDashboard.tsx` | **MODIFICAR** — Buscar `birth_date` de demographics para aniversários | P1 |
| `src/components/analytics/DiversityTab.tsx` | **MODIFICAR** — Verificar que consome dados do analytics hook atualizado | P2 |
| `src/pages/EmployeeProfile.tsx` | **MODIFICAR** — Orquestrar 4+ hooks (employee, demographics, contact, legal_docs, contract) | P1 |
| `src/pages/ImportEmployees.tsx` | **VERIFICAR** — Pode precisar de ajuste na preview se mostrar campos migrados | P2 |
| Tipos Supabase (`src/integrations/`) | **REGENERAR** — `supabase gen types typescript` para incluir novas tabelas | P0 |

### Novos Hooks

**`useEmployeeDemographics.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeDemographics {
  user_id: string;
  gender: string | null;
  ethnicity: string | null;
  marital_status: string | null;
  birth_date: string | null;
  number_of_children: number | null;
  nationality: string | null;
  birthplace: string | null;
  education_level: string | null;
  education_course: string | null;
}

export const useEmployeeDemographics = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["employee_demographics", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees_demographics")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as EmployeeDemographics | null;
    },
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<EmployeeDemographics>) => {
      const { error } = await supabase
        .from("employees_demographics")
        .upsert({ user_id: userId!, ...updates }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_demographics", userId] });
      queryClient.invalidateQueries({ queryKey: ["employee", userId] });
    },
  });

  return {
    demographics: query.data,
    isLoading: query.isLoading,
    updateDemographics: mutation,
  };
};
```

**`useEmployeeLegalDocs.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

interface EmployeeLegalDocs {
  user_id: string;
  cpf: string | null;
  rg: string | null;
  rg_issuer: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  bank_account_type: string | null;
  pix_key: string | null;
}

export const useEmployeeLegalDocs = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const { isAdmin, isPeople } = useUserRole();

  // Admin/People veem dados completos; próprio vê mascarado
  const tableName = (isAdmin() || isPeople())
    ? "employees_legal_docs"
    : "employees_legal_docs_masked";

  const query = useQuery({
    queryKey: ["employee_legal_docs", userId, tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as EmployeeLegalDocs | null;
    },
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<EmployeeLegalDocs>) => {
      // Sempre escreve na tabela real (RLS controla permissão)
      const { error } = await supabase
        .from("employees_legal_docs")
        .upsert({ user_id: userId!, ...updates }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_legal_docs", userId] });
    },
  });

  return {
    legalDocs: query.data,
    isLoading: query.isLoading,
    updateLegalDocs: mutation,
  };
};
```

### Ajuste no Analytics (opção com view de transição)

```typescript
// Em useAnalyticsData.ts — durante transição (Fase 2), trocar source:

// DE:
const { data: employees } = await supabase.from("employees").select("...");

// PARA:
const { data: employees } = await supabase.from("employees_full").select("...");

// Após remover colunas antigas (Fase 3), migrar para JOIN explícito:
const { data: employees } = await supabase
  .from("employees")
  .select(`
    *,
    employees_demographics(gender, ethnicity, birth_date, education_level)
  `);
```

### Ajuste na UI — PersonalInfoForm

O `PersonalInfoForm` será dividido em 3 seções visuais, cada uma salvando na tabela correta:

1. **Dados Pessoais** (demographics) — gênero, etnia, estado civil, nascimento, filhos, escolaridade
2. **Documentos** (legal_docs) — CPF, RG
3. **Dados Bancários** (legal_docs) — banco, agência, conta, PIX

Cada seção usa seu próprio hook e submete independentemente. Erros em uma seção não bloqueiam as outras.

---

## Segurança: Resumo de Acesso

| Tabela | Admin | People | Gestor | Próprio |
|--------|-------|--------|--------|---------|
| `employees` | CRUD | CRUD | READ (subordinados) | READ/UPDATE |
| `employees_demographics` | CRUD | CRUD | **Sem acesso** | READ/UPDATE |
| `employees_contact` | CRUD | CRUD | **Sem acesso** | READ/UPDATE |
| `employees_legal_docs` | CRUD | CRUD | **Sem acesso** | **UPDATE** + READ (mascarado via view) |
| `employees_contracts` | CRUD | CRUD | **Sem acesso** | **Sem acesso** |

### Detalhes de segurança adicionais

- **FORCE RLS** aplicado em todas as 5 tabelas (previne bypass por table owner)
- **View mascarada** usa `security_invoker = true` + filtro `WHERE user_id = auth.uid()` (defesa em profundidade)
- **Audit trail** via `modified_by` + trigger `set_modified_by` nas 2 tabelas novas
- **Multi-tenancy** herdada via EXISTS subquery no `employees.organization_id` (mesmo padrão das tabelas existentes)
- **Próprio funcionário pode atualizar `legal_docs`** (ex: trocar banco/PIX) — a policy `legal_docs_update_own` permite UPDATE, mas o SELECT retorna dados mascarados

---

## Ordem de Execução

### Fase 1 — Database (sem breaking changes)

1. Criar tabelas `employees_demographics` e `employees_legal_docs` com RLS + FORCE
2. Criar triggers (`set_modified_by`, `update_updated_at`)
3. Criar índices para analytics
4. Criar view `employees_legal_docs_masked`
5. Criar view `employees_full` (transição)
6. Migrar dados (`INSERT INTO ... SELECT`)
7. Aplicar `FORCE ROW LEVEL SECURITY` nas tabelas existentes
8. **Validar**: contar registros, comparar dados migrados vs. originais

### Fase 2 — Código

1. Regenerar tipos Supabase (`supabase gen types typescript`)
2. Criar hooks novos (`useEmployeeDemographics`, `useEmployeeLegalDocs`)
3. Modificar `useEmployeeById` — remover campos demográficos
4. Modificar `useUpdateEmployee` — remover update de campos demográficos
5. Modificar `useEmployeeContact` — remover campos docs/bancário
6. Modificar `useEmployees` — remover `birth_date`
7. Modificar `useAnalyticsData` — usar `employees_full` view ou JOIN com demographics
8. Modificar `EmployeeDashboard` — buscar `birth_date` via demographics
9. Modificar `PersonalInfoForm` — separar seções, usar novos hooks
10. Modificar `ContactInfoForm` — remover seções docs/bancário
11. Modificar `EmployeeDialog` — ajustar validação e submissão
12. Modificar `EmployeeProfile` — orquestrar hooks
13. Modificar `employeeChangeTracking` — adaptar tracking
14. Modificar `importEmployees` — refatorar para 4 tabelas
15. **Testar**: todos os fluxos listados em "Testes"

### Fase 3 — Cleanup (após validação em produção, mínimo 2 semanas)

1. Remover colunas antigas de `employees` e `employees_contact`
2. Dropar view `employees_full` (transição)
3. Migrar analytics de `employees_full` para JOIN direto
4. Atualizar documentação

---

## Rollback

Se necessário reverter:

1. **Fase 1**: Colunas antigas permanecem intactas — basta dropar tabelas novas e views
2. **Fase 2**: Código antigo pode ser restaurado via git revert; dados ainda estão nas colunas originais
3. **Fase 3**: Ponto sem retorno simples — após remover colunas, reverter requer restaurar de backup. Por isso, manter colunas originais por pelo menos 2 semanas após Fase 2 em produção
4. **Opcional**: Criar triggers de sync bidirecional durante Fase 2 para manter colunas originais atualizadas:

```sql
-- Exemplo: sync demographics → employees (temporário durante transição)
CREATE OR REPLACE FUNCTION sync_demographics_to_employees()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE employees SET
    gender = NEW.gender,
    birth_date = NEW.birth_date,
    ethnicity = NEW.ethnicity,
    marital_status = NEW.marital_status,
    number_of_children = NEW.number_of_children,
    nationality = NEW.nationality,
    birthplace = NEW.birthplace,
    education_level = NEW.education_level,
    education_course = NEW.education_course
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_demographics_trigger
  AFTER INSERT OR UPDATE ON employees_demographics
  FOR EACH ROW EXECUTE FUNCTION sync_demographics_to_employees();
```

---

## Testes

### Testes manuais obrigatórios

1. **Perfil do funcionário** — abrir perfil → verificar que dados carregam de 4 tabelas
2. **Editar dados pessoais** → salvar → verificar em `employees_demographics`
3. **Editar CPF/RG** → salvar → verificar em `employees_legal_docs`
4. **Editar dados bancários (como próprio)** → salvar → verificar que UPDATE funciona
5. **Ver dados bancários (como próprio)** → verificar que CPF/conta aparecem mascarados
6. **Logar como gestor** → verificar que NÃO vê dados demográficos nem documentos de subordinados
7. **Logar como funcionário comum** → verificar que vê seus próprios dados
8. **Importar CSV** → verificar que popula `employees`, `employees_demographics`, `employees_contact`, `employees_contracts`
9. **Analytics de diversidade** → verificar que gráficos de gênero, etnia, idade, escolaridade funcionam
10. **Dashboard aniversários** → verificar que aniversariantes do mês aparecem corretamente
11. **Histórico de mudanças** → editar campo demográfico → verificar que aparece no changelog
12. **Multi-tenancy** → verificar que org A não vê demographics da org B

---

## Impacto

| Aspecto | Detalhe |
|---------|---------|
| **UI** | Nenhuma mudança visível (mesmos formulários, nova organização interna) |
| **Estado** | 4-5 hooks em vez de 2 na página de perfil |
| **DB** | +2 tabelas, +1 view mascarada, +1 view transição, -15 colunas (Fase 3) |
| **Segurança** | Gestor não vê mais dados sensíveis; mascaramento de CPF/banco; FORCE RLS |
| **LGPD** | Minimização de dados por tabela; acesso granular por finalidade |
| **Analytics** | Usa view de transição (Fase 2) → JOIN direto (Fase 3) |
| **Performance** | JOINs adicionais no perfil, mas dados demográficos/legal_docs são 1:1 (PK) — impacto negligível |

---

## Roadmap Futuro (pós-migração)

| Item | Descrição | Prioridade |
|------|-----------|-----------|
| Criptografia em repouso | Criptografar CPF e dados bancários com `pgcrypto` | P2 |
| Audit log granular | Log de acesso (quem visualizou dados sensíveis, não só quem editou) | P2 |
| Consentimento LGPD | Registrar consentimento do funcionário para cada categoria de dado | P3 |
| Data retention | Política de retenção automática para dados de funcionários desligados | P3 |
| CORS restriction | Resolver SEC-004 (wildcard CORS nas edge functions) | P1 |

---

## Documentação a Atualizar

- [ ] `docs/architecture.md` — Nova estrutura de tabelas com diagrama
- [ ] `docs/schema_design_v2.md` — Diagrama atualizado com 5 tabelas
- [ ] `docs/SECURITY_BACKLOG.md` — Marcar itens resolvidos, adicionar novos
- [ ] `docs/codebase_guide.md` — Novos hooks e fluxo de dados
- [ ] `docs/permissions.md` — Atualizar matriz de acesso por tabela
