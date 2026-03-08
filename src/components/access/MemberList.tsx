import { useState } from "react";
import { useOrganizationMembers, OrganizationMember } from "@/hooks/useOrganizationMembers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Shield, Crown } from "lucide-react";
import { ChangeRoleDialog } from "./ChangeRoleDialog";

const roleBadgeStyles: Record<string, string> = {
  admin: "bg-red-500/10 text-red-500 border-red-500/20",
  people: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  user: "bg-muted text-muted-foreground border-border",
};

export function MemberList() {
  const { data: members = [], isLoading, refetch } = useOrganizationMembers();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredMembers = members.filter((member) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      member.employee?.full_name?.toLowerCase().includes(search) ||
      member.employee?.email?.toLowerCase().includes(search)
    );
  });

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const handleChangeRole = (member: OrganizationMember) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Member List */}
      <div className="space-y-2">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum membro encontrado
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.employee?.photo_url || ""} />
                <AvatarFallback>
                  {getInitials(member.employee?.full_name || null, member.employee?.email || "")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {member.employee?.full_name || member.employee?.email}
                  </p>
                  {member.is_owner && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {member.employee?.email}
                </p>
              </div>

              <Badge
                variant="outline"
                className={roleBadgeStyles[member.role?.slug || "user"]}
              >
                {member.role?.name || "Usuário"}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleChangeRole(member)}>
                    <Shield className="h-4 w-4 mr-2" />
                    Alterar Perfil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Change Role Dialog */}
      <ChangeRoleDialog
        member={selectedMember}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          refetch();
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}
