
## Escopo desta entrega

Você marcou 4 módulos prioritários. Implementar os 4 de ponta-a-ponta (banco + RLS + Edge Functions + telas + integrações) numa única rodada é inviável sem comprometer qualidade. Proponho dividir assim:

- **Esta entrega (Fase 3):** Bloco 1 do documento (sidebar) + **Admissão Digital** + **Recibos/Holerites em lote**.
- **Próxima entrega (Fase 4):** **Saúde Ocupacional (ASO)** + **Rescisão Contratual**.
- **Fases futuras:** Folha de Pagamento + Apontamentos, EPIs, Treinamentos, Super Admin completo.

Se preferir trocar a ordem ou priorizar outro módulo agora, me diga antes de aprovar.

---

## Bloco 1 — Sidebar com grupos colapsáveis

Refatorar `src/components/AppSidebar.tsx` mantendo 100% das rotas, permissões, ViewAs, busca, multi-org e responsividade atuais.

- Cada `SidebarGroupLabel` vira um `button` acessível (`aria-expanded`, `aria-controls`, foco por teclado) com `ChevronRight` fechado / `ChevronDown` aberto.
- Estado de expansão por grupo persistido em `localStorage` (chave por `userId:orgId`).
- Comportamento padrão: todos recolhidos exceto o grupo que contém a rota ativa.
- Busca abre automaticamente os grupos com resultados; ao limpar a busca, restaura o estado salvo.
- Mensagem "Nenhum item encontrado" quando a busca não retorna nada, com botão para limpar.
- Transição suave usando `Collapsible` do shadcn (já disponível no projeto) ou classes Tailwind.
- Sem renomear rotas, sem remover itens, sem quebrar offcanvas mobile.

---

## Bloco 2 — Admissão Digital (4.1 do documento)

Fluxo real: candidato aprovado → processo admissional → colaborador ativo.

### Banco (migration única)

Tabelas novas (todas com `organization_id`, RLS, timestamps, `created_by`):

- `admission_processes` — `candidate_id?`, `employee_id?`, `position_id`, `department_id`, `manager_id`, `cost_center_id`, `unit_id`, `contract_type`, `expected_start_date`, `status` (`draft|invited|in_progress|review|signed|completed|cancelled`), `responsible_user_id`, `invite_token` (único, expirável), `invite_expires_at`, `completed_at`.
- `admission_checklist_items` — `process_id`, `title`, `description`, `required`, `status` (`pending|done|skipped`), `done_at`, `done_by`, `order`.
- `admission_documents` — `process_id`, `doc_type` (RG, CPF, CTPS, comprovante, foto, diploma, dependentes, dados bancários, outros), `file_path` (bucket `employee-documents`), `status` (`pending|submitted|approved|rejected`), `review_notes`, `reviewed_by`, `reviewed_at`.
- `admission_form_data` — `process_id`, payload `jsonb` (dados pessoais, endereço, bancários, dependentes), `submitted_at`.
- `admission_events` — append-only: `process_id`, `event_type`, `actor_user_id`, `metadata jsonb`, `created_at`.

RLS:
- RH/DP/Admin da org: full CRUD por `organization_id`.
- Candidato acessa via token público (link seguro) — sem auth Supabase, validado em Edge Function.
- Colaborador criado vê apenas o próprio processo após login.

Trigger: ao mudar `status` para `completed`, criar/atualizar `employees`, `employees_contracts`, `employees_contact`, `employees_legal_docs`, `employee_documents` (cópia dos anexos), gerar `audit_log`.

### Edge Functions

- `admission-create` — RH cria processo (a partir de candidato ou do zero), gera `invite_token`.
- `admission-invite-send` — envia e-mail com link seguro ao candidato (Resend já configurado).
- `admission-public-get` — público, valida token, retorna formulário e documentos pendentes.
- `admission-public-submit` — público, valida token + rate limit, salva form data e arquivos.
- `admission-review-document` — RH aprova/rejeita documento individual.
- `admission-complete` — RH valida tudo, opcionalmente envia contrato para Clicksign (reutiliza `signature-send`), converte em colaborador.
- `admission-cancel` — cancela e registra auditoria.

### Frontend

- `/admissoes` — listagem (cards de resumo: em andamento / pendentes / concluídos / cancelados), filtros por status/cargo/responsável, busca.
- `/admissoes/nova` — wizard 3 passos (vínculo com candidato → dados do cargo/contrato → checklist personalizado).
- `/admissoes/:id` — detalhe com abas (Visão Geral, Checklist, Documentos, Formulário, Eventos), botão de reenviar convite, ações de aprovar/rejeitar doc, botão "Enviar contrato p/ assinatura", botão "Concluir admissão".
- `/admissao-publica/:token` — página pública para o candidato preencher dados e anexar documentos (sem login).
- Hook `useAdmissions`, `useAdmissionProcess(id)`, `useAdmissionPublic(token)`.
- Componente `AdmissionStatusBadge` reutilizando o padrão visual existente.
- Integração com o card de candidato no Funil: botão "Iniciar admissão" pré-preenche o wizard.

---

## Bloco 3 — Recibos / Holerites em lote (4.3 do documento)

Upload em lote de PDFs, associação automática por CPF/matrícula, publicação com ciência.

### Banco (migration única — estende o que já existe)

- `payroll_receipt_batches` — `organization_id`, `competency` (YYYY-MM), `type` (`holerite|recibo|13o|ferias|rescisao`), `status` (`draft|matching|ready|published|cancelled`), `total_files`, `matched_count`, `unmatched_count`, `published_at`, `published_by`.
- `payroll_receipts` — `batch_id`, `employee_id?` (null se não casou), `cpf_lookup`, `matricula_lookup`, `file_path`, `file_name`, `match_status` (`matched|ambiguous|unmatched`), `published`, `acknowledged_at`, `acknowledged_ip`.
- `document_acknowledgements` — `receipt_id`, `employee_id`, `acknowledged_at`, `ip_address`, `user_agent` (para auditoria forte).

RLS: RH/DP/Admin da org gerenciam tudo; colaborador lê apenas `payroll_receipts WHERE employee_id = auth.uid() AND published = true`.

Bucket: reusar `payroll-exports` ou criar `payroll-receipts` (privado), policies por org.

### Edge Functions

- `payroll-receipts-upload` — recebe lote de PDFs, extrai CPF/matrícula do nome do arquivo (padrão configurável) ou de metadado, cria registros com `match_status`.
- `payroll-receipts-rematch` — RH corrige manualmente associações ambíguas/sem match.
- `payroll-receipts-publish` — valida que não há `unmatched`/`ambiguous`, marca `published=true`, dispara notificação (in-app) aos colaboradores, registra auditoria.
- `payroll-receipts-acknowledge` — colaborador dá ciência (grava IP/UA).
- `payroll-receipts-download` — gera signed URL temporária + audita download.

### Frontend

- `/holerites` (RH) — listagem de lotes com cards (este mês / publicados / pendentes), filtros por competência/tipo.
- `/holerites/novo` — wizard: escolher competência+tipo → upload múltiplo → tela de revisão de matches com cores (verde/amarelo/vermelho) e correção manual → confirmar publicação.
- `/holerites/:batchId` — detalhe do lote, lista de recibos, status de ciência por colaborador, exportar relatório.
- `/meus-holerites` (colaborador, já existe `MyPayslips.tsx`) — completar: card por competência, botão "Dar ciência" obrigatório antes de baixar, badge "Novo", download via signed URL.
- Integração com Floating Chat: notificação quando novo holerite for publicado.

---

## Detalhes técnicos transversais

- **Padrão UX:** todas as páginas seguem o padrão existente (header com título + descrição + breadcrumb + CTA primário, cards de resumo, tabela responsiva, empty state com CTA, skeletons em loading, toasts via `sonner`, `AlertDialog` para ações destrutivas).
- **Segurança:** zero secret no frontend; toda criação/mudança de status passa por Edge Function que valida JWT + `has_org_permission`; rate-limit em endpoints públicos (token de admissão).
- **Auditoria:** registrar em `audit_log` (já existe) e nas tabelas `*_events` para timelines no detalhe.
- **Integração com Clicksign:** já está disponível por tenant (Fase 2). Os botões "Enviar contrato para assinatura" / "Enviar holerite para assinatura" só aparecem quando o tenant tem credencial configurada — caso contrário mostram tooltip explicativo.
- **Realtime:** subscrever mudanças de `admission_processes` e `payroll_receipt_batches` para refletir progresso ao vivo.
- **Tipos:** `src/integrations/supabase/types.ts` é regenerado automaticamente após a migration.

---

## Ordem de execução

1. Migration única consolidada (sidebar não precisa; Admissão + Holerites em uma só migration).
2. Edge Functions (Admissão e Holerites em paralelo).
3. Refator do `AppSidebar`.
4. Páginas e hooks de Admissão.
5. Páginas e hooks de Holerites em lote + completar `MyPayslips`.
6. Rotas no `App.tsx` + entradas no menu (já existem para holerites; criar para admissão).
7. Smoke test manual: criar admissão, simular fluxo do candidato, concluir; subir 3 PDFs de holerite, matchear, publicar, dar ciência.

## Fora de escopo desta entrega (vão para Fase 4+)

- Saúde Ocupacional (ASO) e Rescisão Contratual — próxima fase.
- Folha de Pagamento completa, EPIs, Treinamentos, Super Admin avançado — fases seguintes.
- Auditoria detalhada de cada um dos 9 módulos existentes (faria nesta fase só se você trocar para a opção "Bloco 1 + auditoria").
