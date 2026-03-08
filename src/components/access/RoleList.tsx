import { useState } from "react";
import { useOrganizationRoles, Role } from "@/hooks/useOrganizationRoles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Users, Plus } from "lucide-react";
import { CreateRoleDialog } from "./CreateRoleDialog";

const DEFAULT_SLUGS = ["admin", "people", "user"];

const roleStyles: Record<string, { icon: string; badge: "error" | "info" | "neutral" | "purple" | "success" | "warning" | "teal" }> = {
  admin: { icon: "text-status-error", badge: "error" },
  people: { icon: "text-status-info", badge: "info" },
  user: { icon: "text-status-neutral", badge: "neutral" },
};

export function RoleList() {
  const { data: roles = [], isLoading } = useOrganizationRoles();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const defaultRoles = roles.filter((r) => DEFAULT_SLUGS.includes(r.slug));
  const customRoles = roles.filter((r) => !DEFAULT_SLUGS.includes(r.slug));

  return (
    <div className="space-y-6">
      {/* Default Roles */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Roles Padrão</h3>
          <Badge variant="secondary" className="text-xs">
            Protegidas
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {defaultRoles.map((role) => (
            <RoleCard key={role.id} role={role} isDefault />
          ))}
        </div>
      </div>

      {/* Custom Roles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">Roles Customizadas</h3>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Role
          </Button>
        </div>
        {customRoles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customRoles.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma role customizada criada</p>
            <p className="text-sm mb-4">
              Crie roles personalizadas para sua organização
            </p>
            <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Criar primeira role
            </Button>
          </div>
        )}
      </div>

      <CreateRoleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}

function RoleCard({ role, isDefault = false }: { role: Role; isDefault?: boolean }) {
  const permissionCount = role.permissions.length;
  const styles = roleStyles[role.slug] || { icon: "text-status-purple", badge: "purple" as const };

  return (
    <Card className={isDefault ? "bg-muted/30" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Shield className={`h-5 w-5 ${styles.icon}`} />
          <CardTitle className="text-base">{role.name}</CardTitle>
          <Badge variant={styles.badge} className="text-xs">
            {role.slug}
          </Badge>
          {isDefault && (
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        <CardDescription className="text-xs">
          {role.description || `Role ${role.slug}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Permissões</span>
          <Badge variant="secondary">{permissionCount}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {role.permissions.slice(0, 5).map((perm) => (
            <Badge key={perm} variant="outline" className="text-xs">
              {perm.split(".")[0]}
            </Badge>
          ))}
          {role.permissions.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{role.permissions.length - 5}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}