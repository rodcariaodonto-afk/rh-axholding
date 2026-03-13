

# Gap Analysis: Documento CRM vs Plataforma Atual

## Resumo da Analise

Apos comparar as 19 paginas do documento com o estado atual da plataforma, identifiquei **8 modulos novos** a criar, **6 modulos existentes** a expandir/mover, e **1 reorganizacao completa do menu lateral**.

---

## O QUE JA EXISTE (nenhuma acao necessaria)

- Meu Perfil, Meu PDI, Minhas Avaliacoes
- Colaboradores, Cargos, Departamentos, Organograma
- Politicas de Trabalho, Cultura
- Gestao de Ponto, Gestao de Ferias, Escalas
- Folha de Pagamento, Desligamentos
- Avaliacao de Desempenho, Feedbacks, Competencias
- Metas & OKRs, Catalogo de Treinamentos
- Vagas, Candidatos, Funil de Selecao, Banco de Talentos
- Dashboard, Relatorios de Ponto, Auditoria
- Empresa, Integracoes, Gestao de Acessos, Custos, Documentos

---

## O QUE FALTA IMPLEMENTAR

### FASE 1 -- Menu + Modulos Base

**1. Reorganizar Menu Lateral**
Reestruturar os blocos conforme documento:
- PERFIL: Meu Perfil, Meu PDI, Tipo de Perfil (novo)
- CADASTRO: Colaboradores, Cargos, Salarios (novo), Departamentos, Documentos da Empresa (novo)
- ESTRUTURA ORGANIZACIONAL (novo bloco): Organograma, Politicas de Trabalho, Identidade Organizacional (renomear Cultura)
- DEPARTAMENTO PESSOAL: Dados Trabalhistas (novo), Gestao de Ferias, Absenteismo (novo), Banco de Horas, Rescisao Contratual (novo)
- GESTAO & DESENVOLVIMENTO: PDI, Avaliacao, Feedbacks, Matriz SWOT (novo)
- RECRUTAMENTO: manter como esta
- RELATORIOS: Dashboard, Relatorio de Ponto
- FINANCEIRO (novo bloco): Folha de Pagamento, Programacao de Pagamento (novo), Custos
- ADMINISTRACAO: Dados da Empresa (renomear), Integracoes, Gestao de Acessos, Auditoria (mover), Documentos da Empresa, Inventario

**2. Criar pagina "Tipo de Perfil"**
- Mostrar tipo do usuario logado (Colaborador, Supervisor, Coordenador, Gerente, RH, Admin)
- Card com permissoes, modulos acessiveis, data de atribuicao
- Tabela: `profile_types` (user_id, type, assigned_at)

**3. Criar modulo "Salarios"**
- CRUD de faixas salariais por cargo e senioridade
- Campos: cargo, senioridade, salario base, adicionais (noturno, insalubridade, periculosidade), beneficios, vigencia
- Tabela: `salary_ranges`

**4. Criar "Documentos da Empresa" (em Administracao)**
- Diferente do /documents existente (que e para docs de colaboradores)
- Upload de politicas, normas, manuais com controle de versao
- Tabela: `company_documents`

### FASE 2 -- Departamento Pessoal

**5. Criar modulo "Dados Trabalhistas"**
- Centralizar escala, salario e beneficios por colaborador
- 3 abas: Escala de Trabalho, Salario, Beneficios
- Historico de alteracoes para cada aba
- Tabela: `employee_labor_data` + `employee_benefits`

**6. Expandir "Gestao de Ferias"**
- Novas abas: Periodo de Aquisicao, Programacao de Ferias (calendario), Saldo de Ferias, Conclusao de Ferias
- Novos campos: dias acumulados, dias em uso, saldo, data retorno

**7. Criar modulo "Absenteismo"**
- 4 abas: Faltas, Atrasos, Atestados, Licencas INSS
- CRUD com upload de arquivos (atestados)
- Tabela: `absenteeism`

**8. Criar modulo "Rescisao Contratual"**
- Formulario completo com calculo de valores (ferias, 13o, multa FGTS)
- Geracao de termo PDF
- Integracao com desligamentos existentes
- Tabela: `terminations_details` (complementar a tabela existente)

### FASE 3 -- Gestao, Financeiro e Relatorios

**9. Expandir PDI**
- Novas secoes: Competencias Esperadas (nivel esperado vs atual), Metas e OKRs dentro do PDI, Plano de Acao, Historico de versoes

**10. Criar "Matriz SWOT"**
- Analise por colaborador ou equipe
- 4 quadrantes com CRUD de itens (descricao, impacto, acao relacionada)
- Exportar PDF
- Tabela: `swot_analysis`

**11. Criar "Programacao de Pagamento"**
- Calendario de pagamentos agendados
- Campos: colaborador, valor, forma (PIX, transferencia), data, status
- Tabela: `payment_schedule`

**12. Consolidar Relatorio de Ponto**
- Novo relatorio unificado com: horas, faltas, atrasos, atestados, licencas, banco de horas
- Exportar CSV/PDF

**13. Renomear e mover itens**
- "Cultura" → "Identidade Organizacional"
- "Empresa" → "Dados da Empresa"
- Auditoria → mover para bloco Administracao
- Folha/Custos → mover para bloco Financeiro

---

## Detalhes Tecnicos

### Novas tabelas (via migracoes SQL)
- `salary_ranges` - faixas salariais
- `company_documents` - documentos da empresa com versionamento
- `employee_labor_data` - dados trabalhistas (escala, salario, beneficios)
- `employee_benefits` - beneficios por colaborador
- `absenteeism` - faltas, atrasos, atestados, licencas
- `termination_details` - detalhes de rescisao contratual
- `swot_analysis` - itens da matriz SWOT
- `payment_schedule` - programacao de pagamentos

Todas com `organization_id`, RLS policies e foreign keys para `employees`.

### Novos arquivos (estimativa ~25 arquivos)
- 8 novas paginas em `src/pages/`
- ~15 componentes em `src/components/`
- ~5 hooks em `src/hooks/`
- Atualizacao de rotas em `App.tsx`
- Atualizacao do `AppSidebar.tsx`

---

## Proposta de Execucao

Dado o tamanho, sugiro implementar **uma fase por vez**, comecando pela Fase 1 (menu + modulos base). Deseja que eu comece pela Fase 1?

