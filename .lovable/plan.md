

# Visualizacoes Avancadas para Gestao de Ponto

## Visao Geral

Adicionar uma nova aba **"Visao Geral"** na tela admin de Gestao de Ponto com 3 componentes visuais usando Recharts (ja instalado no projeto):

### 1. Grafico de Barras Semanal - Horas por Dia

Um grafico de barras empilhadas mostrando, para cada dia da semana, as horas trabalhadas vs. horas esperadas. Barras com cores indicando:
- Verde: dentro da meta
- Vermelho: abaixo da meta
- Azul: horas extras

Filtro por colaborador ou "todos" (agregado). Facilita identificar dias com mais ou menos carga.

### 2. Heatmap Mensal (Grid de Quadrados)

Uma grade estilo calendario (similar ao contribution graph do GitHub) onde cada celula e um dia do mes. A intensidade da cor indica a quantidade de horas trabalhadas naquele dia:
- Cinza claro: sem registro
- Verde claro a verde escuro: de poucas a muitas horas
- Vermelho: deficit significativo

Permite visualizar rapidamente padroes ao longo do mes.

### 3. Ranking de Colaboradores - Horas Trabalhadas no Mes

Um grafico de barras horizontais mostrando o total de horas trabalhadas por cada colaborador no mes, com uma linha de referencia indicando a meta esperada. Facilita comparar a equipe.

---

## Detalhes Tecnicos

### Novos arquivos

1. **`src/components/time-tracking/WeeklyHoursChart.tsx`**
   - Usa `BarChart` do Recharts com `ResponsiveContainer`
   - Recebe `time_entries` da semana e agrupa por dia
   - Calcula horas esperadas com base em `weekly_hours / 5` (media diaria)
   - Barras: `worked` (horas trabalhadas) e `expected` (referencia como linha ou barra secundaria)

2. **`src/components/time-tracking/MonthlyHeatmap.tsx`**
   - Componente custom com grid CSS (7 colunas x ~5 linhas)
   - Cada celula recebe `total_minutes` do dia e aplica escala de cor via Tailwind (`bg-green-100` ate `bg-green-700`)
   - Tooltip mostrando data e horas ao passar o mouse

3. **`src/components/time-tracking/TeamHoursRanking.tsx`**
   - `BarChart` horizontal do Recharts
   - Agrupa `time_entries` do mes por `employee_id`
   - Exibe nome do colaborador no eixo Y e horas no eixo X
   - Linha de referencia vertical (`ReferenceLine`) para a meta mensal

### Hook adicional

4. **`src/hooks/useMonthlyTimeEntries.ts`**
   - Busca todas as `time_entries` do mes corrente para a organizacao (sem filtro de employee)
   - Reutilizado pelos 3 componentes visuais

### Alteracoes em arquivos existentes

5. **`src/pages/TimeTracking.tsx`**
   - Adicionar nova aba "Visao Geral" no `TabsList` da visao admin
   - `TabsContent` renderiza os 3 componentes visuais em grid

### Dependencias
- Nenhuma nova -- usa Recharts (ja instalado) e Tailwind para o heatmap

