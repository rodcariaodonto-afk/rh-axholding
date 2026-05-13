
# Governança de Dados — RH AXIS

Pacote completo de Data Governance no padrão IRIS, adaptado à sensibilidade trabalhista (colaboradores, candidatos, folha, ponto, documentos, PDI, avaliações).

## Estado atual (preservado)

Já existe e será reaproveitado, **sem quebra**:
- `audit_log` (com `organization_id`, `is_sensitive`, RLS por admin) → será **ampliado**, não substituído
- `lgpd_requests` (formulário público) → será **ampliado** com campos de fluxo interno
- `permission_audit_log` → mantido
- Página `/audit` e `/lgpd` → mantidas, links integrados na nova área
- RLS multi-tenant via `has_org_role`, `has_org_permission`, `is_same_org`, `get_user_organization` → todas as novas policies seguem o mesmo padrão
- Buckets `employee-documents`, `resumes`, `pdi-attachments`, `justificativa-anexos` → não alterados

## Nova área: Governança de Dados

**Rota**: `/data-governance` (protegida via `AdminRoute` + permissão `governance.access`)
**Acesso**: Owner, Admin, People Admin, ou role com permissão `governance.access` explicitamente atribuída.
**Entrada na navegação**: novo item no menu lateral em **Configurações da Organização** → "Governança de Dados".

Layout: shadcn `Tabs` no padrão da IRIS, com 8 abas:

1. **Visão Geral** — cards de KPIs reais (queries agregadas, sem mocks)
2. **Exportações** — JSON por escopo + por titular
3. **Auditoria** — leitor de `audit_log` ampliado com filtros e severidade
4. **Retenção & Exclusão** — políticas e jobs de retenção
5. **Conformidade** — relatório consolidado exportável
6. **Pedidos dos Titulares** — fluxo LGPD ampliado
7. **Consentimentos** — base legal por colaborador/candidato
8. **Políticas** — configuração granular por org

## Mudanças de banco (migration única, RLS ativa em todas)

### Novas tabelas
- `data_exports` — `id, organization_id, requested_by, scope[] (text[]), subject_type, subject_id, status (pending|processing|completed|failed|expired), format (json), file_url, file_size_bytes, expires_at (default now()+7d), created_at, completed_at, error_message, metadata jsonb`
- `data_subject_requests` — fluxo interno (estende `lgpd_requests`): `id, organization_id, request_id (FK lgpd_requests, nullable), subject_type (employee|candidate|external), subject_id, request_kind (access|rectification|portability|anonymization|deletion|restriction|consent_revocation|review), status (received|in_review|in_progress|awaiting_subject|resolved|rejected), priority (low|med|high|urgent), assigned_to, due_at, resolution_notes, history jsonb[], created_at, updated_at`
- `data_consents` — `id, organization_id, subject_type (employee|candidate), subject_id, purpose (talent_pool|ai_profiling|marketing|behavioral_test|document_processing|evaluation|...), consent_status (granted|revoked|pending|not_required), legal_basis (consent|contract|legal_obligation|legitimate_interest|...), consent_source, consent_given_at, consent_revoked_at, data_origin, ai_processing_allowed bool, talent_pool_opt_in bool, privacy_notes, created_at, updated_at`
- `data_governance_policies` — `organization_id (PK), candidate_retention_days (default 730), terminated_employee_retention_days (default 1825 = 5 anos por CLT), document_retention_days, export_link_ttl_days (default 7), document_access_logging bool, ai_recruitment_policy text, dsr_response_sla_days (default 15), data_classification_required bool, sensitive_export_requires_2fa bool, updated_at, updated_by`
- `data_classifications` — `id, organization_id, resource_type, resource_id, classification (public|internal|confidential|sensitive|legal_obligation), retention_until, classified_by, created_at` (índice por resource_type+resource_id)
- `retention_jobs` — `id, organization_id, target_table, target_id, action (anonymize|delete|archive), scheduled_for, executed_at, status, executed_by`

### Ampliação de tabelas existentes
- `lgpd_requests`: adicionar `organization_id`, `status`, `assigned_to`, `due_at`, `updated_at` (nullable, sem quebrar RLS pública de insert)
- `audit_log`: adicionar `severity` (info|warn|critical, default info), `previous_values jsonb`, `new_values jsonb` (mantém `changes` para retrocompat)

### Permissões (linha em `permissions`)
`governance.access`, `governance.export`, `governance.audit_view`, `governance.policies_manage`, `governance.dsr_manage`, `governance.consent_manage`, `governance.retention_manage` — atribuídas por padrão a `admin` e `people` (via `seed_org_roles` ajustado e backfill para orgs existentes).

### RLS (todas as novas tabelas)
Padrão: `SELECT` exige `has_org_permission(auth.uid(), organization_id, 'governance.access')`. Mutations exigem permissão específica (`governance.export`, `governance.policies_manage`, etc.). `data_consents` do próprio titular: leitura permitida ao `auth.uid() = subject_id` quando `subject_type='employee'`.

## Edge Functions (novas, todas com `verify_jwt` validado em código + CORS + Zod)

- `governance-export` — recebe `{ organization_id, scope[], subject_type?, subject_id?, include_files? (default false) }`. Valida sessão, membership, permissão `governance.export`. Cria `data_exports` (status pending), monta JSON por escopo respeitando RLS via service role + filtro explícito `organization_id`, sobe arquivo no bucket privado `governance-exports` (novo, signed URL com TTL = `export_link_ttl_days`), atualiza status, **grava `audit_log` com severity=critical**.
- `governance-compliance-report` — gera relatório consolidado (RLS state, contagens, riscos) em JSON; opcionalmente persiste como export.
- `governance-dsr-resolve` — transição de status do `data_subject_requests` com log de histórico e auditoria.
- `governance-retention-run` — executa `retention_jobs` agendados (anonymize/delete) respeitando classificações `legal_obligation`. Pode ser chamado manualmente pelo admin.
- `governance-consent-update` — registra concessão/revogação com base legal, com auditoria.

Novo bucket privado: **`governance-exports`** (não público, RLS por org via path prefix `<org_id>/...`).

## UI (frontend)

Estrutura de arquivos:
```
src/pages/DataGovernance.tsx                    # shell com Tabs
src/components/governance/
  OverviewTab.tsx                                # cards reais via React Query
  ExportsTab.tsx                                 # form de escopo + lista de exports
  AuditTab.tsx                                   # tabela filtrável (reaproveita /audit)
  RetentionTab.tsx                               # políticas + jobs agendados
  ComplianceTab.tsx                              # relatório + botão exportar
  DsrTab.tsx                                     # kanban/tabela de pedidos
  ConsentsTab.tsx                                # consentimentos por titular
  PoliciesTab.tsx                                # form de policies
src/hooks/useGovernancePermission.ts
```

- Rota lazy-loaded em `App.tsx` dentro do bloco protegido.
- Item de menu adicionado em Configurações da Organização (não em rota pública).
- Padrão visual: tokens semânticos do design system existente, `Tabs`, `Card`, `Badge` por severidade, sem cores hardcoded.
- Textos UI em PT-BR (regra do projeto).

## Eventos críticos cobertos na auditoria

Hooks/funções server-side e client-side passam a registrar em `audit_log` com `severity`:
acesso a perfil de colaborador, view/download de documento, download de currículo, alteração salarial, alteração de contrato, alteração de ponto, aprovação de justificativa, aprovação de férias/afastamento, mudança de cargo, admissão, desligamento, criação/edição de avaliação, feedback, alteração de role/permissão, convite, exclusão de colaborador, exclusão de candidato, exportação, alteração de policy.

Implementação: helper `logAudit()` no front (chama RPC `insert_audit_log` que já existe) + adições nas Edge Functions críticas (`delete-employee`, `terminate-employee`, `change-user-role`, `invite-employee`, `submit-application`).

## Visão Geral — fonte real dos cards

Todos via `supabase` queries respeitando RLS:
- Última exportação: `data_exports order by created_at desc limit 1`
- LGPD em aberto: `data_subject_requests where status not in ('resolved','rejected')`
- Exclusões pendentes: `retention_jobs where status='pending' and action='delete'`
- Eventos críticos 30d: `audit_log where severity='critical' and created_at > now()-30d`
- Status de retenção: leitura de `data_governance_policies`
- Colaboradores ativos / candidatos em retenção / docs sensíveis / admins: counts diretos
- Riscos: derivado do compliance-report (contagem de issues)

## Conformidade — checks gerados

RLS habilitada em todas as tabelas org-scoped (via `pg_policies`), DSRs em atraso, docs sem classificação, candidatos > retenção, colaboradores desligados em retenção, admins inativos > 90d, exports expirados não removidos, policies não configuradas.

## Fora de escopo (não será feito agora)

- 2FA real para exports sensíveis (apenas flag na policy; integração 2FA em fase posterior)
- Cron automático para `retention-run` (execução manual via UI; agendamento pode ser adicionado depois)
- Anonimização irreversível de tabelas históricas legadas — limitada às tabelas listadas

## Entregáveis finais

Ao concluir: relatório técnico em `docs/governance.md` com tabelas criadas, RLS aplicada, Edge Functions, permissões, eventos de auditoria cobertos e riscos remanescentes (ex.: ausência de 2FA, dependência de execução manual da retenção).
