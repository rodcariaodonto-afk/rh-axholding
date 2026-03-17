

# Registros de Ponto com 4 Batidas

## Situacao Atual
O sistema registra apenas 2 eventos por dia: **Entrada** (`clock_in`) e **Saida** (`clock_out`). O usuario quer 4 batidas: Entrada, Saida Almoco, Retorno Almoco, Saida.

## Plano

### 1. Migracao — Adicionar colunas na tabela `time_entries`
```sql
ALTER TABLE public.time_entries
  ADD COLUMN lunch_out TIMESTAMPTZ,
  ADD COLUMN lunch_return TIMESTAMPTZ;
```

### 2. Atualizar `useClockInOut.ts` — Ciclo de 4 estados
O botao de ponto passa a ciclar entre 4 estados baseado no que ja foi preenchido no registro aberto:
- Sem registro aberto → **Registrar Entrada** (cria entry com `clock_in`)
- `clock_in` preenchido, sem `lunch_out` → **Saida Almoco** (atualiza `lunch_out`)
- `lunch_out` preenchido, sem `lunch_return` → **Retorno Almoco** (atualiza `lunch_return`)
- `lunch_return` preenchido, sem `clock_out` → **Saida** (atualiza `clock_out` + calcula `total_minutes` descontando almoco)

O calculo de `total_minutes` passa a descontar o intervalo de almoco:
`total = (clock_out - clock_in) - (lunch_return - lunch_out)`

### 3. Atualizar `ClockInOutButton.tsx` — Labels dinamicos
Mostrar o label correto para cada estado: "Registrar Entrada", "Saida para Almoco", "Retorno do Almoco", "Registrar Saida". Cores e icones diferentes para cada etapa.

### 4. Atualizar `TimeEntriesTable.tsx` — 4 colunas
Tabela com colunas: Colaborador | Data | Entrada | Saida Almoco | Retorno Almoco | Saida | Total | Status

### 5. Atualizar `DailyTimeline.tsx` — 4 pontos na timeline
Mostrar os 4 eventos na timeline do colaborador.

### Arquivos alterados
- `supabase/migrations/` — nova migracao (2 colunas)
- `src/hooks/useClockInOut.ts` — logica de 4 estados
- `src/components/time-tracking/ClockInOutButton.tsx` — labels/icones
- `src/components/time-tracking/TimeEntriesTable.tsx` — 4 colunas
- `src/components/time-tracking/DailyTimeline.tsx` — 4 eventos

