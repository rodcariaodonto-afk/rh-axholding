---
type: "ai-development-guide"
project: "PoPeople"
target_agents: ["Claude", "Cursor", "GitHub Copilot"]
version: "1.0"
---

# Guia de Desenvolvimento com IA: PoPeople

Este documento orienta agentes de IA (Claude, Cursor, Copilot) sobre como trabalhar eficientemente neste projeto.

---

## 🎯 Contexto Rápido

**O que é**: Sistema de inventário de dispositivos interno da Popcode  
**Stack**: React 18 + Vite + TypeScript + Supabase + shadcn/ui  
**Plataforma**: Lovable (hosted) + Supabase backend  
**Escopo**: ~14 usuários, 100-200 devices, single-org

**Documentos essenciais**:
- [architecture.md](architecture.md) - Visão completa do sistema
- [permissions.md](permissions.md) - RLS policies e roles
- [codebase_guide.md](codebase_guide.md) - Mapa de diretórios

---

## 📁 Navegação Otimizada para IA

### Arquivos Âncora (Ponto de Partida)

| Objetivo | Arquivo Inicial | Evidência |
|----------|----------------|-----------|
| **Entender autenticação** | `src/hooks/useAuth.ts` | OAuth Google, domain validation |
| **Entender roles** | `src/hooks/useUserRole.ts` | Functions isAdmin(), isPeople(), canEdit() |
| **CRUD de devices** | `src/hooks/useDevices.ts` | TanStack Query patterns |
| **Schema do banco** | `src/integrations/supabase/types.ts` | Auto-gerado, 100% accurate |
| **RLS policies** | `supabase/migrations/20251006142104_*.sql` | Todas policies em SQL |
| **Página principal** | `src/pages/Index.tsx` | Lógica de UI + role checks |
| **Componentes UI** | `src/components/ui/*.tsx` | shadcn/ui components |

### Termos de Busca Úteis

| Procurando... | Busque por | Onde |
|---------------|------------|------|
| Como users são criados | `handle_new_user` | `supabase/migrations/20251006142104*.sql` |
| Validação de domínio | `@popcode.com.br` | `useAuth.ts:42`, migration trigger |
| Role checks | `has_role(` | Migrations (SQL function) |
| Device types | `device_type` enum | `src/types/device.ts:1-14` |
| Device status | `device_status` enum | `src/types/device.ts:16-27` |
| Import CSV logic | `importDevicesFromCSV` | `src/scripts/importDevices.ts` |
| RLS violations | `row-level security policy` | Supabase error messages |

---

## 🎨 Padrões de Estilo

### TypeScript

**✅ Fazer**:
```typescript
// Use type imports
import type { Database } from './types';

// Prefer interfaces para props
interface DeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
}

// Use enums do schema
type DeviceStatus = Database["public"]["Enums"]["device_status"];

// Destructure props
const DeviceTable = ({ devices, onEdit, onDelete }: DeviceTableProps) => { ... }
```

**❌ Evitar**:
```typescript
// Não usar any (projeto tem strict mode)
const data: any = ...;

// Não usar require (projeto é ESM)
const utils = require('./utils');

// Não ignorar erros Supabase
const { data } = await supabase.from("devices").select();
// Missing: if (error) throw error;
```

**Evidência**: `tsconfig.json`, `src/hooks/useDevices.ts:10-26`

### React Patterns

**✅ Fazer**:
```typescript
// Use TanStack Query para data fetching
const { data: devices = [], isLoading } = useQuery({
  queryKey: ["devices"],
  queryFn: async () => { ... },
});

// Use useMutation para writes
const createDevice = useMutation({
  mutationFn: async (device) => { ... },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["devices"] });
  },
});

// Toast notifications para feedback
toast({
  title: "Sucesso",
  description: "Dispositivo adicionado.",
});
```

**❌ Evitar**:
```typescript
// Não usar useState para dados Supabase
const [devices, setDevices] = useState([]);

// Não usar useEffect para queries
useEffect(() => {
  supabase.from("devices").select().then(...);
}, []);

// Não deixar loading states sem skeleton
if (isLoading) return <div>Loading...</div>; // Use <Skeleton />
```

**Evidência**: `src/hooks/useDevices.ts`, `src/pages/Index.tsx:74-78`

### SQL/Migrações

**✅ Fazer**:
```sql
-- Sempre habilitar RLS em novas tabelas
ALTER TABLE public.nova_tabela ENABLE ROW LEVEL SECURITY;

-- Use SECURITY DEFINER + search_path em functions
CREATE OR REPLACE FUNCTION my_function()
RETURNS ... LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$ ... $$;

-- Comente policies
COMMENT ON POLICY "policy_name" ON table_name IS 'Explicação';

-- Use enums para valores fixos
CREATE TYPE status AS ENUM ('active', 'inactive');
```

**❌ Evitar**:
```sql
-- Não criar tabelas sem RLS
CREATE TABLE x (...); -- Falta ENABLE ROW LEVEL SECURITY

-- Não usar search_path default em SECURITY DEFINER
CREATE FUNCTION f() ... SECURITY DEFINER AS $$ ... $$;
-- Risco: SQL injection via search_path

-- Não hardcode UUIDs
INSERT INTO table VALUES ('123e4567-...'); -- Use gen_random_uuid()
```

**Evidência**: `supabase/migrations/20251006142104*.sql:13,48`

---

## ⚠️ Pitfalls Comuns

### 1. RLS Violations

**Sintoma**: `Error: new row violates row-level security policy`

**Causa**: User sem permissão tentando INSERT/UPDATE/DELETE

**Solução**:
```typescript
// Verificar role antes de tentar operação
const { canEdit } = useUserRole(user?.id);
if (!canEdit()) {
  toast({ title: "Sem permissão", variant: "destructive" });
  return;
}
```

**Evidência**: `docs/troubleshooting.md` (quando existir)

### 2. Queries Retornam Vazias (Mas Dados Existem)

**Causa**: RLS bloqueando SELECT

**Debug**:
```sql
-- Check policies
\d+ devices -- No psql, mostra policies

-- Test como user específico
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub TO '<user_uuid>';
SELECT * FROM devices;
```

### 3. Tipos Desatualizados

**Sintoma**: TypeScript reclama de campo que existe no DB

**Causa**: `src/integrations/supabase/types.ts` desatualizado

**Solução**: Regenerar types (via Lovable ou Supabase CLI)

### 4. Duplicate Key Errors em Import

**Sintoma**: `ERROR: duplicate key value violates unique constraint`

**Causa**: Import CSV tentando inserir serial já existente

**Solução**:
```typescript
// Use upsert pattern
const { error } = await supabase
  .from("devices")
  .upsert(devices, { onConflict: "serial" });
```

**Evidência**: `src/scripts/importDevices.ts:189-192`

### 5. Cold Starts no Supabase

**Sintoma**: Primeira query após inatividade demora 3-5s

**Causa**: Database hibernation em free tier

**Solução**: Ping endpoint a cada 5 min (ou upgrade para paid tier)

---

## 🚀 Performance Best Practices

### Frontend

**✅ Fazer**:
```typescript
// Specific selects (não *)
.select("id, model, year, user_name")

// Use indexes em filters
.eq("status", "available") // status tem index

// Cache agressivo com TanStack Query
staleTime: 5 * 60 * 1000, // 5 min
```

**❌ Evitar**:
```typescript
// Select *
.select("*") // Traz dados desnecessários

// Filter sem index
.ilike("notes", "%keyword%") // Slow scan

// Refetch desnecessário
refetchInterval: 1000 // Polling agressivo
```

### Backend (Postgres)

**✅ Fazer**:
```sql
-- Indexes em FKs e filtros comuns
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_status ON devices(status);

-- Partial indexes
CREATE INDEX idx_devices_serial ON devices(serial) WHERE serial IS NOT NULL;

-- Analyze após bulk inserts
ANALYZE devices;
```

**Evidência**: `supabase/migrations/20251006143920*.sql:6`, `20251006144602*.sql:7`

---

## 🔒 Segurança Best Practices

### Never Do

- ❌ **Expor service role key no client** → Bypass completo de RLS
- ❌ **Desabilitar RLS** → Dados públicos
- ❌ **Confiar em frontend auth** → Sempre validar no RLS
- ❌ **Usar `text` para senhas** → Use `auth.users` do Supabase
- ❌ **Log segredos** → `console.log(SUPABASE_KEY)` em produção

### Always Do

- ✅ **RLS em todas tabelas** → `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- ✅ **SECURITY DEFINER + search_path** → Previne SQL injection
- ✅ **Validate domain no backend** → Não confiar em OAuth hint
- ✅ **Separate user_roles table** → Previne privilege escalation
- ✅ **Use HTTPS** → Lovable + Supabase fornecem automaticamente

**Evidência**: `docs/architecture.md` (seção "Segurança")

---

## 🧪 Testing Strategies

### Manual Testing (Atual)

```typescript
// Test role checks
1. Login como admin → deve ver botão "Deletar"
2. Login como user → não deve ver botão "Deletar"
3. Logout → redirect para /auth

// Test RLS
1. DevTools → Network → copiar query
2. Mudar auth header → deve falhar
3. Verificar error message = "RLS violation"
```

### Future (Automated Tests)

```typescript
// Vitest + Testing Library (a ser implementado)
describe("useUserRole", () => {
  it("admin can delete", () => {
    const { canDelete } = useUserRole("admin_uuid");
    expect(canDelete()).toBe(true);
  });
});
```

**Evidência**: `package.json:6-11` (sem script de teste ainda)

---

## 🛠️ Debugging Workflows

### 1. Query Não Retorna Dados

```bash
# 1. Check Supabase Dashboard → Table Editor
# 2. Check RLS policies
# 3. Check user_roles do usuário
SELECT * FROM user_roles WHERE user_id = '<uuid>';

# 4. Test query como user
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub TO '<uuid>';
SELECT * FROM devices;
```

### 2. UI Não Atualiza Após Mutation

```typescript
// Check: queryClient.invalidateQueries foi chamado?
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["devices"] });
  // ^ Isso força refetch
}
```

### 3. Migration Falhou

```bash
# Check: syntax error? dependency missing?
# 1. Revisar SQL no editor
# 2. Test localmente (se possível)
# 3. Rollback via Lovable UI ou SQL direto
```

---

## 📚 Recursos Úteis

### Documentação Externa

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/overview)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vite](https://vitejs.dev/)

### Documentação Interna

- [architecture.md](architecture.md) - Deep dive técnico
- [permissions.md](permissions.md) - Matrix completa de permissões
- [codebase_guide.md](codebase_guide.md) - Mapa de diretórios

### Comandos Úteis

```bash
# Dev server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Check types
npx tsc --noEmit
```

---

## 🤝 Como Contribuir (Para Agentes de IA)

1. **Sempre ler contexto antes de propor mudanças**
   - Consultar `docs/` antes de fazer alterações arquiteturais

2. **Seguir padrões existentes**
   - Mimetizar estilo de código já presente
   - Usar mesmos hooks (TanStack Query, useAuth, useUserRole)

3. **Documentar decisões não-óbvias**
   - Comentários em SQL (policies, triggers)
   - JSDoc em funções complexas

4. **Validar segurança**
   - Toda nova tabela deve ter RLS
   - Toda operação privilegiada deve ter role check

5. **Testar manualmente**
   - Login com roles diferentes
   - Verificar RLS via Network tab

---

## 🚨 Red Flags (Nunca Fazer Sem Consulta)

- 🚨 Desabilitar RLS em tabela existente
- 🚨 Adicionar service role key no frontend
- 🚨 Mudar estrutura de `user_roles` (risco de privilege escalation)
- 🚨 Remover validação de domínio `@popcode.com.br`
- 🚨 Fazer breaking changes em `types.ts` (regenerar é ok, editar manualmente não)

---

## ✅ Definition of Done (AI Changes)

- [ ] Código compila sem erros TypeScript
- [ ] ESLint passa sem warnings
- [ ] RLS verificado se mudou DB
- [ ] Documentação atualizada se mudou arquitetura
- [ ] Testado manualmente com roles diferentes
- [ ] Git commit message descritivo

---

**Version**: 1.0  
**Last Updated**: 2025-01-06  
**Maintainer**: Hugo (hugo@popcode.com.br)

