import { GraduationCap } from "lucide-react";

interface EducationChartProps {
  data: Array<{ level: string; count: number }>;
}

export function EducationChart({ data }: EducationChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count));

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Nenhum dado de escolaridade disponível
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {data.map((item) => {
        const percentage = total > 0 ? (item.count / total) * 100 : 0;
        const barHeight = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

        return (
          <div key={item.level} className="flex flex-col items-center">
            {/* Icon */}
            <GraduationCap
              className="w-8 h-8 md:w-10 md:h-10 mb-2"
              style={{ color: "hsl(var(--status-info))" }}
              strokeWidth={1.5}
            />

            {/* Percentage */}
            <span className="text-2xl md:text-4xl font-bold text-foreground mb-1">
              {percentage.toFixed(0)}%
            </span>

            {/* Level name */}
            <span className="text-muted-foreground text-xs md:text-sm mb-4 text-center min-h-[2.5rem] flex items-center">
              {item.level}
            </span>

            {/* Bar container */}
            <div className="w-full h-24 md:h-32 rounded-lg relative overflow-hidden bg-muted">
              {/* Filled bar */}
              <div
                className="absolute bottom-0 left-0 right-0 rounded-lg transition-all duration-500"
                style={{
                  backgroundColor: "hsl(var(--status-info))",
                  height: `${barHeight}%`,
                }}
              />
            </div>

            {/* Employee count */}
            <span className="text-muted-foreground text-xs md:text-sm mt-3">
              {item.count.toLocaleString("pt-BR")} col.
            </span>
          </div>
        );
      })}
    </div>
  );
}
