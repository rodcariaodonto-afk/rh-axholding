---
type: "technical-index"
project: "PoPeople"
slug: "popeople"
repo: "/Users/hdoria/projects/popeople"
context_path: "."
template_version: "popcode-v3"
source_commit: "8c8fb75"
---

# Perfil de Contexto do Projeto

**PoPeople** é um **portal de RH em evolução** desenvolvido na plataforma Lovable para a Popcode. O sistema começou como gerenciador de inventário de dispositivos (Phase 0) e está se expandindo para um portal de RH completo estilo Deel/Rippling, incluindo time-off management, performance reviews, e learning & development.

**Stack Principal**: React 18, Vite, TypeScript, **Lovable Cloud** (Postgres + Auth + Storage), shadcn/ui, TanStack Query

**Fases do Projeto**:
- ✅ **Phase 0**: Device Management (Completo)
- 🎯 **Phase 1**: Time-Off Management (Em planejamento)
- 🔮 **Phase 2+**: Performance, Learning, Onboarding (Futuro)

> **⚠️ Nota Importante**: O backend é **Lovable Cloud** (infraestrutura própria do Lovable), não Supabase diretamente. Lovable Cloud usa API compatível com Supabase (`@supabase/supabase-js` SDK funciona), mas o gerenciamento é feito no **Lovable Dashboard**, não no Supabase Dashboard.

**Restrições Conhecidas**:
- Ambiente Lovable (sem runtime Node/Python no backend)
- Migrações via Migration Tool do Lovable (não usar Supabase CLI)
- Sem Edge Functions implementadas (toda lógica server-side em Postgres functions/triggers)
- Single-org system (sem multi-tenancy)
- Role management requer SQL direto (sem admin UI)

---

## Camada 1 — Contexto Central

- **[Carta do Projeto](project_charter.md)** - Visão, objetivos, critérios de sucesso e limites de escopo
- **[Roadmap](roadmap.md)** - Timeline da expansão para portal de RH (Phase 0 → Phase 4+)
- **[Registros de Decisão Arquitetural](adr/)** - ADRs numerados documentando decisões técnicas críticas
  - [ADR-0001: Lovable Cloud como Backend](adr/0001-lovable-cloud-backend.md)
  - [ADR-0002: Row Level Security (RLS) para Autorização](adr/0002-rls-authorization.md)
  - [ADR-0003: Roles Hardcoded por Email](adr/0003-hardcoded-roles.md)
  - [ADR-0004: Consultas Diretas sem Edge Functions](adr/0004-direct-queries.md)
  - [ADR-0005: Expansão para Portal de RH Completo](adr/0005-hr-platform-expansion.md)

## Camada 2 — Otimização para IA

- **[Guia de Desenvolvimento com IA](claude.meta.md)** - Padrões, convenções e pitfalls para agentes de IA
- **[Guia de Navegação da Base de Código](codebase_guide.md)** - Mapa de diretórios, fluxos de dados e arquivos-chave

## Camada 3 — Domínio

- **[Arquitetura Completa](architecture.md)** - Visão detalhada do sistema, stack, segurança e padrões
- **[Roles & Permissões](permissions.md)** - Matrix de permissões, RLS policies e enforcement points
- **[Lógica de Negócio](business_logic.md)** - Entidades, regras de negócio e workflows do domínio
- **[Especificação de API](api_specification.md)** - Schemas Supabase, queries e políticas RLS
- **[Schema Design v2.0](schema_design_v2.md)** - Database design para expansão HR (Phase 1+)

## Camada 4 — Fluxo de Desenvolvimento

- **[Contribuição e Fluxos](contributing.md)** - Git workflow, setup de ambiente e CI/CD
- **[Solução de Problemas](troubleshooting.md)** - Debugging, problemas comuns e soluções

---

## Referências Externas

- **[README (raiz do projeto)](../README.md)** - Setup rápido, tecnologias e deployment via Lovable
- **[Supabase Migrations](../supabase/migrations/)** - Histórico completo de mudanças no schema

---

## Status da Documentação

| Documento | Status | Última Atualização |
|-----------|--------|-------------------|
| index.md | ✅ Completo | 2025-01-06 |
| project_charter.md | ✅ Atualizado (HR expansion) | 2025-01-06 |
| roadmap.md | ✅ Novo | 2025-01-06 |
| schema_design_v2.md | ✅ Novo | 2025-01-06 |
| architecture.md | ✅ Completo | 2025-01-06 |
| permissions.md | ✅ Completo | 2025-01-06 |
| ADRs (5 documentos) | ✅ Completo | 2025-01-06 |
| claude.meta.md | ✅ Completo | 2025-01-06 |
| codebase_guide.md | ✅ Completo | 2025-01-06 |
| business_logic.md | ✅ Completo | 2025-01-06 |
| api_specification.md | ✅ Completo | 2025-01-06 |
| contributing.md | ✅ Completo | 2025-01-06 |
| troubleshooting.md | ✅ Completo | 2025-01-06 |

---

## Navegação Rápida por Persona

### Para Desenvolvedores Novos
1. [README](../README.md) → [Project Charter](project_charter.md) → [Codebase Guide](codebase_guide.md)
2. [Claude Meta Guide](claude.meta.md) para padrões e pitfalls
3. [Contributing](contributing.md) para setup e workflow

### Para Revisores de Segurança
1. [Permissions](permissions.md) → [Architecture (Seção Segurança)](architecture.md#4-segurança)
2. [ADR-0002: RLS Authorization](adr/0002-rls-authorization.md)
3. [API Specification (RLS Policies)](api_specification.md#rls-policies)

### Para Agentes de IA
1. [Claude Meta Guide](claude.meta.md) para contexto e padrões
2. [Codebase Guide](codebase_guide.md) para navegação
3. [Architecture](architecture.md) para decisões técnicas

### Para Product Owners
1. [Project Charter](project_charter.md) para visão e escopo
2. [Roadmap](roadmap.md) para timeline e fases
3. [Business Logic](business_logic.md) para regras de negócio
4. [Troubleshooting](troubleshooting.md) para problemas conhecidos

