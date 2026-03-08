---
type: "contribution-guide"
project: "PoPeople"
version: "1.0"
---

# Guia de Contribuição: PoPeople

Como contribuir para o projeto PoPeople, incluindo setup, workflow Git, padrões de código e processo de review.

---

## 🚀 Setup de Ambiente

### Pré-requisitos

- **Node.js** 18+ (recomendado: usar [nvm](https://github.com/nvm-sh/nvm))
- **npm** ou **bun** (projeto usa npm por padrão)
- **Git** 2.0+
- **Editor**: VSCode recomendado (configurações incluídas)

### Primeira vez (Onboarding)

```bash
# 1. Clone o repositório
git clone <GIT_URL>
cd popeople

# 2. Instale dependências
npm install

# 3. Configure environment variables
# Crie arquivo .env.local (não commitado):
echo "VITE_SUPABASE_URL=<URL>" > .env.local
echo "VITE_SUPABASE_PUBLISHABLE_KEY=<KEY>" >> .env.local

# 4. Inicie dev server
npm run dev

# 5. Acesse http://localhost:8080
```

**Obter credenciais Supabase**: Pergunte para admin (hugo@popcode.com.br) ou acesse Supabase Dashboard.

**Evidência**: `README.md:23-37`

### VSCode Extensions Recomendadas

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
- **TypeScript Error Lens** (`usernamehw.errorlens`)
- **Prettier** (opcional, projeto usa ESLint)

---

## 🌳 Git Workflow

### Branch Strategy

**Modelo**: Simplified Git Flow (sem `develop` branch)

```
main (production)
  ↳ feature/nome-da-feature
  ↳ fix/descricao-do-bug
  ↳ docs/descricao-da-doc
```

**Regras**:
1. **`main`** é sempre deployable (Lovable auto-deploy)
2. **Nunca** commitar direto em `main`
3. Branches de feature são efêmeras (deletar após merge)

**Evidência**: Padrão comum; não há `develop` branch no repositório.

### Naming Conventions

| Tipo | Prefixo | Exemplo |
|------|---------|---------|
| Nova feature | `feature/` | `feature/add-qr-code` |
| Bug fix | `fix/` | `fix/rls-policy-recursion` |
| Documentação | `docs/` | `docs/update-architecture` |
| Refactoring | `refactor/` | `refactor/device-hooks` |
| Performance | `perf/` | `perf/optimize-queries` |

### Commit Messages

**Formato**: [Conventional Commits](https://www.conventionalcommits.org/)

```
<type>(<scope>): <subject>

<body (opcional)>

<footer (opcional)>
```

**Types**:
- `feat`: Nova feature
- `fix`: Bug fix
- `docs`: Documentação
- `style`: Formatting (sem mudança lógica)
- `refactor`: Code refactoring
- `perf`: Performance
- `test`: Testes (futuro)
- `chore`: Build/config changes

**Exemplos**:
```bash
feat(devices): add QR code generation
fix(auth): validate domain in trigger
docs(architecture): add RLS policy matrix
refactor(hooks): extract useRoleCheck hook
```

**Evidência**: Commit history mostra pattern (ex: `8c8fb75 Fix: Device list screen not opening`)

---

## 🔄 Pull Request Process

### 1. Criar Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/nome-da-feature
```

### 2. Desenvolver

- Faça commits pequenos e frequentes
- Teste localmente (`npm run dev`)
- Rode linter (`npm run lint`)
- Verifique types (`npx tsc --noEmit`)

### 3. Push e PR

```bash
git push origin feature/nome-da-feature
```

**No GitHub**:
1. Abra Pull Request para `main`
2. Preencha template (se houver)
3. Adicione reviewers (admin/people team)
4. Aguarde review

### 4. Review

**Reviewer checklist**:
- [ ] Código compila sem erros TypeScript
- [ ] ESLint passa sem warnings
- [ ] Mudanças de DB têm migration SQL
- [ ] RLS policies verificadas (se mudou auth)
- [ ] Documentação atualizada (se mudou arquitetura)
- [ ] Testado manualmente (login com roles diferentes)

### 5. Merge

**Estratégia**: Squash and Merge (histórico limpo)

```bash
# Após aprovação, GitHub Squash Merge
# Branch é deletada automaticamente
```

**Auto-deploy**: Lovable detecta merge em `main` e faz deploy automático.

---

## 📝 Padrões de Código

### TypeScript

**✅ Do's**:
```typescript
// Type imports
import type { Device } from '@/types/device';

// Explicit return types
function getDevices(): Promise<Device[]> { ... }

// Prefer interfaces for props
interface DeviceDialogProps {
  open: boolean;
  device: Device | null;
}

// Use const assertions
const STATUS_LABELS = {
  borrowed: 'Emprestado',
  available: 'Disponível',
} as const;
```

**❌ Don'ts**:
```typescript
// No any
const data: any = ...;

// No non-null assertion without check
const device = devices.find(...)!; // Unsafe

// No unused imports
import { X, Y, Z } from 'lib'; // If only using X
```

**Evidência**: `src/hooks/useDevices.ts`, `src/types/device.ts`

### React

**✅ Do's**:
```typescript
// Functional components
const DeviceTable: React.FC<DeviceTableProps> = ({ devices }) => { ... };

// Custom hooks for logic
const { devices, isLoading } = useDevices();

// Destructure props
const DeviceDialog = ({ open, onOpenChange, device }: Props) => { ... };

// Memoize expensive computations
const sortedDevices = useMemo(() => devices.sort(...), [devices]);
```

**❌ Don'ts**:
```typescript
// No class components
class DeviceTable extends React.Component { ... }

// No inline object creation in render
<Component config={{ x: 1 }} /> // Re-creates object every render

// No missing dependencies in useEffect
useEffect(() => { doSomething(x); }, []); // x is dependency
```

**Evidência**: `src/components/DeviceTable.tsx`, `src/pages/Index.tsx`

### SQL (Migrations)

**✅ Do's**:
```sql
-- Always enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Use SECURITY DEFINER + search_path
CREATE FUNCTION f() ...
SECURITY DEFINER SET search_path = public;

-- Comment policies
COMMENT ON POLICY "policy_name" ON table IS 'Description';

-- Use transactions implicitly (Supabase wraps migrations)
```

**❌ Don'ts**:
```sql
-- No raw DELETE without WHERE
DELETE FROM devices; -- Dangerous

-- No DROP TABLE without IF EXISTS
DROP TABLE old_table; -- Fails if not exists

-- No hardcoded timestamps
INSERT INTO devices (created_at) VALUES ('2025-01-01'); -- Use now()
```

**Evidência**: `supabase/migrations/*.sql`

---

## 🧪 Testing Strategy

### Current State

**No automated tests** (Lovable limitation).

**Manual testing checklist**:
- [ ] Login como admin → ver botões admin-only
- [ ] Login como people → criar/editar devices
- [ ] Login como user → editar apenas próprios devices
- [ ] Logout → redirect para /auth
- [ ] Import CSV → verificar preview e resultado
- [ ] Filtros/busca → testar múltiplos cenários
- [ ] RLS → tentar operações não permitidas (deve falhar)

### Future (Vitest + Testing Library)

```typescript
// Exemplo (a ser implementado)
import { renderHook } from '@testing-library/react-hooks';
import { useDevices } from '@/hooks/useDevices';

test('useDevices fetches devices', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useDevices());
  await waitForNextUpdate();
  expect(result.current.devices).toHaveLength(14);
});
```

**Evidência**: `package.json:6-11` (sem script de teste)

---

## 🗄️ Database Migrations

### Creating Migrations

**Via Lovable Migration Tool** (recomendado):
1. Lovable Dashboard → Database → Migrations
2. Escrever SQL
3. Test (dry-run se disponível)
4. Apply

**Via SQL Editor** (alternativa):
1. Supabase Dashboard → SQL Editor
2. Escrever query
3. Run
4. Salvar como migration local
5. Commit migration file

**Naming**: `{timestamp}_{uuid}.sql` (Lovable auto-gera)

### Migration Checklist

- [ ] RLS habilitado se nova tabela
- [ ] Policies criadas para nova tabela
- [ ] Indexes em FKs e filtros comuns
- [ ] Comments em policies/functions
- [ ] SECURITY DEFINER + search_path em functions
- [ ] Trigger para updated_at se aplicável
- [ ] Testado em staging/dev antes de prod

**Evidência**: `supabase/migrations/*.sql`

### Rollback

**Via Lovable**: Não suportado (usar SQL manual)

**Manual**:
```sql
-- Reverter migration manualmente
DROP TABLE IF EXISTS new_table;
ALTER TABLE old_table ...;
```

**Best practice**: Criar migration de rollback junto com migration original (como comment).

---

## 📚 Documentation

### Quando Atualizar Docs

| Mudança | Docs a Atualizar |
|---------|------------------|
| Nova feature | `architecture.md` (features), `business_logic.md` (regras) |
| Nova tabela/migration | `api_specification.md` (schema), `architecture.md` (data model) |
| Mudança em RLS | `permissions.md` (matrix), `api_specification.md` (policies) |
| Novo workflow | `business_logic.md` (workflows) |
| Decision arquitetural | `adr/` (novo ADR) |
| Bug fix comum | `troubleshooting.md` |

### ADR Process

**Quando criar ADR**:
- Decisão técnica significativa
- Trade-offs entre alternativas
- Impacto em arquitetura ou segurança

**Template**:
```markdown
---
status: "proposed" | "accepted" | "rejected" | "deprecated"
date: "YYYY-MM-DD"
decision-makers: [...]
---

# ADR-XXXX: Título

## Context
## Decision
## Alternatives Considered
## Consequences
## Validation
## Notes
```

**Evidência**: `docs/adr/*.md`

---

## 🔐 Security Guidelines

### Never Commit

- ❌ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ `.env` files com secrets
- ❌ API keys, passwords, tokens
- ❌ Dados pessoais (emails reais em exemplos)

### Always Do

- ✅ Use `.env.local` para secrets (gitignored)
- ✅ Mask dados sensíveis em logs
- ✅ Validate inputs no frontend (zod)
- ✅ Check RLS policies antes de merge
- ✅ Review migrations com admin

**Evidência**: `.gitignore` (contém `.env.local`)

---

## 🚢 Deployment

### Automatic (via Lovable)

```
Git push → main
    ↓
Lovable detects change
    ↓
Build (npm run build)
    ↓
Deploy to CDN
    ↓
Live in ~2min
```

**No CI/CD pipeline**: Lovable não suporta custom pipelines.

**Rollback**: Via Git revert + push (Lovable re-deploys).

**Evidência**: `README.md:63-71`

### Environment Variables

**Set via Lovable Dashboard**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

**Não configurar**:
- `SUPABASE_SERVICE_ROLE_KEY` (não usado no client)

---

## 💬 Communication

### Channels

- **GitHub Issues**: Bugs, features, enhancements
- **Pull Requests**: Code review, discussions
- **Email**: hugo@popcode.com.br (admin/owner)

### Issue Template

```markdown
**Type**: Bug | Feature | Documentation

**Description**:
Brief summary of issue/feature.

**Steps to Reproduce** (for bugs):
1. Login as user X
2. Navigate to Y
3. Click Z
4. Error appears

**Expected Behavior**:
What should happen.

**Actual Behavior**:
What actually happens.

**Environment**:
- Browser: Chrome 120
- Role: admin | people | user
- Device: MacBook Pro M1

**Screenshots** (if applicable):
```

---

## ✅ Definition of Done

### Feature

- [ ] Code implementado e testado localmente
- [ ] TypeScript compila sem erros
- [ ] ESLint passa sem warnings
- [ ] Migrations criadas (se aplicável)
- [ ] RLS policies verificadas
- [ ] Documentação atualizada
- [ ] PR criado e aprovado
- [ ] Merged em `main`
- [ ] Testado em produção (smoke test)

### Bug Fix

- [ ] Root cause identificado
- [ ] Fix implementado
- [ ] Testado (bug não reproduz mais)
- [ ] Regression tests (outros cenários funcionam)
- [ ] PR aprovado e merged

### Documentation

- [ ] Mudanças precisas e baseadas em evidências
- [ ] Links internos verificados
- [ ] Typos corrigidos
- [ ] PR criado (docs também passam por review)

---

## 🤝 Code of Conduct

### Expected Behavior

- **Be respectful**: Respeite opiniões divergentes
- **Be constructive**: Critique código, não pessoas
- **Be collaborative**: Ajude outros devs
- **Be professional**: Ambiente de trabalho

### Unacceptable Behavior

- Linguagem ofensiva ou discriminatória
- Ataques pessoais
- Spam ou trolling
- Vazamento de informações confidenciais

**Enforcement**: Report para hugo@popcode.com.br

---

## 📚 Additional Resources

- [architecture.md](architecture.md) - Arquitetura completa
- [claude.meta.md](claude.meta.md) - Guia para IA
- [codebase_guide.md](codebase_guide.md) - Navegação do código
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev/)
- [TanStack Query Docs](https://tanstack.com/query/latest)

---

**Version**: 1.0  
**Maintainer**: Hugo (hugo@popcode.com.br)  
**Last Updated**: 2025-01-06

