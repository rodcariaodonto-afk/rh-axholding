import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartments } from "@/hooks/useDepartments";

interface DepartmentSelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function DepartmentSelect({ value, onValueChange, disabled }: DepartmentSelectProps) {
  const { data: departments, isLoading } = useDepartments();

  return (
    <Select value={value || ""} onValueChange={onValueChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um departamento" />
      </SelectTrigger>
      <SelectContent>
        {departments?.map((dept) => (
          <SelectItem key={dept.id} value={dept.id}>
            {dept.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
