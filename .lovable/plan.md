## Objetivo

Adicionar ao RHAXIS a camada **Super Admin AXIS** (gestão de clientes/tenants pela AXHolding), planos/módulos contratados, ações administrativas e integração modular de **assinatura eletrônica por empresa cliente** começando pela **Clicksign** — reaproveitando `organizations`, `organization_members`, `roles`, `permissions`, `audit_log` e `has_org_role` já existentes.

---

## Fase 1 — Super Admin AXIS (fundação)

### Banco (migration)
- Adicionar em `organizations`: `is_internal BOOLEAN DEFAULT false`, `plan_id UUID`, `status TEXT` (`trial|active|suspended|cancelled|pending_deletion|deleted`), `trial_ends_at`, `suspended_at`, `scheduled_deletion_at`, `responsible_name`, `responsible_email`, `responsible_phone`, `internal_notes`, `last_access_at`.
- Nova tabela `plans` (`id`, `slug`, `name`, `description`, `price_cents`, `features jsonb`, `is_active`). Seed: Starter, Professional, Enterprise.
- Nova tabela `plan_modules` (`plan_id`, `module_key`) e `organization_modules` (`organization_id`, `module_key`, `enabled`, `enabled_by`, `enabled_at`) para módulos habilitados por tenant.
- Nova tabela `super_admin_audit_log` (espelho global, append-only) — ou usar `audit_log` existente com flag `is_platform = true`.
- Função `is_platform_admin(_user_id uuid) RETURNS boolean` (SECURITY DEFINER): retorna `true` se o usuário é member ativo da org `is_internal = true` com role `admin` ou `is_owner = true`.
- Seed: org interna **AXHolding Internal** (`is_internal=true`, slug `axholding-internal`); cria automaticamente membership owner/admin para o usuário com email `rodcaria.odonto@gmail.com` quando ele aparecer em `auth.users` (trigger one-shot).
- RLS: políticas adicionais em todas as tabelas-chave permitindo `is_platform_admin(auth.uid())` para leitura/escrita global controlada (auditada).

### Edge Functions
- `super-admin-create-client`: cria org cliente vazia + role admin local + convida owner via `invite-employee`. Valida `is_platform_admin`.
- `super-admin-client-action`: ações `suspend`, `reactivate`, `cancel`, `schedule_deletion`, `cancel_deletion`, `resend_invite`, `transfer_owner`.
- `super-admin-update-plan`: troca plano e sincroniza `organization_modules`.
- `super-admin-impersonate`: gera sessão de suporte com TTL curto (registra em audit_log + banner no frontend).
- Todas validam JWT + `is_platform_admin` server-side, sanitizam input (Zod) e gravam auditoria.

### Frontend
- `src/hooks/usePlatformAdmin.ts` — checa `is_platform_admin` via RPC.
- `src/components/PlatformAdminRoute.tsx` — guard de rota.
- Novo bloco no `AppSidebar.tsx` **"AXIS Admin"** (visível só para platform admin), com:
  - `/admin/clientes` — lista de clientes (status, plano, owner, último acesso, ações)
  - `/admin/clientes/novo` — wizard de criação
  - `/admin/clientes/:id` — detalhe + ações (suspender, plano, módulos, impersonar)
  - `/admin/planos` — CRUD de planos e módulos
  - `/admin/usuarios-globais` — lista cross-tenant
  - `/admin/auditoria-global` — log de plataforma
  - `/admin/suporte` — sessões de impersonation ativas
- Banner global vermelho quando em modo impersonation.

---

## Fase 2 — Assinatura Eletrônica por Tenant (Clicksign)

### Banco
- Nova tabela `organization_integrations` (se não existir; caso exista, adicionar campos):
  - `id`, `organization_id`, `provider` (`clicksign|d4sign|zapsign|manual`), `category` (`signature`), `status` (`disconnected|configured|active|error`), `environment` (`sandbox|production`), `encrypted_credentials BYTEA` (pgcrypto AES com chave em secret `INTEGRATION_ENCRYPTION_KEY`), `settings_json`, `last_tested_at`, `last_error`, `created_by`, `updated_by`.
- Reutilizar/expandir `signature_envelopes`, `signature_envelope_signers` (já criados na Fase 4 anterior). Adicionar:
  - `signature_events` (append-only: timestamp, tipo, payload sanitizado, hash).
  - `signature_provider_webhooks` (idempotência: provider_event_id único).
- Funções `pgp_sym_encrypt`/`pgp_sym_decrypt` via pgcrypto, com chave injetada apenas em Edge Functions.
- RLS: leitura/escrita apenas para `can_manage_org_integrations(uid, org_id)`. Credenciais decriptadas **nunca** retornadas via PostgREST — apenas via Edge Function.

### Edge Functions
- `signature-config-test` — recebe credenciais, testa contra API Clicksign, salva criptografado, marca `last_tested_at`.
- `signature-config-get` — retorna apenas metadados (provider, status, environment, masked).
- `signature-create-envelope`, `signature-send-document` — refatorar `signature-send` existente para usar credenciais da org (não global).
- `signature-webhook-clicksign` — endpoint público com validação HMAC + token secreto na URL + idempotência por `provider_event_id`.
- `signature-sync-status`, `signature-cancel-envelope`.
- Adapter modular já existe em `_shared/signature-provider.ts` — estender para receber `credentials` por chamada em vez de ler `Deno.env`.

### Frontend
- `/integrations/signature` (já existe `IntegrationsSettings.tsx` — adicionar aba **Assinatura Eletrônica**):
  - Card por provider (Clicksign ativo; D4Sign/ZapSign "em breve").
  - Form: API token, ambiente (sandbox/prod), webhook secret.
  - Botão **Testar conexão** → chama `signature-config-test`.
  - Status visual e `last_tested_at`. Token nunca é retornado.
- Em **Documentos**, **Holerites**, **Admissão**, **EPI/Recibos**: ação **"Enviar para assinatura"** já parcialmente existente — garantir uso do provider configurado da org ativa, com seleção de tipo (simples / avançada / ICP-Brasil) com validação de capability do plano.
- Sub-página **Documentos > Assinaturas** (acompanhamento de envelopes).

---

## Fase 3 — Permissões, Auditoria e Hardening

- Adicionar permissions: `platform.admin.*`, `clients.manage`, `integrations.signature.manage`, `signatures.send`, `signatures.view_all`.
- Auditar todas as ações Super Admin e de integração (quem testou credencial, enviou, cancelou, webhook recebido, doc baixado).
- Rodar `supabase--linter`; corrigir policies permissivas.
- Checklist final: nenhum secret no frontend, RLS em todas as novas tabelas, idempotência de webhook, isolamento multi-tenant validado.

---

## Detalhes técnicos

**Stack**: usa `has_org_role`, `has_org_permission`, `organization_members`, `roles` (locais por org) já existentes. Cliente novo nasce vazio (sem seed de demo).

**Criptografia**: pgcrypto symmetric (`pgp_sym_encrypt`). Chave única `INTEGRATION_ENCRYPTION_KEY` injetada apenas em Edge Functions via Supabase secrets — não armazenada em DB.

**Impersonation**: Edge Function gera link de magic-link de curta duração + grava `super_admin_sessions` (user_id, target_org_id, expires_at, ip). Frontend lê esse estado e exibe banner "Visualizando como cliente — sair".

**Adapter signature**: assinatura `createEnvelope(input, credentials)` — credentials injetadas pelo caller (edge function que decripta), nunca lidas de `Deno.env` dentro do adapter.

**Migrações**: 3 migrations separadas (Fase 1 schema, Fase 2 signature/integrations, Fase 3 permissions/audit).

**Arquivos a criar/editar (estimativa)**:
- 3 migrations SQL
- ~6 Edge Functions novas + refatorar 2 existentes
- ~8 páginas novas (`/admin/*`) + 1 aba em IntegrationsSettings
- ~5 hooks (`usePlatformAdmin`, `useClients`, `usePlans`, `useSignatureIntegration`, `useImpersonation`)
- `PlatformAdminRoute.tsx`, atualizar `AppSidebar.tsx`, `App.tsx`

---

## Entrega por fase
Cada fase termina com checkpoint para sua validação antes de seguir. Começarei pela **Fase 1** (fundação Super Admin + sua promoção a platform admin).
