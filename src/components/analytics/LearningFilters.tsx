import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useDepartments } from "@/hooks/useDepartments";
import { X, Filter } from "lucide-react";

interface LearningFiltersProps {
  departmentId: string | null;
  onDepartmentChange: (id: string | null) => void;
  year: number;
  onYearChange: (year: number) => void;
}

export function LearningFilters({
  departmentId,
  onDepartmentChange,
  year,
  onYearChange,
}: LearningFiltersProps) {
  const { data: departments } = useDepartments();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const hasFilters = departmentId !== null || year !== currentYear;

  const clearFilters = () => {
    onDepartmentChange(null);
    onYearChange(currentYear);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="size-4" />
        <span className="text-sm font-medium">Filtros:</span>
      </div>

      <Select
        value={departmentId || "all"}
        onValueChange={(value) => onDepartmentChange(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Departamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os departamentos</SelectItem>
          {departments?.map((dept) => (
            <SelectItem key={dept.id} value={dept.id}>
              {dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={year.toString()}
        onValueChange={(value) => onYearChange(parseInt(value))}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}
