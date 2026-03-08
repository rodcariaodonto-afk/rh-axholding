# Catalogo de APIs -- Edge Functions

## 1. Visao Geral das APIs

O Orb RH expoe **11 Edge Functions** como backend serverless, executadas no runtime Deno (Supabase-compatible / Lovable Cloud). Todas as funcoes seguem padroes consistentes de autenticacao, rate limiting e CORS.

**Base URL**: `https://<PROJECT_REF>.supabase.co/functions/v1/`

**Padroes comuns**:
- CORS aberto (`Access-Control-Allow-Origin: *`) em todas as funcoes
- Rate limiting atomico via RPC PostgreSQL (`check_rate_limit`) com politica fail-open
- Respostas de erro seguem RFC 7807 (Problem Details) na maioria das funcoes
- Autenticacao JWT Supabase via header `Authorization: Bearer {token}`
- Cada request recebe um `requestId` de 8 caracteres para rastreabilidade
- Clientes admin (service role) criados internamente para operacoes privilegiadas

**Distribuicao por dominio**:

| Dominio | Funcoes | Qtd |
|---------|---------|-----|
| AI / Inteligencia Artificial | analyze-candidate, generate-position-description | 2 |
| Gestao de Pessoas | invite-employee, delete-employee, terminate-employee, change-user-role | 4 |
| Candidaturas | submit-application | 1 |
| Integracao / Secrets | manage-secrets | 1 |
| GitHub Proxy | github-repos, github-releases, github-tags | 3 |

> **[EVIDENCIA]** `supabase/config.toml:L1-L35` -- configuracao de todas as 11 funcoes e flag `verify_jwt`

---

## 2. Catalogo de Endpoints

### 2.1 Funcoes de IA

#### `analyze-candidate`

| Campo | Valor |
|-------|-------|
| Rota | `POST /functions/v1/analyze-candidate` |
| Auth | **authenticated** (admin ou people) + service role key para chamadas internas |
| Headers | `Authorization: Bearer {token}`, `Content-Type: application/json` |
| verify_jwt | `true` |
| Request | `{ candidateEmail: string, jobId: uuid, jobData: object, candidateData: object, profilerResult: object\|null, resumeUrl: string\|null, desiredPosition?: string, desiredSeniority?: string }` |
| Response 200 | `{ nota_aderencia: number\|null, relatorio_detalhado: string }` |
| Response 401 | `{ error: "Unauthorized", detail: "Missing authorization header" }` |
| Response 403 | `{ error: "Forbidden", detail: "Requires admin or people role" }` |
| Response 429 | RFC 7807 com `Retry-After` header |
| Rate Limit | 50 req/60s por usuario |
| Idempotencia | Nao -- cada chamada gera nova analise AI e atualiza `job_applications` |
| Integracao externa | Anthropic Messages API (`claude-sonnet-4-20250514`, max_tokens=4096) |
| Comportamento especial | Suporta envio de PDF (curriculo) como document base64 para Claude. Para Banco de Talentos (`jobId == 00000000-0000-0000-0000-000000000001`), busca descritivo de cargo em `job_descriptions`. Atualiza `ai_analysis_status` em `job_applications` (processing -> completed/error). API key buscada do vault da organizacao com fallback para env global. |

> **[EVIDENCIA]** `supabase/functions/analyze-candidate/index.ts:L1-L443`
> - Validacao de auth: L53-L132
> - Rate limit skip para service role: L187-L191
> - Resolucao de org e busca de API key no vault: L203-L239
> - Chamada Anthropic: L340-L358
> - Parse de resultado com fallback regex: L381-L402

---

#### `generate-position-description`

| Campo | Valor |
|-------|-------|
| Rota | `POST /functions/v1/generate-position-description` |
| Auth | **authenticated** (admin ou people) |
| Headers | `Authorization: Bearer {token}`, `Content-Type: application/json` |
| verify_jwt | `true` |
| Request | `{ title: string, expected_profile_code?: string, activities?: string, parent_position_title?: string }` |
| Response 200 | `{ description: string }` (Markdown) |
| Response 400 | RFC 7807: `{ type, title: "Validation Error", status: 400, detail: "O campo 'title' e obrigatorio" }` |
| Response 401 | RFC 7807: `{ type, title: "Unauthorized", ... }` |
| Response 403 | RFC 7807: `{ type, title: "Forbidden", detail: "Requires admin or people role" }` |
| Response 424 | RFC 7807: `{ type, title: "Integration Not Configured", ... }` (sem API key) |
| Response 429 | RFC 7807 com `Retry-After` header |
| Response 502 | RFC 7807: `{ type, title: "AI Service Error", ... }` (Anthropic falhou) |
| Rate Limit | 50 req/60s por usuario |
| Idempotencia | Nao -- cada chamada gera nova descricao via AI |
| Integracao externa | Anthropic Messages API (`claude-sonnet-4-20250514`, max_tokens=2048) |
| Comportamento especial | Suporta perfis DISC (EXE, COM, PLA, ANA e combinacoes) para enriquecer o prompt. API key buscada do vault da organizacao com fallback para env global. |

> **[EVIDENCIA]** `supabase/functions/generate-position-description/index.ts:L1-L305`
> - Validacao de auth com roles: L38-L134
> - Perfis DISC: L137-L146
> - Busca de API key vault + fallback: L194-L226
> - Chamada Anthropic: L247-L265

---

### 2.2 Gestao de Pessoas

#### `invite-employee`

| Campo | Valor |
|-------|-------|
| Rota | `POST /functions/v1/invite-employee` |
| Auth | **authenticated** (admin ou people) |
| Headers | `Authorization: Bearer {token}`, `Content-Type: application/json` |
| verify_jwt | `true` |
| Validacao | Zod schema (`InvitePayloadSchema`) |
| Request | `{ email: string, full_name: string, department_id?: uuid, manager_id?: uuid, base_position_id?: uuid, position_level_detail?: enum, unit_id?: uuid, employment_type?: enum, contract_type?: enum, hire_date?: string, base_salary?: number }` |
| Enums - position_level_detail | `estagiario, trainee, junior_i, junior_ii, junior_iii, pleno_i, pleno_ii, pleno_iii, senior_i, senior_ii, senior_iii, especialista, lider` |
| Enums - employment_type | `full_time, part_time, contractor, intern, temporary` |
| Enums - contract_type | `clt, pj, estagio, temporario, aprendiz` |
| Response 200 | `{ success: true, message: string, data: { email, full_name, organization_name } }` |
| Response 400 | RFC 7807 + array `errors` (validacao Zod) ou dominio invalido |
| Response 401 | RFC 7807: token ausente ou invalido |
| Response 403 | RFC 7807: sem permissao admin/people |
| Response 409 | RFC 7807: email ja cadastrado ou convite pendente |
| Response 429 | RFC 7807 com `Retry-After` |
| Response 500 | RFC 7807: erro ao enviar convite |
| Rate Limit | 10 req/60s por usuario |
| Idempotencia | Parcial -- se existir convite anterior em status nao-invited (draft/cancelled/expired), atualiza em vez de criar novo. Rejeita se ja existe convite `invited`. |
| Comportamento especial | Valida dominio do email contra `organizations.allowed_domains`. Verifica se usuario ja existe em `auth.users`. Cria registro em `pending_employees` e envia convite via `supabase.auth.admin.inviteUserByEmail()`. |

> **[EVIDENCIA]** `supabase/functions/invite-employee/index.ts:L1-L328`
> - Zod schema: L13-L34
> - Validacao de dominio: L152-L172
> - Verificacao de usuario existente: L175-L188
> - Convite pendente (idempotencia parcial): L191-L259
> - Envio de convite: L262-L282

---

#### `delete-employee`

| Campo | Valor |
|-------|-------|
| Rota | `POST /functions/v1/delete-employee` |
| Auth | **authenticated** (somente admin) |
| Headers | `Authorization: Bearer {token}`, `Content-Type: application/json` |
| verify_jwt | `true` |
| Request | `{ employee_id: uuid, confirmation_name: string, reason: "lgpd_request"\|"cadastro_erro"\|"other", reason_details?: string }` |
| Response 200 | `{ success: true, message: "Colaborador excluido permanentemente", employee_name: string }` |
| Response 400 | `{ error: string }` -- campos obrigatorios faltando, nome de confirmacao incorreto, ou tentativa de auto-exclusao |
| Response 401 | `{ error: "Nao autorizado" }` |
| Response 403 | `{ error: string }` -- nao-admin ou colaborador de outra organizacao |
| Response 404 | `{ error: "Colaborador nao encontrado" }` |
| Response 429 | RFC 7807 com `Retry-After` |
| Response 500 | `{ error: "Erro interno ao excluir colaborador" }` |
| Rate Limit | 5 req/60s por usuario (o mais restritivo) |
| Idempotencia | Nao -- operacao destrutiva irreversivel |
| Comportamento especial | **Operacao LGPD-critica**. Requer confirmacao por nome do colaborador (case-insensitive). Impede auto-exclusao. Registra audit log *antes* da exclusao (`insert_audit_log` com `p_is_sensitive: true`). Executa **cascata completa**: PDIs (attachments, logs, comments, goals), time_off, feedbacks, profiler_history, devices, contracts, contacts, organization_members, user_roles, employee record, e finalmente `auth.admin.deleteUser()`. Limpa referencias de manager em employees e departments. |

> **[EVIDENCIA]** `supabase/functions/delete-employee/index.ts:L1-L264`
> - Validacao admin-only: L55-L67
> - Confirmacao por nome: L114-L123
> - Impedimento de auto-exclusao: L126-L131
> - Audit log pre-exclusao: L136-L149
> - Cascata de exclusao: L155-L244

---

#### `terminate-employee`

| Campo | Valor |
|-------|-------|
| Rota | `POST /functions/v1/terminate-employee` |
| Auth | **authenticated** (somente admin) |
| Headers | `Authorization: Bearer {token}`, `Content-Type: application/json` |
| verify_jwt | `true` |
| Request | `{ employee_id: uuid, termination_date: string, termination_reason: string, termination_decision?: string, termination_cause?: string, termination_cost?: number, termination_notes?: string }` |
| Response 200 | `{ success: true, message: "Colaborador desligado com sucesso", employee_name: string }` |
| Response 400 | `{ error: string }` -- campos obrigatorios faltando ou auto-desligamento |
| Response 401 | `{ error: "Nao autorizado" }` |
| Response 403 | `{ error: string }` -- nao-admin ou colaborador de outra org |
| Response 404 | `{ error: "Colaborador nao encontrado" }` |
| Response 429 | RFC 7807 com `Retry-After` |
| Response 500 | `{ error: "Erro interno ao desligar colaborador" }` |
| Rate Limit | 10 req/60s por usuario |
| Idempotencia | Nao -- modifica estado do colaborador |
| Comportamento especial | Diferente de `delete-employee`: nao exclui dados, apenas muda status para `"terminated"`. Registra audit log pre-operacao. Limpa manager references. Desvincula devices. Remove organization_members e user_roles (corta acesso). Aplica ban permanente via `auth.admin.updateUserById` com `ban_duration: "876600h"` (~100 anos). Colaborador permanece no banco para historico. |

> **[EVIDENCIA]** `supabase/functions/terminate-employee/index.ts:L1-L238`
> - Interface TerminateRequest: L11-L19
> - Impedimento de auto-desligamento: L125-L131
> - Audit log: L136-L156
> - Ban permanente: L211-L218
> - Update de status: L191-L207

---

#### `change-user-role`

| Campo | Valor |
|-------|-------|
| Rota | `POST /functions/v1/change-user-role` |
| Auth | **authenticated** (admin, owner, ou role `admin` via slug) |
| Headers | `Authorization: Bearer {token}`, `Content-Type: application/json` |
| verify_jwt | `true` |
| Request | `{ target_user_id: uuid, new_role_id: uuid, reason: string }` (reason >= 10 chars) |
| Response 200 | `{ success: true, message: string, old_role: { id, slug, name }, new_role: { id, slug, name } }` |
| Response 400 | RFC 7807: campos obrigatorios ou motivo < 10 caracteres |
| Response 401 | RFC 7807: token ausente ou invalido |
| Response 403 | RFC 7807: auto-modificacao, nao-admin, ou sem organizacao |
| Response 404 | RFC 7807: usuario-alvo ou perfil nao encontrado |
| Response 409 | RFC 7807: tentativa de remover ultimo admin |
| Response 429 | RFC 7807 com `Retry-After` |
| Response 500 | RFC 7807: erro interno |
| Rate Limit | 10 req/60s por usuario |
| Idempotencia | Sim (idem potente se role ja for o mesmo) -- upsert de role_id |
| Comportamento especial | Impede auto-modificacao de role. Verifica se requester e admin via 3 caminhos: `roles.slug == 'admin'`, `organization_members.role == 'admin'`, ou `is_owner == true`. Protecao contra remocao do ultimo admin (`count_org_admins` RPC). Registra em `permission_audit_log` com old/new values e motivo. |

> **[EVIDENCIA]** `supabase/functions/change-user-role/index.ts:L1-L225`
> - Self-modification check: L83-L88
> - Tripla verificacao de admin: L113
> - Protecao ultimo admin: L159-L168
> - Audit log em permission_audit_log: L182-L193

---

### 2.3 Candidaturas

#### `submit-application`

| Campo | Valor |
|-------|-------|
| Rota | `POST /functions/v1/submit-application` |
| Auth | **publico** (sem JWT) |
| Headers | `Content-Type: application/json` |
| verify_jwt | `false` |
| Request | `{ job_id: uuid, candidate_name: string, candidate_email: string, candidate_birth_date: "YYYY-MM-DD", resume_url?: string, profiler_result_code?: string, profiler_result_detail?: object, candidate_state?: string, candidate_city?: string, candidate_phone?: string, candidate_race?: enum, candidate_gender?: enum, candidate_sexual_orientation?: enum, candidate_pcd?: boolean, candidate_pcd_type?: string, desired_position?: string, desired_seniority?: enum }` |
| Enums - candidate_race | `branco, preto, pardo, amarelo, indigena, nao_declarar` |
| Enums - candidate_gender | `masculino, feminino, nao_binarie, fluido, nao_binario, outro, prefiro_nao_informar, nao_declarar` |
| Enums - candidate_sexual_orientation | `heterossexual, homossexual, bissexual, assexual, pansexual, outro, prefiro_nao_responder, nao_declarar` |
| Enums - desired_seniority | `estagiario, junior, pleno, senior, especialista, lideranca` |
| Response 201 | `{ success: true, applicationId: uuid, message: "Application submitted successfully" }` |
| Response 400 | `{ error: string }` -- validacao (email, nome, data nascimento, job nao ativo, JSON invalido) |
| Response 404 | `{ error: "Job not found" }` |
| Response 405 | `{ error: "Method not allowed" }` (apenas POST aceito) |
| Response 409 | `{ error: "You have already applied for this position" }` |
| Response 429 | RFC 7807 com `Retry-After` |
| Response 500 | `{ error: "Failed to submit application" }` |
| Rate Limit | 30 req/60s por IP (sem userId) |
| Idempotencia | Nao -- mas possui deduplicacao: rejeita email+job duplicado com 409 |
| Comportamento especial | Unica funcao publica (`verify_jwt: false`). Rate limit por IP. Validacao extensiva: email regex, UUID format, data de nascimento (16-100 anos), sanitizacao de strings (maxLength), sanitizacao de telefone (regex), whitelist de enums. Verifica se vaga esta ativa (`status == "active"`). Dispara `analyze-candidate` em background (fire-and-forget) via chamada HTTP interna usando service role key, se `resume_url` presente. |

> **[EVIDENCIA]** `supabase/functions/submit-application/index.ts:L1-L294`
> - verify_jwt false: `supabase/config.toml:L31`
> - Helpers de validacao: L11-L38
> - Whitelist de enums: L41-L54
> - Rate limit por IP: L74
> - Deduplicacao: L181-L193
> - Fire-and-forget AI analysis: L219-L275

---

### 2.4 Integracao / Secrets

#### `manage-secrets`

| Campo | Valor |
|-------|-------|
| Rota | `GET\|POST\|DELETE /functions/v1/manage-secrets` |
| Auth | **authenticated** (permissao verificada por RPC: `can_manage_org_integrations` ou `can_manage_critical_integrations`) |
| Headers | `Authorization: Bearer {token}`, `Content-Type: application/json` |
| verify_jwt | `true` |
| Validacao | Zod schemas por operacao |

**GET -- Listar integracoes**

| Campo | Valor |
|-------|-------|
| Query Params | `?organization_id={uuid}` |
| Response 200 | `[ { id, organization_id, provider, environment, display_name, last_four, status, is_active, last_used_at, last_tested_at, last_test_success, last_error, sensitivity, last_rotated_at, created_at, updated_at } ]` |

**POST -- Criar/Atualizar integracao**

| Campo | Valor |
|-------|-------|
| Request | `{ organization_id: uuid, provider: "anthropic"\|"fireflies"\|"openai"\|"github", api_key: string(10-500), display_name?: string(max100), test_connection?: boolean, sensitivity?: "standard"\|"high"\|"critical" }` |
| Response 200 | `{ id, provider, last_four, status, sensitivity, action: "created"\|"rotated", message: string }` |
| Response 400 | RFC 7807: validacao Zod, formato de chave invalido, ou teste de conexao falhou |
| Response 403 | RFC 7807: sem permissao (diferenciado por sensitivity) |

**POST -- Testar conexao existente**

| Campo | Valor |
|-------|-------|
| Request | `{ organization_id: uuid, id: uuid, action: "test" }` |
| Response 200 | `{ success: boolean, message: string, error?: string }` |
| Response 400 | RFC 7807: sem API key (integracao legada) |
| Response 403 | RFC 7807: sem permissao |
| Response 404 | RFC 7807: integracao nao encontrada |

**DELETE -- Remover integracao**

| Campo | Valor |
|-------|-------|
| Body ou Query | `{ organization_id: uuid, id: uuid }` ou `?organization_id={uuid}&id={uuid}` |
| Response 200 | `{ success: true, message: "Integracao removida com sucesso" }` |
| Response 403 | RFC 7807: sem permissao |
| Response 404 | RFC 7807: integracao nao encontrada |

| Campo | Valor |
|-------|-------|
| Response 401 | RFC 7807: token ausente ou invalido |
| Response 405 | RFC 7807: metodo nao suportado |
| Response 429 | RFC 7807 com `Retry-After` |
| Response 500 | RFC 7807: erro interno |
| Rate Limit | 20 req/60s por usuario |
| Idempotencia | POST (create) -- Sim via upsert em `organization_id,provider,environment`. DELETE -- Sim (idempotente por natureza). |
| Comportamento especial | Multi-metodo (GET/POST/DELETE). Criptografia AES-256-GCM com PBKDF2 para armazenamento de chaves. Validacao de formato por provider (regex). Teste de conexao opcional com API real (exceto Anthropic -- apenas formato). Rastreamento de rotacao de chaves (`last_rotated_at`). Auto-upgrade de criptografia legada. Audit trail completo em `integration_access_logs`. DELETE aceita parametros em body *ou* query string (fallback para clientes que nao enviam body em DELETE). Permissoes diferenciadas para `sensitivity: "critical"`. |

> **[EVIDENCIA]** `supabase/functions/manage-secrets/index.ts:L1-L685`
> - Zod schemas: L19-L41
> - Roteamento por metodo: L129-L147
> - Upsert com onConflict: L345-L351
> - Permissao diferenciada por sensitivity: L240-L264
> - DELETE com body ou query: L401-L414
> - Audit logging: L368-L374, L495-L501, L628-L636, L666-L673

---

### 2.5 GitHub Proxy

As tres funcoes GitHub seguem o mesmo padrao: autenticacao JWT + getClaims(), resolucao de organizacao via RPC `get_user_organization`, busca de token GitHub no vault com fallback para env global.

#### `github-repos`

| Campo | Valor |
|-------|-------|
| Rota | `POST /functions/v1/github-repos` |
| Auth | **authenticated** |
| Headers | `Authorization: Bearer {token}`, `Content-Type: application/json` |
| verify_jwt | `true` |
| Request | `{ owner: string }` |
| Response 200 | Array de objetos do GitHub API (repos, max 100) |
| Response 400 | `{ error: "Owner parameter is required" }` |
| Response 401 | `{ error: "Unauthorized", detail: string }` |
| Response 429 | RFC 7807 com `Retry-After` |
| Response 500 | `{ error: string }` (token nao configurado ou erro interno) |
| Rate Limit | 30 req/60s por usuario |
| Idempotencia | Sim (leitura) |
| Integracao externa | GitHub REST API v3 (`/orgs/{owner}/repos` com fallback para `/users/{owner}/repos`) |
| Comportamento especial | Tenta como organizacao primeiro; se 404, tenta como usuario. Retorna ate 100 repos ordenados por `updated`. |

> **[EVIDENCIA]** `supabase/functions/github-repos/index.ts:L1-L170`
> - Fallback org -> user: L122-L143
> - Token do vault: L100-L117

---

#### `github-releases`

| Campo | Valor |
|-------|-------|
| Rota | `POST /functions/v1/github-releases` |
| Auth | **authenticated** |
| Headers | `Authorization: Bearer {token}`, `Content-Type: application/json` |
| verify_jwt | `true` |
| Request | `{ owner: string, repo: string }` |
| Response 200 | Array de objetos do GitHub API (releases, max 100) |
| Response 400 | `{ error: "Owner and repo parameters are required" }` |
| Response 401 | `{ error: "Unauthorized", detail: string }` |
| Response 429 | RFC 7807 com `Retry-After` |
| Response 500 | `{ error: string }` |
| Rate Limit | 30 req/60s por usuario |
| Idempotencia | Sim (leitura) |
| Integracao externa | GitHub REST API v3 (`/repos/{owner}/{repo}/releases?per_page=100`) |

> **[EVIDENCIA]** `supabase/functions/github-releases/index.ts:L1-L147`
> - Chamada GitHub: L116-L124

---

#### `github-tags`

| Campo | Valor |
|-------|-------|
| Rota | `POST /functions/v1/github-tags` |
| Auth | **authenticated** |
| Headers | `Authorization: Bearer {token}`, `Content-Type: application/json` |
| verify_jwt | `true` |
| Request | `{ owner: string, repo: string }` |
| Response 200 | Array de objetos do GitHub API (tags, max 100) |
| Response 400 | `{ error: "Owner and repo parameters are required" }` |
| Response 401 | `{ error: "Unauthorized", detail: string }` |
| Response 429 | RFC 7807 com `Retry-After` |
| Response 500 | `{ error: string }` |
| Rate Limit | 30 req/60s por usuario |
| Idempotencia | Sim (leitura) |
| Integracao externa | GitHub REST API v3 (`/repos/{owner}/{repo}/tags?per_page=100`) |

> **[EVIDENCIA]** `supabase/functions/github-tags/index.ts:L1-L147`
> - Chamada GitHub: L116-L124

---

## 3. Utilitarios Compartilhados (`_shared`)

### 3.1 `cors.ts`

Exporta constante `corsHeaders` e funcao `handleCors()`.

```
corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type,
    x-supabase-client-platform, x-supabase-client-platform-version,
    x-supabase-client-runtime, x-supabase-client-runtime-version',
}
```

- `handleCors(req)`: Retorna `Response(null, { status: 204 })` para `OPTIONS`, ou `null` para outros metodos.
- **Uso**: Importado por `manage-secrets`. As demais funcoes definem seus proprios corsHeaders inline (subconjunto menor de allowed headers).

> **[EVIDENCIA]** `supabase/functions/_shared/cors.ts:L1-L15`

### 3.2 `rate-limit.ts`

Modulo de rate limiting atomico via PostgreSQL RPC.

**Configuracao por funcao** (todas em janelas de 60 segundos):

| Funcao | maxRequests/60s |
|--------|----------------|
| analyze-candidate | 50 |
| generate-position-description | 50 |
| submit-application | 30 |
| github-repos | 30 |
| github-releases | 30 |
| github-tags | 30 |
| manage-secrets | 20 |
| invite-employee | 10 |
| terminate-employee | 10 |
| change-user-role | 10 |
| delete-employee | 5 |
| (default) | 30 |

**Funcoes exportadas**:
- `checkRateLimit(supabaseAdmin, key, functionName, config?)` -- Chama RPC `check_rate_limit` atomicamente. **Fail-open**: se o RPC falhar, a request e permitida. Retorna 429 com headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` e body RFC 7807.
- `getRateLimitKey(req, userId?)` -- Gera chave composta: `user:{userId}` para autenticados, `ip:{ip}` para anonimos. Tenta headers: `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`.
- `withRateLimitHeaders(baseHeaders, rlHeaders)` -- Merge de headers.

> **[EVIDENCIA]** `supabase/functions/_shared/rate-limit.ts:L1-L194`
> - Limites por funcao: L45-L66
> - Fail-open: L119-L123, L157-L160
> - Resposta 429: L135-L153
> - Key por IP: L168-L183

### 3.3 `get-integration-secret.ts`

Busca e descriptografa API keys de integracao do banco de dados.

**Funcao**: `getIntegrationSecret(supabaseAdmin, organizationId, provider, options?)`

**Opcoes**:
- `updateLastUsed` (default: false) -- Atualiza `last_used_at` com debounce de 10 minutos
- `logDecryption` (default: true) -- Registra evento em `integration_access_logs`
- `callerFunction` -- Nome da funcao chamadora para audit trail
- `userId` -- ID do usuario para audit

**Comportamento**:
1. Busca em `organization_integrations` (org_id + provider + environment=production)
2. Verifica `is_active` e `status != 'error'`
3. Descriptografa com `decrypt()`
4. Auto-upgrade: se formato legado, re-criptografa com PBKDF2 (`reencrypt()`)
5. Em caso de falha de descriptografia, marca integracao como `status: 'error'` e loga evento
6. Retorna `string | null`

> **[EVIDENCIA]** `supabase/functions/_shared/get-integration-secret.ts:L1-L146`
> - Query com filtros: L46-L52
> - Auto-upgrade: L80-L89
> - Falha marca status error: L94-L101
> - Debounce 10min: L132-L141

### 3.4 `crypto.ts`

Modulo de criptografia AES-256-GCM com Web Crypto API.

**Algoritmo**: AES-256-GCM
- IV: 96 bits (12 bytes)
- Salt: 128 bits (16 bytes)
- PBKDF2: 100.000 iteracoes, SHA-256
- Chave base: `SUPABASE_SERVICE_ROLE_KEY`

**Formatos**:
- **Novo**: `salt_hex:iv_hex:ciphertext_hex` (3 partes separadas por `:`)
- **Legado**: `iv_hex:ciphertext_hex` (2 partes -- SHA-256 simples da service key)

**Funcoes exportadas**:
- `encrypt(plaintext)` -- Criptografa com PBKDF2 (formato novo)
- `decrypt(encrypted)` -- Descriptografa ambos formatos (detecta pelo numero de partes)
- `reencrypt(encrypted)` -- Re-criptografa do formato legado para novo
- `maskApiKey(key)` -- Retorna ultimos 4 caracteres (ou `'xxxx'`)
- `needsReencryption(encrypted)` -- Verifica se esta no formato legado

> **[EVIDENCIA]** `supabase/functions/_shared/crypto.ts:L1-L217`
> - PBKDF2 key derivation: L42-L72
> - Legacy key derivation: L78-L97
> - Deteccao de formato: L102-L104
> - Encrypt novo formato: L110-L134
> - Decrypt com suporte legado: L140-L182

### 3.5 `validators.ts`

Validadores de formato de API key por provider e metadados.

**Validadores de formato** (`validators`):

| Provider | Regra |
|----------|-------|
| fireflies | `key.length >= 32` |
| anthropic | `startsWith('sk-ant-') && length > 20` |
| openai | `startsWith('sk-') && length > 20` |
| github | `startsWith('ghp_') \|\| startsWith('github_pat_') \|\| length >= 40` |

**Testers de conexao** (`testers`):

| Provider | Metodo |
|----------|--------|
| fireflies | POST GraphQL `{ user { email } }` |
| anthropic | Apenas validacao de formato (evita custo) |
| openai | GET `/v1/models` (sem custo) |
| github | GET `/user` com Accept `vnd.github+json` |

**Metadados de provider** (`providerMeta`): Nome, descricao e placeholder para UI.

> **[EVIDENCIA]** `supabase/functions/_shared/validators.ts:L1-L88`
> - Validators: L2-L7
> - Testers: L18-L64
> - Provider meta: L67-L88

---

## 4. Padroes de Erro

As funcoes mais recentes (invite-employee, manage-secrets, change-user-role, generate-position-description) usam formato **RFC 7807 Problem Details** com Content-Type `application/problem+json`:

```json
{
  "type": "about:blank",
  "title": "Titulo do Erro",
  "status": 429,
  "detail": "Mensagem detalhada para o usuario",
  "requestId": "abc12345",
  "retry_after": 60
}
```

As funcoes mais antigas (analyze-candidate, submit-application, delete-employee, terminate-employee, github-*) usam formato simplificado com Content-Type `application/json`:

```json
{
  "error": "Titulo do erro",
  "detail": "Mensagem detalhada"
}
```

**Mapeamento de status codes**:

| Status | Significado | Usado em |
|--------|-------------|----------|
| 400 | Validacao de input (campos faltando, formato invalido) | Todas |
| 401 | Token ausente, invalido ou expirado | Todas (exceto submit-application) |
| 403 | Permissao insuficiente (role, org, auto-operacao) | analyze-candidate, invite-employee, delete-employee, terminate-employee, change-user-role, manage-secrets, generate-position-description |
| 404 | Recurso nao encontrado (employee, job, integration, role) | submit-application, delete-employee, terminate-employee, change-user-role, manage-secrets |
| 405 | Metodo HTTP nao suportado | submit-application, manage-secrets |
| 409 | Conflito (duplicata, ultimo admin) | submit-application, invite-employee, change-user-role |
| 424 | Dependencia falhou (integracao AI nao configurada) | generate-position-description |
| 429 | Rate limit excedido | Todas |
| 500 | Erro interno do servidor | Todas |
| 502 | Bad Gateway (Anthropic API indisponivel) | generate-position-description |

> **[EVIDENCIA]**
> - RFC 7807 em invite-employee: `supabase/functions/invite-employee/index.ts:L62-L69`
> - RFC 7807 em rate-limit: `supabase/functions/_shared/rate-limit.ts:L136-L148`
> - Formato simples em delete-employee: `supabase/functions/delete-employee/index.ts:L34-L37`
> - Status 424 em generate-position-description: `supabase/functions/generate-position-description/index.ts:L217-L225`

---

## 5. Autenticacao & Headers

### Fluxo de validacao JWT

Todas as funcoes autenticadas seguem um dos dois padroes:

**Padrao 1 -- getClaims()** (analyze-candidate, github-*, change-user-role, generate-position-description):
1. Extrair `Authorization: Bearer {token}` do header
2. Criar Supabase client com anon key + token do usuario
3. Chamar `supabaseClient.auth.getClaims(token)`
4. Extrair `claims.claims.sub` como userId
5. Verificar roles via query em `user_roles`

**Padrao 2 -- getUser()** (invite-employee, manage-secrets, delete-employee, terminate-employee):
1. Extrair `Authorization: Bearer {token}` do header
2. Criar Supabase client com anon key + token do usuario
3. Chamar `supabaseUser.auth.getUser()`
4. Extrair `userData.user.id` como userId
5. Verificar roles via query em `user_roles` ou `organization_members`

**Caso especial -- Service Role** (analyze-candidate):
- Aceita o proprio `SUPABASE_SERVICE_ROLE_KEY` como Bearer token
- Usado para chamadas internas de `submit-application` -> `analyze-candidate`
- Quando service role, rate limit e ignorado

**Excecao -- Publico** (submit-application):
- `verify_jwt: false` no config.toml
- Sem autenticacao de usuario
- Rate limit por IP em vez de userId

### Headers customizados

| Header | Uso |
|--------|-----|
| `Authorization: Bearer {token}` | JWT Supabase (obrigatorio em funcoes autenticadas) |
| `Content-Type: application/json` | Todas as requests |
| `x-client-info` | Metadata do client Supabase (permitido via CORS) |
| `apikey` | Anon key Supabase (permitido via CORS) |
| `x-supabase-client-platform` | Platform metadata (permitido em cors.ts e algumas funcoes) |
| `X-RateLimit-Limit` | Response: limite total da janela |
| `X-RateLimit-Remaining` | Response: requests restantes |
| `X-RateLimit-Reset` | Response: timestamp de reset |
| `Retry-After` | Response 429: segundos para aguardar |

> **[EVIDENCIA]**
> - getClaims: `supabase/functions/analyze-candidate/index.ts:L86`
> - getUser: `supabase/functions/invite-employee/index.ts:L73`
> - Service role check: `supabase/functions/analyze-candidate/index.ts:L72-L77`
> - verify_jwt false: `supabase/config.toml:L31`

---

## 6. CORS

Todas as funcoes configuram `Access-Control-Allow-Origin: *` (CORS aberto).

Existem **duas variantes** de configuracao:

**Variante 1 -- Inline (maioria das funcoes)**:
```
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
}
```
Usada por: analyze-candidate, submit-application, delete-employee, terminate-employee, github-repos, github-releases, github-tags

**Variante 2 -- Shared (`_shared/cors.ts`)**:
```
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type,
    x-supabase-client-platform, x-supabase-client-platform-version,
    x-supabase-client-runtime, x-supabase-client-runtime-version"
}
```
Usada por: manage-secrets (via `handleCors()`). As funcoes invite-employee e generate-position-description definem a versao expandida de headers inline.

**Preflight handling**: Todas as funcoes interceptam `OPTIONS` e retornam `204 No Content` ou `200 OK` com os headers CORS. Nenhuma funcao restringe origens.

> **[EVIDENCIA]**
> - Shared cors.ts: `supabase/functions/_shared/cors.ts:L1-L15`
> - Inline variante 1: `supabase/functions/delete-employee/index.ts:L6-L9`
> - Inline variante 2: `supabase/functions/invite-employee/index.ts:L6-L8`
> - handleCors: `supabase/functions/manage-secrets/index.ts:L74-L75`

---

## 7. Testes & Exemplos de Chamada

### Exemplo 1: Submeter candidatura (publico)

```bash
curl -X POST \
  'https://<PROJECT_REF>.supabase.co/functions/v1/submit-application' \
  -H 'Content-Type: application/json' \
  -H 'apikey: <ANON_KEY>' \
  -d '{
    "job_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "candidate_name": "Maria Silva",
    "candidate_email": "maria@example.com",
    "candidate_birth_date": "1995-06-15",
    "candidate_phone": "(11) 98765-4321",
    "candidate_state": "SP",
    "candidate_city": "Sao Paulo",
    "desired_seniority": "pleno"
  }'
```

Resposta esperada (201):
```json
{
  "success": true,
  "applicationId": "uuid-da-candidatura",
  "message": "Application submitted successfully"
}
```

### Exemplo 2: Gerar descricao de cargo (autenticado)

```bash
curl -X POST \
  'https://<PROJECT_REF>.supabase.co/functions/v1/generate-position-description' \
  -H 'Authorization: Bearer <JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -H 'apikey: <ANON_KEY>' \
  -d '{
    "title": "Engenheiro de Software Senior",
    "expected_profile_code": "ANA_EXE",
    "activities": "Desenvolvimento de APIs REST, Code review, Mentoria de juniors",
    "parent_position_title": "Tech Lead"
  }'
```

Resposta esperada (200):
```json
{
  "description": "## Resumo do Cargo\n\nO Engenheiro de Software Senior..."
}
```

### Exemplo 3: Gerenciar integracao (criar secret)

```bash
curl -X POST \
  'https://<PROJECT_REF>.supabase.co/functions/v1/manage-secrets' \
  -H 'Authorization: Bearer <JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -H 'apikey: <ANON_KEY>' \
  -d '{
    "organization_id": "uuid-da-organizacao",
    "provider": "anthropic",
    "api_key": "sk-ant-api03-...",
    "test_connection": false,
    "sensitivity": "high"
  }'
```

Resposta esperada (200):
```json
{
  "id": "uuid-da-integracao",
  "provider": "anthropic",
  "last_four": "xxxx",
  "status": "active",
  "sensitivity": "high",
  "action": "created",
  "message": "Integracao configurada com sucesso"
}
```

---

## 8. Dependencias Externas

### 8.1 Anthropic Messages API

| Aspecto | Valor |
|---------|-------|
| Usado por | analyze-candidate, generate-position-description |
| Endpoint | `https://api.anthropic.com/v1/messages` |
| Modelo | `claude-sonnet-4-20250514` |
| max_tokens | 4096 (analyze-candidate), 2048 (generate-position-description) |
| Autenticacao | Header `x-api-key` + `anthropic-version: 2023-06-01` |
| Fonte da API key | 1) Vault da organizacao (via `getIntegrationSecret`), 2) Env `ANTHROPIC_API_KEY` (fallback) |
| Timeout | Nenhum timeout explicito configurado (depende do runtime Deno default) |
| Retry | Nenhum retry implementado |
| Tratamento de erro | Log + retorna resposta degradada (nota null) ou 502 |

> **[EVIDENCIA]**
> - Chamada em analyze-candidate: `supabase/functions/analyze-candidate/index.ts:L340-L358`
> - Chamada em generate-position-description: `supabase/functions/generate-position-description/index.ts:L247-L265`

### 8.2 GitHub REST API v3

| Aspecto | Valor |
|---------|-------|
| Usado por | github-repos, github-releases, github-tags |
| Base URL | `https://api.github.com` |
| Endpoints | `/orgs/{owner}/repos`, `/users/{owner}/repos`, `/repos/{owner}/{repo}/releases`, `/repos/{owner}/{repo}/tags` |
| Autenticacao | Header `Authorization: Bearer {token}`, `Accept: application/vnd.github.v3+json` |
| Fonte do token | 1) Vault da organizacao (provider "github"), 2) Env `GITHUB_TOKEN` (fallback) |
| Paginacao | `per_page=100` (fixo) |
| Timeout | Nenhum timeout explicito |
| Retry | Nenhum retry implementado |
| Tratamento de erro | Repassa status code do GitHub + mensagem de erro |

> **[EVIDENCIA]**
> - Fallback org -> user em repos: `supabase/functions/github-repos/index.ts:L122-L143`
> - Token do vault: `supabase/functions/github-repos/index.ts:L100-L117`

### 8.3 Testers de conexao (validators.ts)

| Provider | Endpoint testado |
|----------|------------------|
| fireflies | `https://api.fireflies.ai/graphql` |
| openai | `https://api.openai.com/v1/models` |
| github | `https://api.github.com/user` |
| anthropic | Sem chamada real (apenas formato) |

> **[EVIDENCIA]** `supabase/functions/_shared/validators.ts:L18-L64`

---

## 9. Beneficios & Racional

### Por que Edge Functions em vez de acesso direto ao banco?

1. **Operacoes privilegiadas**: Funcoes como `delete-employee` e `terminate-employee` precisam de cascatas complexas que ultrapassam o que RLS policies permitem (deletar em multiplas tabelas, manipular auth.users).

2. **Integracao com APIs externas**: As funcoes AI e GitHub precisam de chamadas HTTP para servicos terceiros, impossivel de fazer diretamente do client ou via PostgreSQL.

3. **Logica de negocios complexa**: `invite-employee` envolve validacao de dominio, verificacao de duplicatas em auth.users, criacao em pending_employees, e envio de convite -- uma transacao multi-step.

4. **Seguranca de secrets**: `manage-secrets` criptografa API keys com AES-256-GCM antes de gravar. A chave de criptografia (service role key) nunca e exposta ao client.

5. **Rate limiting centralizado**: Protecao contra abuso implementada de forma uniforme em todas as funcoes, incluindo o endpoint publico `submit-application`.

6. **Audit trail**: Operacoes criticas (exclusao, desligamento, mudanca de role) registram logs de auditoria *antes* da execucao -- impossivel de garantir apenas com triggers de banco.

### Trade-offs

| Vantagem | Desvantagem |
|----------|-------------|
| Logica de negocio isolada do client | Cold start de Edge Functions |
| Secrets nunca expostos ao browser | Duplicacao de CORS headers entre funcoes |
| Rate limiting por funcao | Sem transacoes atomicas (cascatas podem falhar parcialmente) |
| Audit trail pre-operacao | Sem retry automatico para APIs externas |
| Fail-open no rate limit (disponibilidade) | Fail-open no rate limit (seguranca reduzida se DB indisponivel) |

---

## 10. Melhorias Futuras

1. **Unificar formato de erro para RFC 7807**: As funcoes mais antigas (analyze-candidate, submit-application, delete-employee, terminate-employee, github-*) usam formato `{ error, detail }` simples. Padronizar todas para `application/problem+json` com `type`, `title`, `status`, `detail`.

2. **Centralizar middleware de autenticacao**: Existem dois padroes de auth (getClaims vs getUser) e validacao de roles duplicada em cada funcao. Um middleware compartilhado em `_shared/auth.ts` reduziria duplicacao e inconsistencias.

3. **Unificar CORS headers**: As funcoes definem CORS inline com subconjuntos diferentes de allowed headers. Todas deveriam importar de `_shared/cors.ts` para consistencia.

4. **Adicionar timeouts explicitos para APIs externas**: As chamadas a Anthropic e GitHub nao definem timeout. Um timeout de 30-60s com `AbortController` evitaria requests presas.

5. **Implementar retry com backoff para APIs externas**: Chamadas a Anthropic e GitHub nao fazem retry. Um retry com exponential backoff (1-2 tentativas) melhoraria resiliencia.

6. **Transacoes atomicas nas cascatas**: `delete-employee` executa ~15 operacoes sequenciais sem transacao. Se alguma falhar no meio, o estado fica inconsistente. Considerar uso de stored procedure ou transacao via RPC.

7. **Paginacao para GitHub proxy**: As funcoes GitHub limitam a 100 itens (`per_page=100`). Adicionar suporte a paginacao cursor-based para organizacoes com muitos repos/releases.

8. **Validacao Zod em todas as funcoes**: Apenas `invite-employee` e `manage-secrets` usam Zod. Padronizar validacao de input com Zod em todas as funcoes para consistencia e mensagens de erro estruturadas.

---

## 11. Suposicoes & Incertezas

| Item | Suposicao/Incerteza | Impacto |
|------|----------------------|---------|
| Base URL | Assumida como `https://<PROJECT_REF>.supabase.co/functions/v1/` (padrao Supabase). Lovable Cloud pode usar URL diferente. | Todos os exemplos de chamada |
| RPC `check_rate_limit` | Existe uma funcao PostgreSQL nao inspecionada que implementa a logica atomica de rate limiting. | Rate limiting pode ter comportamentos nao documentados |
| RPC `get_user_organization` | Usada pelas funcoes GitHub e generate-position-description para resolver org do usuario. Implementacao nao inspecionada. | Resolucao de organizacao pode ter logica adicional |
| RPC `count_org_admins` | Usada por change-user-role para protecao de ultimo admin. Implementacao nao inspecionada. | Protecao pode ter edge cases |
| RPC `can_manage_org_integrations` / `can_manage_critical_integrations` | Usadas por manage-secrets para verificacao de permissao. Implementacao nao inspecionada. | Logica de permissao pode ser mais complexa do que documentado |
| RPC `insert_audit_log` | Usada por delete-employee e terminate-employee. Implementacao nao inspecionada. | Estrutura exata do log de auditoria desconhecida |
| Timeout do runtime Deno | Nenhum timeout explicito nas chamadas `fetch()`. O runtime Deno/Supabase pode impor limites (tipicamente 150s para Edge Functions). | Chamadas AI podem timeout em curriculos grandes |
| `analyze-candidate` chamado internamente | `submit-application` chama `analyze-candidate` via HTTP com service role key. Se o deploy usa URL interna diferente, pode falhar. | Analise AI pode nao ser disparada |
| Formato de response do GitHub | As funcoes GitHub repassam a response do GitHub API diretamente. O schema exato depende da versao da API GitHub. | Clients devem tratar response do GitHub, nao um schema fixo |
| Cascata de delete-employee | A cascata cobre tabelas conhecidas, mas pode haver FKs adicionais nao listadas que causariam falha. | Exclusao pode falhar em edge cases |
