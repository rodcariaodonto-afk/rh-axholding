import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";

interface ManagerSelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function ManagerSelect({ value, onValueChange, disabled }: ManagerSelectProps) {
  const { data: employees, isLoading } = useEmployees();

  // Filtrar apenas colaboradores ativos
  const activeEmployees = employees?.filter(e => e.status === 'active') || [];

  return (
    <Select value={value || ""} onValueChange={onValueChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um gestor" />
      </SelectTrigger>
      <SelectContent>
        {activeEmployees.map((emp) => (
          <SelectItem key={emp.id} value={emp.id}>
            {emp.full_name || emp.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
