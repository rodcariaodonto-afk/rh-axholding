import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

interface AnalyticsKPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  description?: string;
  className?: string;
  iconColor?: string;
  iconBgColor?: string;
}

export function AnalyticsKPICard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
}: AnalyticsKPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-emerald-500";
    if (trend.value < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-lg hover:-translate-y-1", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {(trend || description) && (
              <div className="flex items-center gap-2 text-sm">
                {trend && TrendIcon && (
                  <span className={cn("flex items-center gap-1", getTrendColor())}>
                    <TrendIcon className="size-4" />
                    {Math.abs(trend.value).toFixed(1)}%
                  </span>
                )}
                {trend?.label && (
                  <span className="text-muted-foreground">{trend.label}</span>
                )}
                {description && !trend && (
                  <span className="text-muted-foreground">{description}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn("rounded-full p-3", iconBgColor)}>
            <Icon className={cn("size-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
