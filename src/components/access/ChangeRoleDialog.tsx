import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationRoles } from "@/hooks/useOrganizationRoles";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { OrganizationMember } from "@/hooks/useOrganizationMembers";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ChangeRoleDialogProps {
  member: OrganizationMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Workaround for Radix UI Dialog bug #1241
// https://github.com/radix-ui/primitives/issues/1241
const cleanupDialogScrollLock = () => {
  // Remove scroll lock styles from body
  document.body.style.overflow = "";
  document.body.style.pointerEvents = "";
  document.body.style.paddingRight = "";
  document.body.removeAttribute("data-scroll-locked");
};

export function ChangeRoleDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
}: ChangeRoleDialogProps) {
  const { user } = useAuth();
  const { organizationId } = useCurrentOrganization();
  const { data: roles = [] } = useOrganizationRoles();
  const queryClient = useQueryClient();

  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [reason, setReason] = useState("");

  // Cleanup scroll lock when dialog closes
  useEffect(() => {
    if (!open) {
      // Small delay to let animation finish, then force cleanup
      const timer = setTimeout(() => {
        cleanupDialogScrollLock();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupDialogScrollLock();
    };
  }, []);

  // Reset state when dialog opens with new member
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen && member) {
      setSelectedRoleId(member.role_id || "");
      setReason("");
    }
    onOpenChange(isOpen);
    
    // Force cleanup after close animation
    if (!isOpen) {
      setTimeout(cleanupDialogScrollLock, 300);
    }
  }, [member, onOpenChange]);

  const changeRoleMutation = useMutation({
    mutationFn: async () => {
      if (!member || !organizationId || !selectedRoleId) {
        throw new Error("Dados inválidos");
      }

      // Validações client-side
      if (member.user_id === user?.id) {
        throw new Error("Você não pode alterar seu próprio perfil");
      }

      if (reason.trim().length < 10) {
        throw new Error("O motivo deve ter pelo menos 10 caracteres");
      }

      // Buscar role antiga e nova para o audit log
      const oldRole = roles.find((r) => r.id === member.role_id);
      const newRole = roles.find((r) => r.id === selectedRoleId);

      // Atualizar role do membro
      const { error: updateError } = await supabase
        .from("organization_members")
        .update({ role_id: selectedRoleId })
        .eq("id", member.id);

      if (updateError) throw updateError;

      // Registrar no audit log
      const { error: auditError } = await supabase
        .from("permission_audit_log")
        .insert({
          organization_id: organizationId,
          action: "member_role_changed",
          target_user_id: member.user_id,
          target_role_id: selectedRoleId,
          old_value: oldRole ? { role_id: oldRole.id, slug: oldRole.slug, name: oldRole.name } : null,
          new_value: newRole ? { role_id: newRole.id, slug: newRole.slug, name: newRole.name } : null,
          reason: reason.trim(),
          changed_by: user?.id,
        });

      if (auditError) {
        console.error("Erro ao registrar audit log:", auditError);
        // Não falhar a operação por erro no audit log
      }

      return { oldRole, newRole };
    },
    onSuccess: (data) => {
      toast.success(
        `Perfil alterado de ${data.oldRole?.name || "N/A"} para ${data.newRole?.name || "N/A"}`
      );
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      queryClient.invalidateQueries({ queryKey: ["permission-audit-log"] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao alterar perfil");
    },
  });

  const currentRole = roles.find((r) => r.id === member?.role_id);
  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isDowngrade =
    currentRole?.slug === "admin" && selectedRole?.slug !== "admin";
  const isSameRole = selectedRoleId === member?.role_id;
  const isSelf = member?.user_id === user?.id;
  const isReasonValid = reason.trim().length >= 10;

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

  if (!member) {
    return <Dialog open={false} onOpenChange={onOpenChange} />;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Alterar Perfil de Acesso</DialogTitle>
          <DialogDescription>
            Selecione o novo perfil e informe o motivo da alteração
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Member Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.employee?.photo_url || ""} />
              <AvatarFallback>
                {getInitials(
                  member.employee?.full_name || null,
                  member.employee?.email || ""
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {member.employee?.full_name || member.employee?.email}
              </p>
              <p className="text-sm text-muted-foreground">
                {member.employee?.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Perfil atual: <strong>{currentRole?.name || "Não definido"}</strong>
              </p>
            </div>
          </div>

          {/* Self Warning */}
          {isSelf && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você não pode alterar seu próprio perfil de acesso
              </AlertDescription>
            </Alert>
          )}

          {/* Role Selection */}
          <div className="space-y-3">
            <Label>Novo Perfil</Label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
              disabled={isSelf}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Downgrade Warning */}
          {isDowngrade && !isSelf && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: Você está removendo privilégios de administrador deste
                usuário
              </AlertDescription>
            </Alert>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo da Alteração <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da alteração de perfil..."
              disabled={isSelf}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 10 caracteres ({reason.length}/10)
            </p>
          </div>

          {/* Audit Notice */}
          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            ⚠️ Esta ação será registrada para fins de auditoria
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => changeRoleMutation.mutate()}
            disabled={
              isSelf ||
              isSameRole ||
              !isReasonValid ||
              changeRoleMutation.isPending
            }
          >
            {changeRoleMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirmar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
