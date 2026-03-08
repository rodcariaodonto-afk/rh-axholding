import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePositions } from "@/hooks/usePositions";

interface PositionSelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function PositionSelect({ value, onValueChange, disabled }: PositionSelectProps) {
  const { data: positions, isLoading } = usePositions();

  return (
    <Select value={value || ""} onValueChange={onValueChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um cargo" />
      </SelectTrigger>
      <SelectContent>
        {positions?.map((pos) => (
          <SelectItem key={pos.id} value={pos.id}>
            {pos.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
