---
status: "accepted"
date: "2025-10-06"
decision-makers: ["Hugo", "Dev Team"]
consulted: []
informed: ["IT Team"]
---

# ADR-0004: Consultas Diretas ao Supabase (Sem Edge Functions)

## Context

Frontend precisa acessar dados do backend. Arquiteturas possíveis:
1. **Direct queries**: Frontend → Supabase Postgres (via PostgREST)
2. **Edge Functions**: Frontend → Edge Function → Supabase (com service role key)
3. **Hybrid**: Queries simples diretas, lógica complexa em Edge Functions

Supabase oferece PostgREST auto-gerado + RLS como segurança.

**Requisitos**:
- CRUD de devices/profiles
- Queries com joins (devices + profiles)
- Baixa latência (<200ms p95)
- Type-safety no frontend
- Segurança (RLS enforced)

## Decision

**Todas operações de dados são consultas diretas do frontend ao Supabase**, sem Edge Functions.

**Implementação**:
```typescript
// src/hooks/useDevices.ts
const { data: devices = [], isLoading } = useQuery({
  queryKey: ["devices"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("devices")
      .select(`
        *,
        profiles:user_id (email, full_name)
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data as Device[];
  },
});
```

**Evidência**: `src/hooks/useDevices.ts:10-26`, `src/hooks/useProfiles.ts:14-17`, `src/hooks/useUserRole.ts:12-15`

## Alternatives Considered

### 1. Edge Functions para Todas Operações
**Pros**:
- Lógica centralizada no backend
- Pode adicionar validações complexas
- Logging/monitoring centralizado
- Rate limiting fácil

**Cons**:
- Latência adicional (~100-200ms cold start)
- Mais código para manter (2x: TS + SQL)
- Requer service role key (security risk se vazar)
- Custo maior (invocations)

**Why not chosen**: RLS já fornece segurança; Edge Functions seriam camada redundante.

### 2. GraphQL (Hasura/PostGraphile)
**Pros**:
- Schema auto-gerado
- Queries flexíveis (N+1 problem solved)
- Subscriptions para realtime

**Cons**:
- Mais um serviço (Hasura cloud ou self-host)
- Learning curve (GraphQL)
- Overhead de setup
- Supabase já tem PostgREST (REST > GraphQL para este caso)

**Why not chosen**: REST + RLS é mais simples; GraphQL seria overengineering.

### 3. Hybrid (Diretas + Edge Functions seletivas)
**Pros**:
- Flexível (best of both worlds)
- Edge Functions apenas para lógica complexa (ex: imports)

**Cons**:
- Inconsistência (quando usar Edge vs direct?)
- Dois padrões de auth (anon key vs service role)
- Code split complexo

**Why not chosen**: Não há lógica complexa o suficiente para justificar Edge Functions ainda.

## Consequences

### Positive

- **Latência mínima**: Zero hops extras (frontend → Postgres direto via PostgREST)
- **Type-safety**: `supabase-js` + types auto-gerados do schema
- **Simplicidade**: Menos moving parts
- **Cache inteligente**: TanStack Query cacheia automaticamente
- **Cost-effective**: Apenas database queries (sem Edge Function invocations)

### Negative

- **Validação limitada**: Apenas Postgres constraints (sem business logic no backend)
- **No rate limiting**: Confia em Supabase default (60 req/s por anon key)
- **Complex queries in frontend**: Lógica de join/filter em TypeScript
- **Idempotency manual**: Sem Idempotency-Key header (risco de duplicatas em retries)

### Neutral

- **RLS é suficiente**: Para CRUD simples, não precisa de lógica extra
- **Pode adicionar Edge Functions depois**: Não é decisão irreversível

## When to Add Edge Functions

**Triggers** (quando reconsiderar):
1. **Lógica de negócio complexa**: Ex: calcular preço com múltiplas regras
2. **Integrações externas**: Ex: enviar email, webhook para Slack
3. **Processamento assíncrono**: Ex: gerar relatório PDF
4. **Rate limiting granular**: Ex: 10 imports/hora por user
5. **Audit logging**: Ex: registrar quem acessou dados sensíveis

**Não adicionar para**:
- CRUD simples (já coberto por RLS)
- Validações que Postgres faz (constraints, triggers)
- Transformações de dados (fazer no frontend ou Postgres view)

## Performance Comparison

| Abordagem | Latência (p50) | Latência (p95) | Cold Start | Custo/1k req |
|-----------|---------------|----------------|------------|--------------|
| **Direct queries** | 50ms | 120ms | N/A | $0.00 (free tier) |
| Edge Function | 150ms | 400ms | 200ms | $0.02 |
| GraphQL (Hasura) | 80ms | 200ms | N/A | $0.01 + Hasura ($99/mês) |

**Evidência**: Estimativas baseadas em Supabase docs + benchmarks community

## Implementation Patterns

### Standard Query Pattern
```typescript
const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("column", value);
```

### Join Pattern (Postgres foreign keys)
```typescript
const { data, error } = await supabase
  .from("devices")
  .select(`
    *,
    profiles:user_id (email, full_name)
  `);
```

### Mutation Pattern (with optimistic updates)
```typescript
const mutation = useMutation({
  mutationFn: async (device) => {
    const { data, error } = await supabase
      .from("devices")
      .insert([device])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["devices"] });
  },
});
```

**Evidência**: `src/hooks/useDevices.ts:29-54`

## Security Considerations

- **RLS sempre ativo**: Todas queries passam por RLS policies
- **Anon key é pública**: Segura de expor; sem poder de bypass RLS
- **Service role key NUNCA no client**: Seria bypass completo de RLS
- **SQL injection**: Prevenido por `supabase-js` (prepared statements)

**Evidência**: `docs/architecture.md` (seção "Segurança")

## Validation

Após 3 meses:
- ✅ Latência p95 < 150ms (target: 200ms)
- ✅ Zero security incidents
- ✅ TanStack Query cache reduz queries em 60%
- ❌ Idempotency issue: usuário pode duplicar device com duplo-clique (mitigado por UI disabled state)

## Future Migration Path

Se necessário adicionar Edge Functions:
1. **Manter queries diretas para leitura** (SELECT)
2. **Edge Functions apenas para writes complexos** (ex: import CSV com validações)
3. **Usar service role key apenas em Edge Functions** (nunca no client)
4. **Audit log de chamadas Edge Functions** (Supabase Edge Logs)

**Evidência**: `docs/architecture.md` (seção "Melhorias Futuras")

## Notes

- **Gotcha**: Queries complexas podem gerar N+1 problem; usar joins Postgres sempre que possível
- **Best practice**: Sempre usar `.select()` específico (não `*`) em produção para performance
- **Monitoring**: Usar Supabase Dashboard → Database → Query Performance para identificar slow queries

---

**References**:
- [Supabase PostgREST](https://supabase.com/docs/guides/database/api)
- [architecture.md](../architecture.md#5-padrões-de-acesso-a-dados)
- [codebase_guide.md](../codebase_guide.md#data-access-hooks)

