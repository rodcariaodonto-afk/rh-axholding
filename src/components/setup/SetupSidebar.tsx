import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import type { SetupCategory } from "@/hooks/useSetupProgress";

interface SetupSidebarProps {
  categories: SetupCategory[];
  overallPercentage: number;
  activeCategory: string;
  onCategoryClick: (categoryId: string) => void;
}

export function SetupSidebar({
  categories,
  overallPercentage,
  activeCategory,
  onCategoryClick,
}: SetupSidebarProps) {
  const { data: org } = useOrganizationSettings();

  const getOrgInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayOrgName = org?.name || "Minha Empresa";
  const displayOrgLogo = org?.logo_url;

  return (
    <aside className="w-[280px] border-r bg-muted/30 p-6 flex flex-col gap-6">
      {/* Org Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Avatar className="size-10">
          {displayOrgLogo && (
            <AvatarImage src={displayOrgLogo} alt={displayOrgName} />
          )}
          <AvatarFallback className="text-sm font-medium text-white bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
            {getOrgInitials(displayOrgName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{displayOrgName}</p>
          <p className="text-xs text-muted-foreground">Progresso: {overallPercentage}%</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <Progress value={overallPercentage} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {overallPercentage === 100 ? "Setup completo! 🎉" : "Continue configurando..."}
        </p>
      </div>

      {/* Categories */}
      <nav className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
          Categorias
        </p>
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Icon className="size-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{category.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={category.percentage} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-muted-foreground w-8">
                    {category.percentage}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
