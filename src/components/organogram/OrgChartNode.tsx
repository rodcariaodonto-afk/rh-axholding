import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Employee } from "@/hooks/useEmployees";

interface OrgChartNodeProps {
  employee: Employee;
  childCount: number;
  depth: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const getInitials = (name?: string | null): string => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getDepthColor = (depth: number): string => {
  switch (depth) {
    case 0:
      return "border-l-rose-500";
    case 1:
      return "border-l-emerald-500";
    case 2:
      return "border-l-blue-500";
    case 3:
      return "border-l-amber-500";
    default:
      return "border-l-border";
  }
};

export function OrgChartNode({
  employee,
  childCount,
  depth,
  isSelected,
  onClick,
}: OrgChartNodeProps) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 p-3 pr-4 bg-card border rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md border-l-4",
        getDepthColor(depth),
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
      style={{ minWidth: "200px", maxWidth: "240px" }}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={employee.photo_url || undefined} />
        <AvatarFallback className="text-sm font-medium bg-muted">
          {getInitials(employee.full_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {employee.full_name || "—"}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {employee.position_title || "Sem cargo"}
        </div>
        {employee.department_name && (
          <Badge variant="secondary" className="mt-1 text-xs h-5">
            {employee.department_name}
          </Badge>
        )}
      </div>

      {childCount > 0 && (
        <Badge
          variant="outline"
          className="absolute -top-2 -right-2 h-5 min-w-5 text-xs bg-card"
        >
          {childCount}
        </Badge>
      )}
    </div>
  );
}
