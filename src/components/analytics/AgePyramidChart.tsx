interface AgePyramidData {
  range: string;
  male: number;
  female: number;
  other: number;
}

interface AgePyramidChartProps {
  data: AgePyramidData[];
}

const MALE_COLOR = "hsl(217, 91%, 60%)";
const FEMALE_COLOR = "hsl(330, 81%, 60%)";

export function AgePyramidChart({ data }: AgePyramidChartProps) {
  const maxValue = Math.max(...data.flatMap((d) => [d.male, d.female]));
  const total = data.reduce((acc, d) => acc + d.male + d.female + d.other, 0);

  // Find the age range with highest concentration
  const rangeWithMax = data.reduce(
    (max, d) => {
      const rangeTotal = d.male + d.female + d.other;
      return rangeTotal > max.total ? { range: d.range, total: rangeTotal } : max;
    },
    { range: "", total: 0 }
  );
  const maxPercentage = total > 0 ? ((rangeWithMax.total / total) * 100).toFixed(0) : 0;

  const hasData = data.some((d) => d.male > 0 || d.female > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Dados de nascimento não preenchidos
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3">
        {data.map((row) => (
          <div key={row.range} className="flex items-center gap-2">
            {/* Male bar (right-aligned, grows left) */}
            <div className="flex-1 flex justify-end">
              <div
                className="h-10 rounded-l-md flex items-center px-3 transition-all"
                style={{
                  backgroundColor: MALE_COLOR,
                  width: maxValue > 0 ? `${(row.male / maxValue) * 100}%` : "0%",
                  minWidth: row.male > 0 ? "48px" : "0px",
                }}
              >
                {row.male > 0 && (
                  <span className="text-white font-semibold text-sm">
                    {row.male.toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
            </div>

            {/* Age label (centered) */}
            <div className="w-16 text-center shrink-0">
              <span className="text-foreground font-medium text-sm">
                {row.range}
              </span>
            </div>

            {/* Female bar (left-aligned, grows right) */}
            <div className="flex-1 flex justify-start">
              <div
                className="h-10 rounded-r-md flex items-center justify-end px-3 transition-all"
                style={{
                  backgroundColor: FEMALE_COLOR,
                  width: maxValue > 0 ? `${(row.female / maxValue) * 100}%` : "0%",
                  minWidth: row.female > 0 ? "48px" : "0px",
                }}
              >
                {row.female > 0 && (
                  <span className="text-white font-semibold text-sm">
                    {row.female.toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-8 mt-6">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: MALE_COLOR }}
          />
          <span className="text-sm text-muted-foreground">Masculino</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: FEMALE_COLOR }}
          />
          <span className="text-sm text-muted-foreground">Feminino</span>
        </div>
      </div>

      {/* Insight */}
      {rangeWithMax.total > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            A maior concentração de colaboradores está na faixa{" "}
            <span className="font-semibold text-foreground">{rangeWithMax.range}</span> (
            <span className="font-semibold text-foreground">{maxPercentage}%</span>),
            refletindo o perfil demográfico da organização.
          </p>
        </div>
      )}
    </div>
  );
}
