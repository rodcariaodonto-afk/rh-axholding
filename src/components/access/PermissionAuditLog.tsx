import { usePermissionAuditLog, AuditLogEntry } from "@/hooks/usePermissionAuditLog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, UserPlus, UserMinus, Shield, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actionLabels: Record<string, { label: string; icon: typeof History }> = {
  role_created: { label: "Role criada", icon: Shield },
  role_updated: { label: "Role atualizada", icon: Shield },
  role_deleted: { label: "Role excluída", icon: Shield },
  permission_added: { label: "Permissão adicionada", icon: Key },
  permission_removed: { label: "Permissão removida", icon: Key },
  member_role_assigned: { label: "Membro adicionado", icon: UserPlus },
  member_role_changed: { label: "Perfil alterado", icon: Shield },
  member_removed: { label: "Membro removido", icon: UserMinus },
};

const roleColorMap: Record<string, BadgeProps["variant"]> = {
  admin: "error",
  people: "purple",
  user: "neutral",
};

function getRoleBadgeVariant(slug: string | undefined): BadgeProps["variant"] {
  if (!slug) return "purple";
  return roleColorMap[slug] || "purple";
}

export function PermissionAuditLog() {
  const { data: logs = [], isLoading } = usePermissionAuditLog();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 p-4 border rounded-lg">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma alteração registrada</p>
        <p className="text-sm">
          O histórico de alterações de permissões aparecerá aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <LogEntry key={log.id} log={log} />
      ))}
    </div>
  );
}

function LogEntry({ log }: { log: AuditLogEntry }) {
  const navigate = useNavigate();
  const actionConfig = actionLabels[log.action] || {
    label: log.action,
    icon: History,
  };
  const Icon = actionConfig.icon;

  const timeAgo = formatDistanceToNow(new Date(log.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const handleUserClick = (userId: string | null) => {
    if (userId) {
      navigate(`/employees/${userId}`);
    }
  };

  // Build human-readable description
  const getDescription = () => {
    const actorName = log.changed_by_name || "Alguém";
    const targetName = log.target_user_name || "um usuário";
    const oldRoleName = log.old_value?.name || log.old_value?.slug || "N/A";
    const newRoleName = log.new_value?.name || log.new_value?.slug || "N/A";
    const oldRoleSlug = log.old_value?.slug;
    const newRoleSlug = log.new_value?.slug;

    const ActorBadge = () => (
      <Badge 
        variant="secondary" 
        className="text-xs mx-1 cursor-pointer hover:bg-secondary/80"
        onClick={() => handleUserClick(log.changed_by)}
      >
        {actorName}
      </Badge>
    );

    const TargetBadge = () => (
      <Badge 
        variant="secondary" 
        className="text-xs mx-1 cursor-pointer hover:bg-secondary/80"
        onClick={() => handleUserClick(log.target_user_id)}
      >
        {targetName}
      </Badge>
    );

    const OldRoleBadge = () => (
      <Badge variant={getRoleBadgeVariant(oldRoleSlug)} className="text-xs mx-1">
        {oldRoleName}
      </Badge>
    );

    const NewRoleBadge = () => (
      <Badge variant={getRoleBadgeVariant(newRoleSlug)} className="text-xs mx-1">
        {newRoleName}
      </Badge>
    );

    switch (log.action) {
      case "member_role_changed":
        return (
          <>
            <ActorBadge /> alterou o perfil de
            <TargetBadge /> de
            <OldRoleBadge />
            para
            <NewRoleBadge />
          </>
        );
      case "member_role_assigned":
        return (
          <>
            <ActorBadge /> atribuiu o perfil
            <NewRoleBadge />
            para <TargetBadge />
          </>
        );
      case "member_removed":
        return (
          <>
            <ActorBadge /> removeu
            <TargetBadge /> da organização
          </>
        );
      case "role_created":
        return (
          <>
            <ActorBadge /> criou a role
            <NewRoleBadge />
          </>
        );
      case "role_updated":
        return (
          <>
            <ActorBadge /> atualizou a role
            <NewRoleBadge />
          </>
        );
      case "role_deleted":
        return (
          <>
            <ActorBadge /> excluiu a role
            <OldRoleBadge />
          </>
        );
      default:
        return (
          <>
            <ActorBadge /> realizou uma ação
          </>
        );
    }
  };

  return (
    <div className="flex gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant="outline" className="text-xs">
            {actionConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm">{getDescription()}</p>
        {log.reason && (
          <p className="text-xs mt-1 text-muted-foreground">
            Motivo: {log.reason}
          </p>
        )}
      </div>
    </div>
  );
}
