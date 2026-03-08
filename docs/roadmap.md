---
type: "roadmap"
project: "PoPeople"
status: "active"
last_reviewed: "2025-01-06"
---

# PoPeople Roadmap: Device Management → HR Platform

Roadmap incremental para transformação do PoPeople em portal de RH completo, estilo Deel/Rippling.

---

## 🎯 Overall Strategy

**Abordagem**: Incremental, module-by-module, com MVPs testados e feedback loops.

**Kill switch**: Se após Phase 1 não houver adoção/feedback positivo (>80% uso, <5 bugs críticos), reconsiderar estratégia.

**Success metrics**:
- **Adoption**: % de processos no sistema (vs. manual)
- **Efficiency**: Tempo economizado pela People team
- **Satisfaction**: Survey scores (1-5 scale)
- **Stability**: Bugs críticos, uptime

---

## ✅ Phase 0: Device Management (COMPLETO)

**Status**: ✅ Deployed to production  
**Timeline**: Oct 2024 - Dec 2024 (3 meses)  
**Team**: Hugo + People Team feedback

### Delivered Features

- [x] Device CRUD (13 types, 11 status)
- [x] CSV import with preview/validation
- [x] Role-based access (admin, people, user)
- [x] RLS policies
- [x] Google OAuth with domain restriction
- [x] Audit trail (basic via `updated_at`)

### Metrics Achieved

| Metric | Target | Actual |
|--------|--------|--------|
| Devices registered | 50+ | 73 ✅ |
| Import success rate | >95% | 98% ✅ |
| User adoption | 100% People team | 100% ✅ |
| Critical bugs | <3 | 2 ✅ |

### Learnings

✅ **What worked**:
- Lovable Cloud (zero-config backend)
- RLS for authorization (declarative, secure)
- CSV import (People team loved it)
- shadcn/ui (fast, consistent UI)

⚠️ **Challenges**:
- No automated tests (manual testing only)
- Hardcoded roles by email (não escala)
- Audit log básico (sem detalhes de mudanças)

**References**: `docs/project_charter.md`, `src/pages/Index.tsx`

---

## 🎯 Phase 1: Time-Off Management (MVP)

**Status**: 📋 Planning  
**Target Timeline**: Jan 2025 - Feb 2025 (5-6 weeks)  
**Team**: Hugo + 1 designer (UI/UX) + People Team (requirements)

### Goals

Eliminar solicitação de férias por email/Slack, centralizando em workflow aprovado e visível.

### Features

#### 1.1 Foundation (Week 1-2)
- [ ] **Schema migration**:
  - [ ] Create `employees`, `departments`, `positions` tables
  - [ ] Create `time_off_policies`, `time_off_balances`, `time_off_requests` tables
  - [ ] Create `audit_log`, `role_permissions` tables
  - [ ] Migrate existing `profiles` to `employees`
  - [ ] Set up RLS policies
  - [ ] **Evidence**: `docs/schema_design_v2.md`

- [ ] **Permissions refactor**:
  - [ ] Replace hardcoded roles with `role_permissions` table
  - [ ] Add permission check helper (`hasPermission(module, action)`)
  - [ ] Update `useUserRole` hook to use new system
  - [ ] **Why**: Scales better for multiple modules

#### 1.2 Time-Off Request Flow (Week 3-4)
- [ ] **Request form**:
  - [ ] Date picker (start/end date)
  - [ ] Policy selector (Vacation, Sick Leave, Personal)
  - [ ] Days calculation (auto)
  - [ ] Reason/notes field
  - [ ] Balance validation (can't request more than available)
  - [ ] **UI**: shadcn Dialog + Calendar component

- [ ] **Approval workflow (Simplified - 1 step)**:
  - [ ] Submit → status = `pending_people` (directly to People team)
  - [ ] People approve → status = `approved`, balance updated
  - [ ] People reject → status = `rejected`
  - [ ] Employee can cancel → status = `cancelled`
  - [ ] **Logic**: Postgres trigger + RLS policies
  - [ ] **Note**: Manager approval deferred to Phase 1.5

- [ ] **In-app notifications (MVP)**:
  - [ ] Notification badge for People team (pending requests count)
  - [ ] Toast on status changes
  - [ ] **Note**: Email notifications deferred to Phase 1.5

#### 1.3 Dashboard & Reporting (Week 5-6)
- [ ] **Employee dashboard**:
  - [ ] Balance card (Vacation: 25/30 days)
  - [ ] Request history table (sortable, filterable)
  - [ ] Quick action button "Request Time-Off"

- [ ] **Manager dashboard**:
  - [ ] Pending approvals (badge count)
  - [ ] Team calendar view (who's off when)
  - [ ] Approve/reject actions

- [ ] **People dashboard**:
  - [ ] All pending requests
  - [ ] Company calendar (all employees)
  - [ ] Reports: time-off by department, by type
  - [ ] Export to CSV

#### 1.4 Testing & Polish (Week 7-8)
- [ ] **Manual testing**:
  - [ ] Happy path (request → approve → balance updates)
  - [ ] Rejection flow
  - [ ] Edge cases (overlapping requests, negative balance)
  - [ ] RLS policies (manager can't approve outside team)

- [ ] **Performance**:
  - [ ] Load test (50 concurrent requests)
  - [ ] Query optimization (indexes validated)

- [ ] **Documentation**:
  - [ ] Update `LOVABLE_KNOWLEDGE_BASE.md` with time-off module
  - [ ] Add troubleshooting guide
  - [ ] Record demo video for People team

### Success Metrics (Phase 1)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Adoption rate | >80% of time-off via system | Track requests vs. email |
| Approval time | <24h average | Track `submitted_at` → `approved_at` |
| Error rate | <2% (balance calc, workflow bugs) | Monitor Lovable Cloud logs |
| User satisfaction | >4/5 on ease-of-use | Post-launch survey |

### Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Complex approval logic bugs | High | High | Extensive manual testing, pilot with 5 users |
| Balance calculation errors | Medium | Critical | Unit tests (Edge Function), audit log |
| Manager confusion on workflow | Medium | Medium | Onboarding session, tooltips in UI |
| Lovable Cloud limits | Low | High | Monitor usage, fallback to Supabase standalone |

### Out of Scope (Phase 1)

❌ Not included:
- Manager approval step (deferred to Phase 1.5)
- Email notifications (deferred to Phase 1.5)
- Balance Management UI (manual SQL for now)
- Half-day requests (future)
- Automatic accrual (manual entry for now)
- Integration with Google Calendar (future)
- Mobile app (web-only)
- Public holidays blocking (future)

### Phase 1.5: Polish & Enhancements (Optional)

**Target Timeline**: Mar 2025 (2-3 weeks)  
**Conditional on Phase 1 success**

- [ ] **2-step approval workflow**:
  - [ ] Add manager approval step before People
  - [ ] Manager dashboard with team requests
  
- [ ] **Email notifications**:
  - [ ] Integration with Resend API
  - [ ] Email templates for submission, approval, rejection
  
- [ ] **Balance Management UI**:
  - [ ] Admin page to adjust balances manually
  - [ ] Audit log for balance changes

---

## 🔮 Phase 2: Performance Management

**Status**: 🔮 Future  
**Target Timeline**: Mar 2025 - Apr 2025 (6-8 weeks)  
**Prerequisites**: Phase 1 stable, People team ready

### Goals

Replace Google Docs evaluations with structured performance reviews.

### Features (Draft)

- [ ] **Performance cycles**:
  - [ ] Annual/semi-annual cycles
  - [ ] Self-assessment form
  - [ ] Manager review form
  - [ ] Ratings (1-5 scale on competencies)

- [ ] **Goals/OKRs**:
  - [ ] Set quarterly goals
  - [ ] Track progress (0-100%)
  - [ ] Manager check-ins

- [ ] **360 Feedback** (optional):
  - [ ] Request feedback from peers
  - [ ] Anonymous or named
  - [ ] Aggregated results

### Success Metrics (Phase 2)

| Metric | Target |
|--------|--------|
| Adoption | 100% of evaluations via system |
| Time saved | 50% reduction vs. Google Docs |
| Satisfaction | >4/5 on process clarity |

---

## 🔮 Phase 3: Learning & Development

**Status**: 🔮 Future  
**Target Timeline**: May 2025 - Jun 2025 (4-6 weeks)  
**Prerequisites**: Phase 2 stable

### Goals

Centralize training requests and PDIs (Personal Development Plans).

### Features (Draft)

- [ ] **Training catalog**:
  - [ ] Course listings (internal/external)
  - [ ] Request with budget approval
  - [ ] Completion tracking

- [ ] **PDIs**:
  - [ ] Template-based (goals, skills, timeline)
  - [ ] Manager collaboration
  - [ ] Progress tracking

- [ ] **Skills matrix**:
  - [ ] Self-reported skills
  - [ ] Endorsements (optional)
  - [ ] Skill gap analysis

### Success Metrics (Phase 3)

| Metric | Target |
|--------|--------|
| PDIs created | 100% of employees |
| Training completion rate | >80% |
| Skills coverage | >50% of employees with skills mapped |

---

## 🔮 Phase 4+: Long-Term Vision

**Status**: 🔮 Future  
**Timeline**: Q3 2025 onwards

### Potential Features

- **Onboarding/Offboarding**:
  - Checklists (docs, equipment, access)
  - Email templates
  - Task assignments

- **Document Management**:
  - Contracts, NDAs, certificates
  - E-signature integration (DocuSign?)
  - Expiration alerts

- **Org Chart**:
  - Visual hierarchy
  - Department/team view
  - Export to PDF

- **Compensation Management** (sensitive!):
  - Salary history (encrypted)
  - Bonus tracking
  - Equity management

- **Analytics & Reporting**:
  - Headcount trends
  - Turnover rate
  - Time-off patterns
  - Performance distributions

- **Integrations**:
  - Google Calendar (time-off sync)
  - Slack (notifications)
  - Hexnode (device provisioning)
  - Pay1 (expense reimbursements?)

- **Mobile App**:
  - React Native or PWA
  - Push notifications

---

## 📊 Overall Timeline (Visual)

```
2024 Q4        2025 Q1         Q2          Q3          Q4
┣━━━━━━━┫━━━━━━━━┫━━━━━━━┫━━━━━━━┫━━━━━━━┫
Phase 0   Phase 1      Phase 2  Phase 3  Phase 4+
(Devices) (Time-Off)   (Perf)   (Learn)  (Ongoing)
✅        🎯           🔮       🔮       🔮
```

---

## 🎯 Decision Points & Reviews

### After Phase 1 (Feb 2025)
**Review**: Adoption, feedback, bugs  
**Decision**: Continue to Phase 2 OR pivot/pause

**Go/No-Go Criteria**:
- ✅ >80% adoption
- ✅ <5 critical bugs
- ✅ >4/5 satisfaction
- ❌ If not met: Pause, fix issues, reconsider scope

### After Phase 2 (Apr 2025)
**Review**: Performance module value, People team capacity  
**Decision**: Continue to Phase 3 OR focus on polish

### Mid-2025 (Jun 2025)
**Review**: Overall platform health, technical debt, team bandwidth  
**Decision**: Continue expansion OR consolidate, OR buy external tool

---

## 🚀 How to Use This Roadmap

**For Development**:
- Use phases as sprint planning reference
- Break features into 2-week sprints
- Prioritize by impact/effort

**For Stakeholders**:
- Understand what's coming, when
- Manage expectations (out-of-scope items)
- Provide feedback at decision points

**For AI Agents**:
- Context for feature prioritization
- Understanding of system evolution
- Guidance on what to build next

---

## 📚 Related Documents

- [ADR-0005: HR Platform Expansion](adr/0005-hr-platform-expansion.md) - Why we're doing this
- [schema_design_v2.md](schema_design_v2.md) - Database design for Phase 1+
- [project_charter.md](project_charter.md) - Vision and objectives
- [business_logic.md](business_logic.md) - Domain concepts and workflows

---

## 🔄 Change Log

| Date | Phase | Change | Reason |
|------|-------|--------|--------|
| 2025-01-06 | Phase 1 | Roadmap created | Initial planning for HR expansion |
| TBD | TBD | TBD | Updates as we learn |

---

**Last updated**: 2025-01-06  
**Next review**: After Phase 1 completion (Feb 2025)

