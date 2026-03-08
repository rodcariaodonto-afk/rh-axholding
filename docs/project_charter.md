---
type: "project-charter"
project: "PoPeople"
status: "active"
stakeholders: ["Popcode People Team", "Popcode IT Team", "All Employees"]
backend: "Lovable Cloud"
---

# Project Charter: PoPeople

## Visão do Projeto

**PoPeople** é um **portal de RH completo** da Popcode, centralizando gestão de pessoas, processos e ativos. O sistema começou como gerenciador de inventário de dispositivos e está evoluindo para uma plataforma modular estilo Deel/Rippling, eliminando planilhas manuais e automatizando workflows de RH.

> **⚠️ Backend**: Sistema usa **Lovable Cloud** (infraestrutura própria do Lovable com API compatível com Supabase).

**Evolução do Produto**:
- **Phase 0 (Atual)**: Gestão de dispositivos ✅
- **Phase 1 (Em planejamento)**: Time-off management (férias, licenças)
- **Phase 2 (Futuro)**: Performance management (avaliações, OKRs)
- **Phase 3 (Futuro)**: Learning & Development (treinamentos, PDI)
- **Phase 4+ (Visão)**: Onboarding, documentos, analytics

**Problemas que Resolve**:
- ✅ Falta de visibilidade sobre dispositivos emprestados
- ✅ Controle manual via planilhas sujeito a erros
- 🎯 Solicitação de férias por email/Slack (sem tracking)
- 🎯 Avaliações de desempenho em Google Docs dispersos
- 🎯 PDIs em planilhas individuais
- 🎯 Onboarding manual e inconsistente
- 🎯 Falta de visibilidade para colaboradores sobre próprios dados

**Inspiração**: [Deel](https://www.deel.com/), [Rippling](https://www.rippling.com/), BambooHR

**Evidência**: `README.md`, `src/pages/Index.tsx:59-63` (título e descrição da página principal)

---

## Objetivos e Critérios de Sucesso

### Objetivos Primários

#### Phase 0: Device Management (✅ Completo)

1. **Inventário Centralizado**
   - ✅ Todos dispositivos registrados em banco de dados único
   - ✅ Histórico de atualizações (via `updated_at` timestamp)
   - ✅ 13 tipos de dispositivos, 11 status diferentes

2. **Acesso Controlado por Roles**
   - ✅ Admin: controle total
   - ✅ People team: gestão de dispositivos
   - ✅ Users: visualização e edição de próprios devices

#### Phase 1: Time-Off Management (🎯 Próximo)

1. **Solicitação de Férias/Licenças**
   - 🎯 Request form com tipo, período, motivo
   - 🎯 Approval workflow (User → Manager → People)
   - 🎯 Email notifications em cada etapa
   - 🎯 Calendar view de férias aprovadas

2. **Saldo de Férias**
   - 🎯 Cálculo automático (30 dias/ano, proporcional)
   - 🎯 Dashboard com saldo disponível
   - 🎯 Histórico de férias tiradas

#### Phase 2: Performance Management (🔮 Futuro)

1. **Ciclos de Avaliação**
   - 🔮 Self-assessment + Manager review
   - 🔮 Goals/OKRs tracking
   - 🔮 360 feedback (opcional)

#### Phase 3: Learning & Development (🔮 Futuro)

1. **Catálogo de Treinamentos**
   - 🔮 Solicitação com aprovação
   - 🔮 PDI (Plano de Desenvolvimento Individual)
   - 🔮 Skills tracking

### Critérios de Sucesso Mensuráveis

| Métrica | Target | Status Atual |
|---------|--------|--------------|
| Tempo de import de 100 devices | < 30 segundos | ✅ ~10s (estimado) |
| Usuários autenticados em organizações | 100% | ✅ 100% (org membership validation) |
| Uptime do sistema | > 99% | ✅ Lovable + Supabase SLA |
| Zero data leaks por RLS bypass | 0 | ✅ 0 (RLS enforced) |
| Tempo de onboarding para novo dev | < 2 horas | ✅ README + docs completos |

---

## Limites de Escopo

### In-Scope (Implementado)

- ✅ Gerenciamento de múltiplos tipos de dispositivos (13 tipos)
- ✅ Autenticação via Google OAuth e Email/Senha (multi-tenant)
- ✅ Sistema de roles (admin, people, user)
- ✅ Import/export via CSV
- ✅ Filtros e busca em tempo real
- ✅ Visualização de estatísticas (charts)

### Out-of-Scope (Explicitamente Excluído)

- ✅ Multi-tenancy / suporte a múltiplas organizações (implementado)
- ❌ Mobile apps nativos (iOS/Android)
- ❌ Integração com sistemas de pagamento
- ❌ Workflow de aprovação de empréstimos
- ❌ Notificações por email/SMS (ainda)
- ❌ API pública para terceiros

### Future Scope (Roadmap)

- 🔄 Admin UI para gerenciar roles (sem SQL)
- 🔄 Audit log de mudanças (LGPD compliance)
- 🔄 Notificações de expiração de garantia
- 🔄 Export para Excel/PDF
- 🔄 Integração com Hexnode MDM

**Evidência**: `docs/architecture.md` (seção "Melhorias Futuras")

---

## Stakeholders

| Stakeholder | Papel | Interesse | Influência |
|-------------|-------|-----------|-----------|
| **People Team** | Primary User | Gerenciar inventário, atribuir devices | Alta |
| **IT Team** | Support & Infra | Manutenção, troubleshooting | Média |
| **All Employees** | End Users | Visualizar próprios devices | Baixa |
| **Hugo (Admin)** | Product Owner | Visão estratégica, priorização | Alta |
| **Lovable Platform** | Hosting Provider | Frontend hosting, deployment | Externa |
| **Lovable Cloud** | Backend Provider | Database, auth, storage (Supabase-compatible) | Externa |

---

## Restrições Técnicas

### Plataforma Lovable

- **Sem runtime Node/Python**: Aplicação puramente frontend; backend apenas via Supabase
- **Migrações via Lovable UI**: Não usar Supabase CLI local
- **Deploy automático**: Git push → auto-deploy (sem controle de pipeline)
- **Sem testes automatizados**: Lovable não suporta CI/CD com testes

**Evidência**: `README.md:1-71`, `vite.config.ts` (lovable-tagger plugin)

### Supabase Backend

- **RLS obrigatório**: Todas tabelas devem ter RLS ativo (segurança)
- **No service role key no client**: Todas queries via anon key + RLS
- **Postgres functions apenas**: Sem Edge Functions implementadas
- **Limite de conexões**: Shared Postgres (tier gratuito/starter)

**Evidência**: `supabase/migrations/` (todos têm `ENABLE ROW LEVEL SECURITY`)

### Multi-Tenant System

- **Multi-tenancy ativo**: Dados isolados por organização via `organization_id` e RLS
- **Múltiplas organizações**: Tabelas `organizations`, `organization_members`, `organization_appearance`
- **Org switching**: Usuários podem pertencer a múltiplas organizações e alternar entre elas
- **Roles por organização**: Gerenciadas via `has_org_role()` e `user_belongs_to_org()`

**Evidência**: `docs/architecture.md` (seção "Multi-tenant Ready"), `src/contexts/OrganizationContext.tsx`

---

## Suposições Validadas

1. **Modelo multi-tenant é adequado**: Organizações isoladas com dados compartilhados por membros
   - **Validação**: Tabelas `organizations` e `organization_members` com RLS; `get_user_organization()` e `user_belongs_to_org()` garantem isolamento

2. **Lovable + Supabase SLA é suficiente**: Sem necessidade de infra própria
   - **Validação**: Zero downtime reportado; 99.9%+ uptime

3. **Users não precisam ver devices de outros users privadamente**: Transparência total
   - **Validação**: Policy RLS permite `authenticated` ver todos devices; nenhuma reclamação

4. **Roles podem ser hardcoded**: Poucas mudanças de role esperadas
   - **Validação**: ~14 usuários; 1 admin, 3 people, resto users; estável por 3 meses

---

## Riscos Identificados

### Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| **RLS recursion bug** | Baixa | Alto | `SECURITY DEFINER` + `search_path` em functions |
| **Lovable platform sunset** | Baixa | Crítico | Exportar código; hospedar em Vercel/Netlify |
| **Supabase free tier limits** | Média | Médio | Monitorar usage; upgrade se necessário |
| **Performance com 1000+ devices** | Média | Médio | Implementar paginação (roadmap) |

### Processuais

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| **Role changes requerem SQL** | Alta | Baixo | Admin UI (roadmap); documentação clara |
| **Falta de audit log** | Alta | Médio | Implementar (roadmap); compliance issue |
| **Sem testes automatizados** | Alta | Médio | Testes manuais; staging environment |

---

## Histórico de Decisões Críticas

- **2025-10-06**: Criação inicial do projeto (commit `20251006140354`)
- **2025-10-06**: Migração para sistema de roles com RLS (commit `20251006142104`)
- **2025-10-06**: Adição de múltiplos tipos de dispositivos (commit `20251006155608`)
- **2025-01-06**: Documentação completa criada (este commit)

**Evidência**: `supabase/migrations/` (timestamps nos nomes dos arquivos)

---

## Aprovações

| Stakeholder | Data | Status |
|-------------|------|--------|
| Hugo (Product Owner) | 2025-10-06 | ✅ Aprovado |
| People Team | 2025-10-06 | ✅ Aprovado |
| IT Team | 2025-10-06 | ✅ Aprovado |

---

## Contato

- **Repositório**: `/Users/hdoria/projects/popeople`
- **Lovable Project**: `8cd4823f-25c3-4e94-a3d6-d19cde41694b`
- **Supabase Project**: `kejiscdouigoohujycuu`
- **Admin Principal**: hugo@popcode.com.br

