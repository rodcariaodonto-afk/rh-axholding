import { Badge } from "@/components/ui/badge";
import type { SetupCategory as SetupCategoryType } from "@/hooks/useSetupProgress";

interface SetupCategoryProps {
  category: SetupCategoryType;
  children: React.ReactNode;
}

export function SetupCategory({ category, children }: SetupCategoryProps) {
  const Icon = category.icon;

  return (
    <div className="space-y-4">
      {/* Category Header */}
      <div className="flex items-center gap-3 pb-2 border-b">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{category.title}</h2>
          <p className="text-sm text-muted-foreground">
            {category.completedCount} de {category.totalRequired} passos concluídos
          </p>
        </div>
        <Badge
          variant={category.percentage === 100 ? "default" : "secondary"}
          className="text-sm"
        >
          {category.percentage}%
        </Badge>
      </div>

      {/* Steps */}
      <div className="space-y-3">{children}</div>
    </div>
  );
}
