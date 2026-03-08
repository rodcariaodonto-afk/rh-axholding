import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePositions } from "@/hooks/usePositions";
import { JOB_STATUS_LABELS, JobStatus } from "@/types/job";

interface JobsFiltersProps {
  statusFilter: JobStatus | 'all';
  positionFilter: string;
  onStatusChange: (status: JobStatus | 'all') => void;
  onPositionChange: (positionId: string) => void;
}

const JobsFilters = ({
  statusFilter,
  positionFilter,
  onStatusChange,
  onPositionChange,
}: JobsFiltersProps) => {
  const { data: positions } = usePositions();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="w-full sm:w-48">
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as JobStatus | 'all')}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-48">
        <Select value={positionFilter} onValueChange={onPositionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por cargo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cargos</SelectItem>
            {positions?.map((position) => (
              <SelectItem key={position.id} value={position.id}>
                {position.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default JobsFilters;
