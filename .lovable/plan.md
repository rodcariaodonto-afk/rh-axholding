# Fase 2 — Assinatura Eletrônica por Tenant (Clicksign)

Objetivo: permitir que cada cliente (organização) configure suas próprias credenciais Clicksign e envie documentos para assinatura — sem expor segredos no PostgREST e sem misturar credenciais entre tenants.

## 1. Banco de dados (migration única)

### `organization_integrations`
Tabela genérica para integrações por organização (começa com Clicksign, extensível).

Colunas principais:
- `organization_id` (FK organizations)
- `provider` (enum: `clicksign`)
- `environment` (enum: `sandbox` | `production`)
- `is_active` (boolean)
- `encrypted_credentials` (bytea) — `pgp_sym_encrypt` com `INTEGRATION_ENCRYPTION_KEY`
- `webhook_secret` (text, gerado server-side) — usado para validar HMAC do Clicksign
- `webhook_url_token` (text único) — URL pública do webhook por org
- `capabilities` (jsonb) — ex.: `{ whatsapp: true, email: true }`
- `last_tested_at`, `last_test_status`, `last_test_error`
- `created_by`, `updated_by`

Constraint: `UNIQUE (organization_id, provider)`.

RLS:
- SELECT: membros da org via `user_belongs_to_org` — **porém `encrypted_credentials` e `webhook_secret` ficam fora**: criamos uma VIEW `organization_integrations_safe` sem esses campos e revogamos SELECT da tabela base para `authenticated`. Apenas service role lê os blobs.
- INSERT/UPDATE/DELETE: somente via Edge Function (service role).

### `signature_events` (append-only)
Toda mudança de status vinda do Clicksign:
- `organization_id`, `envelope_id`, `provider`, `event_type`, `payload` (jsonb), `received_at`, `webhook_id`

Trigger `block_modify_append_only` para UPDATE/DELETE.

### `signature_provider_webhooks` (idempotência)
- `provider`, `external_event_id`, `organization_id`, `received_at`
- `UNIQUE (provider, external_event_id)`

### Extensões em `signature_envelopes` (Fase 4)
- `provider_envelope_id` (text)
- `provider` (default `clicksign`)
- `organization_id` (NOT NULL, FK)
- índice `(organization_id, status)`

### Funções
- `get_org_integration_credentials(_org_id, _provider)` — SECURITY DEFINER, retorna jsonb decifrado. Só executável pelo role service.
- `set_org_integration_credentials(_org_id, _provider, _creds jsonb, _env, _caps)` — cifra e upserta.
- Permissões adicionadas: `integrations.signature.manage`, `signatures.send`, `signatures.view_all`.

### Secret
`INTEGRATION_ENCRYPTION_KEY` (32+ bytes) — pedir via `add_secret` antes de rodar migration que dependa dela em runtime (a função apenas usa quando chamada).

## 2. Edge Functions

Todas validam JWT via `getClaims`, checam `has_org_permission(user, org, 'integrations.signature.manage')` para configuração e `signatures.send` para envio, e gravam em `platform_audit_log` quando relevante.

1. **`signature-config-upsert`** — POST `{ organization_id, environment, api_token, capabilities }` → cifra e grava. Gera `webhook_secret` e `webhook_url_token` no primeiro upsert.
2. **`signature-config-get`** — GET `?organization_id=` → retorna metadados (sem token), webhook URL pública pronta para colar no painel Clicksign.
3. **`signature-config-test`** — chama endpoint leve do Clicksign com as credenciais decifradas e grava `last_test_*`.
4. **`signature-create-envelope`** — cria envelope no Clicksign para um documento (payslip / hr_document / admissão / EPI), persiste em `signature_envelopes` com `provider_envelope_id`.
5. **`signature-send-document`** — adiciona signatários + dispara envio (email/WhatsApp conforme `capabilities`).
6. **`signature-cancel-envelope`** — cancela no Clicksign + atualiza local.
7. **`signature-sync-status`** — fallback poll (caso webhook falhe).
8. **`signature-webhook-clicksign`** — público (`verify_jwt = false`), URL inclui `webhook_url_token`. Valida HMAC com `webhook_secret`, faz idempotência via `signature_provider_webhooks`, grava em `signature_events`, atualiza `signature_envelopes` e `signature_envelope_signers`.

### Adapter
Estender `supabase/functions/_shared/signature-provider.ts`:
- Interface `SignatureProvider` recebe `credentials` por chamada (nada de `Deno.env` no provider).
- Implementação `ClicksignProvider` com `createEnvelope`, `addSigner`, `send`, `cancel`, `getStatus`, `verifyWebhook(rawBody, signature, secret)`.

## 3. Frontend

### Configuração (somente admin/owner)
- Nova aba **"Assinatura Eletrônica"** em `IntegrationsSettings.tsx`:
  - Form: ambiente (sandbox/prod), token, toggles de canais (email/WhatsApp).
  - Botão **Testar conexão** → `signature-config-test`.
  - Bloco **Webhook**: exibe URL única `https://…/functions/v1/signature-webhook-clicksign?t=<token>` com botão copiar + instruções.
  - Status: último teste, ambiente ativo, badge "Configurado".

### Hooks
- `useOrgSignatureConfig.ts` — get/upsert/test via edge functions.
- Ampliar `useSignatureEnvelopes.ts` (já existe da Fase 4) para usar provider per-tenant.

### Ações nas telas existentes
Adicionar botão **"Enviar para assinatura"** com guard `signatures.send` + verificação `is_active` em:
- `PayslipsManage.tsx` (holerites)
- `MyPayslips.tsx` (re-envio se permitido)
- `HrDocuments` (já tem assinatura — passa a usar provider per-tenant)
- `OnboardingProcesses.tsx` (admissão)
- `Receipts.tsx` (EPI/recibos)

Modal único `SendForSignatureDialog.tsx` reutilizável: lista signatários sugeridos, canal (email/whatsapp), confirma envio.

### Painel de envelopes
Página `/assinaturas` (já existente como `SignatureEnvelopes`?) — se não, criar listando envelopes da org com status, ações (sync, cancelar, reenviar).

## 4. Segurança e Hardening

- `encrypted_credentials` nunca sai do banco via PostgREST (view + revoke).
- Webhook usa token na URL **e** HMAC do payload — ambos obrigatórios.
- Rate limit no `signature-webhook-clicksign` via `check_rate_limit` por IP.
- Auditoria: cada `config-upsert`, `test`, `create-envelope`, `send`, `cancel` grava em `platform_audit_log` com `target_organization_id`.
- Rodar `supabase--linter` ao fim e corrigir warnings da migration.

## 5. Arquivos previstos

**Migration**: 1 (`fase_2_signature_per_tenant.sql`)

**Edge functions** (novas/editadas):
- `signature-config-upsert`, `signature-config-get`, `signature-config-test`
- `signature-create-envelope`, `signature-send-document`, `signature-cancel-envelope`, `signature-sync-status`
- `signature-webhook-clicksign`
- `_shared/signature-provider.ts` (refatorar)
- `supabase/config.toml` (apenas webhook `verify_jwt = false`)

**Frontend**:
- `src/hooks/useOrgSignatureConfig.ts`
- `src/components/integrations/SignatureProviderTab.tsx`
- `src/components/signature/SendForSignatureDialog.tsx`
- Edições em `IntegrationsSettings.tsx`, `PayslipsManage.tsx`, `MyPayslips.tsx`, `HrDocuments*`, `OnboardingProcesses.tsx`, `Receipts.tsx`
- `src/App.tsx` (rota `/assinaturas` se faltar)

## 6. Secret a pedir antes de começar

- `INTEGRATION_ENCRYPTION_KEY` (gerar string aleatória de 64 chars hex — eu mostro como)

Após sua aprovação eu peço esse secret e já rodo a migration.