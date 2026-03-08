---
type: "troubleshooting-guide"
project: "PoPeople"
version: "1.0"
---

# Solução de Problemas: PoPeople

Guia de debugging, problemas comuns e soluções para o sistema PoPeople.

---

## 🔍 Onde Verificar Primeiro

### Sintomas por Categoria

| Sintoma | Onde Verificar | Ferramenta |
|---------|---------------|-----------|
| **Página não carrega** | Browser DevTools Console | F12 → Console |
| **Login falha** | Supabase Dashboard → Auth Logs | `https://supabase.com/dashboard/project/{id}/auth/users` |
| **Query retorna vazio** | RLS policies, Supabase API Logs | Dashboard → Logs → API |
| **Erro 403 Forbidden** | RLS policies, user roles | SQL Editor + `user_roles` table |
| **Import CSV falha** | Browser Console, parse errors | DevTools Console |
| **UI não atualiza após save** | TanStack Query cache | React DevTools + Network tab |
| **Migration falha** | SQL syntax, dependencies | Supabase SQL Editor |

---

## 🚨 Problemas Comuns

### 1. "new row violates row-level security policy"

**Sintoma**: Erro 403 ao tentar INSERT/UPDATE/DELETE.

**Causa**: User não tem permissão via RLS policy.

**Solução**:
```bash
# 1. Verificar role do user
SELECT role FROM user_roles WHERE user_id = '<user_uuid>';

# 2. Verificar policy da tabela
# Supabase Dashboard → Database → Tables → devices → Policies

# 3. Testar como user específico
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub TO '<user_uuid>';
INSERT INTO devices (...) VALUES (...); -- Deve falhar ou passar
```

**Fix comum**:
```sql
-- Se user deveria ter acesso, atribuir role:
INSERT INTO user_roles (user_id, role) 
VALUES ('<user_uuid>', 'people'::app_role);
```

**Evidência**: `docs/permissions.md` (RLS policies matrix)

---

### 2. Query Retorna Vazio Mas Dados Existem

**Sintoma**: `devices` retorna `[]` mesmo com devices no DB.

**Causa**: RLS bloqueando SELECT.

**Debug**:
```bash
# 1. Check data exists (bypass RLS com service role)
# Supabase SQL Editor (como postgres role):
SELECT * FROM devices; -- Deve retornar dados

# 2. Check como authenticated
SELECT * FROM public.devices; -- Deve aplicar RLS

# 3. Check policy
SELECT * FROM pg_policies WHERE tablename = 'devices';
```

**Fix comum**:
```sql
-- Se policy SELECT está faltando:
CREATE POLICY "Usuários autenticados podem visualizar dispositivos"
ON devices FOR SELECT TO authenticated
USING (true);
```

**Evidência**: `supabase/migrations/*142104*.sql:109-112`

---

### 3. Login com Google Falha

**Sintoma**: Redirect loop ou erro "Invalid redirect URI".

**Causa**: Redirect URI não configurado no Google OAuth.

**Solução**:
```bash
# 1. Verificar redirect URI no Supabase Auth Settings
# Deve ser: https://{project_id}.supabase.co/auth/v1/callback

# 2. Adicionar redirect URI no Google Cloud Console:
# APIs & Services → Credentials → OAuth 2.0 Client ID
# Authorized redirect URIs: adicionar URI acima

# 3. Se domínio customizado (ex: popeople.lovable.app):
# Adicionar: https://popeople.lovable.app/auth/callback
```

**Evidência**: `src/hooks/useAuth.ts:34-58` (OAuth flow)

---

### 4. Usuário Não Consegue Criar Conta

**Sintoma**: Signup falha com erro "Apenas emails do domínio @popcode.com.br são permitidos".

**Causa**: Email fora do domínio `@popcode.com.br`.

**Solução**:
1. **Se email é válido**: Validar que termina com `@popcode.com.br`
2. **Se é colaborador**: Pedir para usar email corporativo
3. **Se é teste**: Atualizar trigger para permitir domínio de teste temporariamente

```sql
-- Temporariamente permitir domínio teste (NÃO em produção)
-- Editar trigger handle_new_user:
IF NEW.email NOT LIKE '%@popcode.com.br' AND NEW.email NOT LIKE '%@test.com' THEN
  RAISE EXCEPTION '...';
END IF;
```

**Evidência**: `supabase/migrations/*142104*.sql:67-69`

---

### 5. Tipos TypeScript Desatualizados

**Sintoma**: TypeScript reclama de campo que existe no DB.

```typescript
// Error: Property 'serial' does not exist on type 'Device'
device.serial // TS error
```

**Causa**: `src/integrations/supabase/types.ts` não reflete schema atual.

**Solução**:
```bash
# Via Supabase CLI (se tiver acesso local):
npx supabase gen types typescript --project-id kejiscdouigoohujycuu > src/integrations/supabase/types.ts

# Via Lovable:
# Lovable auto-sync geralmente funciona; force refresh se necessário
```

**Alternativa**: Atualizar manualmente `src/types/device.ts` temporariamente.

**Evidência**: `src/integrations/supabase/types.ts:1` (comment: "auto-generated")

---

### 6. Import CSV Duplica Devices

**Sintoma**: Mesmo device aparece 2x após import.

**Causa**: Import não verifica duplicatas; campo `serial` não tem constraint UNIQUE.

**Solução (temporária)**:
```sql
-- Remover duplicatas manualmente
DELETE FROM devices a USING devices b
WHERE a.id > b.id 
  AND a.serial = b.serial 
  AND a.serial IS NOT NULL;
```

**Solução (permanente)**:
```sql
-- Adicionar constraint UNIQUE em serial
ALTER TABLE devices ADD CONSTRAINT devices_serial_unique UNIQUE (serial);

-- Então usar upsert no import:
-- supabase.from("devices").upsert(devices, { onConflict: "serial" })
```

**Evidência**: Gap documentado em `docs/architecture.md` (melhorias futuras #3)

---

### 7. UI Não Atualiza Após Mutation

**Sintoma**: Device editado mas tabela não atualiza.

**Causa**: TanStack Query cache não invalidado.

**Debug**:
```typescript
// Verificar se onSuccess está presente
const mutation = useMutation({
  mutationFn: ...,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["devices"] }); // ← Isso DEVE estar aqui
  },
});
```

**Fix**:
```typescript
// Adicionar invalidation se faltando
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["devices"] });
  toast({ title: "Sucesso" });
},
```

**Evidência**: `src/hooks/useDevices.ts:41,70,91` (pattern correto)

---

### 8. Cold Start Lento (3-5s)

**Sintoma**: Primeira query após inatividade demora muito.

**Causa**: Supabase free tier hiberna database após inatividade.

**Solução**:
```bash
# 1. Upgrade para paid tier (recomendado para produção)
# Supabase Dashboard → Settings → Billing

# 2. Ping endpoint periodicamente (workaround)
# Adicionar cron job que chama API a cada 5 min
```

**Alternativa**: Aceitar cold start (comum em free tier).

**Evidência**: Comportamento conhecido do Supabase free tier

---

### 9. Role Não Aplica Após Signup

**Sintoma**: User criado mas não tem role esperado (ex: admin).

**Causa**: Trigger `handle_new_user` não executou ou email não match.

**Debug**:
```sql
-- 1. Check se profile foi criado
SELECT * FROM profiles WHERE email = 'user@popcode.com.br';

-- 2. Check se role foi atribuído
SELECT * FROM user_roles 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'user@popcode.com.br');

-- 3. Check logs do trigger
-- Supabase Dashboard → Logs → Postgres
```

**Fix**:
```sql
-- Atribuir role manualmente se necessário
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM profiles WHERE email = 'user@popcode.com.br';
```

**Evidência**: `supabase/migrations/*142104*.sql:79-86` (trigger logic)

---

### 10. Migration Falha com "relation does not exist"

**Sintoma**: Migration erro `ERROR: relation "user_roles" does not exist`.

**Causa**: Migration depende de tabela criada em migration anterior; ordem errada.

**Solução**:
```sql
-- Verificar ordem de migrations (timestamp no nome)
-- Se migration A depende de B, A deve ter timestamp > B

-- Se ordem está errada, renomear migration:
-- 20251006150000_*.sql → 20251006160000_*.sql
```

**Prevention**: Sempre criar dependencies antes de referências.

**Evidência**: `supabase/migrations/` (timestamps nos nomes)

---

## 🛠️ Debugging Workflows

### Workflow 1: Debug Query Não Retorna Dados

```
1. Verificar se dados existem no DB
   ↓ Supabase SQL Editor: SELECT * FROM devices;
   
2. Verificar RLS policies
   ↓ Dashboard → Database → Tables → devices → Policies
   
3. Testar query como user específico
   ↓ SET LOCAL role authenticated; SET LOCAL request.jwt.claims.sub TO '<uuid>';
   
4. Verificar role do user
   ↓ SELECT * FROM user_roles WHERE user_id = '<uuid>';
   
5. Verificar logs de erro
   ↓ Supabase Dashboard → Logs → API
```

### Workflow 2: Debug Authentication Issue

```
1. Verificar se user existe em auth.users
   ↓ Supabase Dashboard → Auth → Users
   
2. Verificar se profile foi criado
   ↓ SQL: SELECT * FROM profiles WHERE email = '...';
   
3. Verificar trigger logs
   ↓ Dashboard → Logs → Postgres
   
4. Verificar domain validation
   ↓ Email termina com @popcode.com.br?
   
5. Check redirect URI
   ↓ Google Cloud Console → OAuth credentials
```

### Workflow 3: Debug RLS Policy

```
1. Identificar policy que está bloqueando
   ↓ Error message geralmente indica operação (SELECT/INSERT/UPDATE/DELETE)
   
2. Revisar policy SQL
   ↓ docs/permissions.md ou Supabase Dashboard
   
3. Testar policy manually
   ↓ SQL Editor com SET LOCAL role/claims
   
4. Verificar função has_role()
   ↓ SELECT has_role('<uuid>', 'admin'); -- Deve retornar true/false
   
5. Fix policy ou atribuir role
```

---

## 📊 Performance Issues

### Slow Queries (>1s)

**Sintoma**: Queries demorando muito.

**Debug**:
```sql
-- 1. Enable query timing
\timing on

-- 2. Explain query
EXPLAIN ANALYZE SELECT * FROM devices WHERE status = 'available';

-- 3. Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'devices';
```

**Common fixes**:
```sql
-- Add index on frequently filtered columns
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_user_id ON devices(user_id);

-- Use specific selects (not *)
SELECT id, model, year FROM devices; -- Faster than SELECT *
```

**Evidência**: `supabase/migrations/*155608*.sql:54-55` (indexes)

### Large Payload (>1MB)

**Sintoma**: Requests lentos, browser trava.

**Causa**: Retornar muitos devices de uma vez (sem paginação).

**Fix**:
```typescript
// Implementar paginação
const { data, error } = await supabase
  .from("devices")
  .select("*")
  .range(0, 49); // Primeiros 50
```

**Evidência**: Gap documentado em `docs/architecture.md` (melhorias futuras #1)

---

## 🔐 Security Issues

### Exposed Service Role Key

**Sintoma**: `SUPABASE_SERVICE_ROLE_KEY` commitado no Git.

**Immediate action**:
```bash
# 1. Revoke key no Supabase Dashboard
# Settings → API → Service Role Key → Regenerate

# 2. Remover do Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" HEAD

# 3. Force push (cuidado!)
git push origin main --force
```

**Prevention**: Adicionar `.env` ao `.gitignore`.

**Evidência**: Prática padrão de segurança

### RLS Bypass Attempt

**Sintoma**: Logs mostram tentativas de bypass RLS.

**Detection**:
```sql
-- Check API logs para 403 errors excessivos
-- Supabase Dashboard → Logs → API → Filter by status=403
```

**Action**: Monitorar; RLS é à prova de bypass (assumindo configurado corretamente).

---

### 11. Modal/Dialog Trava a Tela Após Fechar (Scroll Lock Bug)

**Sintoma**: Após fechar um modal (Dialog), não é possível clicar em nada da tela. A página fica "travada".

**Causa**: Bug conhecido do Radix UI (#1241). Quando o Dialog fecha, ele não remove corretamente os estilos de scroll lock do `<body>`:
- `pointer-events: none`
- `overflow: hidden`
- `data-scroll-locked` attribute

**Debug**:
```javascript
// No DevTools Console, verificar:
document.body.style.pointerEvents // Se "none", bug está acontecendo
document.body.hasAttribute('data-scroll-locked') // Se true, bug confirmado
```

**Solução**: Implementar cleanup manual no componente que usa o Dialog:

```typescript
// Função de cleanup - remove scroll lock styles do body
const cleanupDialogScrollLock = () => {
  document.body.style.overflow = "";
  document.body.style.pointerEvents = "";
  document.body.style.paddingRight = "";
  document.body.removeAttribute("data-scroll-locked");
};

// No componente:
export function MyDialog({ open, onOpenChange }) {
  // Cleanup quando dialog fecha
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(cleanupDialogScrollLock, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Cleanup on unmount (fallback)
  useEffect(() => {
    return () => cleanupDialogScrollLock();
  }, []);

  // Cleanup extra no handler
  const handleOpenChange = useCallback((isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTimeout(cleanupDialogScrollLock, 300);
    }
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* ... */}
    </Dialog>
  );
}
```

**Referência**: 
- Bug report: https://github.com/radix-ui/primitives/issues/1241
- Implementação: `src/components/access/ChangeRoleDialog.tsx:32-40`

**Evidência**: Componente `ChangeRoleDialog` corrigido com este pattern

---

### 12. Edge Function retorna "non-2xx status code" (401/500)

**Sintoma**: Chamada a Edge Function falha com erro genérico "Edge Function returned a non-2xx status code".

**Causas comuns**:

#### Causa A: `verify_jwt = true` no config.toml (mais comum)

O Lovable Cloud usa signing-keys para autenticação. O `verify_jwt = true` (padrão) é uma abordagem deprecada que **não funciona** com signing-keys, causando rejeição 401 no gateway antes da função executar.

**Solução**: Configurar `verify_jwt = false` e validar o token internamente:

```toml
# supabase/config.toml
[functions.minha-funcao]
verify_jwt = false
```

```typescript
// Na Edge Function — validar manualmente
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  { global: { headers: { Authorization: authHeader } } }
);

const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

> ⚠️ **IMPORTANTE**: Toda nova Edge Function DEVE usar `verify_jwt = false` + validação interna.

#### Causa B: Uso de `auth.getClaims()` (método inexistente)

O método `supabase.auth.getClaims(token)` **não existe** no SDK `@supabase/supabase-js@2` usado via esm.sh nas Edge Functions. Usar este método causa erro de runtime silencioso.

**Solução**: Usar `auth.getUser()`:

```typescript
// ❌ ERRADO — getClaims() não existe neste SDK
const token = authHeader.replace('Bearer ', '');
const { data: claims } = await supabase.auth.getClaims(token);
const userId = claims.claims.sub;

// ✅ CORRETO — usar getUser()
const { data: { user }, error } = await supabase.auth.getUser();
const userId = user.id;
```

> **Nota**: `getUser()` faz chamada ao servidor e retorna o user completo (id, email, metadata). É o método correto para validação em Edge Functions.

#### Causa C: Integração externa não configurada (ex: Anthropic)

Se a Edge Function depende de uma API key externa, retorna erro 424/500 quando a chave não está configurada. Verificar no frontend se a integração está ativa ANTES de chamar a função.

**Evidência**: `supabase/config.toml`, Edge Functions em `supabase/functions/`

---

## 🧪 Testing Tips

### Manual Testing Checklist

**Roles**:
- [ ] Login como admin → testar CRUD completo
- [ ] Login como people → testar create/edit (não delete)
- [ ] Login como user → testar edit apenas próprios devices
- [ ] Tentar deletar como user → deve falhar (403)

**Scenarios**:
- [ ] Import CSV com 10+ devices
- [ ] Filtrar por tipo/status
- [ ] Buscar por texto
- [ ] Editar device e verificar updated_at muda
- [ ] Logout e verificar redirect

**RLS**:
- [ ] Tentar operation não permitida (via DevTools)
- [ ] Verificar erro é 403 (não 500)

---

## 📱 Browser-Specific Issues

### Safari

**Sintoma**: OAuth redirect falha.

**Causa**: Safari bloqueia cookies third-party por padrão.

**Solução**: Pedir user para habilitar cookies em Safari Preferences.

### Firefox

**Sintoma**: LocalStorage não persiste.

**Causa**: Firefox private browsing.

**Solução**: Usar Firefox normal (não private).

---

## 🆘 Emergency Procedures

### Database Down

**Sintoma**: Todos requests falham com "connection refused".

**Action**:
```bash
# 1. Check Supabase status
https://status.supabase.com

# 2. Ping database
curl https://{project_id}.supabase.co/rest/v1/

# 3. If prolonged, contact Supabase support
```

### Accidental Data Deletion

**Sintoma**: Devices deletados por engano.

**Recovery**:
```sql
-- Supabase não tem backup automático em free tier
-- Paid tier: Supabase Dashboard → Database → Backups → Restore

-- Prevention: Implementar soft delete (futuro)
ALTER TABLE devices ADD COLUMN deleted_at TIMESTAMP;
```

**Evidência**: Gap documentado (sem soft delete)

---

## 📚 Additional Resources

### Logs & Monitoring

| Log Type | Location | What to Look For |
|----------|----------|------------------|
| **Frontend errors** | Browser DevTools Console | JavaScript errors, network failures |
| **API requests** | Browser DevTools Network | Status codes, payloads, timings |
| **Auth events** | Supabase Dashboard → Auth → Logs | Login failures, token refreshes |
| **Database queries** | Supabase Dashboard → Logs → API | Slow queries, RLS violations |
| **Postgres logs** | Supabase Dashboard → Logs → Postgres | Trigger errors, constraint violations |

### Useful Supabase SQL Queries

```sql
-- Check all RLS policies
SELECT * FROM pg_policies;

-- Check active sessions
SELECT * FROM pg_stat_activity WHERE datname = 'postgres';

-- Check table sizes
SELECT 
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check user roles
SELECT p.email, ur.role 
FROM profiles p 
LEFT JOIN user_roles ur ON p.id = ur.user_id;
```

---

## 🔗 References

- [Supabase Docs - Debugging](https://supabase.com/docs/guides/platform/debugging)
- [Postgres RLS Docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [architecture.md](architecture.md) - Sistema completo
- [permissions.md](permissions.md) - RLS policies
- [api_specification.md](api_specification.md) - Schema detalhado

---

**Version**: 1.0  
**Maintainer**: Hugo (hugo@popcode.com.br)  
**Last Updated**: 2025-01-06

