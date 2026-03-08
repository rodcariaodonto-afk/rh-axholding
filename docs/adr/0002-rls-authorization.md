---
status: "accepted"
date: "2025-10-06"
decision-makers: ["Hugo", "IT Team"]
consulted: ["Security Team"]
informed: ["Dev Team"]
---

# ADR-0002: Row Level Security (RLS) para Autorização

## Context

Sistema multi-user com roles diferentes (admin, people, user) precisa controlar acesso a dados. Autorização pode ocorrer em múltiplas camadas:
1. **Frontend** (UX): Mostrar/esconder UI
2. **API Layer** (Edge Functions): Validar antes de DB
3. **Database** (RLS): Enforced no Postgres

Sem backend próprio (Lovable), opções são: (a) RLS ou (b) Edge Functions com service role key.

**Requisitos**:
- Admin pode deletar qualquer device
- People pode criar/editar devices
- Users podem editar apenas próprios devices
- Todos veem todos devices (transparência)
- Impossível bypass via client tampering

## Decision

**Escolhemos Row Level Security (RLS) como camada primária de autorização**, com checks frontend apenas para UX.

**Implementação**:
```sql
-- devices table
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar dispositivos"
ON public.devices FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin, People e donos podem atualizar dispositivos"
ON public.devices FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'people') OR
  auth.uid() = user_id
);

CREATE POLICY "Apenas Admin pode excluir dispositivos"
ON public.devices FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));
```

**Evidência**: `supabase/migrations/20251006142104_eb175b5c-0bd4-4be1-ba73-0afa39e1aeab.sql:109-133`

## Alternatives Considered

### 1. Edge Functions + Service Role Key
**Pros**:
- Lógica de autorização em TypeScript (familiar)
- Fácil testar/debugar
- Logging centralizado

**Cons**:
- Requer Edge Functions para cada operação (não implementadas)
- Service role key no server = single point of failure
- Cold starts de Edge Functions (~200ms)
- Mais código para manter

**Why not chosen**: Adiciona complexidade sem ganho de segurança vs RLS.

### 2. App-Level Authorization (Frontend apenas)
**Pros**:
- Zero config
- Rápido de implementar

**Cons**:
- **Inseguro**: Bypassável via DevTools/API direta
- Não-compliance (LGPD/GDPR)
- Auditoria impossível

**Why not chosen**: Não é autorização real; seria security theater.

### 3. Hybrid (RLS + Edge Functions)
**Pros**:
- RLS como fallback
- Edge Functions para lógica complexa

**Cons**:
- Duplicação de lógica
- Risco de inconsistência (RLS vs Edge)
- Mais pontos de falha

**Why not chosen**: Overengineering; RLS sozinho é suficiente.

## Consequences

### Positive

- **Defense-in-depth**: Mesmo se frontend comprometido, RLS protege
- **Zero trust**: Client é sempre untrusted
- **Auditável**: Policies são declarativas e versionadas
- **Performance**: Policies executam in-process no Postgres (sem network hop)
- **Consistente**: Mesmas regras para web, mobile, scripts

### Negative

- **Debug complexo**: Erros RLS são genéricos ("new row violates row-level security policy")
- **Learning curve**: Time precisa entender Postgres policies
- **Performance cost**: Policies avaliam em cada query (mitigado por indexes)
- **Testing difícil**: Testar policies requer setup de auth.uid() mock

### Neutral

- **Frontend checks redundantes**: `useUserRole` verifica roles mesmo com RLS (UX)
- **No fine-grained logging**: RLS não loggeia quem acessou o quê (ver ADR-futuro)

## Implementation Details

### Helper Function `has_role()`

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

**Why SECURITY DEFINER**: Evita recursão RLS (function roda como owner, não caller).

**Why search_path**: Previne SQL injection via search_path manipulation.

**Evidência**: `supabase/migrations/20251006142104_eb175b5c-0bd4-4be1-ba73-0afa39e1aeab.sql:43-56`

### Tables com RLS

| Table | Policies | Evidence |
|-------|----------|----------|
| `devices` | 4 (SELECT, INSERT, UPDATE, DELETE) | `migration:20251006142104:109-133` |
| `profiles` | 2 (SELECT, UPDATE) | `migration:20251006144910:5-12` |
| `user_roles` | 1 (SELECT) | `migration:20251006142104:37-40` |

**Critical**: `user_roles` tem apenas SELECT policy; INSERT/UPDATE/DELETE via triggers apenas → previne privilege escalation.

## Validation

Após 3 meses:
- ✅ Zero bypass attempts detectados
- ✅ Policies funcionam conforme esperado
- ✅ Performance não degradou (<5ms overhead p95)
- ❌ Debug de policies ainda é pain point (usar `EXPLAIN` + logs)

## Testing Strategy

```sql
-- Test: Regular user NÃO pode deletar
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub TO '<regular_user_uuid>';
DELETE FROM devices WHERE id = '<any_device_id>';
-- Esperado: ERROR: new row violates row-level security policy
```

**Evidência**: `docs/permissions.md` (Appendix: Testing RLS Policies)

## Migration Path

Se RLS se tornar bottleneck:
1. **Short-term**: Adicionar indexes em colunas usadas por policies
2. **Medium-term**: Custom JWT claims (evita query `user_roles` em cada policy check)
3. **Long-term**: Edge Functions + cache Redis para permissions (se >10k concurrent users)

## Notes

- **Best practice**: Sempre começar com `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` antes de criar policies
- **Gotcha**: Policies só aplicam a `authenticated` role; queries com service role key bypassam RLS (por design)
- **Monitoring**: Usar `pg_stat_statements` para ver overhead de policy evaluation

---

**References**:
- [Postgres RLS Docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [permissions.md](../permissions.md#4-rls-summary)
- [architecture.md](../architecture.md#4-segurança)

