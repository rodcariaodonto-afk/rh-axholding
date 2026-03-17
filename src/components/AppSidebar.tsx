import * as React from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useViewAs } from "@/contexts/ViewAsContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserOrganizations } from "@/hooks/useUserOrganizations";
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
  Target,
  MessageSquare,
  Brain,
  User,
  ChevronDown,
  Search,
  ChevronRight,
  Clock,
  LogOut,
  Check,
  LayoutDashboard,
  Network,
  Plug,
  TrendingUp,
  Award,
  Shield,
  Eye,
  EyeOff,
  Calendar,
  FileText,
  Filter,
  UserPlus,
  CalendarClock,
  ClipboardCheck,
  type LucideIcon,
  BookOpen,
  Landmark,
  FileStack,
  UserCog,
  AlertTriangle,
  CreditCard,
  Compass,
} from "lucide-react";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
  hideFor?: ("admin" | "people")[];
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
  showFor?: "all" | "admin" | "people";
}

const menuGroups: MenuGroup[] = [
  {
    label: "PERFIL",
    showFor: "all",
    items: [
      { icon: User, label: "Meu Perfil", href: "/profile" },
      { icon: Brain, label: "Profiler", href: "/profiler-intro" },
      { icon: TrendingUp, label: "Meu PDI", href: "/my-pdis" },
      { icon: Target, label: "Minhas Avaliações", href: "/my-evaluations" },
      { icon: UserCog, label: "Tipo de Perfil", href: "/profile-type" },
      { icon: Palmtree, label: "Minhas Férias", href: "/time-off", hideFor: ["admin", "people"] },
      { icon: Clock, label: "Meu Ponto", href: "/time-tracking", hideFor: ["admin", "people"] },
    ],
  },
  {
    label: "CADASTRO",
    showFor: "people",
    items: [
      { icon: Users, label: "Colaboradores", href: "/employees" },
      { icon: Briefcase, label: "Cargos", href: "/positions" },
      { icon: DollarSign, label: "Salários", href: "/salary-ranges" },
      { icon: Building2, label: "Departamentos", href: "/departments" },
    ],
  },
  {
    label: "ESTRUTURA ORGANIZACIONAL",
    showFor: "people",
    items: [
      { icon: Network, label: "Organograma", href: "/organogram" },
      { icon: Calendar, label: "Políticas de Trabalho", href: "/work-policies" },
      { icon: Compass, label: "Identidade Organizacional", href: "/culture" },
    ],
  },
  {
    label: "DEPARTAMENTO PESSOAL",
    showFor: "people",
    items: [
      { icon: Landmark, label: "Dados Trabalhistas", href: "/labor-data" },
      { icon: Clock, label: "Gestão de Ponto", href: "/time-tracking" },
      { icon: Palmtree, label: "Gestão de Férias", href: "/time-off" },
      { icon: CalendarClock, label: "Escalas", href: "/work-schedules" },
      { icon: ClipboardCheck, label: "Parametrização de Jornada", href: "/journey-config" },
      { icon: AlertTriangle, label: "Absenteísmo", href: "/absenteeism" },
      { icon: UserMinus, label: "Rescisão Contratual", href: "/terminations" },
    ],
  },
  {
    label: "GESTÃO & DESENVOLVIMENTO",
    showFor: "people",
    items: [
      { icon: Target, label: "Avaliação de Desempenho", href: "/performance-evaluation" },
      { icon: MessageSquare, label: "Feedbacks", href: "/feedbacks" },
      { icon: Award, label: "Competências", href: "/skills-management" },
      { icon: TrendingUp, label: "Metas & OKRs", href: "/goals" },
      { icon: BookOpen, label: "Catálogo de Treinamentos", href: "/training-catalog" },
      { icon: Compass, label: "Matriz SWOT", href: "/swot-analysis" },
    ],
  },
  {
    label: "RECRUTAMENTO & VAGAS",
    showFor: "people",
    items: [
      { icon: ClipboardList, label: "Vagas", href: "/vagas" },
      { icon: UserPlus, label: "Candidatos", href: "/candidates" },
      { icon: Filter, label: "Funil de Seleção", href: "/selection-funnel" },
      { icon: Archive, label: "Banco de Talentos", href: "/talent-bank" },
    ],
  },
  {
    label: "RELATÓRIOS & DASHBOARDS",
    showFor: "people",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: ClipboardCheck, label: "Relatórios de Ponto", href: "/time-reports" },
      { icon: TrendingUp, label: "People Analytics", href: "/people-analytics" },
    ],
  },
  {
    label: "FINANCEIRO",
    showFor: "people",
    items: [
      { icon: FileText, label: "Folha de Pagamento", href: "/payroll" },
      { icon: CreditCard, label: "Programação de Pagamento", href: "/payment-schedule" },
      { icon: DollarSign, label: "Custos", href: "/company-costs" },
    ],
  },
  {
    label: "ADMINISTRAÇÃO",
    showFor: "people",
    items: [
      { icon: Building2, label: "Dados da Empresa", href: "/company-settings" },
      { icon: Plug, label: "Integrações", href: "/company-settings/integrations" },
      { icon: Shield, label: "Gestão de Acessos", href: "/access-management" },
      { icon: FileText, label: "Auditoria", href: "/audit" },
      { icon: FileStack, label: "Documentos da Empresa", href: "/company-documents" },
      { icon: Package, label: "Inventário", href: "/" },
      { icon: FileText, label: "Documentos de Colaboradores", href: "/documents" },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, signOut } = useAuth();
  const { isAdmin, isPeople, realIsAdmin, realIsPeople } = useUserRole(user?.id);
  const { isViewingAsCollaborator, toggleViewAsCollaborator } = useViewAs();
  const { data: userOrganizations = [] } = useUserOrganizations(user?.id);
  const location = useLocation();
  
  // Track selected organization (default to first one)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get current organization
  const currentOrg = selectedOrgId 
    ? userOrganizations.find(org => org.id === selectedOrgId) 
    : userOrganizations[0];
  
  const hasMultipleOrgs = userOrganizations.length > 1;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const canShowGroup = (group: MenuGroup) => {
    if (group.showFor === "all") return true;
    if (group.showFor === "admin") return isAdmin;
    if (group.showFor === "people") return isAdmin || isPeople;
    return false;
  };

  const canShowItem = (item: MenuItem) => {
    if (!item.hideFor) return true;
    if (item.hideFor.includes("admin") && isAdmin) return false;
    if (item.hideFor.includes("people") && isPeople) return false;
    return true;
  };

  // Filter items based on search term
  const filterItems = (items: MenuItem[]) => {
    if (!searchTerm.trim()) return items;
    const normalizedSearch = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return items.filter(item => {
      const normalizedLabel = item.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalizedLabel.includes(normalizedSearch);
    });
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "US";
  
  // Fallback org name if no organization found
  const displayOrgName = currentOrg?.name || "Orb RH";
  const displayOrgLogo = currentOrg?.logo_url;

  if (!user) return null;

  const getOrgInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const OrgHeader = () => (
    <div className="flex items-center gap-2">
      <Avatar className="size-7">
        {displayOrgLogo && (
          <AvatarImage src={displayOrgLogo} alt={displayOrgName} />
        )}
        <AvatarFallback className="text-xs font-medium text-white bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
          {getOrgInitials(displayOrgName)}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium text-foreground">
        {displayOrgName}
      </span>
      {hasMultipleOrgs && (
        <ChevronDown className="size-3 text-muted-foreground" />
      )}
    </div>
  );

  return (
    <Sidebar collapsible="offcanvas" className="!border-r-0" {...props}>
      <SidebarHeader className="p-5 pb-0">
        <div className="flex items-center justify-between">
          {hasMultipleOrgs ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                <OrgHeader />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuGroup>
                  <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                    Organizações
                  </p>
                  {userOrganizations.map((org) => (
                    <DropdownMenuItem 
                      key={org.id}
                      onClick={() => setSelectedOrgId(org.id)}
                    >
                      {org.logo_url ? (
                        <Avatar className="size-5 mr-2">
                          <AvatarImage src={org.logo_url} alt={org.name} />
                          <AvatarFallback className="text-[10px] bg-gradient-to-br from-purple-400 via-pink-500 to-red-500" />
                        </Avatar>
                      ) : (
                        <div className="size-5 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 mr-2" />
                      )}
                      {org.name}
                      {currentOrg?.id === org.id && (
                        <Check className="size-4 ml-auto" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="size-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => signOut()}
                >
                  <LogOut className="size-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <OrgHeader />
          )}
          <Avatar className="size-7">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
          </Avatar>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-5 pt-5">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-10 h-9 bg-background"
          />
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          ) : (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-muted px-1.5 py-0.5 rounded text-[11px] text-muted-foreground font-medium">
              ⌘K
            </div>
          )}
        </div>

        {menuGroups.map((group) => {
          if (!canShowGroup(group)) return null;
          
          const visibleItems = filterItems(group.items.filter(canShowItem));
          
          // Hide group if no items match search
          if (visibleItems.length === 0) return null;
          
          return (
            <SidebarGroup key={group.label} className="p-0">
              <SidebarGroupLabel className="px-0 text-[10px] font-semibold tracking-wider text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        className="h-[38px]"
                      >
                        <Link to={item.href}>
                          <item.icon className="size-5" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="bg-destructive text-destructive-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          {isActive(item.href) && (
                            <ChevronRight className="size-4 text-muted-foreground opacity-60" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="px-5 pb-5 space-y-2">
        {(realIsAdmin || realIsPeople) && (
          <button
            onClick={toggleViewAsCollaborator}
            className={`inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border text-sm font-medium w-full transition-colors ${
              isViewingAsCollaborator
                ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                : "border-border bg-background hover:bg-muted text-muted-foreground"
            }`}
          >
            {isViewingAsCollaborator ? (
              <>
                <EyeOff className="size-4" />
                Voltar ao modo normal
              </>
            ) : (
              <>
                <Eye className="size-4" />
                Ver como Colaborador
              </>
            )}
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
