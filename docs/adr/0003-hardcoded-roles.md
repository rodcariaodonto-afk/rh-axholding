---
status: "accepted"
date: "2025-10-06"
decision-makers: ["Hugo"]
consulted: ["People Team"]
informed: ["Dev Team"]
---

# ADR-0003: Roles Hardcoded por Email

## Context

Sistema precisa atribuir roles (admin, people, user) para novos usuários automaticamente. Opções incluem:
1. **Hardcode no trigger**: Basear role em email específico
2. **Admin UI**: Interface para admin atribuir roles
3. **Invite system**: Admin envia convite com role pré-definido
4. **Default + self-service**: Todos users, usuários solicitam upgrade

**Requisitos**:
- ~14 usuários iniciais com roles conhecidas
- 1 admin (hugo@popcode.com.br)
- 3 people team (brenda, dayse, people@)
- Resto users
- Poucas mudanças esperadas (<1 por mês)

## Decision

**Roles são hardcoded por email no trigger `handle_new_user`**.

**Implementação**:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar domínio
  IF NEW.email NOT LIKE '%@popcode.com.br' THEN
    RAISE EXCEPTION 'Apenas emails do domínio @popcode.com.br são permitidos';
  END IF;

  -- Criar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  -- Atribuir role baseado no email
  IF NEW.email = 'hugo@popcode.com.br' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSIF NEW.email IN ('brenda.mendes@popcode.com.br', 'dayse.quirino@popcode.com.br', 'people@popcode.com.br') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'people');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Evidência**: `supabase/migrations/20251006142104_eb175b5c-0bd4-4be1-ba73-0afa39e1aeab.sql:79-86`

## Alternatives Considered

### 1. Admin UI para Role Management
**Pros**:
- Flexível (admin pode mudar roles sem SQL)
- Auditável (log de mudanças)
- Self-service para admin

**Cons**:
- Requer Edge Function com service role key
- Mais código frontend (forms, validação)
- Risco de privilege escalation bugs
- Tempo de implementação (~2 dias)

**Why not chosen**: Overengineering para 14 usuários com mudanças raras.

### 2. Invite System
**Pros**:
- Seguro (apenas admin gera convites)
- Onboarding controlado

**Cons**:
- UX complexa (usuário precisa aceitar convite)
- Email infra necessária
- Mais tabelas (invites, invite_tokens)

**Why not chosen**: Overkill; Google OAuth já é convite implícito.

### 3. Default User + Self-Service Upgrade
**Pros**:
- Zero config no signup
- Usuário pode solicitar upgrade via form

**Cons**:
- Aprovação manual (bottleneck)
- Risco de spam de solicitações
- Ainda requer admin UI

**Why not chosen**: Transparência é melhor; roles são conhecidas a priori.

### 4. External Identity Provider (Okta, Auth0)
**Pros**:
- Centralizado (SSO para múltiplos apps)
- Role management built-in

**Cons**:
- Custo ($$$)
- Complexidade de integração
- Vendor lock-in

**Why not chosen**: Popcode não usa SSO; seria novo stack apenas para roles.

## Consequences

### Positive

- **Simplicidade extrema**: Zero UI, zero Edge Functions
- **Imediato**: Role atribuído no signup (não requer admin approval)
- **Auditável**: Mudanças de role via migration (versionadas)
- **Seguro**: Usuários não podem modificar próprias roles

### Negative

- **Inflexível**: Adicionar novo admin requer migration
- **Manual**: Mudanças de role via SQL direto (risco de erro)
- **Sem UI**: Admin precisa saber SQL ou pedir para dev
- **Sem audit trail**: Não loggeia quem mudou role de quem

### Neutral

- **Git history**: Migrations mostram quando roles mudaram
- **Single source of truth**: Trigger é autoridade; não há desync

## Migration Example

Para promover `joao@popcode.com.br` a admin:

```sql
-- 1. Remover role atual
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'joao@popcode.com.br');

-- 2. Adicionar admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM profiles WHERE email = 'joao@popcode.com.br';
```

**Evidência**: `docs/permissions.md` (Appendix: Adding Role Assignment)

## Validation

Após 3 meses:
- ✅ Zero mudanças de role necessárias (previsão correta)
- ✅ Nenhum usuário reclamou de processo
- ❌ Admin precisou pedir ajuda para SQL 1x (friction point)

## Future Work

**Quando implementar Admin UI**:
- Trigger de 5+ solicitações de mudança de role por mês
- Admin não tem conhecimento SQL
- Time cresce para 50+ pessoas

**Implementação sugerida**:
1. Edge Function `POST /admin/roles` com service role key
2. Validação: apenas users com role=admin podem chamar
3. Audit log: registrar mudanças em `role_changes` table
4. Frontend: simple form em `/admin/roles`

**Evidência**: `docs/architecture.md` (seção "Melhorias Futuras" #1)

## Compliance

- **LGPD**: Role assignment não é dado pessoal sensível; ok
- **Security**: Trigger protege contra self-promotion (RLS em `user_roles` é read-only)
- **Auditability**: Git migrations = audit trail parcial (falta timestamps)

## Notes

- **Gotcha**: Se email mudar (raro), role não re-avalia; manter email estável
- **Workaround**: Admin pode manualmente rodar SQL; documentado em `permissions.md`
- **Best practice**: Comentar em migration o motivo da mudança de role

---

**References**:
- [permissions.md](../permissions.md#1-roles-overview)
- [architecture.md](../architecture.md#3-autenticação--autorização)
- Migration: `20251006142104_eb175b5c-0bd4-4be1-ba73-0afa39e1aeab.sql:79-86`

