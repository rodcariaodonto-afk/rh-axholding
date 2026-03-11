

# Fase 5: Documentos & Contratos, Org Chart, Performance e L&D

Analise do estado atual: muitas features ja existem parcialmente. O foco da Fase 5 sera **preencher lacunas** e **conectar modulos**.

## Estado Atual (ja implementado)

- **Organograma**: Pagina funcional com arvore hierarquica baseada em `manager_id`
- **Documentos**: Upload/download no perfil do colaborador (`EmployeeDocumentsTab`)
- **Performance**: Ciclos de avaliacao, skills, feedbacks, PDIs ja existem
- **Dashboard**: KPIs, aniversarios, contratos expirando ja exibidos
- **Treinamentos**: Tab de treinamentos no perfil do colaborador

---

## O que falta construir

### 1. Gestao de Documentos Centralizada (nova pagina)

Criar `/documents` -- pagina central para RH visualizar TODOS os documentos de todos os colaboradores com filtros e alertas de vencimento.

- **Tabela**: Adicionar coluna `expires_at` (date, nullable) em `employee_documents`
- **Pagina**: Grid com filtros por colaborador, categoria (RG, contrato, NDA, certidao), status (valido/vencido/proximo)
- **Alertas**: Cards com documentos vencendo nos proximos 30 dias
- **Acoes**: Download, visualizar, solicitar reenvio (cria notificacao para o colaborador)
- **Sidebar**: Adicionar item "Documentos" no bloco CADASTROS

### 2. Contratos com Workflow (melhorar existente)

Melhorar a gestao de contratos no perfil do colaborador:

- **Tabela**: Adicionar `document_url` (text, nullable) e `signed_at` (timestamp, nullable) em `employees_contracts`
- **Upload de contrato**: Permitir anexar PDF do contrato assinado
- **Historico**: Listar todos os contratos (ativos e inativos) com timeline
- **Alerta no Dashboard**: Ja existe parcialmente, melhorar com link direto ao contrato

### 3. Organograma Melhorado

O organograma ja funciona. Melhorias:

- **Drag-and-drop**: Permitir mover colaborador entre gestores arrastando no organograma (atualiza `manager_id`)
- **Filtro por departamento**: Mostrar sub-arvore de um departamento especifico
- **Export PNG**: Botao para exportar organograma como imagem
- **Contagem de reports**: Badge com numero de subordinados diretos/indiretos

### 4. Performance Management -- Complementos

Avaliacoes e PDIs ja existem. Adicionar:

- **OKRs/Metas**: Nova tabela `goals` (employee_id, title, description, target_value, current_value, period, status)
- **Pagina `/goals`**: CRUD de metas trimestrais com barra de progresso
- **Dashboard de Performance**: Consolidar notas de avaliacao + progresso de PDI + metas em uma visao unica por colaborador
- **Link no sidebar**: "Metas & OKRs" no bloco GESTAO & DESENVOLVIMENTO

### 5. Learning & Development -- Catalogo de Treinamentos

A tab de treinamentos no perfil ja existe. Criar modulo central:

- **Tabela**: `training_catalog` (organization_id, title, description, provider, format [online/presencial], duration_hours, cost, category, url)
- **Pagina `/training-catalog`**: Grid com catalogo de treinamentos disponiveis
- **Solicitacao**: Colaborador solicita treinamento, RH aprova (status: pending/approved/rejected/completed)
- **Tabela**: Adicionar `catalog_item_id` (nullable FK) e `status` em `employee_trainings` se nao existir
- **Link no sidebar**: "Catalogo de Treinamentos" no bloco GESTAO & DESENVOLVIMENTO

---

## Migracao SQL

Uma unica migracao com:
- `ALTER TABLE employee_documents ADD COLUMN expires_at date`
- `ALTER TABLE employees_contracts ADD COLUMN document_url text, ADD COLUMN signed_at timestamptz`
- `CREATE TABLE goals (...)` com RLS
- `CREATE TABLE training_catalog (...)` com RLS

## Arquivos Impactados

| Acao | Arquivo |
|------|---------|
| Criar | `src/pages/Documents.tsx` |
| Criar | `src/pages/Goals.tsx` |
| Criar | `src/pages/TrainingCatalog.tsx` |
| Criar | `src/hooks/useDocumentsCentral.ts` |
| Criar | `src/hooks/useGoals.ts` |
| Criar | `src/hooks/useTrainingCatalog.ts` |
| Editar | `src/pages/Organogram.tsx` (filtros, drag-drop, export) |
| Editar | `src/components/EmployeeDocumentsTab.tsx` (campo expires_at) |
| Editar | `src/components/AppSidebar.tsx` (novos itens) |
| Editar | `src/App.tsx` (novas rotas) |
| Migracao | Novas tabelas + colunas |

## Ordem de Execucao

1. Migracao SQL (todas as tabelas/colunas de uma vez)
2. Documentos centralizados + Contratos (podem ser paralelos)
3. Organograma melhorado
4. Goals/OKRs
5. Catalogo de Treinamentos
6. Atualizar sidebar e rotas

