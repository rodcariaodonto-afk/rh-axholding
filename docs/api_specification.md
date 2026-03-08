---
type: "api-specification"
project: "PoPeople"
version: "1.0"
api_type: "Supabase PostgREST + RLS"
---

# Especificação de API: PoPeople

Documentação completa do schema Supabase, queries, RLS policies e padrões de acesso a dados.

---

## 🌐 Arquitetura da API

**Tipo**: Supabase PostgREST (REST auto-gerado do Postgres schema)  
**Autenticação**: Supabase Auth JWT (OAuth Google)  
**Autorização**: Row Level Security (RLS) at database-level  
**Base URL**: `https://{project_id}.supabase.co`  
**Project ID**: `kejiscdouigoohujycuu`

**Evidência**: `supabase/config.toml:1`, `src/integrations/supabase/client.ts:5-6`

---

## 🗄️ Database Schema

### Tables Overview

| Table | Primary Key | Foreign Keys | RLS Enabled | Policies Count |
|-------|------------|--------------|-------------|---------------|
| `devices` | id (UUID) | user_id → profiles(id) | ✅ | 4 |
| `profiles` | id (UUID) | id → auth.users(id) | ✅ | 2 |
| `user_roles` | id (UUID) | user_id → auth.users(id) | ✅ | 1 |

**Evidência**: `src/integrations/supabase/types.ts:16-126`

---

## 📋 Table: `devices`

### Schema

```sql
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  device_type device_type NOT NULL DEFAULT 'computer',
  status device_status NOT NULL DEFAULT 'borrowed',
  processor TEXT,
  ram INTEGER,
  disk INTEGER,
  screen_size NUMERIC(4,1),
  serial TEXT,
  warranty_date DATE,
  hexnode_registered BOOLEAN DEFAULT false,
  notes TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Evidência**: Inferido de `src/integrations/supabase/types.ts:18-75`

### Indexes

| Index Name | Columns | Type | Purpose |
|-----------|---------|------|---------|
| `devices_pkey` | id | PRIMARY KEY | Unique identifier |
| `idx_devices_user_id` | user_id | BTREE | FK lookups, joins |
| `idx_devices_serial` | serial | BTREE (partial) | Serial lookups (WHERE serial IS NOT NULL) |
| `idx_devices_type` | device_type | BTREE | Type filtering |
| `idx_devices_status` | status | BTREE | Status filtering |

**Evidência**: `supabase/migrations/20251006143920*.sql:6`, `20251006144602*.sql:7`, `20251006155608*.sql:54-55`

### Constraints

- `NOT NULL`: user_name, model, year, device_type, status
- `CHECK`: None currently (no validation on year, ram, disk values)
- `UNIQUE`: None (⚠️ **Gap**: serial pode duplicar)
- `FOREIGN KEY`: user_id → profiles(id) ON DELETE SET NULL

### Triggers

```sql
-- Auto-update updated_at
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

**Evidência**: `supabase/migrations/20251006140354*.sql:52-55`

---

## 📋 Table: `profiles`

### Schema

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

**Evidência**: Inferido de `src/integrations/supabase/types.ts:85-107`

### Constraints

- `PRIMARY KEY`: id (also FK to auth.users)
- `UNIQUE`: email
- `NOT NULL`: email, created_at, updated_at
- `FOREIGN KEY`: id → auth.users(id) ON DELETE CASCADE

### Triggers

```sql
-- Auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Evidência**: `supabase/migrations/20251006142104*.sql:92-100`

---

## 📋 Table: `user_roles`

### Schema

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
```

**Evidência**: Inferido de `src/integrations/supabase/types.ts:109-126`

### Constraints

- `PRIMARY KEY`: id
- `UNIQUE`: (user_id, role) - User can't have duplicate roles
- `NOT NULL`: user_id, role
- `FOREIGN KEY`: user_id → auth.users(id) ON DELETE CASCADE

**Security Note**: No INSERT/UPDATE/DELETE policies; roles são atribuídas apenas via trigger ou SQL manual.

---

## 🔐 RLS Policies

### devices

#### Policy 1: SELECT (Read)

```sql
CREATE POLICY "Usuários autenticados podem visualizar dispositivos"
ON public.devices
FOR SELECT
TO authenticated
USING (true);
```

**Effect**: Qualquer usuário autenticado pode ver todos devices.

**Evidência**: `supabase/migrations/20251006142104*.sql:109-112`

#### Policy 2: INSERT (Create)

```sql
CREATE POLICY "Admin e People podem adicionar dispositivos"
ON public.devices
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'people'::app_role)
);
```

**Effect**: Apenas admins e people team podem criar devices.

**Evidência**: `supabase/migrations/20251006142104*.sql:114-120`

#### Policy 3: UPDATE (Edit)

```sql
CREATE POLICY "Admin, People e donos podem atualizar dispositivos"
ON public.devices
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'people'::app_role) OR
  auth.uid() = user_id
);
```

**Effect**: Admins, people team e owners podem editar devices.

**Evidência**: `supabase/migrations/20251006144602*.sql:16-23`

#### Policy 4: DELETE (Remove)

```sql
CREATE POLICY "Apenas Admin pode excluir dispositivos"
ON public.devices
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
```

**Effect**: Somente admins podem deletar devices.

**Evidência**: `supabase/migrations/20251006142104*.sql:130-133`

### profiles

#### Policy 1: SELECT (Read)

```sql
CREATE POLICY "Usuários podem ver próprio perfil, admin e people veem todos"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'people'::app_role)
);
```

**Effect**: Users veem próprio profile; admins/people veem todos.

**Evidência**: `supabase/migrations/20251006144910*.sql:5-12`

#### Policy 2: UPDATE (Edit)

```sql
CREATE POLICY "Usuários podem atualizar próprio perfil"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

**Effect**: Users podem editar apenas próprio profile.

**Evidência**: `supabase/migrations/20251006142104*.sql:21-24`

**No INSERT policy**: Profiles criados apenas via trigger `handle_new_user`.

### user_roles

#### Policy 1: SELECT (Read)

```sql
CREATE POLICY "Usuários podem ver seus próprios papéis"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**Effect**: Users veem apenas próprias roles.

**Evidência**: `supabase/migrations/20251006142104*.sql:37-40`

**No INSERT/UPDATE/DELETE policies**: Roles gerenciadas apenas por triggers/admin SQL (security measure).

---

## 🎯 Postgres Functions

### has_role()

**Signature**:
```sql
has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN
```

**Purpose**: Verifica se user tem role específico.

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

**Usage**: Chamada em RLS policies (ex: `has_role(auth.uid(), 'admin')`).

**Security**: `SECURITY DEFINER` bypassa RLS para evitar recursão; `search_path` previne SQL injection.

**Evidência**: `supabase/migrations/20251006142104*.sql:43-56`

### update_updated_at_column()

**Signature**:
```sql
update_updated_at_column() RETURNS TRIGGER
```

**Purpose**: Atualiza campo `updated_at` automaticamente em UPDATE.

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

**Usage**: Trigger em `devices` e `profiles`.

**Evidência**: `supabase/migrations/20251006140427*.sql:4-14`

### handle_new_user()

**Signature**:
```sql
handle_new_user() RETURNS TRIGGER
```

**Purpose**: Auto-cria profile + atribui role no signup.

**Implementation**: Ver `docs/business_logic.md` (RN-001, RN-002).

**Usage**: Trigger em `auth.users` AFTER INSERT.

**Evidência**: `supabase/migrations/20251006142104*.sql:59-94`

---

## 🔌 API Endpoints (PostgREST)

### Base Pattern

```
{method} https://{project_id}.supabase.co/rest/v1/{table_name}?{query_params}
Headers:
  apikey: {anon_key}
  Authorization: Bearer {jwt_token}
  Content-Type: application/json
```

### GET /rest/v1/devices

**Query devices com filtros e joins**.

**Request**:
```http
GET /rest/v1/devices?select=*,profiles:user_id(email,full_name)&order=created_at.desc
Headers:
  apikey: {anon_key}
  Authorization: Bearer {jwt}
```

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "user_name": "Hugo Gomes",
    "model": "MacBook Air 13\"",
    "year": 2025,
    "device_type": "computer",
    "status": "borrowed",
    "processor": "M4",
    "ram": 16,
    "disk": 256,
    "user_id": "uuid",
    "profiles": {
      "email": "hugo@popcode.com.br",
      "full_name": "Hugo Gomes"
    },
    "created_at": "2025-10-06T...",
    "updated_at": "2025-10-06T..."
  }
]
```

**RLS**: Policy "Usuários autenticados podem visualizar dispositivos" aplica.

**Evidência**: `src/hooks/useDevices.ts:13-22`

### POST /rest/v1/devices

**Cria novo device**.

**Request**:
```http
POST /rest/v1/devices
Headers:
  apikey: {anon_key}
  Authorization: Bearer {jwt}
  Content-Type: application/json
Body:
{
  "user_name": "Novo User",
  "model": "MacBook Pro 16\"",
  "year": 2024,
  "device_type": "computer",
  "status": "borrowed",
  "processor": "M3 Pro",
  "ram": 32,
  "disk": 1024
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "user_name": "Novo User",
  "model": "MacBook Pro 16\"",
  ...
}
```

**RLS**: Policy "Admin e People podem adicionar" checked.

**Errors**:
- `403 Forbidden` se user não é admin/people
- `400 Bad Request` se campos obrigatórios faltam

**Evidência**: `src/hooks/useDevices.ts:31-35`

### PATCH /rest/v1/devices?id=eq.{uuid}

**Atualiza device existente**.

**Request**:
```http
PATCH /rest/v1/devices?id=eq.123e4567-...
Headers:
  apikey: {anon_key}
  Authorization: Bearer {jwt}
  Content-Type: application/json
Body:
{
  "status": "available",
  "notes": "Device formatado"
}
```

**Response** (200 OK):
```json
{
  "id": "123e4567-...",
  "status": "available",
  "notes": "Device formatado",
  ...
}
```

**RLS**: Policy "Admin, People e donos podem atualizar" checked.

**Evidência**: `src/hooks/useDevices.ts:59-63`

### DELETE /rest/v1/devices?id=eq.{uuid}

**Deleta device**.

**Request**:
```http
DELETE /rest/v1/devices?id=eq.123e4567-...
Headers:
  apikey: {anon_key}
  Authorization: Bearer {jwt}
```

**Response** (204 No Content)

**RLS**: Policy "Apenas Admin pode excluir" checked.

**Errors**:
- `403 Forbidden` se user não é admin

**Evidência**: `src/hooks/useDevices.ts:87`

---

## 🚨 Error Handling

### Standard Errors

**Format**: Supabase retorna errors no formato:
```json
{
  "message": "Error message",
  "code": "error_code",
  "details": "Additional details",
  "hint": "Possible solution"
}
```

### Common Error Codes

| Code | HTTP Status | Meaning | Solution |
|------|-------------|---------|----------|
| `PGRST301` | 403 | RLS policy violation | Check user role/ownership |
| `23505` | 409 | Unique constraint violation | Check duplicate email/serial |
| `23503` | 409 | Foreign key violation | Ensure user_id exists in profiles |
| `22P02` | 400 | Invalid input syntax | Validate data types (ex: year must be integer) |
| `42P01` | 404 | Table doesn't exist | Check table name spelling |

**Evidência**: Pattern observado em `src/hooks/useDevices.ts:24,37,65,88` (error throwing)

**Gap**: Não usa RFC 7807 Problem Details (ver `docs/architecture.md` melhorias futuras).

---

## 📊 Query Patterns

### Select with Join

```typescript
const { data, error } = await supabase
  .from("devices")
  .select(`
    *,
    profiles:user_id (email, full_name)
  `);
```

### Select with Filters

```typescript
const { data, error } = await supabase
  .from("devices")
  .select("*")
  .eq("status", "available")
  .eq("device_type", "computer");
```

### Select with Ordering

```typescript
const { data, error } = await supabase
  .from("devices")
  .select("*")
  .order("created_at", { ascending: false });
```

### Upsert Pattern (Future)

```typescript
const { data, error } = await supabase
  .from("devices")
  .upsert({ serial: "ABC123", ... }, { onConflict: "serial" });
```

**Evidência**: `src/hooks/useDevices.ts`, `src/scripts/importDevices.ts`

---

## 🔒 Authentication & Authorization

### JWT Token Structure

```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "user-uuid",
  "email": "user@popcode.com.br",
  "role": "authenticated",
  "app_metadata": {},
  "user_metadata": {
    "full_name": "User Name"
  }
}
```

**Claims Used**:
- `sub`: User ID (usado em `auth.uid()` no RLS)
- `role`: Postgres role (`authenticated` ou `anon`)

**Not Used**:
- Custom claims (roles em DB, não JWT)

**Evidência**: Padrão Supabase Auth (não customizado)

### Rate Limiting

**Default**: 60 requests/second por anon key (Supabase free tier).

**Custom**: Não implementado.

**Bypass**: Service role key bypassa rate limit (não usado no client).

---

## 📚 References

- [Supabase PostgREST Docs](https://postgrest.org/en/stable/api.html)
- [permissions.md](permissions.md) - Detailed RLS matrix
- [architecture.md](architecture.md) - Security & patterns
- [codebase_guide.md](codebase_guide.md) - Where to find query code

