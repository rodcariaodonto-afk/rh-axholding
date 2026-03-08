interface GenderByDepartmentData {
  department: string;
  male: number;
  female: number;
  other: number;
}

interface GenderByDepartmentChartProps {
  data: GenderByDepartmentData[];
}

const MALE_COLOR = "hsl(217, 91%, 60%)";
const FEMALE_COLOR = "hsl(330, 81%, 60%)";
const OTHER_COLOR = "hsl(262, 83%, 58%)";

export function GenderByDepartmentChart({ data }: GenderByDepartmentChartProps) {
  const slicedData = data.slice(0, 6);

  if (slicedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3">
        {slicedData.map((row) => {
          const total = row.male + row.female + row.other;
          const malePercent = total > 0 ? (row.male / total) * 100 : 0;
          const femalePercent = total > 0 ? (row.female / total) * 100 : 0;
          const otherPercent = total > 0 ? (row.other / total) * 100 : 0;

          return (
            <div key={row.department} className="flex items-center gap-3">
              {/* Department label */}
              <div className="w-28 text-right shrink-0">
                <span className="text-sm text-foreground truncate block">
                  {row.department}
                </span>
              </div>

              {/* Stacked bars */}
              <div className="flex-1 flex h-9 rounded-md overflow-hidden">
                {malePercent > 0 && (
                  <div
                    className="flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: MALE_COLOR,
                      width: `${malePercent}%`,
                    }}
                  >
                    {malePercent >= 10 && (
                      <span className="text-white font-semibold text-xs">
                        {malePercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
                {otherPercent > 0 && (
                  <div
                    className="flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: OTHER_COLOR,
                      width: `${otherPercent}%`,
                    }}
                  >
                    {otherPercent >= 10 && (
                      <span className="text-white font-semibold text-xs">
                        {otherPercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
                {femalePercent > 0 && (
                  <div
                    className="flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: FEMALE_COLOR,
                      width: `${femalePercent}%`,
                    }}
                  >
                    {femalePercent >= 10 && (
                      <span className="text-white font-semibold text-xs">
                        {femalePercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6">
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
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: OTHER_COLOR }}
          />
          <span className="text-sm text-muted-foreground">Outros</span>
        </div>
      </div>
    </div>
  );
}
