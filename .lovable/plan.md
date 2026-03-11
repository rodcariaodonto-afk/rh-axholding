

# Plano de Implementacao - Fase 1

Este plano cobre a Fase 1 do documento: reorganizacao do menu lateral, melhoria da pagina de Colaboradores, formulario de cadastro manual, importacao CSV e criacao das tabelas necessarias no banco.

---

## 1. Criar Tabelas no Banco de Dados

Novas tabelas adaptadas ao padrao ingles existente:

- **`work_schedules`** - Escalas de trabalho (organization_id, name, type, hours_per_week, work_days, hours_per_day, late_tolerance, overtime_rules, hour_bank_rules)
- **`work_policies`** - Politicas de trabalho (organization_id, name, type [presencial/hybrid/remote], description, in_office_days_per_week, in_office_days_per_month)
- **`candidates`** - Candidatos (organization_id, job_id, name, email, phone, resume_url, source, status, applied_at, notes)
- **`candidate_interactions`** - Historico de interacoes (candidate_id, user_id, action, notes)
- **`import_logs`** - Log de importacoes em massa (organization_id, user_id, file_name, total_rows, success_rows, error_rows)

Alterar tabela `employees`:
- Adicionar colunas: `cpf`, `work_schedule_id`, `work_policy_id`, `weekly_hours`, `cbo_code`

Alterar tabela `employees_contact`:
- Adicionar colunas: `personal_phone`, `corporate_phone`, `corporate_email`

Criar 6 novas roles via seeds (Funcionario, Gestor, Coordenador, Gerente, RH, Admin) para as organizacoes existentes, mantendo compatibilidade com as 3 roles atuais.

RLS policies para todas as tabelas novas usando `is_same_org()` e `user_belongs_to_org()`.

---

## 2. Reorganizar Menu Lateral

Alterar `src/components/AppSidebar.tsx` para reorganizar os `menuGroups` em 6 blocos tematicos:

| Bloco | Itens |
|-------|-------|
| DEPARTAMENTO PESSOAL | Gestao de Ponto, Banco de Horas (existente TimeOff), Gestao de Ferias, Folha de Pagamento (placeholder) |
| GESTAO & DESENVOLVIMENTO | Meu PDI, Avaliacoes, Feedbacks, Competencias |
| RECRUTAMENTO & VAGAS | Vagas, Candidatos (novo), Funil de Selecao (placeholder), Banco de Talentos |
| CADASTROS | Colaboradores, Cargos, Departamentos, Escalas (novo), Politicas (novo) |
| RELATORIOS & DASHBOARDS | Dashboard, Relatorios de Ponto (placeholder), Auditoria (placeholder) |
| ADMINISTRACAO | Empresa, Gestao de Acessos, Integracoes, Custos, Inventario |

Os itens marcados como placeholder terao paginas simples com mensagem "Em breve".

---

## 3. Melhorar Pagina de Colaboradores

Alterar `src/pages/Employees.tsx`:

- Adicionar botao **"+ Novo Colaborador"** ao lado do botao "Convidar" existente
- Adicionar botao **"Importar CSV"** (redireciona para `/import-employees`)
- Adicionar filtros: **Local de Trabalho**, **Escala**, **Politica de Trabalho**
- Nos cards de colaborador, exibir CPF (mascarado: `***.***.***-XX`), Data de Admissao e Escala

---

## 4. Formulario de Cadastro Manual de Colaborador

Criar `src/pages/NewEmployeePage.tsx` com formulario em 6 tabs:

1. **Dados Pessoais**: Nome, CPF (validacao), Nascimento, Genero, Email pessoal, Telefone, Endereco, Nacionalidade
2. **Dados Profissionais**: Email corporativo, Cargo (dropdown), CBO, Senioridade, Departamento, Gestor, Admissao, Contrato, Jornada, Escala, Local, Politica
3. **Competencias**: Multi-select de competencias existentes
4. **Beneficios**: VT, VR, Plano Saude, Odonto, Outros (checkboxes + valores)
5. **Documentos**: Upload de RG, CPF, Comprovante, Diploma, Contrato
6. **Resumo**: Preview de todos os dados + botao Salvar

Ao salvar: insere em `employees`, `employees_contact`, `employees_contracts`, e opcionalmente dispara convite.

Rota: `/employees/new`

---

## 5. Importacao em Massa (CSV)

Melhorar a pagina `src/pages/ImportEmployees.tsx` existente com fluxo de 4 passos:

1. **Upload**: Drag-and-drop de CSV
2. **Mapeamento**: Mostrar preview de 5 linhas, permitir mapear colunas CSV para campos do sistema
3. **Validacao**: Checar obrigatorios (Nome, CPF, Email, Cargo), duplicatas, formatos
4. **Resultado**: Barra de progresso, contagem sucesso/erro, download de relatorio

Criar hook `useImportEmployees.ts` para processar a importacao.

---

## 6. Paginas Placeholder (Fase 2/3)

Criar paginas simples "Em breve" para:
- `/candidates` - Candidatos
- `/selection-funnel` - Funil de Selecao  
- `/work-schedules` - Escalas de Trabalho
- `/work-policies` - Politicas de Trabalho
- `/payroll` - Folha de Pagamento
- `/time-reports` - Relatorios de Ponto
- `/audit` - Auditoria

---

## Arquivos Impactados

| Acao | Arquivo |
|------|---------|
| Editar | `src/components/AppSidebar.tsx` |
| Editar | `src/pages/Employees.tsx` |
| Editar | `src/pages/ImportEmployees.tsx` |
| Editar | `src/App.tsx` (novas rotas) |
| Criar | `src/pages/NewEmployeePage.tsx` |
| Criar | `src/pages/WorkSchedules.tsx` (placeholder) |
| Criar | `src/pages/WorkPolicies.tsx` (placeholder) |
| Criar | `src/pages/Candidates.tsx` (placeholder) |
| Criar | `src/pages/SelectionFunnel.tsx` (placeholder) |
| Criar | `src/pages/Payroll.tsx` (placeholder) |
| Criar | `src/pages/TimeReports.tsx` (placeholder) |
| Criar | `src/pages/Audit.tsx` (placeholder) |
| Criar | `src/hooks/useImportEmployees.ts` |
| Criar | `src/hooks/useWorkSchedules.ts` |
| Criar | `src/hooks/useWorkPolicies.ts` |
| Migracoes | Novas tabelas + colunas + roles + RLS |

---

## Observacoes de Seguranca

- CPF sera armazenado como texto criptografado/mascarado na exibicao
- Todas as novas tabelas terao RLS com `organization_id` scoping
- Acoes de criacao/importacao serao registradas na tabela `audit_log` existente
- Nenhuma funcionalidade existente sera removida ou alterada

