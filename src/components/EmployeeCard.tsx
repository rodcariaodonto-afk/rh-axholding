import { Link } from "react-router-dom";
import type { Employee } from "@/hooks/useEmployees";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileByCode } from "@/lib/profiler/profiles";
import { getProfilerInitials } from "@/lib/profiler/utils";

interface EmployeeCardProps {
  employee: Employee;
  onProfilerClick?: (employee: Employee) => void;
}

const getInitials = (name?: string | null): string => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getStatusConfig = (status?: string) => {
  switch (status) {
    case "active":
      return { label: "Ativo", variant: "success" as const };
    case "pending":
      return { label: "Pendente", variant: "outline" as const };
    case "on_leave":
      return { label: "Afastado", variant: "warning" as const };
    default:
      return { label: "Inativo", variant: "error" as const };
  }
};

const getContractTypeConfig = (type?: string | null) => {
  switch (type) {
    case "clt":
      return { label: "CLT", variant: "default" as const };
    case "pj":
      return { label: "PJ", variant: "secondary" as const };
    case "internship":
      return { label: "Estágio", variant: "warning" as const };
    case "temporary":
      return { label: "Temporário", variant: "outline" as const };
    case "other":
      return { label: "Outro", variant: "outline" as const };
    default:
      return null;
  }
};

export function EmployeeCard({ employee, onProfilerClick }: EmployeeCardProps) {
  const statusConfig = getStatusConfig(employee.status);
  const profile = employee.profiler_result_code
    ? getProfileByCode(employee.profiler_result_code)
    : null;
  const contractConfig = getContractTypeConfig(employee.contract_type);

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link to={`/employees/${employee.id}`}>
            <Avatar className="h-12 w-12 ring-2 ring-background group-hover:ring-primary/20 transition-all">
              <AvatarImage src={employee.photo_url || undefined} alt={employee.full_name || ""} />
              <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                {getInitials(employee.full_name)}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link 
              to={`/employees/${employee.id}`} 
              className="font-medium hover:underline truncate block text-sm"
            >
              {employee.full_name || "—"}
            </Link>
            <p className="text-xs text-muted-foreground truncate">
              {employee.position_title || "Sem cargo"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {employee.department_name || "Sem departamento"}
            </p>
          </div>
        </div>
        
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge variant={statusConfig.variant} className="text-xs">
            {statusConfig.label}
          </Badge>
          
          {contractConfig && (
            <Badge variant={contractConfig.variant} className="text-xs">
              {contractConfig.label}
            </Badge>
          )}
          
          {profile && (
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                borderColor: profile.color,
                color: profile.color,
                backgroundColor: `${profile.color.replace(')', ', 0.1)')}`,
              }}
              onClick={() => onProfilerClick?.(employee)}
            >
              {getProfilerInitials(employee.profiler_result_code!)}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
