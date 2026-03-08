import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SENIORITY_LEVELS = [
  { value: 'estagiario', label: 'Estagiário' },
  { value: 'trainee', label: 'Trainee' },
  { value: 'junior_i', label: 'Júnior I' },
  { value: 'junior_ii', label: 'Júnior II' },
  { value: 'junior_iii', label: 'Júnior III' },
  { value: 'pleno_i', label: 'Pleno I' },
  { value: 'pleno_ii', label: 'Pleno II' },
  { value: 'pleno_iii', label: 'Pleno III' },
  { value: 'senior_i', label: 'Sênior I' },
  { value: 'senior_ii', label: 'Sênior II' },
  { value: 'senior_iii', label: 'Sênior III' },
  { value: 'especialista', label: 'Especialista' },
  { value: 'lider', label: 'Líder' },
];

interface SenioritySelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function SenioritySelect({ value, onValueChange, disabled }: SenioritySelectProps) {
  return (
    <Select value={value || ""} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o nível" />
      </SelectTrigger>
      <SelectContent>
        {SENIORITY_LEVELS.map((level) => (
          <SelectItem key={level.value} value={level.value}>
            {level.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
