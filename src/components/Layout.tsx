import { createContext, useContext } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { useViewAs } from "@/contexts/ViewAsContext";
import { useLocation, Link } from "react-router-dom";
import { 
  Package, 
  Users, 
  Building2, 
  Briefcase, 
  ClipboardList, 
  Heart, 
  UserMinus, 
  Palmtree, 
  Archive, 
  DollarSign, 
  Brain, 
  User,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  type LucideIcon 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Context to prevent double-rendering when Layout is used both in LayoutRoute and inside pages
const LayoutContext = createContext(false);

interface LayoutProps {
  children: React.ReactNode;
}

interface PageInfo {
  title: string;
  icon: LucideIcon;
}

const routeTitles: Record<string, PageInfo> = {
  "/": { title: "Inventário", icon: Package },
  
  "/people-analytics": { title: "Dashboard", icon: LayoutDashboard },
  "/employees": { title: "Colaboradores", icon: Users },
  "/departments": { title: "Departamentos", icon: Building2 },
  "/positions": { title: "Cargos", icon: Briefcase },
  "/vagas": { title: "Vagas", icon: ClipboardList },
  "/culture": { title: "Cultura", icon: Heart },
  "/terminations": { title: "Desligamentos", icon: UserMinus },
  "/time-off": { title: "Férias", icon: Palmtree },
  "/talent-bank": { title: "Banco de Talentos", icon: Archive },
  "/company-costs": { title: "Custos", icon: DollarSign },
  "/company-settings/integrations": { title: "Integrações", icon: Building2 },
  "/profiler-intro": { title: "Profiler", icon: Brain },
  "/profile": { title: "Perfil", icon: User },
};

const getPageInfo = (pathname: string): PageInfo => {
  // Verificar rota exata primeiro
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }
  
  // Verificar rotas dinâmicas
  if (pathname.startsWith("/employees/")) return { title: "Colaboradores", icon: Users };
  if (pathname.startsWith("/departments/")) return { title: "Departamentos", icon: Building2 };
  if (pathname.startsWith("/vagas/")) return { title: "Vagas", icon: ClipboardList };
  
  if (pathname.startsWith("/profiler")) return { title: "Profiler", icon: Brain };
  
  // Fallback
  return { title: "Dashboard", icon: LayoutDashboard };
};

const Layout = ({ children }: LayoutProps) => {
  const isAlreadyInLayout = useContext(LayoutContext);
  const { user, signOut } = useAuth();
  const { isAdmin, isPeople, realIsAdmin, realIsPeople } = useUserRole(user?.id);
  const { isViewingAsCollaborator, setViewingAsCollaborator } = useViewAs();
  const location = useLocation();
  
  const pageInfo = getPageInfo(location.pathname);
  const PageIcon = pageInfo.icon;

  const getRoleBadge = () => {
    if (isViewingAsCollaborator) return <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">Colaborador (preview)</Badge>;
    if (isAdmin) return <Badge variant="secondary" className="text-xs">Admin</Badge>;
    if (isPeople) return <Badge variant="secondary" className="text-xs">People</Badge>;
    return null;
  };

  // If already inside a Layout (from LayoutRoute), just render children
  if (isAlreadyInLayout) {
    return <>{children}</>;
  }

  // Se não há usuário, renderiza sem sidebar
  if (!user) {
    return (
      <LayoutContext.Provider value={true}>
        <div className="min-h-screen bg-background">
          <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
        </div>
      </LayoutContext.Provider>
    );
  }

  return (
    <LayoutContext.Provider value={true}>
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-sidebar">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 bg-background overflow-hidden md:m-2 md:ml-0 md:rounded-xl md:border md:border-border">
          {/* Header fixo */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background px-4 sm:px-6">
            <SidebarTrigger className="-ml-1" />
            
            <PageIcon className="size-5 text-muted-foreground" />
            <h1 className="flex-1 font-medium text-base">{pageInfo.title}</h1>
            
            <ThemeToggle />
            
            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-3">
                  <span className="text-sm text-muted-foreground truncate max-w-[150px] hidden sm:inline">
                    {user?.email}
                  </span>
                  {getRoleBadge()}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Banner de preview como colaborador */}
          {isViewingAsCollaborator && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-sm">
              <span className="text-amber-700 dark:text-amber-300 font-medium">
                👁️ Visualizando como Colaborador — permissões restritas
              </span>
              <button
                onClick={() => setViewingAsCollaborator(false)}
                className="text-amber-700 dark:text-amber-300 hover:underline font-medium text-xs"
              >
                Sair do modo preview
              </button>
            </div>
          )}

          {/* Área principal */}
          <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
    </LayoutContext.Provider>
  );
};

export default Layout;
