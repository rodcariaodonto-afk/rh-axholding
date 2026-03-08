---
status: "accepted"
date: "2025-01-06"
decision-makers: ["Hugo", "Popcode Leadership"]
consulted: ["People Team", "IT Team"]
informed: ["All Employees"]
---

# ADR-0005: Expansão para Portal de RH Completo

## Context

O PoPeople começou como uma ferramenta de gerenciamento de inventário de dispositivos, resolvendo um problema pontual da empresa. Após 3 meses de uso bem-sucedido, identificamos uma oportunidade estratégica de expandir o sistema para um **portal de RH completo**, estilo Deel ou Rippling.

**Problema atual**:
- Processos de RH dispersos (planilhas, emails, ferramentas múltiplas)
- Solicitação de férias via email/Slack (sem tracking)
- Avaliações de desempenho em Google Docs
- PDIs em planilhas individuais
- Onboarding manual e inconsistente
- Falta de visibilidade para colaboradores sobre próprios dados

**Oportunidade**:
- Temos infraestrutura funcional (Lovable Cloud + RLS + Auth)
- Time conhece a plataforma
- Single-org simplifica (sem multi-tenancy)
- Cultura da empresa valoriza ferramentas internas

**Inspiração**:
- [Deel](https://www.deel.com/) - Global HR platform
- [Rippling](https://www.rippling.com/) - Unified HR + IT

## Decision

**Decidimos expandir o PoPeople para um portal de RH modular**, mantendo devices como primeiro módulo e adicionando:

1. **Time-Off Management** (Fase 1 - MVP)
   - Solicitação de férias/licenças
   - Approval workflow (Manager → People)
   - Saldo de férias
   - Calendar integration

2. **Performance Management** (Fase 2)
   - Ciclos de avaliação
   - Self-assessment + Manager review
   - Goals/OKRs tracking
   - 360 feedback

3. **Learning & Development** (Fase 3)
   - Catálogo de treinamentos
   - Solicitação com aprovação
   - PDI (Plano de Desenvolvimento Individual)
   - Skills tracking

4. **Core HR Enhancements** (Fase 4+)
   - Onboarding checklists
   - Document management
   - Org chart visual
   - Analytics & reporting

**Abordagem**: Incremental, módulo por módulo, com MVPs testados.

## Alternatives Considered

### 1. Comprar Deel/Rippling/BambooHR
**Pros**:
- Pronto out-of-the-box
- Suporte profissional
- Features maduras
- Compliance built-in

**Cons**:
- Custo: $8-20/user/mês = $960-2,400/ano (50 users)
- Vendor lock-in
- Customização limitada
- Overhead de integração com sistemas internos
- Dados sensíveis em third-party

**Why not chosen**: 
- Custo alto para empresa small
- Cultura Popcode valoriza build interno
- Necessidades específicas (ex: integração com Hexnode, processos próprios)

### 2. Usar Google Workspace Apps apenas
**Pros**:
- Zero custo adicional
- Já usado pela empresa
- Familiar para todos

**Cons**:
- Sem workflows automatizados
- Sem approval flows
- Dados dispersos (Sheets, Docs, Forms)
- Reporting manual
- Sem audit trail

**Why not chosen**: Não escala; problema atual continua.

### 3. Híbrido (Comprar módulos + Build custom)
**Pros**:
- Best of both worlds
- Reduz risk de build

**Cons**:
- Complexidade de integração
- Múltiplos vendors
- Dados fragmentados

**Why not chosen**: Overhead de gestão; preferimos controle total.

## Consequences

### Positive

- **Centralização**: Todos dados de People em um lugar
- **Eficiência**: Workflows automatizados (aprovações, notificações)
- **Visibilidade**: Colaboradores acessam próprios dados (férias, avaliações)
- **Data-driven**: Analytics sobre time-off, performance, growth
- **Cost-effective**: $0 adicional (Lovable Cloud atual)
- **Custom fit**: Adaptado aos processos da Popcode
- **Ownership**: Controle total sobre dados sensíveis

### Negative

- **Complexidade técnica**: Domínio de RH é mais complexo que devices
  - Hierarquias (managers, reports)
  - Workflows multi-step (aprovações)
  - Temporal data (histórico de cargos, salários)
  
- **LGPD/Compliance**: Dados muito mais sensíveis
  - Salário, avaliações, dados médicos
  - Audit log obrigatório
  - Encryption at rest necessário
  - Retention policies
  
- **Desenvolvimento contínuo**: Não é "one-and-done"
  - Features pedidas continuamente
  - Manutenção + suporte interno
  
- **Risco de over-engineering**: Pode ficar complexo demais
  
- **Dependência de Lovable Cloud**: Se plataforma mudar, impacta crítico

### Neutral

- **Time de dev**: Requer dedicação contínua (vs. comprar produto pronto)
- **Learning curve**: Time precisa aprender domínio de RH

## Phased Approach (Mitigation Strategy)

Para mitigar riscos, abordagem **incremental**:

### Phase 0: Foundation (1-2 semanas)
- [ ] Documentar nova visão (este ADR)
- [ ] Design de schema (employees, departments, permissions)
- [ ] Setup de audit log (LGPD)
- [ ] Migração de roles para permissões modulares

### Phase 1: Time-Off MVP (2-3 semanas)
- [ ] CRUD de time-off requests
- [ ] Approval workflow (Manager → People)
- [ ] Email notifications
- [ ] Dashboard de saldo de férias
- [ ] **Success metric**: 10 solicitações processadas sem bugs

### Phase 2: Performance (3-4 semanas)
- [ ] Ciclos de avaliação
- [ ] Self-assessment + Manager review
- [ ] Goals tracking
- [ ] **Success metric**: 1 ciclo completo de avaliação

### Phase 3: Learning & PDI (2-3 semanas)
- [ ] Catálogo de treinamentos
- [ ] Solicitação + approval
- [ ] PDI templates
- [ ] **Success metric**: 5 PDIs criados

### Phase 4+: Continuous (ongoing)
- Onboarding, documents, analytics, integrações

**Kill switch**: Se após Phase 1 não houver adoção/feedback positivo, reconsiderar estratégia.

## Migration Simplifications (Phase 1 - MVP Adjustments)

Para reduzir complexidade e acelerar MVP, as seguintes simplificações foram decididas:

### 1. Campos NULL Iniciais (`employees` table)
- **`hire_date`**: NULL inicialmente (não derivar de `created_at`)
  - **Razão**: `created_at` do profile = data de signup, não data de contratação
  - **Solução**: People team preenche manualmente depois
  
- **`manager_id`**: NULL inicialmente
  - **Razão**: Hierarquia não mapeada ainda
  - **Solução**: People team preenche via SQL ou futuro admin UI

- **`employment_type`**: Hardcoded como `'full_time'`
  - **Razão**: 100% dos colaboradores atuais são full-time
  - **Solução**: Assumir default, ajustar manualmente se necessário

### 2. Workflow Simplificado (1-step approval)
- **MVP**: `pending_people` direto (sem step de manager)
- **Razão**: 
  - Reduz complexidade de state machine
  - Sem Edge Functions ainda no Lovable Cloud
  - People team já aprova tudo mesmo na prática
- **Futuro (Phase 1.5)**: Adicionar manager approval como second step

### 3. Notificações In-App Apenas
- **MVP**: Badge counts + toast notifications
- **Razão**: Email requer integração externa (Resend), adiciona complexidade
- **Futuro (Phase 1.5)**: Integrar Resend API

### 4. Balance Management Manual
- **MVP**: Balances ajustados via SQL direto
- **Razão**: Feature nice-to-have, não blocker
- **Futuro (Phase 1.5)**: Admin UI para ajustar balances

### Impact on Success Metrics
Métricas ajustadas para refletir MVP simplificado:
- Approval time: <24h (vs. <2 min original) - OK para 1-step manual
- Satisfaction: >80% (vs. 90%) - Lower bar for MVP

## Technical Considerations

### Schema Changes
```sql
-- New core entities
employees (extends profiles)
departments
positions
organizational_hierarchy

-- Time-off module
time_off_policies
time_off_requests
time_off_balances

-- Performance module
performance_cycles
performance_reviews
goals

-- Learning module
training_catalog
training_requests
pdis
```

### Permissions Model
```sql
-- Evolução de roles simples para permissões modulares
role_permissions (
  role,
  module, -- 'devices', 'time_off', 'performance', etc.
  can_read,
  can_write,
  can_approve
)
```

### Workflow Engine
```sql
-- State machine para aprovações
approval_workflows (
  request_type,
  current_state,
  next_states,
  approver_role
)
```

## Compliance & Security

### LGPD Requirements
- **Audit log**: Quem acessou dados de quem
- **Encryption**: Campos sensíveis (salário, avaliações)
- **Consent**: Termos aceitos, data retention
- **Right to erasure**: Soft delete + anonimização
- **Data minimization**: Coletar apenas necessário

### Security Enhancements
- Field-level encryption para compensation
- RLS policies granulares (manager vê apenas reports)
- Session timeout reduzido (15 min → 5 min para dados sensíveis)
- MFA para admins (se Lovable Cloud suportar)

## Success Metrics

### Phase 1 (Time-Off MVP)
- [ ] 80%+ das férias processadas pelo sistema (vs. email)
- [ ] <24h tempo médio de aprovação (1-step workflow)
- [ ] Zero erros de cálculo de saldo
- [ ] >80% satisfação dos usuários (survey) - MVP bar

### Overall (6 meses)
- [ ] 100% de processos de RH no sistema
- [ ] Redução de 50% em tempo gasto pela People team
- [ ] Aumento de transparência (feedback survey)
- [ ] Zero incidents de LGPD

## Validation & Review

**Review em 3 meses (após Phase 1)**:
- Adoção do time-off module
- Feedback de colaboradores
- Bugs críticos encontrados
- Capacidade de Lovable Cloud (performance, limits)

**Decision point**: Continuar para Phase 2 ou pivotar.

## Notes

- **Nome do projeto**: "PoPeople" permanece (já conhecido)
- **Branding**: Pode evoluir para refletir escopo maior
- **Comunicação interna**: Importante explicar roadmap para evitar expectativas erradas
- **Priorização**: Features priorizadas por People team (não tech-driven)

## Risk Mitigation

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Over-engineering | Alta | Alto | MVPs pequenos, feedback contínuo |
| LGPD violation | Média | Crítico | Legal review, audit log desde Phase 0 |
| Lovable Cloud limits | Média | Alto | Monitoring, fallback para Supabase standalone |
| Low adoption | Baixa | Alto | Piloto com early adopters, iteração rápida |
| Feature creep | Alta | Médio | Roadmap fixo, "no" como default |

---

**References**:
- [Deel Platform](https://www.deel.com/)
- [Rippling Features](https://www.rippling.com/)
- [LGPD Overview](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [project_charter.md](../project_charter.md)
- [roadmap.md](../roadmap.md)
- [schema_design_v2.md](../schema_design_v2.md)

