---
type: "codebase-navigation"
project: "PoPeople"
version: "1.0"
---

# Guia de Navegação da Base de Código

Mapa completo de diretórios, arquivos-chave e fluxos de dados do projeto PoPeople.

---

## 📁 Estrutura de Diretórios

```
popeople/
├── docs/                           # 📘 Documentação técnica
│   ├── index.md                    # Índice canônico
│   ├── architecture.md             # Arquitetura completa
│   ├── permissions.md              # Roles & RLS policies
│   ├── adr/                        # Architecture Decision Records
│   │   ├── 0001-lovable-cloud-backend.md
│   │   ├── 0002-rls-authorization.md
│   │   ├── 0003-hardcoded-roles.md
│   │   └── 0004-direct-queries.md
│   ├── claude.meta.md              # Guia para IA
│   └── ...                         # Outros docs
│
├── src/                            # 💻 Código-fonte frontend
│   ├── main.tsx                    # Entrypoint React
│   ├── App.tsx                     # Router & providers
│   ├── pages/                      # 📄 Páginas (routes)
│   │   ├── Index.tsx               # "/" - Inventário principal
│   │   ├── Auth.tsx                # "/auth" - Login Google
│   │   ├── ImportCSV.tsx           # "/import-csv" - Import devices
│   │   └── NotFound.tsx            # "/*" - 404
│   │
│   ├── components/                 # 🧩 Componentes React
│   │   ├── Header.tsx              # Header com user info
│   │   ├── DeviceTable.tsx         # Tabela com filtros
│   │   ├── DeviceDialog.tsx        # Modal add/edit device
│   │   ├── DeviceCharts.tsx        # Gráficos estatísticos
│   │   ├── ProtectedRoute.tsx      # Auth guard
│   │   └── ui/                     # shadcn/ui components
│   │
│   ├── hooks/                      # 🪝 React hooks customizados
│   │   ├── useAuth.ts              # OAuth + session
│   │   ├── useUserRole.ts          # Role checks
│   │   ├── useDevices.ts           # CRUD devices
│   │   ├── useProfiles.ts          # Query profiles
│   │   ├── use-toast.ts            # Toast notifications
│   │   └── use-mobile.tsx          # Responsive breakpoint
│   │
│   ├── types/                      # 📝 TypeScript types
│   │   └── device.ts               # Device, DeviceType, DeviceStatus
│   │
│   ├── constants/                  # 🔢 Constantes
│   │   └── device.ts               # Labels, icons, colors
│   │
│   ├── integrations/               # 🔌 Integrações externas
│   │   └── supabase/
│   │       ├── client.ts           # Cliente Supabase
│   │       └── types.ts            # Types auto-gerados do DB
│   │
│   ├── scripts/                    # 🛠️ Scripts utilitários
│   │   └── importDevices.ts        # Lógica import CSV
│   │
│   ├── lib/                        # 📚 Utilitários
│   │   └── utils.ts                # Helpers (cn, etc.)
│   │
│   └── assets/                     # 🎨 Assets estáticos
│       └── popcode-logo.svg
│
├── supabase/                       # 🗄️ Backend Supabase
│   ├── config.toml                 # Project ID
│   └── migrations/                 # Migrações SQL
│       ├── 20251006140354_*.sql    # Criação inicial devices
│       ├── 20251006142104_*.sql    # Roles + RLS + auth
│       ├── 20251006155608_*.sql    # Multi-device types
│       └── ...
│
├── public/                         # 🌐 Assets públicos
│   ├── favicon.ico
│   └── robots.txt
│
└── config files                    # ⚙️ Configurações
    ├── package.json                # Dependencies
    ├── vite.config.ts              # Vite + Lovable
    ├── tsconfig.json               # TypeScript
    ├── tailwind.config.ts          # Tailwind CSS
    ├── components.json             # shadcn/ui config
    └── eslint.config.js            # Linter
```

---

## 🗂️ Arquivos-Chave por Funcionalidade

### Autenticação & Autorização

| Arquivo | Propósito | Exports Key |
|---------|-----------|-------------|
| `src/hooks/useAuth.ts` | OAuth Google, session management | `useAuth()` → `{ user, signInWithGoogle, signOut }` |
| `src/hooks/useUserRole.ts` | Role checks (admin, people, user) | `useUserRole(userId)` → `{ isAdmin, canEdit, canDelete }` |
| `src/components/ProtectedRoute.tsx` | Redirect unauthenticated users | `<ProtectedRoute>` wrapper |
| `src/pages/Auth.tsx` | Login page | Login UI |
| `supabase/migrations/*142104*.sql` | Trigger `handle_new_user`, roles table, RLS | SQL DDL |

### Gestão de Devices

| Arquivo | Propósito | Exports Key |
|---------|-----------|-------------|
| `src/hooks/useDevices.ts` | CRUD operations (TanStack Query) | `useDevices()` → `{ devices, createDevice, updateDevice, deleteDevice }` |
| `src/types/device.ts` | TypeScript types | `Device`, `DeviceType`, `DeviceStatus` |
| `src/constants/device.ts` | Labels, icons, colors | `DEVICE_TYPE_LABELS`, `DEVICE_STATUS_COLORS` |
| `src/components/DeviceTable.tsx` | Tabela com filtros/busca | `<DeviceTable>` |
| `src/components/DeviceDialog.tsx` | Modal add/edit | `<DeviceDialog>` |
| `src/components/DeviceCharts.tsx` | Gráficos (Recharts) | `<DeviceCharts>` |

### Import/Export

| Arquivo | Propósito | Exports Key |
|---------|-----------|-------------|
| `src/pages/ImportCSV.tsx` | UI import CSV | Page component |
| `src/scripts/importDevices.ts` | Parsing CSV + bulk insert | `importDevicesFromCSV(csvData)` |

### UI Foundation

| Arquivo | Propósito | Notes |
|---------|-----------|-------|
| `src/components/ui/*.tsx` | shadcn/ui components | 40+ components (button, dialog, table, etc.) |
| `src/lib/utils.ts` | Helper `cn()` | Merge Tailwind classes |
| `tailwind.config.ts` | Theme config | Colors, fonts, animations |

### Backend Schema

| Arquivo | Propósito | Key Objects |
|---------|-----------|-------------|
| `src/integrations/supabase/types.ts` | Auto-gerado do DB | `Database`, `Tables<"devices">`, `Enums` |
| `src/integrations/supabase/client.ts` | Cliente Supabase | `supabase` instance |
| `supabase/config.toml` | Project ID | `project_id = "kejiscdouigoohujycuu"` |

---

## 🔄 Fluxos de Dados

### 1. Fluxo de Autenticação

```
User clica "Entrar com Google"
    ↓
useAuth.signInWithGoogle()
    ↓
Supabase Auth OAuth (Google)
    → hd=popcode.com.br (domain hint)
    ↓
Callback redirect → "/"
    ↓
Supabase trigger: handle_new_user
    → Valida domínio @popcode.com.br
    → Cria registro em `profiles`
    → Atribui role (admin/people/user)
    ↓
useAuth hook atualiza state
    ↓
ProtectedRoute permite acesso
    ↓
Header mostra user email + role badge
```

**Arquivos envolvidos**:
- Frontend: `useAuth.ts:34-58`, `Auth.tsx`, `ProtectedRoute.tsx`
- Backend: `supabase/migrations/*142104*.sql:59-94`

### 2. Fluxo de CRUD de Device

```
User clica "Adicionar Dispositivo"
    ↓
DeviceDialog abre
    ↓
User preenche form (react-hook-form + zod)
    ↓
onSave() chamado
    ↓
useDevices.createDevice.mutate(device)
    ↓
supabase.from("devices").insert([device])
    ↓
RLS Policy "Admin e People podem adicionar" check
    → has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'people')
    ↓
Se OK: INSERT no Postgres
    ↓
onSuccess: queryClient.invalidateQueries(["devices"])
    ↓
TanStack Query refetch
    ↓
DeviceTable atualiza automaticamente
    ↓
Toast "Dispositivo adicionado"
```

**Arquivos envolvidos**:
- Frontend: `Index.tsx:40-49`, `DeviceDialog.tsx`, `useDevices.ts:29-54`
- Backend: `supabase/migrations/*142104*.sql:114-120` (RLS policy)

### 3. Fluxo de Import CSV

```
User seleciona arquivo CSV
    ↓
ImportCSV.handleFileChange()
    ↓
parseCSV(text) → csvData array
    ↓
Preview mostra primeiros 10 registros
    ↓
User clica "Confirmar e Importar"
    ↓
importDevicesFromCSV(csvData)
    ↓
Para cada linha:
    → Mapeia tipo/status (TYPE_MAP, STATUS_MAP)
    → Busca user por email (findUserByNameOrEmail)
    → Skip se status = "Não encontrado"
    → Monta objeto device
    ↓
supabase.from("devices").insert(devices)
    ↓
RLS Policy check (admin/people)
    ↓
Bulk INSERT
    ↓
Retorna { imported, skipped, skippedItems }
    ↓
UI mostra resultado
```

**Arquivos envolvidos**:
- `ImportCSV.tsx:75-108`, `importDevices.ts:114-213`

### 4. Fluxo de Role Check

```
Component precisa saber role do user
    ↓
const { canEdit, canDelete } = useUserRole(user?.id)
    ↓
TanStack Query busca:
    supabase.from("user_roles").select("role").eq("user_id", userId)
    ↓
RLS Policy "Usuários podem ver seus próprios papéis" check
    → auth.uid() = user_id
    ↓
Retorna roles (ex: ['admin'])
    ↓
canEdit() = isAdmin() || isPeople()
canDelete() = isAdmin()
    ↓
UI condicional:
    {canEdit() && <Button onClick={handleAdd}>Adicionar</Button>}
```

**Arquivos envolvidos**:
- Frontend: `useUserRole.ts:1-36`, `Index.tsx:17,66-70`
- Backend: `supabase/migrations/*142104*.sql:37-40` (RLS policy)

---

## 🔌 Dependências Externas

### Runtime Dependencies

| Biblioteca | Versão | Uso | Import Path |
|-----------|--------|-----|-------------|
| `react` | ^18.3.1 | UI framework | `import { useState } from 'react'` |
| `@supabase/supabase-js` | ^2.58.0 | Backend client | `import { supabase } from '@/integrations/supabase/client'` |
| `@tanstack/react-query` | ^5.83.0 | Data fetching/cache | `import { useQuery, useMutation } from '@tanstack/react-query'` |
| `react-router-dom` | ^6.30.1 | Routing | `import { BrowserRouter, Route } from 'react-router-dom'` |
| `react-hook-form` | ^7.61.1 | Forms | `import { useForm } from 'react-hook-form'` |
| `zod` | ^3.25.76 | Validation | `import { z } from 'zod'` |
| `recharts` | ^2.15.4 | Charts | `import { BarChart, Bar } from 'recharts'` |
| `lucide-react` | ^0.462.0 | Icons | `import { Plus, Pencil } from 'lucide-react'` |
| `tailwindcss` | ^3.4.17 | CSS | class names |
| `@radix-ui/react-*` | vários | shadcn/ui base | `import * from '@radix-ui/react-dialog'` |

**Evidência**: `package.json:13-64`

### Dev Dependencies

| Biblioteca | Versão | Uso |
|-----------|--------|-----|
| `vite` | ^5.4.19 | Build tool |
| `@vitejs/plugin-react-swc` | ^3.11.0 | React plugin (SWC compiler) |
| `typescript` | ^5.8.3 | Type checking |
| `eslint` | ^9.32.0 | Linting |
| `lovable-tagger` | ^1.1.10 | Lovable integration |

**Evidência**: `package.json:65-83`

---

## 🗄️ Schema do Banco de Dados

### Tabelas

| Tabela | Colunas-Chave | FK | Descrição |
|--------|--------------|----|-----------| 
| `devices` | id, user_name, model, year, device_type, status, user_id | → profiles(id) | Inventário de dispositivos |
| `profiles` | id, email, full_name | → auth.users(id) | Perfis de usuários |
| `user_roles` | id, user_id, role | → auth.users(id) | Roles (admin/people/user) |

### Enums

| Enum | Valores | Uso |
|------|---------|-----|
| `app_role` | admin, people, user | Roles de usuários |
| `device_type` | computer, monitor, mouse, ... (13 tipos) | Tipo de equipamento |
| `device_status` | borrowed, available, office, ... (11 status) | Situação do device |

### Functions

| Function | Propósito | Uso |
|----------|-----------|-----|
| `has_role(_user_id, _role)` | Verifica se user tem role | RLS policies |
| `update_updated_at_column()` | Atualiza timestamp | Trigger em devices/profiles |
| `handle_new_user()` | Cria profile + atribui role | Trigger em auth.users |

**Evidência**: `src/integrations/supabase/types.ts:9-173`

---

## ⚙️ Configurações de Build/Deploy

### Vite (Dev Server)

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger() // Lovable
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Path alias
    },
  },
}));
```

**Evidência**: `vite.config.ts:1-18`

### TypeScript

```json
// tsconfig.json (resumido)
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Evidência**: `tsconfig.json`, `tsconfig.app.json`

### Tailwind

```typescript
// tailwind.config.ts
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ... }, // Custom theme
      borderRadius: { ... },
      keyframes: { ... },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}
```

**Evidência**: `tailwind.config.ts`

### Deployment (Lovable)

- **Git push → auto-deploy**: Lovable monitora repositório
- **Build command**: `npm run build`
- **Output**: `dist/`
- **Environment vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (configuradas no Lovable Dashboard)

**Evidência**: `README.md:63-71`

---

## 🧭 Pontos de Entrada por Caso de Uso

### "Preciso adicionar um novo campo em devices"

1. **Backend**: Criar migration em `supabase/migrations/`
   ```sql
   ALTER TABLE devices ADD COLUMN novo_campo TEXT;
   ```

2. **Regenerar types**: Lovable auto-sync ou `supabase gen types typescript`

3. **Frontend**: Atualizar `src/types/device.ts` se necessário

4. **UI**: Adicionar campo em `DeviceDialog.tsx` form

5. **Evidência**: `supabase/migrations/20251006144602*.sql:1-4` (exemplo: serial, warranty_date)

### "Preciso adicionar uma nova role"

1. **Backend**: Alterar enum em migration
   ```sql
   ALTER TYPE app_role ADD VALUE 'new_role';
   ```

2. **Atualizar trigger**: `handle_new_user` com lógica de atribuição

3. **Frontend**: Atualizar `useUserRole.ts` com novo check
   ```typescript
   const isNewRole = () => roles.includes("new_role");
   ```

4. **RLS**: Adicionar policies usando novo role

### "Preciso debugar por que query falhou"

1. **Browser DevTools** → Network tab → ver request Supabase

2. **Supabase Dashboard** → Logs → API Logs

3. **Verificar RLS**: `docs/permissions.md` matriz de permissões

4. **Testar SQL direto**: Supabase SQL Editor

---

## 📚 Referências

- [architecture.md](architecture.md) - Arquitetura completa
- [permissions.md](permissions.md) - Matriz de permissões
- [claude.meta.md](claude.meta.md) - Guia para IA
- [README.md](../README.md) - Setup e tecnologias

