

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

### 🔲 FASE 3 — Gestão, Financeiro e Relatórios (PENDENTE)

9. Expandir PDI — Competências Esperadas, Metas/OKRs dentro do PDI, Plano de Ação
10. Matriz SWOT — Análise por colaborador/equipe com 4 quadrantes
11. Programação de Pagamento — Calendário de pagamentos agendados
12. Consolidar Relatório de Ponto — Relatório unificado com exportação

---

## Tabelas Criadas

| Tabela | Fase | RLS |
|--------|------|-----|
| `salary_ranges` | 1 | ✅ |
| `company_documents` | 1 | ✅ |
| `absenteeism` | 2 | ✅ |
| `termination_details` | 2 | ✅ |

## Páginas Criadas

- `src/pages/ProfileType.tsx`
- `src/pages/SalaryRanges.tsx`
- `src/pages/CompanyDocuments.tsx`
- `src/pages/LaborData.tsx`
- `src/pages/Absenteeism.tsx`
- `src/pages/PaymentSchedule.tsx` (placeholder)
