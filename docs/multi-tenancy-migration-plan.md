# Plano de Migração Multi-Tenancy

## 1. Visão Geral

Este documento descreve a estratégia **híbrida** para implementar isolamento completo de dados entre organizações (multi-tenancy) no Orb RH.

### Estratégia Híbrida

- **Tabelas Raiz**: Possuem `organization_id` direto para performance e simplicidade de RLS
- **Tabelas Filhas**: Herdam contexto de organização via FK usando RLS com `EXISTS`

---

## 2. Estado Atual

### 2.1 O que já existe

| Componente | Status | Descrição |
|------------|--------|-----------|
| `organizations` | ✅ OK | Tabela com dados da empresa |
| `organization_members` | ✅ OK | Vincula usuários a organizações |
| `get_user_organization()` | ✅ OK | Função para obter org do usuário |
| `user_belongs_to_org()` | ✅ OK | Verifica pertencimento |
| `has_org_role()` | ✅ OK | Verifica role dentro da org |
| `useRequireOrganization` | ✅ OK | Hook frontend para contexto |
| Onboarding Flow | ✅ OK | Criação de org no signup |

### 2.2 Classificação das Tabelas

#### Tabelas Raiz (precisam de `organization_id` direto)

| Tabela | Status | Motivo |
|--------|--------|--------|
| `employees` | ✅ OK | Entidade principal, consultada diretamente |
| `departments` | ✅ OK | Entidade principal |
| `positions` | ✅ OK | Entidade principal |
| `jobs` | ✅ OK | Entidade principal |
| `units` | ✅ OK | Entidade principal |
| `devices` | ✅ OK | Consultada diretamente no frontend |
| `time_off_policies` | ✅ OK | Configuração por organização |
| `company_culture` | ✅ OK | Configuração por organização |
| `company_cost_settings` | ✅ OK | Configuração por organização |
| `job_descriptions` | ✅ OK | Consultada diretamente |

#### Tabelas Filhas (herdam via FK - NÃO precisam de `organization_id`)

| Tabela | Herda via | Cadeia de FK |
|--------|-----------|--------------|
| `job_applications` | `job_id` | → jobs.organization_id |
| `employees_contact` | `user_id` | → employees.organization_id |
| `employees_contracts` | `user_id` | → employees.organization_id |
| `pdis` | `employee_id` | → employees.organization_id |
| `pdi_goals` | `pdi_id` | → pdis → employees.organization_id |
| `pdi_comments` | `pdi_id` | → pdis → employees.organization_id |
| `pdi_logs` | `pdi_id` | → pdis → employees.organization_id |
| `pdi_attachments` | `pdi_id` | → pdis → employees.organization_id |
| `time_off_balances` | `employee_id` | → employees.organization_id |
| `time_off_requests` | `employee_id` | → employees.organization_id |
| `feedbacks` | `sender_id` | → employees.organization_id |
| `profiler_history` | `employee_id` | → employees.organization_id |

---

## 3. Plano de Migração

### Fase 1: Schema Changes (Tabelas Raiz)

#### 3.1.1 Adicionar `organization_id` às tabelas raiz

```sql
-- 1. employees
ALTER TABLE public.employees 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_employees_organization ON public.employees(organization_id);

-- 2. departments
ALTER TABLE public.departments 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_departments_organization ON public.departments(organization_id);

-- 3. positions
ALTER TABLE public.positions 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_positions_organization ON public.positions(organization_id);

-- 4. jobs
ALTER TABLE public.jobs 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_jobs_organization ON public.jobs(organization_id);

-- 5. units
ALTER TABLE public.units 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_units_organization ON public.units(organization_id);

-- 6. devices
ALTER TABLE public.devices 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_devices_organization ON public.devices(organization_id);

-- 7. time_off_policies
ALTER TABLE public.time_off_policies 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_time_off_policies_organization ON public.time_off_policies(organization_id);

-- 8. company_culture
ALTER TABLE public.company_culture 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_company_culture_organization ON public.company_culture(organization_id);

-- 9. company_cost_settings
ALTER TABLE public.company_cost_settings 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_company_cost_settings_organization ON public.company_cost_settings(organization_id);

-- 10. job_descriptions
ALTER TABLE public.job_descriptions 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
CREATE INDEX idx_job_descriptions_organization ON public.job_descriptions(organization_id);
```

### Fase 2: Atualizar Triggers e Funções

#### 3.2.1 Novo `handle_new_user()` (Multi-Tenant)

**Comportamento Anterior:**
- Criava `employee` automaticamente
- Validava domínio hardcoded

**Novo Comportamento:**
- Apenas cria `user_roles`
- NÃO cria employee (será feito no onboarding/convite)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Verificar se é o primeiro usuário do sistema
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) INTO is_first_user;

  -- NÃO criar employee aqui - será criado no onboarding/convite
  -- Apenas atribuir role global
  IF is_first_user THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;
```

#### 3.2.2 Nova função `create_employee_for_org()`

```sql
CREATE OR REPLACE FUNCTION public.create_employee_for_org(
  _user_id UUID,
  _org_id UUID,
  _email TEXT,
  _full_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _employee_id UUID;
BEGIN
  -- Verificar se employee já existe para este user/org
  SELECT id INTO _employee_id 
  FROM public.employees 
  WHERE id = _user_id AND organization_id = _org_id;
  
  IF _employee_id IS NOT NULL THEN
    RETURN _employee_id;
  END IF;

  -- Criar employee
  INSERT INTO public.employees (
    id, 
    email, 
    full_name, 
    organization_id,
    status, 
    employment_type
  ) VALUES (
    _user_id,
    _email,
    COALESCE(_full_name, split_part(_email, '@', 1)),
    _org_id,
    'active',
    'full_time'
  )
  RETURNING id INTO _employee_id;

  RETURN _employee_id;
END;
$$;
```

#### 3.2.3 Função helper `is_same_org()`

```sql
CREATE OR REPLACE FUNCTION public.is_same_org(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _org_id = get_user_organization(auth.uid())
$$;
```

### Fase 3: RLS Policies - Tabelas Raiz ✅ COMPLETA

### Fase 4: RLS Policies - Tabelas Filhas (Pattern EXISTS) ✅ COMPLETA

> **Executada em:** 2026-02-01
> **Status:** Todas as 12 tabelas filhas agora usam `EXISTS` para isolamento multi-tenant
> 
> **Tabelas atualizadas:**
> - `employees_contact` - herda via user_id → employees
> - `employees_contracts` - herda via user_id → employees
> - `feedbacks` - herda via sender_id → employees
> - `profiler_history` - herda via employee_id → employees
> - `time_off_balances` - herda via employee_id → employees
> - `time_off_requests` - herda via employee_id → employees
> - `job_applications` - herda via job_id → jobs (INSERT público mantido)
> - `pdis` - herda via employee_id → employees
> - `pdi_goals` - herda via pdi_id → pdis → employees
> - `pdi_comments` - herda via pdi_id → pdis → employees
> - `pdi_logs` - herda via pdi_id → pdis → employees
> - `pdi_attachments` - herda via pdi_id → pdis → employees

---

### Fase 3 (Referência): RLS Policies - Tabelas Raiz

#### 3.3.1 Pattern para Tabelas Raiz

```sql
-- Exemplo: employees
DROP POLICY IF EXISTS "employees_select_own" ON public.employees;
DROP POLICY IF EXISTS "employees_select_admin_people" ON public.employees;
-- ... (drop outras policies existentes)

-- SELECT: Ver próprio perfil
CREATE POLICY "employees_select_own" ON public.employees
FOR SELECT USING (auth.uid() = id);

-- SELECT: Ver colegas da mesma org (admin/people)
CREATE POLICY "employees_select_same_org" ON public.employees
FOR SELECT USING (
  is_same_org(organization_id) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
);

-- SELECT: Manager vê subordinados diretos
CREATE POLICY "employees_select_direct_reports" ON public.employees
FOR SELECT USING (
  manager_id = auth.uid() AND
  is_same_org(organization_id)
);

-- INSERT: Admin/People da mesma org
CREATE POLICY "employees_insert_same_org" ON public.employees
FOR INSERT WITH CHECK (
  is_same_org(organization_id) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
);

-- UPDATE: Próprio perfil
CREATE POLICY "employees_update_own" ON public.employees
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- UPDATE: Admin/People da mesma org
CREATE POLICY "employees_update_same_org" ON public.employees
FOR UPDATE USING (
  is_same_org(organization_id) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people'))
);

-- DELETE: Apenas admin da mesma org
CREATE POLICY "employees_delete_same_org" ON public.employees
FOR DELETE USING (
  is_same_org(organization_id) AND
  has_role(auth.uid(), 'admin')
);
```

### Fase 4: RLS Policies - Tabelas Filhas (Pattern EXISTS)

#### 3.4.1 Pattern para Tabelas que Herdam de `employees`

```sql
-- employees_contact: herda via user_id → employees
CREATE POLICY "tenant_isolation" ON public.employees_contact
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employees_contact.user_id
    AND e.organization_id = get_user_organization(auth.uid())
  )
);

-- employees_contracts: herda via user_id → employees
CREATE POLICY "tenant_isolation" ON public.employees_contracts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employees_contracts.user_id
    AND e.organization_id = get_user_organization(auth.uid())
  )
);

-- feedbacks: herda via sender_id → employees
CREATE POLICY "tenant_isolation" ON public.feedbacks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = feedbacks.sender_id
    AND e.organization_id = get_user_organization(auth.uid())
  )
);

-- profiler_history: herda via employee_id → employees
CREATE POLICY "tenant_isolation" ON public.profiler_history
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = profiler_history.employee_id
    AND e.organization_id = get_user_organization(auth.uid())
  )
);

-- time_off_balances: herda via employee_id → employees
CREATE POLICY "tenant_isolation" ON public.time_off_balances
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = time_off_balances.employee_id
    AND e.organization_id = get_user_organization(auth.uid())
  )
);

-- time_off_requests: herda via employee_id → employees
CREATE POLICY "tenant_isolation" ON public.time_off_requests
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = time_off_requests.employee_id
    AND e.organization_id = get_user_organization(auth.uid())
  )
);
```

#### 3.4.2 Pattern para Tabelas que Herdam de `jobs`

```sql
-- job_applications: herda via job_id → jobs
CREATE POLICY "tenant_isolation" ON public.job_applications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = job_applications.job_id
    AND j.organization_id = get_user_organization(auth.uid())
  )
);
```

#### 3.4.3 Pattern para Tabelas que Herdam via Cadeia (2+ níveis)

```sql
-- pdis: herda via employee_id → employees
CREATE POLICY "tenant_isolation" ON public.pdis
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = pdis.employee_id
    AND e.organization_id = get_user_organization(auth.uid())
  )
);

-- pdi_goals: herda via pdi_id → pdis → employees
CREATE POLICY "tenant_isolation" ON public.pdi_goals
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_goals.pdi_id
    AND e.organization_id = get_user_organization(auth.uid())
  )
);

-- pdi_comments: herda via pdi_id → pdis → employees
CREATE POLICY "tenant_isolation" ON public.pdi_comments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_comments.pdi_id
    AND e.organization_id = get_user_organization(auth.uid())
  )
);

-- pdi_logs: herda via pdi_id → pdis → employees
CREATE POLICY "tenant_isolation" ON public.pdi_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_logs.pdi_id
    AND e.organization_id = get_user_organization(auth.uid())
  )
);

-- pdi_attachments: herda via pdi_id → pdis → employees
CREATE POLICY "tenant_isolation" ON public.pdi_attachments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.pdis p
    JOIN public.employees e ON e.id = p.employee_id
    WHERE p.id = pdi_attachments.pdi_id
    AND e.organization_id = get_user_organization(auth.uid())
  )
);
```

### Fase 5: Frontend Updates ✅ COMPLETA

> **Executada em:** 2026-02-01
> **Status:** Todos os hooks principais atualizados para multi-tenancy
>
> **Hooks de leitura atualizados (filtro por organization_id):**
> - `useEmployees.ts` - filtra por org + queryKey inclui org_id
> - `useDepartments.ts` - filtra por org
> - `usePositions.ts` - filtra por org
> - `useJobs.ts` + `useJobStats.ts` - filtra por org
> - `useDevices.ts` - filtra por org + insert com org_id
> - `useUnits.ts` - filtra por org
> - `useJobDescriptions.ts` - filtra por org
> - `useCompanyCostSettings.ts` - filtra por org + insert com org_id
> - `useCompanyCulture.ts` - filtra por org + insert com org_id
> - `useCompanyCosts.ts` - filtra por org
>
> **Hooks de criação atualizados (inclui organization_id):**
> - `useCreateDepartment.ts`
> - `useCreatePosition.ts`
> - `useCreateJob.ts`
> - `useCreateJobDescription.ts`
>
> **Onboarding atualizado:**
> - `useCreateOrganization.ts` - chama `create_employee_for_org()` após criar org

#### 3.5.1 Hooks Atualizados

| Hook | Mudança | Status |
|------|---------|--------|
| `useEmployees.ts` | Filtrar por `organization_id` | ✅ |
| `useDepartments.ts` | Filtrar por `organization_id` | ✅ |
| `useCreateDepartment.ts` | Incluir `organization_id` no insert | ✅ |
| `usePositions.ts` | Filtrar por `organization_id` | ✅ |
| `useCreatePosition.ts` | Incluir `organization_id` no insert | ✅ |
| `useJobs.ts` | Filtrar por `organization_id` | ✅ |
| `useCreateJob.ts` | Incluir `organization_id` no insert | ✅ |
| `useDevices.ts` | Filtrar + insert com `organization_id` | ✅ |
| `useUnits.ts` | Filtrar por `organization_id` | ✅ |
| `useJobDescriptions.ts` | Filtrar por `organization_id` | ✅ |
| `useCreateJobDescription.ts` | Incluir `organization_id` no insert | ✅ |
| `useCompanyCostSettings.ts` | Filtrar + insert com `organization_id` | ✅ |
| `useCompanyCulture.ts` | Filtrar + insert com `organization_id` | ✅ |
| `useCompanyCosts.ts` | Filtrar por `organization_id` | ✅ |
| `useCreateOrganization.ts` | Chamar `create_employee_for_org()` | ✅ |

#### 3.5.2 Exemplo de Atualização - `useEmployees.ts`

```typescript
import { useRequireOrganization } from "./useRequireOrganization";

export const useEmployees = () => {
  const { organization } = useRequireOrganization();
  
  return useQuery({
    queryKey: ["employees", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from("employees")
        .select(`
          *,
          departments(name),
          positions:base_position_id(title),
          units(name)
        `)
        .eq("organization_id", organization.id)
        .eq("status", "active")
        .order("full_name");

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });
};
```

#### 3.5.3 Atualizar Onboarding

```typescript
// Em useCreateOrganization.ts
const createOrganization = async (data: OrganizationInput) => {
  // 1. Criar organização
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ ...data })
    .select()
    .single();

  if (orgError) throw orgError;

  // 2. Criar membership (owner)
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: "admin",
      is_owner: true,
    });

  if (memberError) throw memberError;

  // 3. Criar employee para o owner
  const { error: empError } = await supabase.rpc("create_employee_for_org", {
    _user_id: user.id,
    _org_id: org.id,
    _email: user.email,
    _full_name: user.user_metadata?.full_name,
  });

  if (empError) throw empError;

  return org;
};
```

---

## 4. Trade-offs e Decisões

| Abordagem | Prós | Contras |
|-----------|------|---------|
| `organization_id` direto em todas | RLS simples, queries rápidas | Redundância, mais colunas para manter |
| Herdar via FK em todas | Normalizado, menos colunas | RLS com JOIN em tudo (performance) |
| **Híbrido (escolhido)** | Equilíbrio performance/normalização | Duas estratégias de RLS |

### Por que Híbrido?

1. **Tabelas Raiz com `organization_id` direto:**
   - São consultadas diretamente e frequentemente
   - RLS simples: `is_same_org(organization_id)`
   - Melhor performance em listagens

2. **Tabelas Filhas herdam via FK:**
   - Já possuem FK para tabela pai
   - Evita redundância de dados
   - RLS com EXISTS é aceitável para operações pontuais

---

## 5. Checklist de Implementação

### Fase 1: Schema (Tabelas Raiz) ✅ COMPLETA
- [x] Adicionar `organization_id` em `employees`
- [x] Adicionar `organization_id` em `departments`
- [x] Adicionar `organization_id` em `positions`
- [x] Adicionar `organization_id` em `jobs`
- [x] Adicionar `organization_id` em `units`
- [x] Adicionar `organization_id` em `devices`
- [x] Adicionar `organization_id` em `time_off_policies`
- [x] Adicionar `organization_id` em `company_culture`
- [x] Adicionar `organization_id` em `company_cost_settings`
- [x] Adicionar `organization_id` em `job_descriptions`
- [x] Criar índices para todas as colunas `organization_id`

### Fase 2: Funções e Triggers ✅ COMPLETA
- [x] Criar função helper `is_same_org()`
- [x] Atualizar trigger `handle_new_user()` (remover criação de employee)
- [x] Criar função `create_employee_for_org()`

### Fase 3: RLS Tabelas Raiz ✅ COMPLETA
- [x] Atualizar policies de `employees`
- [x] Atualizar policies de `departments`
- [x] Atualizar policies de `positions`
- [x] Atualizar policies de `jobs`
- [x] Atualizar policies de `units`
- [x] Atualizar policies de `devices`
- [x] Atualizar policies de `time_off_policies`
- [x] Atualizar policies de `company_culture`
- [x] Atualizar policies de `company_cost_settings`
- [x] Atualizar policies de `job_descriptions`

### Fase 4: RLS Tabelas Filhas
- [ ] Adicionar policy `tenant_isolation` em `job_applications`
- [ ] Adicionar policy `tenant_isolation` em `employees_contact`
- [ ] Adicionar policy `tenant_isolation` em `employees_contracts`
- [ ] Adicionar policy `tenant_isolation` em `pdis`
- [ ] Adicionar policy `tenant_isolation` em `pdi_goals`
- [ ] Adicionar policy `tenant_isolation` em `pdi_comments`
- [ ] Adicionar policy `tenant_isolation` em `pdi_logs`
- [ ] Adicionar policy `tenant_isolation` em `pdi_attachments`
- [ ] Adicionar policy `tenant_isolation` em `time_off_balances`
- [ ] Adicionar policy `tenant_isolation` em `time_off_requests`
- [ ] Adicionar policy `tenant_isolation` em `feedbacks`
- [ ] Adicionar policy `tenant_isolation` em `profiler_history`

### Fase 5: Frontend
- [ ] Atualizar `useEmployees.ts`
- [ ] Atualizar `useCreateEmployee.ts`
- [ ] Atualizar `useDepartments.ts`
- [ ] Atualizar `useCreateDepartment.ts`
- [ ] Atualizar `usePositions.ts`
- [ ] Atualizar `useCreatePosition.ts`
- [ ] Atualizar `useJobs.ts`
- [ ] Atualizar `useCreateJob.ts`
- [ ] Atualizar `useDevices.ts`
- [ ] Atualizar `useUnits.ts`
- [ ] Atualizar `useCreateOrganization.ts` (criar employee)
- [ ] Atualizar componentes que listam dados

### Fase 6: Testes ✅ COMPLETA
- [x] Testar isolamento entre organizações
- [x] Testar permissões admin/people/user
- [x] Testar onboarding completo (nova org + employee)
- [x] Testar páginas públicas (vagas, careers) ✅
- [ ] Testar convite de novos membros - pendente manual

#### Correções Aplicadas Durante Testes Públicos:
1. **`useOrganization.ts`**: Hook `useActiveJobsForCareers` agora filtra por `organization_id`
2. **`useJobById.ts`**: Inclui dados da organização via JOIN para páginas de aplicação
3. **`JobApplicationPage.tsx`**: Usa dados da organização vindos do job

#### Validações Realizadas:
- RPC `get_organization_public` retorna dados corretamente para slugs válidos
- Jobs com `status='active'` são acessíveis publicamente (RLS: `status = 'active'`)
- Query de vagas por organização funciona corretamente

---

## 6. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Dados existentes sem `organization_id` | Queries falham | Permitir NULL temporariamente, migrar dados depois |
| Performance com EXISTS em cascata | Lentidão em tabelas profundas (pdi_*) | Índices otimizados, monitorar queries lentas |
| Complexidade de RLS | Bugs de permissão | Testes extensivos, auditoria de policies |
| Usuários sem organização | Tela em branco | Redirect obrigatório para onboarding |
| Employee não criado no signup | Funcionalidades quebradas | Verificar employee existe antes de operações |

---

## 7. Estimativa de Tempo

| Fase | Estimativa |
|------|------------|
| Fase 1: Schema (10 tabelas) | 1 hora |
| Fase 2: Funções e Triggers | 1 hora |
| Fase 3: RLS Tabelas Raiz (10 tabelas) | 2-3 horas |
| Fase 4: RLS Tabelas Filhas (12 tabelas) | 2-3 horas |
| Fase 5: Frontend (~12 hooks) | 3-4 horas |
| Fase 6: Testes | 2-4 horas |
| **Total** | **11-16 horas** |

---

## 8. Documentos Relacionados

- [Architecture](./architecture.md)
- [Permissions](./permissions.md)
- [ADR-0002: RLS Authorization](./adr/0002-rls-authorization.md)
- [Business Logic](./business_logic.md)
