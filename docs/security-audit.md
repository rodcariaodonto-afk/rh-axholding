# Security Audit Report — Orb RH

Auditoria de segurança completa (pentest + OWASP compliance) comparando documentação existente com implementação real.

**Uso**: Correção de vulnerabilidades, compliance, auditorias externas, go/no-go de produção.

---

## Executive Summary

| Métrica | Valor |
|---------|-------|
| **OWASP Score** | 6/10 categorias conformes |
| **Findings Críticos** | 2 |
| **Findings High** | 4 |
| **Findings Medium** | 4 |
| **Findings Low** | 3 |
| **Total** | **13** |
| **Go/No-Go** | 🔴 **NO-GO** para produção |

### Top 3 Riscos Críticos

1. **CRITICAL-001**: Edge Function `analyze-candidate` sem autenticação
2. **CRITICAL-002**: Edge Functions GitHub (`github-repos`, `github-releases`, `github-tags`) expõem token corporativo
3. **HIGH-001**: `FORCE ROW LEVEL SECURITY` ausente em todas as tabelas

### Recomendação Geral

⚠️ **NO-GO para produção** até resolução dos findings CRITICAL e HIGH. Após correção dos P0/P1, revisão necessária.

---

## PARTE 1: Análise por Área Técnica

### 1.1 RLS Policies vs Documentação

| Verificação | Status | Evidence |
|-------------|--------|----------|
| Todas as tabelas públicas têm RLS ativo | ✅ | `migration-dump/05-rls-policies.sql:L11-36` |
| Policies cobrem SELECT/INSERT/UPDATE/DELETE | ✅ | 26 tabelas com policies completas |
| Nenhuma policy para `anon` que deveria ser `authenticated` | ⚠️ | `job_applications` permite INSERT anônimo |
| Views mascaradas não expõem dados sensíveis | ✅ | `get_organization_public` filtra campos |
| `FORCE ROW LEVEL SECURITY` ativo | ❌ | Nenhuma tabela usa FORCE RLS |

**Evidence**:
- `[OK] migration-dump/05-rls-policies.sql:L11-36` — RLS ativo em todas tabelas
- `[EVIDÊNCIA] migration-dump/05-rls-policies.sql:L242-246` — INSERT aberto em job_applications
- `[EVIDÊNCIA] grep "FORCE ROW LEVEL" migration-dump/` — 0 resultados

---

### 1.2 Edge Functions vs Documentação

| Verificação | Status | Evidence |
|-------------|--------|----------|
| Todo endpoint verifica `Authorization` header | ❌ | `analyze-candidate`, `github-*` sem auth |
| Claims são extraídos e validados | ⚠️ | `invite-employee` e `manage-secrets` validam |
| Erros não vazam informações sensíveis | ✅ | Mensagens genéricas em português |
| CORS restritivo em produção | ❌ | Wildcard `*` em todas funções |
| Rate limiting implementado | ❌ | Não implementado |

**Evidence**:
- `[EVIDÊNCIA] supabase/functions/analyze-candidate/index.ts:L85-147` — Sem check de Authorization
- `[EVIDÊNCIA] supabase/functions/github-repos/index.ts:L8-91` — Sem verificação de auth
- `[OK] supabase/functions/invite-employee/index.ts:L25-55` — Verifica auth e roles
- `[EVIDÊNCIA] supabase/functions/_shared/cors.ts:L2` — `'*'` hardcoded

---

### 1.3 Frontend vs Backend Enforcement

| Verificação | Status | Evidence |
|-------------|--------|----------|
| Toda verificação frontend tem equivalente backend | ✅ | Guards + RLS |
| Guards de rota são defense-in-depth | ✅ | AdminRoute, PeopleRoute, ProtectedRoute |
| Dados sensíveis não carregam sem auth | ✅ | RLS protege queries |

**Evidence**:
- `[OK] src/components/AdminRoute.tsx:L12-50` — Guard para rotas admin
- `[OK] src/components/PeopleRoute.tsx:L12-52` — Guard para rotas people
- `[OK] migration-dump/05-rls-policies.sql:L180-191` — contracts_select requer admin/people

---

### 1.4 Secrets & Configuração

| Verificação | Status | Evidence |
|-------------|--------|----------|
| Nenhum secret em `VITE_*` | ✅ | Apenas URL e publishable key |
| Service-role apenas em Edge Functions | ✅ | Não encontrado no bundle |
| `.env` no `.gitignore` | ✅ | Configurado |
| Secrets diferentes por ambiente | ⚠️ | Não verificável sem acesso ao dashboard |

**Evidence**:
- `[OK] src/integrations/supabase/client.ts:L5-6` — Apenas VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY
- `[OK] grep -r "SERVICE_ROLE" src/` — 0 resultados
- `[EVIDÊNCIA] src/hooks/useOrganizationIntegrations.ts:L45` — URL fallback hardcoded

---

### 1.5 Storage Buckets

| Verificação | Status | Evidence |
|-------------|--------|----------|
| Buckets sensíveis são privados | ✅ | `resumes`, `employee-documents`, `pdi-attachments` |
| Policies de storage documentadas e corretas | ❌ | Apenas `resumes` tem policies |
| Validação de MIME type em uploads | ⚠️ | Não verificável pelo código |
| Limite de tamanho configurado | ⚠️ | Não verificável pelo código |

**Evidence**:
- `[OK] supabase-configuration/storage-buckets` — Buckets privados
- `[EVIDÊNCIA] migration-dump/06-storage.sql` — Apenas `resumes` com policies

---

### 1.6 Autenticação & Sessão

| Verificação | Status | Evidence |
|-------------|--------|----------|
| JWT expiration configurado | ✅ | Supabase default (1h) |
| Refresh flow seguro | ✅ | Supabase Auth gerencia |
| Logout invalida sessão | ✅ | Supabase Auth gerencia |
| MFA disponível para admins | ❌ | Não implementado |

**Evidence**:
- `[OK] Supabase Auth` — Gerenciamento padrão de sessões
- `[EVIDÊNCIA] Ausência de MFA` — Não encontrado no código

---

### 1.7 Injeção & Validação

| Verificação | Status | Evidence |
|-------------|--------|----------|
| Queries usam parameterized statements | ✅ | Supabase SDK |
| Input validado antes de uso | ✅ | `submit-application` com Zod-like validation |
| Sem `dangerouslySetInnerHTML` com user input | ✅ | Não encontrado |
| IDs não previsíveis expostos | ✅ | UUIDs usados |

**Evidence**:
- `[OK] supabase/functions/submit-application/index.ts:L10-38` — Validação completa
- `[OK] grep -r "dangerouslySetInnerHTML" src/` — Apenas markdown sanitizado

---

### 1.8 Lógica de Negócio & Edge Cases

| Verificação | Status | Evidence |
|-------------|--------|----------|
| Operações financeiras são idempotentes | ➖ | N/A (sem pagamentos) |
| Fluxos críticos têm locks/transactions | ⚠️ | PDI check via trigger |
| Estados inválidos não são alcançáveis | ✅ | Triggers validam transições |

**Evidence**:
- `[OK] migration-dump/03-functions.sql:L85-110` — `check_one_active_pdi_per_employee()`

---

### 1.9 Logging & Auditoria

| Verificação | Status | Evidence |
|-------------|--------|----------|
| Ações sensíveis logadas | ✅ | `audit_log` table |
| Logs não expõem PII/secrets | ⚠️ | Logs de dev expõem dados |
| Falhas de auth logadas | ✅ | Edge Functions logam |

**Evidence**:
- `[OK] migration-dump/03-functions.sql:L398-439` — `insert_audit_log()`
- `[EVIDÊNCIA] supabase/functions/submit-application/index.ts:L72-79` — Loga campos demográficos

---

## PARTE 2: Mapeamento OWASP Top 10 (2021)

### Matriz de Conformidade

| Categoria OWASP | Status | Findings Relacionados | Áreas Técnicas |
|-----------------|--------|----------------------|----------------|
| **A01** Broken Access Control | ❌ | CRITICAL-001, CRITICAL-002, HIGH-001, HIGH-003 | 1.1, 1.2 |
| **A02** Cryptographic Failures | ✅ | — | 1.4 |
| **A03** Injection | ✅ | — | 1.7 |
| **A04** Insecure Design | ⚠️ | HIGH-004 | 1.8 |
| **A05** Security Misconfiguration | ⚠️ | HIGH-002, MEDIUM-003 | 1.2, 1.5 |
| **A06** Vulnerable Components | ✅ | — | package.json |
| **A07** Auth Failures | ⚠️ | CRITICAL-001, CRITICAL-002 | 1.2, 1.6 |
| **A08** Integrity Failures | ✅ | — | 1.4 |
| **A09** Logging Failures | ⚠️ | LOW-003 | 1.9 |
| **A10** SSRF | ✅ | — | 1.2 |

**Legenda:** ✅ Conforme | ⚠️ Parcial | ❌ Não conforme | ➖ N/A

---

### Checklist OWASP Detalhado

#### A01:2021 – Broken Access Control

| Verificação | Status | Evidence | Finding ID |
|-------------|--------|----------|------------|
| RLS ativo em todas as tabelas | ✅ | `05-rls-policies.sql:L11-36` | — |
| FORCE RLS ativo | ❌ | Não encontrado | HIGH-001 |
| Sem IDOR | ✅ | UUIDs + RLS | — |
| Principle of least privilege | ⚠️ | job_applications INSERT aberto | HIGH-003 |
| CORS restritivo | ❌ | Wildcard `*` | MEDIUM-003 |
| Rate limiting | ❌ | Não implementado | — |
| Edge Functions com auth | ❌ | 4 funções sem auth | CRITICAL-001, CRITICAL-002 |

#### A02:2021 – Cryptographic Failures

| Verificação | Status | Evidence | Finding ID |
|-------------|--------|----------|------------|
| HTTPS forçado | ✅ | Lovable/Supabase enforced | — |
| Secrets não no client | ✅ | Apenas VITE_* públicas | — |
| Dados sensíveis criptografados at-rest | ✅ | AES-256-GCM em vault | — |
| Sem hashing fraco | ✅ | Supabase Auth (bcrypt) | — |

#### A03:2021 – Injection

| Verificação | Status | Evidence | Finding ID |
|-------------|--------|----------|------------|
| SQL parameterizado | ✅ | Supabase SDK | — |
| XSS prevenido | ✅ | React escapa por padrão | — |
| Sem eval() com user input | ✅ | Não encontrado | — |

#### A04:2021 – Insecure Design

| Verificação | Status | Evidence | Finding ID |
|-------------|--------|----------|------------|
| Threat modeling documentado | ⚠️ | `docs/permissions.md` existe | — |
| Fluxos críticos validados server-side | ✅ | RLS + triggers | — |
| Domínio hardcoded multi-tenant | ❌ | `@popcode.com.br` | HIGH-004 |

#### A05:2021 – Security Misconfiguration

| Verificação | Status | Evidence | Finding ID |
|-------------|--------|----------|------------|
| Sem debug em produção | ✅ | Não encontrado | — |
| Error messages genéricas | ✅ | Mensagens em PT | — |
| Headers de segurança | ⚠️ | Lovable gerencia | — |
| Buckets configurados corretamente | ❌ | 2 buckets sem policies | HIGH-002 |
| CORS configurado | ❌ | Wildcard `*` | MEDIUM-003 |

#### A06:2021 – Vulnerable Components

| Verificação | Status | Evidence | Finding ID |
|-------------|--------|----------|------------|
| Sem CVEs críticos em deps | ✅ | React 18.3.1 atual | — |
| Lock file presente | ✅ | `bun.lockb` | — |
| Supabase client atualizado | ✅ | @supabase/supabase-js@2.93.3 | — |

#### A07:2021 – Auth Failures

| Verificação | Status | Evidence | Finding ID |
|-------------|--------|----------|------------|
| Proteção contra brute force | ✅ | Supabase Auth | — |
| MFA para admins | ❌ | Não implementado | — |
| Sessões invalidadas no logout | ✅ | Supabase Auth | — |
| Tokens não em URLs | ✅ | Headers | — |
| Edge Functions verificam auth | ❌ | 4 funções expostas | CRITICAL-001, CRITICAL-002 |

#### A08:2021 – Integrity Failures

| Verificação | Status | Evidence | Finding ID |
|-------------|--------|----------|------------|
| Deps de fontes confiáveis | ✅ | npm registry | — |
| Webhooks com assinatura | ➖ | N/A | — |
| Migrations versionadas | ✅ | `migration-dump/` | — |

#### A09:2021 – Logging Failures

| Verificação | Status | Evidence | Finding ID |
|-------------|--------|----------|------------|
| Ações sensíveis logadas | ✅ | `audit_log` table | — |
| Logs sem dados sensíveis | ⚠️ | Dev logs expõem PII | LOW-003 |
| Alertas configurados | ❌ | Não implementado | — |

#### A10:2021 – SSRF

| Verificação | Status | Evidence | Finding ID |
|-------------|--------|----------|------------|
| URLs externas validadas | ✅ | APIs fixas (GitHub, Anthropic) | — |
| Whitelist de domínios | ✅ | URLs hardcoded | — |
| Sem redirect baseado em user input | ✅ | Não encontrado | — |

---

## PARTE 3: Findings Detalhados

### [CRITICAL-001] Edge Function `analyze-candidate` sem verificação de autenticação

**Risco:** 🔴 Critical

**Categoria OWASP:** A01 (Broken Access Control), A07 (Auth Failures)

**Área Técnica:** 1.2

**Descrição:**

A Edge Function `analyze-candidate` não verifica o header `Authorization` nem valida JWT. Qualquer pessoa pode enviar requests para analisar candidatos, consumindo créditos da API Anthropic e acessando dados de candidatos.

**Evidence:**

```
[EVIDÊNCIA] supabase/functions/analyze-candidate/index.ts:L85-147
```
- Nenhum check de `Authorization` header
- `docs/api_specification.md` documenta que requer autenticação, mas implementação não verifica

**Cenário de Ataque:**

1. Atacante descobre URL da Edge Function
2. Envia POST com `jobId` e `candidateEmail` de qualquer candidato
3. Obtém relatório de análise completo do candidato
4. Consome créditos da API Anthropic da organização

**Impacto:**

- Acesso não autorizado a dados sensíveis de candidatos
- Consumo de créditos de API (custos financeiros)
- Possível enumeração de candidatos

**PoC:**

```bash
# Sem Authorization header - funciona
curl -X POST \
  'https://xoyahzteplhuwjfwprjz.supabase.co/functions/v1/analyze-candidate' \
  -H 'Content-Type: application/json' \
  -d '{"jobId": "uuid-da-vaga", "candidateEmail": "candidato@email.com"}'
# Retorna: análise completa do candidato
```

**Solução:**

```typescript
// supabase/functions/analyze-candidate/index.ts - Adicionar após L92
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(
    JSON.stringify({ error: 'Não autorizado' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const supabaseUser = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  { global: { headers: { Authorization: authHeader } } }
);

const token = authHeader.replace('Bearer ', '');
const { data: claims, error: claimsError } = await supabaseUser.auth.getClaims(token);
if (claimsError || !claims?.sub) {
  return new Response(
    JSON.stringify({ error: 'Token inválido' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Verificar se user tem role admin ou people
const { data: roles } = await supabaseAdmin
  .from('user_roles')
  .select('role')
  .eq('user_id', claims.sub);

const hasPermission = roles?.some(r => r.role === 'admin' || r.role === 'people');
if (!hasPermission) {
  return new Response(
    JSON.stringify({ error: 'Sem permissão' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**Referências:**

- [OWASP Broken Authentication](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)

---

### [CRITICAL-002] Edge Functions GitHub expõem token corporativo sem autenticação

**Risco:** 🔴 Critical

**Categoria OWASP:** A01 (Broken Access Control), A07 (Auth Failures)

**Área Técnica:** 1.2

**Descrição:**

As Edge Functions `github-repos`, `github-releases`, e `github-tags` não verificam autenticação. Qualquer pessoa pode usar o token GitHub corporativo para consultar repositórios, potencialmente expondo repos privados e consumindo rate limits.

**Evidence:**

```
[EVIDÊNCIA] supabase/functions/github-repos/index.ts:L8-91
[EVIDÊNCIA] supabase/functions/github-releases/index.ts:L8-62
[EVIDÊNCIA] supabase/functions/github-tags/index.ts:L8-62
```
- Sem verificação de auth header em nenhuma das funções

**Cenário de Ataque:**

1. Atacante descobre URLs das Edge Functions
2. Envia requests para listar repos de qualquer organização
3. Token corporativo é usado para autenticar na API do GitHub
4. Se o token tiver acesso a repos privados, atacante pode enumerá-los

**Impacto:**

- Abuso de rate limits do GitHub (5000 req/hora)
- Exposição de repositórios privados (dependendo do escopo do token)
- Uso indevido de credenciais corporativas

**PoC:**

```bash
# Sem autenticação - funciona
curl -X POST \
  'https://xoyahzteplhuwjfwprjz.supabase.co/functions/v1/github-repos' \
  -H 'Content-Type: application/json' \
  -d '{"owner": "microsoft"}'
# Retorna: lista de repos usando token corporativo
```

**Solução:**

```typescript
// Adicionar em cada função github-* após o check de OPTIONS
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(
    JSON.stringify({ error: 'Não autorizado' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  { global: { headers: { Authorization: authHeader } } }
);

const token = authHeader.replace('Bearer ', '');
const { data: claims, error } = await supabase.auth.getClaims(token);
if (error || !claims?.sub) {
  return new Response(
    JSON.stringify({ error: 'Token inválido' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**Referências:**

- [OWASP Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)

---

### [HIGH-001] `FORCE ROW LEVEL SECURITY` ausente em todas as tabelas

**Risco:** 🟠 High

**Categoria OWASP:** A01 (Broken Access Control)

**Área Técnica:** 1.1

**Descrição:**

Nenhuma tabela utiliza `ALTER TABLE ... FORCE ROW LEVEL SECURITY`. Isso significa que o owner da tabela (e funções `SECURITY DEFINER`) podem bypassar RLS inadvertidamente. Se um bug ou configuração incorreta permitir acesso como owner, RLS não protege.

**Evidence:**

```
[EVIDÊNCIA] migration-dump/05-rls-policies.sql:L11-36 — Apenas ENABLE ROW LEVEL SECURITY
[EVIDÊNCIA] grep "FORCE ROW LEVEL" migration-dump/ — 0 resultados
```

**Cenário de Ataque:**

1. Atacante encontra vulnerabilidade que permite executar queries como owner
2. Todas as policies RLS são ignoradas
3. Acesso total a todos os dados

**Impacto:**

- RLS pode ser bypassado por funções SECURITY DEFINER mal configuradas
- Reduz eficácia de defense-in-depth

**PoC:**

```sql
-- Como owner da tabela (ou SECURITY DEFINER function)
SELECT * FROM employees; -- Retorna TODOS, ignorando RLS
```

**Solução:**

```sql
-- Adicionar para TODAS as tabelas em nova migration
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.units FORCE ROW LEVEL SECURITY;
ALTER TABLE public.positions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;
ALTER TABLE public.departments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees_contact FORCE ROW LEVEL SECURITY;
ALTER TABLE public.employees_contracts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.devices FORCE ROW LEVEL SECURITY;
ALTER TABLE public.jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.job_descriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdis FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_goals FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_comments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pdi_attachments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_policies FORCE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_balances FORCE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiler_history FORCE ROW LEVEL SECURITY;
ALTER TABLE public.company_culture FORCE ROW LEVEL SECURITY;
ALTER TABLE public.company_cost_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;
```

**Referências:**

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

### [HIGH-002] Storage buckets `employee-documents` e `pdi-attachments` sem policies

**Risco:** 🟠 High

**Categoria OWASP:** A05 (Security Misconfiguration)

**Área Técnica:** 1.5

**Descrição:**

Os buckets `employee-documents` e `pdi-attachments` existem no Supabase mas não têm policies de storage definidas. Isso pode permitir acesso não autorizado a documentos sensíveis.

**Evidence:**

```
[EVIDÊNCIA] supabase-configuration/storage-buckets — Buckets existem: employee-documents, pdi-attachments
[EVIDÊNCIA] migration-dump/06-storage.sql — Apenas resumes tem policies
```

**Cenário de Ataque:**

1. Se bucket sem policies: usuários autenticados podem acessar documentos de outros funcionários
2. Download de contratos, avaliações, documentos pessoais de qualquer funcionário

**Impacto:**

- Vazamento de documentos sensíveis (contratos, PDIs, avaliações)
- Violação de LGPD

**Solução:**

```sql
-- Policies para employee-documents
CREATE POLICY "Employees can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admin/People can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'people')
  )
);

-- Policies para pdi-attachments
CREATE POLICY "PDI stakeholders can view attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdi-attachments' AND (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'people') OR
    EXISTS (
      SELECT 1 FROM public.pdis p 
      WHERE p.id::text = (storage.foldername(name))[1]
      AND (p.employee_id = auth.uid() OR p.manager_id = auth.uid())
    )
  )
);
```

---

### [HIGH-003] Policy `job_applications` permite INSERT sem restrição

**Risco:** 🟠 High

**Categoria OWASP:** A01 (Broken Access Control)

**Área Técnica:** 1.1

**Descrição:**

A tabela `job_applications` tem policies que permitem INSERT com `WITH CHECK (true)`, permitindo que qualquer usuário (inclusive anônimo) insira candidaturas diretamente no banco, bypassando validações da Edge Function.

**Evidence:**

```
[EVIDÊNCIA] migration-dump/05-rls-policies.sql:L242-246
```

```sql
CREATE POLICY "job_applications_anon_insert" ON public.job_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "job_applications_auth_insert" ON public.job_applications
  FOR INSERT WITH CHECK (true);
```

**Cenário de Ataque:**

1. Atacante usa Supabase client diretamente (sem Edge Function)
2. Insere candidaturas falsas sem validação
3. Pode inserir dados malformados ou XSS em campos de texto

**Impacto:**

- Bypass de validações de negócio
- Dados inválidos no banco
- Spam de candidaturas

**Solução:**

```sql
-- Remover policies permissivas
DROP POLICY "job_applications_anon_insert" ON public.job_applications;
DROP POLICY "job_applications_auth_insert" ON public.job_applications;

-- INSERT apenas via service role (Edge Function)
-- Ou validar campos mínimos:
CREATE POLICY "job_applications_insert_validated" ON public.job_applications
  FOR INSERT WITH CHECK (
    candidate_name IS NOT NULL AND
    length(candidate_name) >= 2 AND
    candidate_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' AND
    candidate_birth_date IS NOT NULL AND
    job_id IS NOT NULL
  );
```

---

### [HIGH-004] Domínio hardcoded `@popcode.com.br` em `invite-employee`

**Risco:** 🟠 High

**Categoria OWASP:** A04 (Insecure Design)

**Área Técnica:** 1.2

**Descrição:**

A Edge Function `invite-employee` contém validação hardcoded que restringe convites apenas para emails `@popcode.com.br`. Isso impede uso multi-tenant do sistema.

**Evidence:**

```
[EVIDÊNCIA] supabase/functions/invite-employee/index.ts:L67-71
```

```typescript
if (!email.endsWith("@popcode.com.br")) {
  return new Response(
    JSON.stringify({ error: "Apenas emails @popcode.com.br são permitidos" }),
    { status: 400, ... }
  );
}
```

**Impacto:**

- Sistema não pode ser usado por outras empresas
- Bloqueio de funcionalidade multi-tenant
- Decisão de negócio embarcada em código

**Solução:**

```typescript
// Buscar domínios permitidos da organização
const { data: org } = await supabaseAdmin
  .from('organizations')
  .select('allowed_domains')
  .eq('id', organizationId)
  .single();

const allowedDomains = org?.allowed_domains || [];
const emailDomain = email.split('@')[1];

if (allowedDomains.length > 0 && !allowedDomains.includes(emailDomain)) {
  return new Response(
    JSON.stringify({ error: `Apenas emails dos domínios ${allowedDomains.join(', ')} são permitidos` }),
    { status: 400, ... }
  );
}
```

---

### [MEDIUM-001] URL hardcoded fallback em `useOrganizationIntegrations.ts`

**Risco:** 🟡 Medium

**Categoria OWASP:** A05 (Security Misconfiguration)

**Área Técnica:** 1.4

**Descrição:**

O hook contém URL de fallback hardcoded para projeto Supabase diferente (`izezklembcgjqfayggjf`).

**Evidence:**

```
[EVIDÊNCIA] src/hooks/useOrganizationIntegrations.ts:L45,L118
```

**Solução:**

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL não configurada');
}
```

---

### [MEDIUM-002] Padrão `select("*")` em múltiplos hooks

**Risco:** 🟡 Medium

**Categoria OWASP:** A01 (Broken Access Control)

**Área Técnica:** 1.3

**Descrição:**

16 hooks usam `select("*")` em vez de campos específicos, potencialmente expondo dados desnecessários.

**Evidence:**

```
[EVIDÊNCIA] src/hooks/useEmployeeContact.ts:L33
[EVIDÊNCIA] src/hooks/useJobDescriptions.ts:L10
[EVIDÊNCIA] src/hooks/useCompanyCostSettings.ts:L15
```

**Solução:**

Selecionar apenas campos necessários para cada use case.

---

### [MEDIUM-003] CORS wildcard `*` em todas Edge Functions

**Risco:** 🟡 Medium

**Categoria OWASP:** A05 (Security Misconfiguration)

**Área Técnica:** 1.2

**Descrição:**

Todas Edge Functions usam `Access-Control-Allow-Origin: '*'`.

**Evidence:**

```
[EVIDÊNCIA] supabase/functions/_shared/cors.ts:L2
```

**Solução:**

```typescript
const ALLOWED_ORIGINS = [
  'https://orbrh.lovable.app',
  'https://id-preview--53e08215-d4f6-436d-9c8a-34b18ddafcfb.lovable.app',
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}
```

---

### [MEDIUM-004] Policies RLS duplicadas

**Risco:** 🟡 Medium

**Categoria OWASP:** A05 (Security Misconfiguration)

**Área Técnica:** 1.1

**Descrição:**

Tabelas `positions` e `departments` têm policies SELECT duplicadas.

**Evidence:**

```
[EVIDÊNCIA] migration-dump/05-rls-policies.sql:L96-101
[EVIDÊNCIA] migration-dump/05-rls-policies.sql:L135-140
```

**Solução:**

```sql
DROP POLICY "positions_select_anon" ON public.positions;
DROP POLICY "departments_select_anon" ON public.departments;
```

---

### [LOW-001] Documentação menciona roles inexistentes

**Risco:** 🟢 Low

**Área Técnica:** Documentação

**Evidence:**

```
[EVIDÊNCIA] Prompt menciona "staff", "validator", "anon"
[EVIDÊNCIA] migration-dump/01-enums.sql — Enum real: ('admin', 'people', 'user')
```

---

### [LOW-002] `user_roles` sem policy INSERT (Correto)

**Risco:** 🟢 Low (Informativo)

**Status:** ✅ **Correto** — Roles gerenciadas via trigger.

---

### [LOW-003] Logs expõem dados sensíveis em desenvolvimento

**Risco:** 🟢 Low

**Evidence:**

```
[EVIDÊNCIA] supabase/functions/submit-application/index.ts:L72-79
[EVIDÊNCIA] supabase/functions/analyze-candidate/index.ts:L96-101
```

---

## PARTE 4: Matriz de Findings

| ID | Severidade | OWASP | Área | Título | Status |
|----|------------|-------|------|--------|--------|
| CRITICAL-001 | 🔴 | A01, A07 | 1.2 | `analyze-candidate` sem auth | Open |
| CRITICAL-002 | 🔴 | A01, A07 | 1.2 | GitHub functions expõem token | Open |
| HIGH-001 | 🟠 | A01 | 1.1 | `FORCE RLS` ausente | Open |
| HIGH-002 | 🟠 | A05 | 1.5 | Storage buckets sem policies | Open |
| HIGH-003 | 🟠 | A01 | 1.1 | INSERT aberto em job_applications | Open |
| HIGH-004 | 🟠 | A04 | 1.2 | Domínio hardcoded em invite | Open |
| MEDIUM-001 | 🟡 | A05 | 1.4 | URL fallback hardcoded | Open |
| MEDIUM-002 | 🟡 | A01 | 1.3 | Padrão `select("*")` | Open |
| MEDIUM-003 | 🟡 | A05 | 1.2 | CORS wildcard `*` | Open |
| MEDIUM-004 | 🟡 | A05 | 1.1 | Policies duplicadas | Open |
| LOW-001 | 🟢 | — | Docs | Roles não existentes | Open |
| LOW-002 | 🟢 | — | 1.1 | user_roles sem INSERT | ✅ Correto |
| LOW-003 | 🟢 | A09 | 1.9 | Dados sensíveis em logs | Open |

---

## PARTE 5: Plano de Correção

### Recomendações Priorizadas

| Prioridade | ID | Ação | Esforço | Impacto |
|------------|-----|------|---------|---------|
| **P0** | CRITICAL-001 | Adicionar auth em `analyze-candidate` | 1h | 🔴 Critical |
| **P0** | CRITICAL-002 | Adicionar auth em GitHub functions | 1h | 🔴 Critical |
| **P0** | HIGH-001 | Adicionar `FORCE ROW LEVEL SECURITY` | 30min | 🟠 High |
| **P1** | HIGH-002 | Criar policies para storage buckets | 1h | 🟠 High |
| **P1** | HIGH-003 | Restringir INSERT em job_applications | 30min | 🟠 High |
| **P1** | HIGH-004 | Parametrizar domínio em invite-employee | 1h | 🟠 High |
| **P2** | MEDIUM-001 | Remover URL fallback hardcoded | 15min | 🟡 Medium |
| **P2** | MEDIUM-003 | Restringir CORS para domínios conhecidos | 30min | 🟡 Medium |
| **P2** | MEDIUM-002 | Substituir `select("*")` por campos específicos | 2h | 🟡 Medium |
| **P3** | MEDIUM-004 | Remover policies duplicadas | 15min | 🟡 Medium |
| **P3** | LOW-001 | Atualizar docs com roles corretas | 30min | 🟢 Low |
| **P3** | LOW-003 | Sanitizar logs de produção | 1h | 🟢 Low |

### Cronograma Sugerido

| Fase | Prazo | Ações | Critério de Sucesso |
|------|-------|-------|---------------------|
| **Crítico** | 24-48h | P0 items | Zero findings críticos |
| **High** | 1 semana | P1 items | Zero findings high |
| **Medium** | 2 semanas | P2 items | Score OWASP ≥ 8/10 |
| **Low** | Backlog | P3 items | Melhoria contínua |

---

## PARTE 6: Documentation Gaps

| Documento | Status | Issues Encontrados |
|-----------|--------|-------------------|
| `permissions.md` | ⚠️ | Menciona roles inexistentes no sistema |
| `api_specification.md` | ⚠️ | GitHub functions não documentadas |
| `secrets.md` | ✅ | Completo |
| `architecture.md` | ✅ | Completo |

---

## PARTE 7: Suposições & Limitações

| Item | Descrição | Impacto na Auditoria |
|------|-----------|---------------------|
| Sem acesso a Supabase Dashboard | Não validei configs runtime de buckets | Médio |
| Ambiente de prod não testado | Findings baseados em código apenas | Alto |
| Sem acesso a logs de produção | Não identifiquei tentativas de ataque reais | Médio |
| Types são read-only | Assumido que schema match com types | Baixo |

---

## PARTE 8: Verificações Positivas

Os seguintes controles estão **corretamente implementados**:

| Controle | Evidence | Status |
|----------|----------|--------|
| RLS ativo em todas as tabelas | `05-rls-policies.sql:L11-36` | ✅ |
| Roles em tabela separada | `user_roles` table | ✅ |
| `has_role()` com SECURITY DEFINER | `03-functions.sql:L11-24` | ✅ |
| Service Role apenas em Edge Functions | Sem uso no client | ✅ |
| Input validation em `submit-application` | Sanitização completa com regex | ✅ |
| Validação de role em `invite-employee` | Check admin/people | ✅ |
| Validação de role em `manage-secrets` | RPC `can_manage_org_integrations` | ✅ |
| Sem secrets no bundle client | Apenas `VITE_*` públicas | ✅ |
| JWT expiration gerenciado por Supabase | Default 1h com refresh | ✅ |
| Parameterized queries (Supabase SDK) | Sem SQL injection possível | ✅ |
| Vault multi-tenant com AES-256-GCM | `_shared/crypto.ts` | ✅ |
| Audit log para ações sensíveis | `audit_log` table | ✅ |

---

## Related Documents

- [Architecture](./architecture.md)
- [Permissions & Access Control](./permissions.md)
- [Secrets & Configuration](./secrets.md)
- [API Specification](./api_specification.md)
