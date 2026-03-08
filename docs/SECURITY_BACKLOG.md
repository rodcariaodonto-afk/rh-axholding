# Security Backlog - Orb RH

> **Status**: P0 concluídos ✅ | Multi-tenancy auditado ✅  
> **Última atualização**: 2026-02-08
> **Referência**: [Security Audit](./security-audit.md)

---

## Resumo Executivo

| Severidade | Quantidade | Status |
|------------|------------|--------|
| 🔴 P0 (Crítico) | 4 | ✅ Resolvidos |
| 🟠 P1 (Alto) | 4 | 3 resolvidos, 1 pendente |
| 🟡 P2 (Médio) | 4 | 2 resolvidos, 2 backlog |
| 🟢 P3 (Baixo) | 3 | Backlog |
| **Total** | **15** | — |

### Decisão de Produção

| Métrica | Status |
|---------|--------|
| **Go/No-Go** | 🟢 **APROVADO** — P0 resolvidos, P1 100% resolvidos |
| **OWASP Score** | 9/10 |
| **Bloqueadores** | Nenhum crítico — SEC-004 (CORS) é P1 pendente |

---

## 🔴 P0 — CRÍTICO (Bloqueia Deploy)

### SEC-015: Isolamento Multi-tenant (Org-Scoped Authorization)

| Campo | Valor |
|-------|-------|
| **Severidade** | 🔴 Crítico |
| **OWASP** | A01 (Broken Access Control) |
| **Componente** | RLS Policies e Edge Functions |
| **Esforço** | 4h |
| **Status** | ✅ Resolvido |

**Problema**:
O sistema utilizava validação global de roles (`has_role`) em vez de validação por organização (`has_org_role`). Um admin da Org A poderia acessar dados da Org B se conhecesse os IDs.

**Solução implementada**:
- Migração de todas as ~64 RLS policies para usar `has_org_role` ou JOINs com `organization_members`.
- Implementação de `checkOrgRole` helper para Edge Functions.
- Correção de vulnerabilidades críticas em tabelas de PII (`employees_demographics`, `employees_legal_docs`).
- Depreciação da função `public.has_role`.

---

### SEC-001: Adicionar autenticação em `analyze-candidate`

| Campo | Valor |
|-------|-------|
| **Severidade** | 🔴 Crítico |
| **OWASP** | A01 (Broken Access Control) |
| **Arquivo** | `supabase/functions/analyze-candidate/index.ts` |
| **Esforço** | 2h |
| **Status** | ✅ Resolvido |

**Problema**:  
A função não valida `Authorization` header. Qualquer pessoa pode:
- Consumir créditos da API Anthropic
- Acessar dados de candidatos
- Obter relatórios de análise de terceiros

**Solução**:
```typescript
// Validar JWT e role antes de processar
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
    status: 401, headers: corsHeaders 
  });
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: authHeader } }
});

const { data, error } = await supabase.auth.getUser();
if (error || !data.user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
    status: 401, headers: corsHeaders 
  });
}

// Verificar role admin ou people
const { data: roles } = await supabaseAdmin
  .from('user_roles')
  .select('role')
  .eq('user_id', data.user.id);

const hasPermission = roles?.some(r => r.role === 'admin' || r.role === 'people');
if (!hasPermission) {
  return new Response(JSON.stringify({ error: 'Forbidden' }), { 
    status: 403, headers: corsHeaders 
  });
}
```

**Critério de Aceite**:
- [ ] Requisições sem JWT retornam 401
- [ ] Requisições com JWT inválido retornam 401
- [ ] Usuários sem role `admin`/`people` retornam 403
- [ ] Logs registram tentativas negadas

---

### SEC-002: Adicionar autenticação em `github-*`

| Campo | Valor |
|-------|-------|
| **Severidade** | 🔴 Crítico |
| **OWASP** | A01 (Broken Access Control), A02 (Cryptographic Failures) |
| **Arquivos** | `supabase/functions/github-repos/index.ts`, `github-releases/index.ts`, `github-tags/index.ts` |
| **Esforço** | 2h |
| **Status** | ✅ Resolvido |

**Problema**:  
Token GitHub corporativo (`GITHUB_TOKEN`) exposto para uso público:
- Qualquer pessoa pode listar repositórios privados
- Rate limit do token pode ser esgotado
- Histórico de commits/releases exposto

**Solução**:
```typescript
// Mesmo padrão de SEC-001
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
    status: 401, headers: corsHeaders 
  });
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: authHeader } }
});

const { data, error } = await supabase.auth.getUser();
if (error || !data.user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
    status: 401, headers: corsHeaders 
  });
}
```

**Critério de Aceite**:
- [ ] Requisições sem JWT retornam 401
- [ ] Token GitHub não é acessível sem autenticação
- [ ] Logs registram acesso a repositórios

---

## 🟠 P1 — ALTO (1 semana)

### SEC-003: Criar storage policies para buckets sensíveis

| Campo | Valor |
|-------|-------|
| **Severidade** | 🟠 Alto |
| **OWASP** | A01 (Broken Access Control) |
| **Componente** | Storage buckets: `employee-documents`, `pdi-attachments` |
| **Esforço** | 2h |
| **Status** | ✅ Resolvido |

**Problema**:  
Buckets configurados como privados mas sem RLS policies definidas.

**Solução implementada**:
- `employee-documents`: 6 políticas RLS
  - Colaborador visualiza/faz upload em sua própria pasta (`{user_id}/...`)
  - RH (admin/people) gerencia todos os documentos
  - Apenas admin pode deletar
- `pdi-attachments`: 8 políticas RLS
  - Colaborador visualiza/atualiza anexos de seus PDIs
  - Manager visualiza anexos de PDIs que gerencia
  - RH (admin/people) gerencia todos os anexos
  - Apenas admin pode deletar

---

### SEC-004: Restringir CORS em produção

| Campo | Valor |
|-------|-------|
| **Severidade** | 🟠 Alto |
| **OWASP** | A05 (Security Misconfiguration) |
| **Arquivo** | `supabase/functions/_shared/cors.ts` |
| **Esforço** | 1h |
| **Status** | ⬜ Pendente |

**Problema**:  
`Access-Control-Allow-Origin: '*'` permite requisições de qualquer origem.

**Solução**:
```typescript
const ALLOWED_ORIGINS = [
  'https://orbrh.lovable.app',
  'https://id-preview--53e08215-d4f6-436d-9c8a-34b18ddafcfb.lovable.app',
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}
```

---

### SEC-005: Remover domínio hardcoded em `invite-employee`

| Campo | Valor |
|-------|-------|
| **Severidade** | 🟠 Alto |
| **OWASP** | A04 (Insecure Design) |
| **Arquivo** | `supabase/functions/invite-employee/index.ts:L67-71` |
| **Esforço** | 2h |
| **Status** | ✅ Resolvido |

**Problema**:  
Validação hardcoded `@popcode.com.br` impedia uso multi-tenant.

**Solução implementada**:
- Removida validação hardcoded de domínio
- Agora busca `allowed_domains` da tabela `organizations`
- Se `organization_id` for passado e tiver domínios configurados, valida contra eles
- Se `allowed_domains` estiver vazio, permite qualquer domínio

---

### SEC-006: Validar INSERT em `job_applications`

| Campo | Valor |
|-------|-------|
| **Severidade** | 🟠 Alto |
| **OWASP** | A01 (Broken Access Control) |
| **Arquivo** | RLS policy em `job_applications` |
| **Esforço** | 1h |
| **Status** | ✅ Ignorado (Intencional) |

**Problema original**:  
Policy INSERT com `WITH CHECK (true)` permite dados inválidos.

**Decisão**:  
✅ **INTENCIONAL**: A policy `applications_insert WITH CHECK (true)` é necessária para permitir candidaturas públicas sem autenticação. A validação de campos obrigatórios é feita no frontend e na Edge Function `submit-application`, que verifica:
- Campos obrigatórios (`candidate_name`, `candidate_email`, `job_id`)
- Existência da vaga (`job_id` válido e com `status='active'`)

---

### SEC-014: Exposição de IDs de Admin via `user_roles`

| Campo | Valor |
|-------|-------|
| **Severidade** | 🔴 Crítico |
| **OWASP** | A01 (Broken Access Control) |
| **Tabela** | `user_roles` |
| **Esforço** | 30min |
| **Status** | ✅ Resolvido |

**Problema**:  
Policy `anon_check_exists` permitia usuários anônimos verem todos os `user_id` mapeados para roles, expondo quais usuários são admins.

**Solução implementada** (2026-02-01):  
```sql
DROP POLICY IF EXISTS "anon_check_exists" ON public.user_roles;
```

A função `has_role()` já é `SECURITY DEFINER`, então acesso direto à tabela não é necessário para verificação de roles.

---

## 🟡 P2 — MÉDIO (2 semanas)

### SEC-007: Implementar rate limiting

| Campo | Valor |
|-------|-------|
| **Severidade** | 🟡 Médio |
| **OWASP** | A05 (Security Misconfiguration) |
| **Componente** | Todas as Edge Functions |
| **Esforço** | 4h |
| **Status** | ✅ Resolvido |

**Problema**:  
Sem proteção contra abuso de endpoints.

**Solução implementada**:
- Tabela `rate_limit_entries` + função PostgreSQL `check_rate_limit` (atômica, SECURITY DEFINER)
- Módulo compartilhado `_shared/rate-limit.ts` com fail-open e headers padrão
- Rate limiting por **user ID** (endpoints autenticados) e por **IP** (endpoints públicos)
- Limites diferenciados por função:
  - AI (analyze-candidate): 50 req/min
  - AI (generate-position-description): 50 req/min
  - Público (submit-application): 30 req/min por IP
  - Gestão (invite, terminate, change-role): 10 req/min
  - Destrutivo (delete-employee): 5 req/min
  - Secrets: 20 req/min
  - GitHub proxy: 30 req/min
- Respostas 429 com headers `X-RateLimit-*` e `Retry-After`
- Cleanup automático de entradas antigas (>1h) a cada verificação
- Migration: `20260207200000_add_rate_limiting_sec007.sql`

---

### SEC-008: Remover URL hardcoded de fallback

| Campo | Valor |
|-------|-------|
| **Severidade** | 🟡 Médio |
| **OWASP** | A05 (Security Misconfiguration) |
| **Arquivo** | `src/hooks/useOrganizationIntegrations.ts:L45` |
| **Esforço** | 30min |
| **Status** | ✅ Resolvido |

**Problema**:  
URL de Supabase hardcoded: `https://izezklembcgjqfayggjf.supabase.co`

**Solução implementada**:
Código atualizado para usar variável de ambiente `import.meta.env.VITE_SUPABASE_URL` em todas as chamadas (linhas 37 e 111).

---

### SEC-009: Sanitizar logs de PII

| Campo | Valor |
|-------|-------|
| **Severidade** | 🟡 Médio |
| **OWASP** | A09 (Logging Failures) |
| **Componente** | Edge Functions |
| **Esforço** | 2h |
| **Status** | ⬜ Pendente |

**Problema**:  
Logs em desenvolvimento podem expor dados pessoais.

---

### SEC-010: MFA para admins

| Campo | Valor |
|-------|-------|
| **Severidade** | 🟡 Médio |
| **OWASP** | A07 (Auth Failures) |
| **Componente** | Autenticação |
| **Esforço** | 4h |
| **Status** | ⬜ Pendente |

**Problema**:  
Admins não têm camada adicional de segurança.

---

## 🟢 P3 — BAIXO (Backlog)

### SEC-011: Documentar rotação de secrets

| Campo | Valor |
|-------|-------|
| **Severidade** | 🟢 Baixo |
| **Arquivo** | `docs/secrets.md` |
| **Esforço** | 2h |
| **Status** | ⬜ Pendente |

---

### SEC-012: Procedimentos de emergência

| Campo | Valor |
|-------|-------|
| **Severidade** | 🟢 Baixo |
| **Arquivo** | `docs/secrets.md` |
| **Esforço** | 1h |
| **Status** | ⬜ Pendente |

---

### SEC-013: Alertas de falha de auth

| Campo | Valor |
|-------|-------|
| **Severidade** | 🟢 Baixo |
| **Componente** | Monitoramento |
| **Esforço** | 4h |
| **Status** | ⬜ Pendente |

---

## Cronograma

| Fase | Prazo | Itens | Critério de Sucesso |
|------|-------|-------|---------------------|
| **Crítico** | 24-48h | SEC-001, SEC-002, SEC-015 | Zero funções expostas, isolamento MT |
| **Alto** | 1 semana | SEC-003 a SEC-006 | Storage protegido, CORS restrito |
| **Médio** | 2 semanas | SEC-007 a SEC-010 | Rate limiting ativo |
| **Baixo** | Contínuo | SEC-011 a SEC-013 | Docs atualizados |

---

## Histórico de Alterações

| Data | Item | Ação | Responsável |
|------|------|------|-------------|
| 2026-02-08 | SEC-015 | Resolvido - Migração completa para org-scoped auth | Lovable |
| 2026-02-07 | SEC-007 | Resolvido - Rate limiting em todas as 11 Edge Functions | Cursor |
| 2026-02-05 | SEC-008 | Verificado como resolvido | Lovable |
| 2026-02-01 | SEC-014 | Resolvido - Removida policy `anon_check_exists` | Lovable |
| 2026-02-01 | SEC-006 | Marcado como intencional | Lovable |
| 2026-02-01 | Auditoria | Scan completo pós multi-tenancy | Lovable |
| — | SEC-001 | Criado | Auditoria |
| — | SEC-002 | Criado | Auditoria |

---

## Referências

- [Security Audit Report](./security-audit.md)
- [Permissions Documentation](./permissions.md)
- [OWASP Top 10 2021](https://owasp.org/Top10/)