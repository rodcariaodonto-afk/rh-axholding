# Secrets & Configuration Management

Mapeamento completo de variáveis de configuracao, secrets e integrações do Orb RH, com classificação de riscos, fluxos de dependência e procedimentos de rotação.

**Uso**: Setup inicial, rotações de chaves, auditorias de segurança, resposta a incidentes, onboarding de desenvolvedores.

---

## 1. Hierarquia de Configuração

O sistema opera em três camadas distintas de configuração, cada uma com escopo e risco diferentes.

### Camadas

| Camada | Local | Acesso | Escopo | Exemplo |
|--------|-------|--------|--------|---------|
| **Edge Secrets** | Lovable Cloud / Supabase Dashboard | Server-only (`Deno.env.get()`) | Backend (Edge Functions) | `SUPABASE_SERVICE_ROLE_KEY` |
| **Client Constants (`VITE_*`)** | `.env` na raiz do projeto | Publico (bundled no JS final) | Frontend (browser) | `VITE_SUPABASE_URL` |
| **Build-time** | Lovable Platform / Vite config | Interno ao build | Processo de build | Vite plugins |

### Filosofia

- **Secrets sensiveis** (service-role key, API keys de terceiros) existem **apenas** como Edge Secrets, acessiveis via `Deno.env.get()` dentro de Edge Functions
- **URLs publicas e anon keys** vivem em variaveis `VITE_*` porque sao publicas por design -- a segurança depende de RLS no Supabase, nao do sigilo dessas chaves
- **Integrações por organizacao** (Anthropic, GitHub, etc.) sao armazenadas criptografadas no banco via tabela `organization_integrations`, com AES-256-GCM + PBKDF2

### Riscos de Violacao

| Violacao | Consequencia | Severidade |
|----------|-------------|------------|
| Service-role key em `VITE_*` ou no bundle | Acesso total ao banco, bypass de RLS, leitura/escrita de todos os dados de todos os tenants | 🔴 Critical |
| API key de terceiros no bundle | Uso nao autorizado, custos financeiros ilimitados | 🔴 Critical |
| Anon key em Edge Function | Nenhum risco adicional (anon key e publica por design) | 🟢 Low |

### ⚠️ PROBLEMA: `.env` nao esta no `.gitignore`

O arquivo `.env` contem `VITE_SUPABASE_PUBLISHABLE_KEY` (um JWT anon) e esta commitado no repositorio. Embora anon keys sejam publicas por design, a presença de `.env` no git cria um anti-pattern perigoso: qualquer desenvolvedor que adicionar um secret real nesse arquivo o commitará acidentalmente.

**Evidence**:
- `[EVIDENCIA] .gitignore:1-25` -- `.env` ausente da lista de exclusões
- `[EVIDENCIA] .env:1-3` -- Contém `VITE_SUPABASE_PUBLISHABLE_KEY` (JWT), `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`

---

## 2. Mapeamento Completo de Variaveis

### 2.1 Secrets de Infraestrutura (Provisionados pelo Supabase/Lovable)

Estes secrets sao automaticamente injetados como variaveis de ambiente nas Edge Functions pelo Supabase.

| Nome | Usado por | Escopo | Fonte | Ambientes | Rotacao | Risco |
|------|-----------|--------|-------|-----------|---------|-------|
| `SUPABASE_URL` | Todas as 11 Edge Functions | server | Supabase auto-inject | all | N/A (infra) | 🟢 Low |
| `SUPABASE_ANON_KEY` | analyze-candidate, github-repos, github-tags, github-releases, manage-secrets, change-user-role, delete-employee, terminate-employee, generate-position-description | server | Supabase auto-inject | all | N/A (infra) | 🟢 Low |
| `SUPABASE_SERVICE_ROLE_KEY` | Todas as 11 Edge Functions + `crypto.ts` (derivacao de chave) | server | Supabase auto-inject | all | On breach (requer re-encrypt) | 🔴 Critical |

**Evidence**:
- `[EVIDENCIA] supabase/functions/manage-secrets/index.ts:L95-L103` -- `Deno.env.get('SUPABASE_URL')`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `[EVIDENCIA] supabase/functions/_shared/crypto.ts:L43` -- `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` para derivacao PBKDF2
- `[EVIDENCIA] supabase/functions/submit-application/index.ts:L71-L72` -- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `[EVIDENCIA] supabase/functions/invite-employee/index.ts:L48-L49` -- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 2.2 Secrets de Integracoes Externas (Fallback Global)

Estes secrets sao usados como **fallback** quando a organizacao nao tem uma integracao propria configurada no vault.

| Nome | Usado por | Escopo | Fonte | Ambientes | Rotacao | Risco |
|------|-----------|--------|-------|-----------|---------|-------|
| `ANTHROPIC_API_KEY` | analyze-candidate, generate-position-description | server | Edge Secret manual | prod | 90 dias ou breach | 🟠 High |
| `GITHUB_TOKEN` | github-repos, github-tags, github-releases | server | Edge Secret manual | prod | 90 dias | 🟠 High |

**Evidence**:
- `[EVIDENCIA] supabase/functions/analyze-candidate/index.ts:L223` -- `Deno.env.get("ANTHROPIC_API_KEY")` como fallback
- `[EVIDENCIA] supabase/functions/generate-position-description/index.ts:L208` -- `Deno.env.get("ANTHROPIC_API_KEY")` como fallback
- `[EVIDENCIA] supabase/functions/github-repos/index.ts:L108` -- `Deno.env.get("GITHUB_TOKEN")` como fallback
- `[EVIDENCIA] supabase/functions/github-tags/index.ts:L104` -- `Deno.env.get("GITHUB_TOKEN")` como fallback
- `[EVIDENCIA] supabase/functions/github-releases/index.ts:L104` -- `Deno.env.get("GITHUB_TOKEN")` como fallback

### 2.3 Variaveis de Cliente (`VITE_*`)

Todas as variaveis com prefixo `VITE_` sao bundled pelo Vite e ficam visíveis no JavaScript final do browser.

| Nome | Usado por | Escopo | Valor em `.env` | Risco |
|------|-----------|--------|-----------------|-------|
| `VITE_SUPABASE_URL` | `client.ts`, `useOrganizationIntegrations.ts`, `useCreateJobApplication.ts`, `CandidateDrawer.tsx` | client | `https://xoyahzteplhuwjfwprjz.supabase.co` | 🟢 Low |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `client.ts`, `useOrganizationIntegrations.ts` | client | JWT anon token | 🟢 Low |
| `VITE_SUPABASE_PROJECT_ID` | `.env` (disponivel mas sem uso direto encontrado no codigo) | client | `xoyahzteplhuwjfwprjz` | 🟢 Low |
| `VITE_USE_GRANULAR_PERMISSIONS` | `featureFlags.ts` | client | Nao definida em `.env` (default: `false`) | 🟢 Low |

**Evidence**:
- `[EVIDENCIA] src/integrations/supabase/client.ts:L5-L6` -- `import.meta.env.VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- `[EVIDENCIA] src/hooks/useOrganizationIntegrations.ts:L37` -- `import.meta.env.VITE_SUPABASE_URL` para URL de Edge Function
- `[EVIDENCIA] src/hooks/useOrganizationIntegrations.ts:L120` -- `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` como apikey header
- `[EVIDENCIA] src/hooks/useCreateJobApplication.ts:L35` -- `import.meta.env.VITE_SUPABASE_URL`
- `[EVIDENCIA] src/components/CandidateDrawer.tsx:L156` -- `import.meta.env.VITE_SUPABASE_URL`
- `[EVIDENCIA] src/config/featureFlags.ts:L9` -- `import.meta.env.VITE_USE_GRANULAR_PERMISSIONS`
- `[EVIDENCIA] .env:L1-L3` -- Valores reais commitados

### 2.4 Secrets por Organizacao (Vault Interno)

Secrets de integrações armazenados criptografados na tabela `organization_integrations`. Gerenciados pela Edge Function `manage-secrets`.

| Provider | Formato da Key | Usado por | Escopo | Rotacao | Risco |
|----------|---------------|-----------|--------|---------|-------|
| `anthropic` | `sk-ant-*` (min 40 chars) | analyze-candidate, generate-position-description | per-org, server | Via UI | 🟠 High |
| `github` | `ghp_*`, `github_pat_*`, ou 40+ chars | github-repos, github-tags, github-releases | per-org, server | Via UI | 🟠 High |
| `openai` | `sk-*` (min 20 chars) | Nenhuma funcao atual (preparado para futuro) | per-org, server | Via UI | 🟡 Medium |
| `fireflies` | Min 32 chars | Nenhuma funcao atual (preparado para futuro) | per-org, server | Via UI | 🟡 Medium |

**Evidence**:
- `[EVIDENCIA] supabase/functions/manage-secrets/index.ts:L16` -- `z.enum(['anthropic', 'fireflies', 'openai', 'github'])`
- `[EVIDENCIA] supabase/functions/_shared/validators.ts:L2-L7` -- Validadores de formato por provider
- `[EVIDENCIA] supabase/functions/_shared/validators.ts:L18-L63` -- Testers de conexao por provider

---

## 3. Chaves no Frontend

### Grep completo de `VITE_*` no codigo-fonte

```
src/integrations/supabase/client.ts:L5   VITE_SUPABASE_URL
src/integrations/supabase/client.ts:L6   VITE_SUPABASE_PUBLISHABLE_KEY
src/hooks/useOrganizationIntegrations.ts:L37   VITE_SUPABASE_URL
src/hooks/useOrganizationIntegrations.ts:L111  VITE_SUPABASE_URL
src/hooks/useOrganizationIntegrations.ts:L120  VITE_SUPABASE_PUBLISHABLE_KEY
src/hooks/useCreateJobApplication.ts:L35       VITE_SUPABASE_URL
src/components/CandidateDrawer.tsx:L156        VITE_SUPABASE_URL
src/config/featureFlags.ts:L9                  VITE_USE_GRANULAR_PERMISSIONS
```

### Confirmacao: Nenhum Secret Bundled no Cliente

| Verificacao | Status | Metodo |
|-------------|--------|--------|
| `SERVICE_ROLE_KEY` no codigo `src/` | **Ausente** | grep no codebase |
| `ANTHROPIC_API_KEY` no codigo `src/` | **Ausente** | grep no codebase |
| `GITHUB_TOKEN` no codigo `src/` | **Ausente** | grep no codebase |
| Apenas chaves publicas em `VITE_*` | **Confirmado** | Analise acima |

Nenhuma violacao de segurança encontrada. Todos os secrets sensiveis sao acessados exclusivamente via `Deno.env.get()` dentro de Edge Functions.

**Evidence**:
- `[EVIDENCIA] src/integrations/supabase/client.ts:L5-L6` -- Apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
- Grep por `SERVICE_ROLE|ANTHROPIC_API|GITHUB_TOKEN` em `src/` -- zero resultados

---

## 4. Fluxo de Dependências

### 4.1 Diagrama de Fluxo

```
FRONTEND (Browser)
====================
  .env (VITE_*)
    |
    +-> VITE_SUPABASE_URL ----------+
    |                               |
    +-> VITE_SUPABASE_PUBLISHABLE_KEY
                                    |
                                    v
                          createClient<Database>()  [client.ts:L11]
                                    |
                                    v
                           Supabase SDK (anon)
                                    |
                          API calls + JWT user token
                                    |
========================================
EDGE FUNCTIONS (Deno)
========================================
    |
    Deno.env.get()
    |
    +-> SUPABASE_URL --------+
    |                        |
    +-> SUPABASE_ANON_KEY ---+--> createClient() [user context, RLS enforced]
    |                        |
    +-> SERVICE_ROLE_KEY ----+--> createClient() [admin, bypasses RLS]
    |        |
    |        +-> crypto.ts:deriveKey() --> PBKDF2(100k iter) --> AES-256-GCM
    |                                         |
    |                                   encrypt/decrypt API keys
    |                                   in organization_integrations
    |
    +-> ANTHROPIC_API_KEY (fallback) ---> Anthropic Messages API
    |
    +-> GITHUB_TOKEN (fallback) -------> GitHub REST API
    |
    +-> Vault (per-org) via getIntegrationSecret()
         |
         +-> DB query -> decrypt -> API key plaintext
              |
              +-> Anthropic API (analyze-candidate, generate-position-description)
              +-> GitHub API (github-repos, github-tags, github-releases)
```

### 4.2 Resolucao de API Keys (Vault-first com Fallback)

As funcoes `analyze-candidate`, `generate-position-description`, `github-repos`, `github-tags` e `github-releases` usam uma estratégia de resolução em duas etapas:

1. **Vault primeiro**: Busca na tabela `organization_integrations` via `getIntegrationSecret()`
2. **Fallback global**: Se nao encontrar no vault, usa `Deno.env.get("ANTHROPIC_API_KEY")` ou `Deno.env.get("GITHUB_TOKEN")`
3. **Erro amigavel**: Se nenhuma fonte disponivel, retorna mensagem orientando configurar a integracao

**Evidence**:
- `[EVIDENCIA] supabase/functions/analyze-candidate/index.ts:L209-L239` -- Vault -> fallback -> erro
- `[EVIDENCIA] supabase/functions/github-repos/index.ts:L100-L117` -- Vault -> fallback -> erro
- `[EVIDENCIA] supabase/functions/generate-position-description/index.ts:L197-L226` -- Vault -> fallback -> erro

### 4.3 O Que Quebra se Missing/Invalida

| Secret | Funcoes Afetadas | Comportamento se Ausente |
|--------|-----------------|--------------------------|
| `SUPABASE_URL` | Todas as 11 Edge Functions | Crash imediato (`!` assertion) |
| `SUPABASE_ANON_KEY` | 9 Edge Functions (auth validation) | Crash imediato (`!` assertion) |
| `SUPABASE_SERVICE_ROLE_KEY` | Todas as 11 Edge Functions + crypto | Crash imediato; criptografia impossivel |
| `ANTHROPIC_API_KEY` (global) | analyze-candidate, generate-position-description | Graceful se vault ativo; erro amigavel se ambos ausentes |
| `GITHUB_TOKEN` (global) | github-repos, github-tags, github-releases | Graceful se vault ativo; erro 500 se ambos ausentes |
| `VITE_SUPABASE_URL` | Frontend inteiro | App nao conecta ao backend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend inteiro | App nao autentica |

**Evidence**:
- `[EVIDENCIA] supabase/functions/_shared/crypto.ts:L44-L46` -- `throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')`
- `[EVIDENCIA] supabase/functions/analyze-candidate/index.ts:L176-L177` -- `Deno.env.get("SUPABASE_URL")!` (assertion, crash se null)
- `[EVIDENCIA] supabase/functions/analyze-candidate/index.ts:L231-L239` -- Erro amigavel quando nenhuma key disponivel

---

## 5. Checklist de Producao

Verificar antes de go-live:

| # | Item | Como Verificar | Status |
|---|------|----------------|--------|
| 1 | Todas Edge Secrets configuradas (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) | Lovable Cloud -> Edge Functions -> Secrets | Obrigatorio |
| 2 | `ANTHROPIC_API_KEY` configurada (global ou per-org) | Testar analyze-candidate em producao | Obrigatorio para IA |
| 3 | `GITHUB_TOKEN` configurado (global ou per-org) com escopo minimo (`repo:read`) | Testar github-repos em producao | Obrigatorio para GitHub |
| 4 | Service-role key ausente do bundle frontend | `grep -r "SERVICE_ROLE" dist/` apos build | Obrigatorio |
| 5 | `.env` adicionado ao `.gitignore` | Verificar `.gitignore` | **PENDENTE** |
| 6 | Variaveis `VITE_*` nao contem secrets | Revisar `.env` -- apenas URLs e anon key | Obrigatorio |
| 7 | CORS configurado (`Access-Control-Allow-Origin: *`) | Revisar para restricao em producao | Recomendado |
| 8 | Rate limiting ativo em todas Edge Functions | Verificar import de `checkRateLimit` em cada funcao | Implementado |
| 9 | Audit log de acesso a secrets funcionando | Verificar tabela `integration_access_logs` | Implementado |
| 10 | Rotacao de secrets documentada e testada | Este documento | Em andamento |

**Evidence**:
- `[EVIDENCIA] .gitignore:L1-L25` -- `.env` AUSENTE
- `[EVIDENCIA] supabase/functions/_shared/cors.ts:L2` -- `'Access-Control-Allow-Origin': '*'`
- `[EVIDENCIA] supabase/functions/_shared/rate-limit.ts:L45-L66` -- Rate limits configurados para todas as 11 funcoes

---

## 6. Procedimentos de Rotacao

### 6.1 Tabela de Rotacao

| Secret | Frequencia | Procedimento | Downtime | Impacto Colateral |
|--------|------------|--------------|----------|-------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Apenas on breach | Regenerar no Supabase Dashboard -> Atualizar Edge Secrets -> **Re-criptografar todos os secrets de organizacoes** | Minutos | **Todos os secrets criptografados ficam ilegíveis** ate re-encrypt |
| `ANTHROPIC_API_KEY` (global) | 90 dias ou breach | Gerar nova key na Anthropic Console -> Atualizar Edge Secret -> Testar | Nenhum (troca atomica) | Nenhum se orgs usam vault |
| `GITHUB_TOKEN` (global) | 90 dias | Gerar novo PAT no GitHub -> Atualizar Edge Secret -> Revogar antigo | Segundos | Nenhum se orgs usam vault |
| Vault per-org (Anthropic) | A criterio da org | UI de Integracoes -> Atualizar chave -> Teste automatico | Nenhum | Apenas a org afetada |
| Vault per-org (GitHub) | A criterio da org | UI de Integracoes -> Atualizar chave -> Teste automatico | Nenhum | Apenas a org afetada |

### 6.2 Procedimento: Rotacao de `SUPABASE_SERVICE_ROLE_KEY`

**ATENCAO**: Esta chave e usada como material de entrada para PBKDF2 na derivacao de chaves AES-256-GCM. Rotacionar esta chave **invalida todos os secrets criptografados** na tabela `organization_integrations`.

Passos:

1. Comunicar todas as organizacoes sobre janela de manutencao
2. Regenerar a key no Supabase Dashboard
3. Atualizar no Lovable Cloud -> Edge Function Secrets
4. Executar script de re-criptografia para todos os registros em `organization_integrations`
5. Testar descriptografia com `manage-secrets` (action: test)
6. Validar que todas as integracoes retornaram ao status `active`

**Evidence**:
- `[EVIDENCIA] supabase/functions/_shared/crypto.ts:L42-L72` -- `deriveKey()` usa `SUPABASE_SERVICE_ROLE_KEY` como input do PBKDF2
- `[EVIDENCIA] supabase/functions/_shared/crypto.ts:L78-L97` -- `deriveLegacyKey()` tambem depende da mesma chave

### 6.3 Procedimento: Rotacao de `ANTHROPIC_API_KEY` (global)

1. Acessar Anthropic Console -> Settings -> API Keys
2. Criar nova key
3. Atualizar no Lovable Cloud -> Edge Function Secrets -> `ANTHROPIC_API_KEY`
4. Testar: acionar analise de candidato em uma vaga
5. Verificar logs da Edge Function `analyze-candidate`
6. Revogar a key antiga na Anthropic Console

### 6.4 Rotacao de Secrets per-org (via UI)

O sistema gerencia rotacao via `manage-secrets` Edge Function:

- Quando uma org atualiza sua key, o campo `last_rotated_at` e preenchido
- A acao `rotated` e registrada em `integration_access_logs`
- O teste de conexao pode ser executado antes de salvar (`test_connection: true`)

**Evidence**:
- `[EVIDENCIA] supabase/functions/manage-secrets/index.ts:L318-L343` -- Detecao de rotacao e tracking
- `[EVIDENCIA] supabase/functions/manage-secrets/index.ts:L368-L374` -- Log de audit (`rotated` vs `created`)

---

## 7. Benefícios & Racional

### Decisoes Arquiteturais

| Decisao | Beneficio | Evidencia |
|---------|-----------|-----------|
| Service-role key exclusiva em Edge Functions | Zero risco de vazamento no bundle do cliente | Grep confirma ausencia em `src/` |
| Vault interno com AES-256-GCM + PBKDF2 | Isolamento multi-tenant; cada org gerencia seus proprios secrets | `crypto.ts` L1-L217 |
| PBKDF2 com 100.000 iteracoes | Protecao contra brute-force da chave derivada | `crypto.ts:L16` |
| Salt unico por operacao de criptografia | Previne ataques de rainbow table | `crypto.ts:L112-L113` |
| Fallback global -> vault per-org | Migracao gradual sem quebra; orgs adotam vault no seu ritmo | Pattern em 5 Edge Functions |
| Audit trail de descriptografia | Rastreabilidade de acesso a secrets por usuario/org/provider | `get-integration-secret.ts:L119-L128` |
| Auto-upgrade de formato de criptografia | Legacy (SHA-256) migrado transparentemente para PBKDF2 | `get-integration-secret.ts:L80-L89` |
| Rate limiting em todas as Edge Functions | Protecao contra abuso de APIs de terceiros e operacoes sensiveis | `rate-limit.ts:L45-L66` |

### Reducao de Riscos

- **Misconfiguration**: Separacao clara client/server com prefixos `VITE_*` torna erros acidentais improvaveis
- **Vazamento de secrets**: Nunca no bundle; verificavel via grep no `dist/`
- **Multi-tenancy**: Cada organizacao tem seus proprios secrets isolados por `organization_id` + `provider` + `environment`
- **Auditoria**: Tabela `integration_access_logs` registra criacao, rotacao, teste, descriptografia e falhas

---

## 8. Melhorias Futuras

| # | Melhoria | Porque | Prioridade |
|---|----------|--------|------------|
| 1 | **Adicionar `.env` ao `.gitignore`** | Prevenir commit acidental de secrets reais; anti-pattern perigoso atual | 🔴 Critical |
| 2 | **Secret scanning no CI/CD** (ex: `gitleaks`, `trufflehog`) | Detectar commits acidentais de secrets antes do merge | 🟠 High |
| 3 | **Vault externo** (Infisical, HashiCorp Vault, ou Supabase Vault) | Rotacao automatica, audit trail centralizado, separacao de concerns | 🟠 High |
| 4 | **Restringir CORS em producao** | `Access-Control-Allow-Origin: *` e permissivo demais para producao | 🟠 High |
| 5 | **Alertas para falhas de descriptografia** | Detectar rapidamente keys corrompidas ou rotacao nao planejada de SERVICE_ROLE_KEY | 🟡 Medium |
| 6 | **Chave de criptografia dedicada** (separada de SERVICE_ROLE_KEY) | Permitir rotacao de SERVICE_ROLE_KEY sem invalidar vault; reduz acoplamento | 🟡 Medium |
| 7 | **Script de re-criptografia** para rotacao de SERVICE_ROLE_KEY | Atualmente nao existe procedimento automatizado | 🟡 Medium |
| 8 | **Remover `VITE_SUPABASE_PROJECT_ID` de `.env`** se nao usado no codigo | Reducao de superficie; variavel sem referencia encontrada em `src/` | 🟢 Low |

**Evidence**:
- `[EVIDENCIA] .gitignore:L1-L25` -- `.env` ausente
- `[EVIDENCIA] supabase/functions/_shared/cors.ts:L2` -- `'Access-Control-Allow-Origin': '*'`
- `[EVIDENCIA] supabase/functions/_shared/crypto.ts:L42-L46` -- Acoplamento SERVICE_ROLE_KEY com criptografia

---

## 9. Suposicoes & Incertezas

| Suposicao | Evidencia/Ausencia | Risco | Follow-up |
|-----------|-------------------|-------|-----------|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` sao auto-injetados pelo Supabase | Padrao documentado do Supabase Edge Functions; codigo usa `Deno.env.get()` sem fallback | 🟢 Low | Confirmar com documentacao Lovable Cloud |
| `SUPABASE_SERVICE_ROLE_KEY` nunca foi rotacionada | Ausencia de script de re-criptografia; ausencia de procedimento documentado | 🔴 Critical | Criar script e testar em staging |
| `GITHUB_TOKEN` global tem escopo minimo (`repo:read`) | Nao verificavel pelo codigo; escopo depende de como foi criado no GitHub | 🟠 High | Auditar permissoes no GitHub Settings |
| `ANTHROPIC_API_KEY` global tem billing limitado | Nao verificavel pelo codigo | 🟠 High | Verificar limites na Anthropic Console |
| `openai` e `fireflies` no enum de providers indica uso futuro | Presentes em `IntegrationProviderSchema` e `validators` mas sem Edge Function consumidora | 🟢 Low | Confirmar roadmap de integrações |
| `SUPABASE_DB_URL` existe como Edge Secret | Nenhuma referencia encontrada no codigo; pode ser provisionado mas nao usado | 🟡 Medium | Verificar no dashboard do Supabase |
| Tabela `organization_integrations` tem RLS ativo | Nao verificavel sem acesso ao schema SQL | 🟠 High | Verificar RLS policies no Supabase Dashboard |
| Rate limiting fail-open e intencional | Codigo explicito: `// Fail open -- allow request if rate limit check fails` | 🟡 Medium | Avaliar se fail-closed e mais seguro para funcoes criticas |

**Evidence**:
- `[EVIDENCIA] supabase/functions/manage-secrets/index.ts:L16` -- `z.enum(['anthropic', 'fireflies', 'openai', 'github'])` inclui providers sem funcao consumidora
- `[EVIDENCIA] supabase/functions/_shared/rate-limit.ts:L121-L123` -- Fail-open explicito
- `[EVIDENCIA] supabase/functions/_shared/validators.ts:L2-L7` -- Validadores para 4 providers

---

## Documentos Relacionados

- [Architecture](./architecture.md) -- Visao geral da arquitetura do sistema
- [Permissions & Access Control](./permissions.md) -- Modelo de permissoes e RLS
- [Security Audit](./security-audit.md) -- Backlog de seguranca
