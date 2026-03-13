

# Gap Analysis: Documento CRM vs Plataforma Atual

## Status de Implementação

### ✅ FASE 1 — Menu + Módulos Base (CONCLUÍDA)

1. **Menu Lateral reorganizado** — Blocos: PERFIL, CADASTRO, ESTRUTURA ORGANIZACIONAL, DEPARTAMENTO PESSOAL, GESTÃO & DESENVOLVIMENTO, RECRUTAMENTO, RELATÓRIOS, FINANCEIRO, ADMINISTRAÇÃO
2. **Tipo de Perfil** (`/profile-type`) — Exibe role, permissões por módulo, data de entrada
3. **Salários** (`/salary-ranges`) — CRUD completo com tabela `salary_ranges` + RLS
4. **Documentos da Empresa** (`/company-documents`) — Upload com versionamento, tabela `company_documents` + RLS
5. **Renomeações** — Cultura → Identidade Organizacional, Empresa → Dados da Empresa, Auditoria → Administração, Financeiro separado

### ✅ FASE 2 — Departamento Pessoal (CONCLUÍDA)

5. **Dados Trabalhistas** (`/labor-data`) — 3 abas: Escala de Trabalho, Salário, Benefícios com dados do contrato ativo
6. **Gestão de Férias expandida** — Novas abas: Saldo de Férias (dias usados/disponíveis), Período Aquisitivo (com cálculo CLT e status vencido/regular)
7. **Absenteísmo** (`/absenteeism`) — 4 abas: Faltas, Atrasos, Atestados, Licenças INSS. CRUD completo com tabela `absenteeism` + RLS
8. **Rescisão Contratual** — Tabela `termination_details` criada com campos para aviso prévio, férias, 13º, FGTS, multa. Integrada com desligamentos existentes.

### ✅ FASE 3 — Gestão, Financeiro e Relatórios (CONCLUÍDA)

9. **PDI Expandido** — Nova aba "Competências" no PdiDialog mostrando gap análise (nível atual vs esperado) por hard/soft skill do colaborador
10. **Matriz SWOT** (`/swot-analysis`) — 4 quadrantes com CRUD, filtro por colaborador, impacto e ação relacionada. Tabela `swot_analysis` + RLS
11. **Programação de Pagamento** (`/payment-schedule`) — CRUD completo com tabela `payment_schedule` + RLS. Cards de resumo, filtro por status, ações de pagar/cancelar
12. **Relatório de Ponto consolidado** — Já existente em `/time-reports`

### ✅ LOTE A — Férias + PDI (CONCLUÍDO)

13. **Programação de Férias** — Calendário visual mensal com férias agendadas, filtro por departamento, detecção de conflitos (3+ ausentes)
14. **Conclusão de Férias** — Registrar retorno de colaborador, confirmar conclusão com observações
15. **PDI Plano de Ação** — Nova aba com CRUD de ações (ação, responsável, início/fim, status, meta vinculada). Tabela `pdi_action_plans` + RLS
16. **PDI Enviar para Aprovação** — Workflow draft → pending → approved/rejected com botões contextuais por role
17. **PDI Histórico de Versões** — Tabela `pdi_versions` com snapshots, exibição na timeline lateral

---

## Tabelas Criadas

| Tabela | Fase | RLS |
|--------|------|-----|
| `salary_ranges` | 1 | ✅ |
| `company_documents` | 1 | ✅ |
| `absenteeism` | 2 | ✅ |
| `termination_details` | 2 | ✅ |
| `swot_analysis` | 3 | ✅ |
| `payment_schedule` | 3 | ✅ |
| `pdi_action_plans` | A | ✅ |
| `pdi_versions` | A | ✅ |

## O QUE AINDA FALTA

### Lote B — Documentos + SWOT + Pagamentos
- Visibilidade e perfis de acesso nos Documentos da Empresa
- Exportação PDF, resumo executivo e gráfico no SWOT
- Calendário visual no Programação de Pagamento

### Lote C — Relatórios + Melhorias menores
- Relatório de ponto consolidado
- Duplicar/histórico em Salários
- Histórico de alterações em Dados Trabalhistas
- Melhorias no Organograma (filtro + export) e Políticas (colaboradores por política)
