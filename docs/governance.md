# Governança de Dados — RH AXIS

## Entregue

### Banco de dados (migration única, RLS ativa em todas)
- **Novas tabelas**: `data_exports`, `data_subject_requests`, `data_consents`, `data_governance_policies`, `data_classifications`, `retention_jobs`
- **Ampliações**: `audit_log` (`severity`, `previous_values`, `new_values`); `lgpd_requests` (`organization_id`, `status`, `assigned_to`, `due_at`, `updated_at`)
- **Permissões novas**: `governance.access`, `.export`, `.audit_view`, `.policies_manage`, `.dsr_manage`, `.consent_manage`, `.retention_manage` — atribuídas a `admin` e `people` em todas as orgs (e via `seed_org_roles` para futuras)
- **Bucket privado**: `governance-exports` (RLS por path `<org_id>/...`)
- **Backfill**: `data_governance_policies` semeada para todas orgs existentes com defaults conservadores (ex.: 1825 dias = 5 anos CLT para colaboradores desligados)

### Edge Functions (todas com `getClaims` + `has_org_permission` + CORS + auditoria)
- `governance-export` — exportação JSON por escopo e/ou titular, signed URL com TTL configurável, registro completo em `data_exports` e log crítico
- `governance-compliance-report` — KPIs reais + issues + score 0-100
- `governance-dsr-resolve` — transição de status com histórico e auditoria
- `governance-retention-run` — executa jobs pendentes, **bloqueia itens classificados como `legal_obligation`**, suporta `delete` e `anonymize`
- `governance-consent-update` — upsert de consentimento com base legal e auditoria

### UI — `/data-governance` (PeopleRoute + bloqueio por permissão `governance.access`)
8 abas no padrão IRIS, todas com queries reais (sem mocks):
- Visão geral · Exportações · Auditoria · Retenção & Exclusão · Conformidade · Pedidos dos titulares · Consentimentos · Políticas

Acesso adicionado no sidebar em **ADMINISTRAÇÃO → Governança de Dados**.

## Eventos críticos cobertos pela auditoria
Toda mutação por Edge Function de governança grava `audit_log` com `severity` em `info|warn|critical` e `is_sensitive` quando aplicável: exportação, atualização de DSR, retenção (delete/anonymize), atualização/revogação de consentimento.

## Riscos remanescentes
1. **2FA real** para exportações sensíveis ainda não implementado — apenas a flag de policy existe; precisa integração com provider TOTP.
2. **Cron automático** para `retention-run` não habilitado — execução é manual via UI. Pode ser ativado depois com `pg_cron + pg_net`.
3. **Anonimização** está limitada às tabelas `employees`, `job_applications` e `employee_documents`; outras tabelas históricas (folha, ponto) precisam de regras dedicadas em fases futuras.
4. **Auditoria de eventos legados** (downloads de documento via SDK direto, mudanças salariais inline) ainda depende de cada feature chamar `insert_audit_log`. Refactor incremental recomendado.
5. **Linter Supabase** reportou 77 warnings pré-existentes não relacionados a esta migration; revisar separadamente.
