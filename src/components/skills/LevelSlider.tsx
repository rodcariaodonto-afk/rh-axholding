import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const LEVEL_LABELS: Record<number, string> = {
  1: "Iniciante",
  2: "Básico",
  3: "Intermediário",
  4: "Avançado",
  5: "Especialista",
};

interface LevelSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function LevelSlider({ label, value, onChange, className }: LevelSliderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{LEVEL_LABELS[value] || value}</span>
      </div>
      <Slider
        value={[value]}
        min={1}
        max={5}
        step={1}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}

interface LevelSlidersGroupProps {
  levelJunior: number;
  levelPleno: number;
  levelSenior: number;
  onChangeJunior: (value: number) => void;
  onChangePleno: (value: number) => void;
  onChangeSenior: (value: number) => void;
  variant?: "horizontal" | "vertical";
}

export function LevelSlidersGroup({
  levelJunior,
  levelPleno,
  levelSenior,
  onChangeJunior,
  onChangePleno,
  onChangeSenior,
  variant = "vertical",
}: LevelSlidersGroupProps) {
  if (variant === "horizontal") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">Níveis esperados por senioridade</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <LevelSlider label="Júnior" value={levelJunior} onChange={onChangeJunior} />
          </div>
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <LevelSlider label="Pleno" value={levelPleno} onChange={onChangePleno} />
          </div>
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <LevelSlider label="Sênior" value={levelSenior} onChange={onChangeSenior} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
      <p className="text-sm font-medium">Níveis esperados por senioridade</p>
      <div className="space-y-4">
        <LevelSlider label="Júnior" value={levelJunior} onChange={onChangeJunior} />
        <LevelSlider label="Pleno" value={levelPleno} onChange={onChangePleno} />
        <LevelSlider label="Sênior" value={levelSenior} onChange={onChangeSenior} />
      </div>
    </div>
  );
}
