import { LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserOrganizations } from "@/hooks/useUserOrganizations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isPeople } = useUserRole(user?.id);
  const { data: organizations } = useUserOrganizations(user?.id);
  
  // Get the first organization (primary org)
  const currentOrg = organizations?.[0];

  const getRoleBadge = () => {
    if (isAdmin) return <Badge variant="destructive">Admin</Badge>;
    if (isPeople) return <Badge variant="secondary">People</Badge>;
    return <Badge variant="outline">Usuário</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {currentOrg?.logo_url ? (
              <AvatarImage src={currentOrg.logo_url} alt={currentOrg.name} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-sm font-medium">
              {currentOrg ? getInitials(currentOrg.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-foreground">
            {currentOrg?.name || "Carregando..."}
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 max-w-xs">
                  <span className="text-muted-foreground hidden sm:inline truncate max-w-[180px]" title={user.email}>
                    {user.email}
                  </span>
                  {getRoleBadge()}
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
