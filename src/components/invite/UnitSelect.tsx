import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnits } from "@/hooks/useUnits";

interface UnitSelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function UnitSelect({ value, onValueChange, disabled }: UnitSelectProps) {
  const { data: units, isLoading } = useUnits();

  return (
    <Select value={value || ""} onValueChange={onValueChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione uma unidade" />
      </SelectTrigger>
      <SelectContent>
        {units?.map((unit) => (
          <SelectItem key={unit.id} value={unit.id}>
            {unit.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
