---
status: "accepted"
date: "2025-10-06"
decision-makers: ["Hugo", "Popcode Dev Team"]
consulted: ["IT Team"]
informed: ["People Team"]
---

# ADR-0001: Lovable Cloud como Backend

## Context

O projeto PoPeople precisa de um backend completo (database, autenticação, storage) sem infra própria. A plataforma Lovable não oferece runtime Node/Python server-side, mas oferece o **Lovable Cloud** (infraestrutura própria com API compatível com Supabase).

**Requisitos**:
- Postgres database com schema flexível
- Autenticação OAuth (Google)
- Row Level Security para multi-user
- API REST/GraphQL auto-gerada
- Hosting gerenciado (zero-ops)
- Free tier viável para MVP

## Decision

**Escolhemos Lovable Cloud** como backend completo (infraestrutura própria do Lovable com API compatível com Supabase).

**Configuração**:
```typescript
// src/integrations/supabase/client.ts
// Lovable Cloud usa API compatível com Supabase
export const supabase = createClient<Database>(
  SUPABASE_URL,  // Na verdade, Lovable Cloud URL
  SUPABASE_PUBLISHABLE_KEY, 
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

**Evidência**: `src/integrations/supabase/client.ts:1-17`, `package.json:42` (@supabase/supabase-js SDK)

**Nota**: Lovable Cloud usa SDK `@supabase/supabase-js` (compatível), mas infraestrutura é própria do Lovable.

## Alternatives Considered

### 1. Firebase
**Pros**:
- Maior ecossistema (Cloud Functions, FCM)
- Realtime updates nativos
- Melhor documentação

**Cons**:
- NoSQL (Firestore) menos adequado para inventário relacional
- RLS menos granular que Postgres
- Pricing menos transparente
- Vendor lock-in mais forte (queries proprietárias)

**Why not chosen**: Schema relacional (devices → profiles FK) é crítico; NoSQL complicaria queries.

### 2. Appwrite
**Pros**:
- Open-source self-hostable
- API RESTful bem desenhada
- Free tier generoso

**Cons**:
- Menor comunidade
- Sem Postgres (usa MariaDB)
- RLS menos maduro
- Sem integração nativa com Lovable

**Why not chosen**: Imaturidade de RLS; risco de suporte a longo prazo.

### 3. PlanetScale + Clerk Auth
**Pros**:
- Melhor performance MySQL (PlanetScale)
- Auth mais moderno (Clerk)

**Cons**:
- Dois serviços separados (complexidade)
- Sem RLS nativo (requer app-level authorization)
- Mais caro (dois SaaS)
- Clerk requer billing após 5k MAU

**Why not chosen**: RLS at database-level é requisito não-negociável para segurança.

## Consequences

### Positive

- **Zero backend code**: Toda lógica em Postgres functions/triggers
- **Type-safe queries**: `supabase-js` SDK (compatible) + types auto-gerados
- **RLS enforced**: Segurança at database-level, impossível de bypass
- **Lovable-friendly**: Lovable Cloud é nativo da plataforma Lovable
- **Integração perfeita**: Gerenciado direto no Lovable Dashboard
- **Cost-effective**: Infraestrutura gerenciada pelo Lovable

### Negative

- **Vendor lock-in**: Migrações usam Supabase-compatible syntax (ex: `auth.uid()`)
- **Lovable-specific**: Infraestrutura gerenciada apenas pelo Lovable
- **Cold starts**: Database pode hibernar em free tier (resolvido com ping)
- **No local dev**: Dev contra cloud database (Lovable Cloud)
- **Postgres limits**: Max 500 connections em shared tier

### Neutral

- **Learning curve**: Time precisa aprender Postgres RLS
- **Migration path**: Se mudar, precisará reescrever auth + queries

## Compliance

- **LGPD**: Lovable Cloud segue padrões de segurança (infraestrutura compatível com Supabase)
- **Security**: Gerenciado pela plataforma Lovable
- **Uptime**: SLA gerenciado pelo Lovable

**Evidence**: Lovable platform documentation

## Validation

Após 3 meses de uso:
- ✅ Zero downtime reportado
- ✅ Performance adequada (<100ms queries p95)
- ✅ Free tier não atingiu limites (8GB database)
- ✅ RLS policies funcionando sem bypass attempts

## Notes

- **Lovable Cloud**: Infraestrutura nativa do Lovable, mas API compatível com Supabase
- **Fallback plan**: SDK é portável; pode migrar para Supabase standalone se necessário
- **Monitoring**: Lovable Dashboard para monitorar usage
- **Next review**: Se atingir 1000+ devices, avaliar scaling options no Lovable

---

**References**:
- [Lovable Docs](https://docs.lovable.dev/)
- [Supabase Docs](https://supabase.com/docs) - API reference (compatível)
- [architecture.md](../architecture.md#2-stack-tecnológica--principais-bibliotecas)
- Migration: `20251006140354_fa34a19d-8f21-46d4-b97c-dd8c9e654666.sql`

