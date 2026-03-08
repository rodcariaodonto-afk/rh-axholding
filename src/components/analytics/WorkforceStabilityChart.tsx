import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LabelList,
} from "recharts";
import { Info } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MonthlyDataWithTurnover {
  month: string;
  headcount: number;
  hires: number;
  terminations: number;
  turnoverRate: number;
}

interface WorkforceStabilityChartProps {
  data: MonthlyDataWithTurnover[];
}

// Using design system colors from index.css
const BAR_COLOR = "hsl(var(--status-info))";
const BAR_STROKE = "hsl(var(--status-info))";
const LINE_COLOR = "hsl(var(--destructive))";

const CustomBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (value === 0) return null;
  
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill="hsl(var(--foreground))"
      textAnchor="middle"
      fontSize={11}
      fontWeight={500}
    >
      {value.toLocaleString("pt-BR")}
    </text>
  );
};

const CustomLineLabel = (props: any) => {
  const { x, y, value } = props;
  if (value === undefined || value === null) return null;
  
  const isHigh = value >= 10;
  
  return (
    <text
      x={x}
      y={isHigh ? y + 16 : y - 12}
      fill={LINE_COLOR}
      textAnchor="middle"
      fontSize={10}
      fontWeight={500}
    >
      {value.toFixed(1)}%
    </text>
  );
};

function getInsightText(data: MonthlyDataWithTurnover[]) {
  if (!data || data.length === 0) return null;
  
  const validData = data.filter(d => d.headcount > 0);
  if (validData.length === 0) return null;
  
  const peakMonth = validData.reduce((a, b) => 
    a.headcount > b.headcount ? a : b
  );
  
  const highTurnoverMonths = validData.filter(d => d.turnoverRate > 0);
  const highTurnover = highTurnoverMonths.length > 0
    ? highTurnoverMonths.reduce((a, b) => a.turnoverRate > b.turnoverRate ? a : b)
    : null;
  
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  
  const trend = currentMonth && previousMonth 
    ? currentMonth.headcount >= previousMonth.headcount 
      ? "crescimento" 
      : "redução"
    : null;
  
  return (
    <p className="text-sm text-muted-foreground">
      O quadro atingiu seu pico em{" "}
      <span className="font-semibold text-foreground">{peakMonth.month}</span> com{" "}
      <span className="font-semibold text-foreground">
        {peakMonth.headcount.toLocaleString("pt-BR")} colaboradores ativos
      </span>.
      {highTurnover && highTurnover.turnoverRate > 0 && (
        <>
          {" "}Um ponto de atenção ocorreu em{" "}
          <span className="font-semibold text-foreground">{highTurnover.month}</span>,
          quando o turnover atingiu{" "}
          <span className="font-semibold text-foreground">
            {highTurnover.turnoverRate.toFixed(1)}%
          </span>.
        </>
      )}
      {trend && currentMonth && (
        <>
          {" "}A tendência atual é de{" "}
          <span className="font-semibold text-foreground">{trend}</span>, com{" "}
          <span className="font-semibold text-foreground">
            {currentMonth.headcount.toLocaleString("pt-BR")}
          </span>{" "}
          colaboradores em {currentMonth.month}.
        </>
      )}
    </p>
  );
}

export function WorkforceStabilityChart({ data }: WorkforceStabilityChartProps) {
  const validData = data.filter(d => d.headcount > 0);
  
  if (validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Estabilidade e Crescimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-72 text-muted-foreground">
            Sem dados suficientes para exibir o gráfico
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const maxHeadcount = Math.max(...validData.map(d => d.headcount));
  const minHeadcount = Math.min(...validData.map(d => d.headcount));
  const maxTurnover = Math.max(...data.map(d => d.turnoverRate), 10);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">
              Estabilidade e Crescimento do Quadro
            </CardTitle>
            <CardDescription>
              Como a expansão da empresa se correlaciona com desafios de retenção?
            </CardDescription>
          </div>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Este gráfico mostra a evolução do headcount (barras) em comparação 
                  com a taxa de turnover mensal (linha), permitindo identificar 
                  correlações entre crescimento e retenção.
                </p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-3 rounded-sm border" 
              style={{ backgroundColor: BAR_COLOR, borderColor: BAR_STROKE }}
            />
            <span className="text-sm text-muted-foreground">Colaboradores Ativos</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: LINE_COLOR }}
            />
            <span className="text-sm text-muted-foreground">Turnover</span>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 30, right: 20, left: 20, bottom: 10 }}
            >
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                dy={10}
              />
              <YAxis
                yAxisId="headcount"
                domain={[
                  Math.floor(minHeadcount * 0.9),
                  Math.ceil(maxHeadcount * 1.05)
                ]}
                hide
              />
              <YAxis
                yAxisId="turnover"
                orientation="right"
                domain={[0, Math.ceil(maxTurnover * 1.2)]}
                hide
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "headcount") {
                    return [value.toLocaleString("pt-BR"), "Colaboradores"];
                  }
                  return [`${value.toFixed(1)}%`, "Turnover"];
                }}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Bar
                yAxisId="headcount"
                dataKey="headcount"
                fill={BAR_COLOR}
                stroke={BAR_STROKE}
                strokeWidth={1}
                radius={[4, 4, 0, 0]}
                barSize={50}
              >
                <LabelList dataKey="headcount" content={<CustomBarLabel />} />
              </Bar>
              <Line
                yAxisId="turnover"
                type="linear"
                dataKey="turnoverRate"
                stroke={LINE_COLOR}
                strokeWidth={2}
                dot={{
                  fill: "hsl(var(--background))",
                  stroke: LINE_COLOR,
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  fill: LINE_COLOR,
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                  r: 5,
                }}
              >
                <LabelList dataKey="turnoverRate" content={<CustomLineLabel />} />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Insight */}
        <div className="pt-4 border-t">
          {getInsightText(data)}
        </div>
      </CardContent>
    </Card>
  );
}
