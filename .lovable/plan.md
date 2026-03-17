

# Banco de Horas Parametrizavel — Plano de Implementacao

## Resumo
Implementar sistema completo de Banco de Horas com parametrizacao de jornada por colaborador, espelho estendido, resumo mensal, historico de saldo e integracao com ponto existente.

---

## 1. Novas Tabelas (Migracao SQL)

### `employee_journey_config` (Parametrizacao por colaborador)
- `id`, `organization_id`, `employee_id` (FK employees)
- `tipo_jornada` (44h, 6x1, horista, comercial, plantao, customizada)
- `horas_semana`, `horas_dia`, `dias_trabalho` (text[])
- `tolerancia_atraso` (default 10), `tolerancia_saida_antecipada` (default 10)
- `intervalo_padrao` (default 60 min)
- `fator_hora_extra_normal` (1.5), `fator_hora_extra_noturna` (2.0), `fator_sabado` (1.5), `fator_domingo` (2.0), `fator_feriado` (2.0)
- `limite_saldo_negativo` (-40h), `validade_horas_dias` (365), `compensacao_automatica` (bool)
- `observacoes`, `data_vigencia`, `data_termino`, `is_active`
- RLS: org members can read/write

### `banco_horas_registros` (Registros diarios detalhados)
- `id`, `organization_id`, `employee_id`, `data` (date)
- `tipo_jornada`, `horas_esperadas`, `entrada`, `saida`, `lunch_out`, `lunch_return`
- `intervalo_minutos`, `horas_trabalhadas_minutos`, `diferenca_minutos`
- `horas_extras_minutos`, `tipo_registro` (presenca, falta, atestado, licenca_inss, atraso, feriado, folga)
- `observacoes`, `banco_horas_acumulado_minutos`
- RLS: org members

### `banco_horas_totalizadores` (Resumo mensal)
- `id`, `organization_id`, `employee_id`, `mes`, `ano`
- `horas_presentes`, `entrada_feriado`, `entrada_feriado_dias`, `atrasados`, `horas_trabalhadas_dias`
- `faltas`, `horas_extras_positivas`, `banco_acumulado_anterior`, `banco_acumulado_mes`, `saldo_atual`
- UNIQUE(organization_id, employee_id, mes, ano)
- RLS: org members

### `historico_saldo_banco_horas` (Evolucao do saldo)
- `id`, `organization_id`, `employee_id`, `mes`, `ano`
- `saldo_anterior`, `horas_acumuladas_mes`, `horas_compensadas`, `saldo_atual`
- RLS: org members

---

## 2. Nova Pagina: Parametrizacao de Jornada

Arquivo: `src/pages/JourneyConfig.tsx`

- Tabela: Colaborador | Tipo Jornada | Horas/Semana | Status | Acoes
- Filtro por colaborador
- Dialog de criacao/edicao com 5 secoes:
  1. Tipo de Jornada (dropdown 6 tipos + horas + dias)
  2. Tolerancias (atraso, saida antecipada, intervalo)
  3. Fatores de Calculo (HE normal, noturna, sabado, domingo, feriado)
  4. Banco de Horas (limite negativo, validade, compensacao auto)
  5. Resumo
- Acoes: Editar, Duplicar, Deletar
- Hook: `useJourneyConfig.ts`
- Adicionar no sidebar em "DEPARTAMENTO PESSOAL"
- Rota: `/journey-config`

## 3. Expandir Banco de Horas (aba existente em TimeTracking)

Substituir a aba "Banco de Horas" simples por 4 sub-abas:

### 3a. Espelho Estendido
- Componente: `BancoHorasEspelho.tsx`
- Filtros: Colaborador, Mes/Ano
- Cabecalho: empresa, colaborador, periodo, departamento, tipo jornada
- Tabela dia-a-dia: Data | Dia Semana | Escala | Entrada | Saida | Horas Esperadas | Horas Trabalhadas | Horas Extras | Observacoes
- Rodape totalizadores: horas presentes, feriados, atrasados, faltas, HE positivas, banco acumulado anterior/mes, saldo atual
- Calculo client-side usando `time_entries` + `employee_journey_config`
- Botao Exportar CSV

### 3b. Resumo Mensal
- Componente: `BancoHorasResumoMensal.tsx`
- Cards: Dias uteis, Dias trabalhados, Faltas, Atestados, HE, Saldo
- Status (Positivo/Negativo) com badge

### 3c. Historico de Saldo
- Componente: `BancoHorasHistorico.tsx`
- Tabela: Mes/Ano | Saldo Anterior | Acumulado Mes | Compensadas | Saldo Atual
- Grafico de evolucao (recharts AreaChart)

### 3d. Configuracao
- Componente: `BancoHorasConfig.tsx`
- Mostra configuracao de jornada do colaborador selecionado (read-only, link para editar)

## 4. Integracao com Ponto

- O espelho estendido busca dados de `time_entries` e cruza com `employee_journey_config` para calcular diferencas e HE
- Calculo feito no frontend (sem edge function): para cada dia do mes, busca entry, compara com horas esperadas, aplica tolerancias e fatores

## 5. Sidebar e Rotas

- Adicionar "Parametrização de Jornada" no bloco DEPARTAMENTO PESSOAL (entre Escalas e Absenteismo)
- Rota `/journey-config` em App.tsx

---

## Arquivos Criados/Alterados
- `supabase/migrations/` — 1 migracao (4 tabelas + RLS)
- `src/pages/JourneyConfig.tsx` — nova pagina
- `src/hooks/useJourneyConfig.ts` — CRUD hook
- `src/components/time-tracking/BancoHorasEspelho.tsx`
- `src/components/time-tracking/BancoHorasResumoMensal.tsx`
- `src/components/time-tracking/BancoHorasHistorico.tsx`
- `src/components/time-tracking/BancoHorasConfig.tsx`
- `src/pages/TimeTracking.tsx` — expandir aba Banco de Horas
- `src/components/AppSidebar.tsx` — adicionar item
- `src/App.tsx` — adicionar rota

