
# Plano — Evolução RHAXIS (Coalize/Quark/ATA Renata-Frederico)

## Princípios

- **Não recriar nada**. Auditar antes de criar: já existem `time_tracking`, `ponto_registros`, `time_entries`, `auditoria_ponto`, `justificativas_ponto`, `organization_locations`, `EmployeeOnboarding`, `pending_employees`, `documents`, `company-documents`, `payroll`, `payment-schedule`, `culture`, `governance`, `audit`. Tudo isso é evoluído, não duplicado.
- **Preservar** AppSidebar, identidade visual, rotas e RLS atuais.
- **RLS obrigatória** em toda tabela nova, sempre por `organization_id` usando `has_org_permission(auth.uid(), organization_id, '<perm>')` (padrão já consolidado no projeto, ex.: governança).
- **Ações críticas via Edge Functions** com validação JWT, Zod e auditoria.
- **Eventos brutos imutáveis** (append-only); ajustes em tabelas separadas.
- Entrega faseada — cada fase é mergeable e funcional isoladamente.

---

## FASE 1 — Base de frequência multicanal, centros de custo e eventos imutáveis

**Cadastro estrutural (Cadastro)**
- `cost_centers` (code, name, cnpj, responsible_id, address, active) — nova página `/cost-centers`.
- `legal_entities` (CNPJs operacionais) — usado por folha/AFD.
- Estender `organization_locations` ligando a `cost_center_id` e `legal_entity_id` (não duplicar — já existe).
- FKs opcionais em `employees`, `departments`, `work_schedules`, `payroll`, dispositivos.

**Dispositivos de ponto (DP > Gestão de Ponto > Dispositivos)**
- `time_clock_devices` (provider, model, serial, device_type, integration_mode, status, last_sync_at, metadata).
- `time_clock_device_tokens` (token cifrado, escopo, expiração) — service role only.
- `time_clock_sync_logs` (sync_status, eventos, erros).
- Nova aba dentro de `TimeTracking.tsx` (não nova rota).

**Ledger imutável**
- `time_clock_raw_events` append-only: RLS sem UPDATE/DELETE; trigger BEFORE UPDATE/DELETE que lança exceção.
- Campos: source, source_event_id (unique p/ idempotência), event_time, received_at, direction, raw_payload jsonb, gps, photo_url, biometric_match_status, hash.

**Importador AFD/CSV/TXT**
- Edge Function `time-clock-import` (upload p/ bucket privado `time-clock-imports`, parse AFD/CSV, mapeia matrícula→employee_id, grava raw_events, retorna relatório).
- UI: aba "Importação AFD" em Dispositivos.

**Apuração derivada**
- Edge Function `time-clock-process` que transforma `time_clock_raw_events` em `time_entries` (existente) — gera `time_inconsistencies` em conflito, nunca sobrescreve.
- Marca `time_entries.source_raw_event_id` (nova coluna nullable).

## FASE 2 — Inconsistências, calendário e fechamento

- `operational_calendars`, `operational_calendar_days`, `holiday_exceptions` por `cost_center_id` (feriado conta/não conta). Integra com `journey-config` e `work-schedules` existentes.
- `time_inconsistencies` (type enum, severity, status, responsible_id, due_date, recommendation, linked_pending_task_id). Página `/time-inconsistencies` em DP.
- **Reuso** de `useJustificativasPonto` — inconsistência gera justificativa; aprovação atualiza apuração derivada + banco de horas, **sem tocar** raw_event.
- `pending_tasks` (módulos: time_tracking, vacation, documents, contracts, onboarding, inconsistencies, bank_hours, payroll_notes). Widget no Portal do Colaborador e Portal do Gestor.

## FASE 3 — Apontamentos da folha, benefícios, exportações

- `payroll_periods`, `payroll_events`, `payroll_closing_runs` — agregam faltas/HE/adicional/banco/férias/afastamento/benefícios/ajustes aprovados.
- Página `/payroll-events` em DP > Apontamentos da Folha (resumo entra em `Payroll.tsx` existente, sem duplicar folha).
- `benefits_calculation_runs`, `employee_benefit_calculations` (VT/VR) com simulação + ajuste manual auditado.
- **Central de Exportações** `/exports`: `report_exports` (formato, filtros jsonb, status, file_path, expires_at). Edge Function `report-export-run` para geração assíncrona (AFD/AEJ/AFDT/TXT/CSV/XLSX/PDF). Reusa bucket `governance-exports` ou novo `report-exports`.

## FASE 4 — Espelho, assinatura, admissão, holerite, documentos

- `time_sheets` + `time_sheet_signatures` (status draft→signed, hash, IP, user_agent). Edge Function `time-sheet-generate` (PDF) e `time-sheet-sign`.
- **Assinatura eletrônica transversal**: `document_signature_requests`, `document_signature_events`. Provider plugável via `Administração > Integrações` (DocuSign/ClickSign — apenas wrapper, credenciais via secrets). Usado por contratos, EPIs, espelhos, ASOs.
- **Admissão digital**: **evoluir** `pending_employees` + `EmployeeOnboarding.tsx`. Adicionar coluna `admission_state` (draft, invited, pending_candidate, pending_hr, validating, signing, completed, cancelled) e `admission_checklist jsonb`. Botão "Iniciar admissão" no funil de seleção quando candidato aprovado.
- **Holerite em lote**: Edge Function `payslip-batch-upload` (ZIP/PDFs nomeados por CPF/matrícula), valida, grava em `employee_documents` (existente) marcado como `category='payslip'`, status sent/viewed/acknowledged.
- **Documentos avançado**: estender `employee_documents` com `legal_category`, `retention_until`, `expires_at`, `requires_acknowledgment`, `requires_signature`. Job de alerta de vencimento.

## FASE 5 — Saúde ocupacional, EPIs, contador, flags, campos custom, comunicação

- `occupational_health_exams` (tipo: admissional/periódico/retorno/mudança/demissional, validade, anexo, ASO).
- `epi_catalog`, `epi_assignments` (entrega, devolução, validade, assinatura via módulo de assinatura).
- `module_entitlements` (org × módulo × plano). Hook `useModuleEnabled()` esconde itens no `AppSidebar` sem quebrar rotas (rotas continuam protegidas server-side).
- **Acesso contador externo**: novo role `accountant` (escopo: relatórios fiscais + holerites + AFD). Convite expirável via `pending_employees` reuso, marcando `role_slug='accountant'`. Auditar todo acesso.
- `custom_fields` (entity_type, field_type, required, options jsonb) + `custom_field_values`. Validação no front (Zod dinâmico) e exibição em relatórios.
- Comunicação/avisos: `announcements` + `announcement_reads` (ciência segmentada). FAQ: `faq_articles` (categoria, audiência). Clima: `climate_surveys`, `climate_survey_responses` (anônimo), `climate_action_plans`, eNPS.

---

## Mudanças no AppSidebar

Apenas adicionar itens nas categorias existentes (não criar novas categorias):
- CADASTRO: + Centros de Custo, Locais & CNPJs
- DEPARTAMENTO PESSOAL: + Inconsistências, Apontamentos da Folha, Espelho de Ponto, Saúde Ocupacional, EPIs
- RELATÓRIOS & DASHBOARDS: + Central de Exportações
- ADMINISTRAÇÃO: + Feature Flags & Planos, Campos Personalizados, Acesso Contador, Avisos & Comunicação
- GESTÃO & DESENVOLVIMENTO: + Clima Organizacional, FAQ
- PERFIL: + Minhas Pendências, Meus Holerites, Meu Espelho de Ponto

## Permissões novas (`permissions`)

`cost_centers.manage`, `devices.manage`, `time_raw.view`, `time_inconsistency.manage`, `payroll_events.manage`, `benefits.calculate`, `exports.run`, `timesheet.sign`, `signature.manage`, `admission.manage`, `payslip.upload`, `health.view`, `health.manage`, `epi.manage`, `module.toggle`, `accountant.access`, `custom_fields.manage`, `announcements.publish`, `climate.manage`. Atribuir ao role `admin` (todas), `people` (operacionais), `manager/coordinator` (visualização da equipe), `accountant` (apenas exports/holerites/AFD).

## Detalhes técnicos

- **Migrations**: uma migration por fase, idempotentes (`IF NOT EXISTS`), com RLS + policies + triggers de auditoria reusando `insert_audit_log()`.
- **Edge Functions novas**: `time-clock-import`, `time-clock-process`, `report-export-run`, `time-sheet-generate`, `time-sheet-sign`, `signature-request`, `signature-webhook`, `payslip-batch-upload`, `benefits-calculate`, `accountant-invite`. Todas com CORS, Zod, `auth.getClaims()`, `has_org_permission()`, audit_log.
- **Storage novos buckets privados**: `time-clock-imports`, `time-sheets`, `payslips`, `signed-documents`, `health-exams`, `epi-evidence`. Policies path-based `<org_id>/...`.
- **Append-only**: triggers `RAISE EXCEPTION` em UPDATE/DELETE para `time_clock_raw_events`, `time_clock_sync_logs`, `audit_log`, `signature_events`.
- **Biometria**: armazenar apenas `biometric_template_id` (externo do provedor) + consentimento em `lgpd_requests`. Nunca template bruto.
- **View-As Collaborator** existente continua válido para QA.
- **Sem mocks**: dashboards lêem `read_query` real; vazio = empty state.

## Ordem sugerida de entrega

1. Fase 1 (base imutável) — habilita tudo.
2. Fase 2 (inconsistências + pendências) — fecha o ciclo operacional.
3. Fase 3 (apontamentos + exportações) — entrega valor p/ DP/Financeiro.
4. Fase 4 (espelho + assinatura + admissão + holerite).
5. Fase 5 (saúde, EPI, contador, flags, custom fields, comunicação).

Cada fase termina com: build OK, lint OK, linter Supabase OK, smoke test manual nos papéis admin/people/manager/colaborador/contador.

## Riscos / decisões a confirmar

1. **Provedor de assinatura eletrônica**: ClickSign, DocuSign, D4Sign, ou abstração para qualquer um via integração? (Default: abstração + ClickSign como primeiro adapter, por ser BR.)
2. **Provedor REP/biometria**: precisa de adapter para algum fabricante específico (Henry, Topdata, Madis)? Ou apenas import AFD genérico nesta primeira leva?
3. **Holerites**: PDF individual gerado pelo RHAXIS a partir de eventos de folha, ou upload em lote de PDFs prontos vindos do escritório contábil? (Recomendado: ambos.)
4. Posso prosseguir com as 5 fases sequencialmente, abrindo cada uma para review antes da próxima?
