import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCog, Shield, Eye, Clock } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const roleLabels: Record<string, { label: string; description: string; color: string }> = {
  admin: {
    label: "Administrador",
    description: "Acesso total a todos os módulos e configurações da plataforma.",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  people: {
    label: "RH",
    description: "Gestão completa de pessoas, exceto configurações administrativas.",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  director: {
    label: "Gerente",
    description: "Visão ampla da equipe com gestão de desempenho e desenvolvimento.",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  coordinator: {
    label: "Coordenador",
    description: "Coordenação de equipe com leitura e gestão limitada.",
    color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  },
  manager: {
    label: "Gestor",
    description: "Gestão direta de colaboradores sob sua responsabilidade.",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  user: {
    label: "Colaborador",
    description: "Acesso básico ao próprio perfil, PDI e avaliações.",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
};

const ProfileType = () => {
  const { user } = useAuth();
  const { roles, isLoading: rolesLoading } = useUserRole(user?.id);
  const { organizationId } = useCurrentOrganization();

  const { data: permissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ["user-permissions", user?.id, organizationId],
    queryFn: async () => {
      if (!user?.id || !organizationId) return [];
      const { data, error } = await supabase.rpc("get_org_user_permissions", {
        _user_id: user.id,
        _org_id: organizationId,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!organizationId,
  });

  const { data: memberInfo, isLoading: memberLoading } = useQuery({
    queryKey: ["member-info", user?.id, organizationId],
    queryFn: async () => {
      if (!user?.id || !organizationId) return null;
      const { data, error } = await supabase
        .from("organization_members")
        .select("joined_at, is_owner")
        .eq("user_id", user.id)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!organizationId,
  });

  const isLoading = rolesLoading || permsLoading || memberLoading;
  const currentRole = roles[0] || "user";
  const roleInfo = roleLabels[currentRole] || roleLabels.user;

  // Group permissions by module
  const permissionsByModule = permissions.reduce<Record<string, string[]>>((acc, p: any) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p.action);
    return acc;
  }, {});

  const moduleLabels: Record<string, string> = {
    employees: "Colaboradores",
    departments: "Departamentos",
    positions: "Cargos",
    devices: "Inventário",
    time_off: "Férias",
    certificates: "Certificados",
    trainings: "Treinamentos",
    jobs: "Vagas",
    feedbacks: "Feedbacks",
    evaluations: "Avaliações",
    pdis: "PDI",
    admin: "Administração",
    users: "Usuários",
  };

  const actionLabels: Record<string, string> = {
    view: "Visualizar",
    edit: "Editar",
    create: "Criar",
    delete: "Excluir",
    manage: "Gerenciar",
    send: "Enviar",
    view_costs: "Ver Custos",
    system_settings: "Configurações do Sistema",
    manage_roles: "Gerenciar Papéis",
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tipo de Perfil</h1>
        <p className="text-muted-foreground">
          Veja seu nível de acesso e as permissões disponíveis na plataforma.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex items-center justify-center size-12 rounded-full bg-primary/10">
            <UserCog className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-3">
              {roleInfo.label}
              <Badge className={roleInfo.color}>{currentRole}</Badge>
              {memberInfo?.is_owner && (
                <Badge variant="outline" className="border-amber-500 text-amber-600">
                  Owner
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{roleInfo.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>
              Membro desde{" "}
              {memberInfo?.joined_at
                ? new Date(memberInfo.joined_at).toLocaleDateString("pt-BR")
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="size-5" />
            Permissões por Módulo
          </CardTitle>
          <CardDescription>
            {permissions.length} permissões ativas em {Object.keys(permissionsByModule).length} módulos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(permissionsByModule).map(([module, actions]) => (
            <div key={module}>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="size-4 text-muted-foreground" />
                <span className="font-medium text-sm">{moduleLabels[module] || module}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 ml-6">
                {actions.map((action) => (
                  <Badge key={action} variant="secondary" className="text-xs">
                    {actionLabels[action] || action}
                  </Badge>
                ))}
              </div>
              <Separator className="mt-3" />
            </div>
          ))}
          {Object.keys(permissionsByModule).length === 0 && (
            <p className="text-muted-foreground text-sm">
              Nenhuma permissão encontrada para este perfil.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileType;
