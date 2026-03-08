import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { useUserRole } from "@/hooks/useUserRole";
import { useViewAs } from "@/contexts/ViewAsContext";

interface Permission {
  permission_id: string;
  module: string;
  action: string;
}

/**
 * Hook para verificar permissões granulares do usuário na organização ativa
 * 
 * Se GRANULAR_PERMISSIONS estiver desativado, usa fallback para sistema antigo (has_role)
 */
export function usePermissions() {
  const { user } = useAuth();
  const { organizationId } = useCurrentOrganization();
  const { isAdmin, isPeople, isLoading: rolesLoading } = useUserRole();
  const { isViewingAsCollaborator } = useViewAs();

  // Se feature flag desativada, usa sistema antigo
  const useGranularPermissions = FEATURE_FLAGS.GRANULAR_PERMISSIONS;

  const {
    data: permissions = [],
    isLoading: permissionsLoading,
    error,
  } = useQuery({
    queryKey: ["user-permissions", user?.id, organizationId],
    queryFn: async () => {
      if (!user?.id || !organizationId) return [];

      const { data, error } = await supabase.rpc("get_org_user_permissions", {
        _user_id: user.id,
        _org_id: organizationId,
      });

      if (error) throw error;
      return (data as Permission[]) ?? [];
    },
    enabled: !!user?.id && !!organizationId && useGranularPermissions,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    retry: 2,
  });

  // Basic user permissions (read-only)
  const USER_PERMISSIONS = [
    'employees.view', 'devices.view', 'time_off.view',
    'certificates.view', 'trainings.view', 'jobs.view', 'positions.view',
  ];

  const allPermissionIds = permissions.map((p) => p.permission_id);
  
  // When viewing as collaborator, restrict to basic user permissions
  const permissionIds = isViewingAsCollaborator
    ? allPermissionIds.filter((p) => USER_PERMISSIONS.includes(p))
    : allPermissionIds;

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const can = useCallback(
    (permission: string): boolean => {
      // Feature flag desativada: fallback para sistema antigo
      if (!useGranularPermissions) {
        return isAdmin || isPeople;
      }

      if (error || permissionsLoading) return false;
      return permissionIds.includes(permission);
    },
    [permissionIds, error, permissionsLoading, useGranularPermissions, isAdmin, isPeople]
  );

  /**
   * Verifica se o usuário tem qualquer uma das permissões
   */
  const canAny = useCallback(
    (perms: string[]): boolean => {
      if (!useGranularPermissions) {
        return isAdmin || isPeople;
      }

      if (error || permissionsLoading) return false;
      return perms.some((p) => permissionIds.includes(p));
    },
    [permissionIds, error, permissionsLoading, useGranularPermissions, isAdmin, isPeople]
  );

  /**
   * Verifica se o usuário tem todas as permissões
   */
  const canAll = useCallback(
    (perms: string[]): boolean => {
      if (!useGranularPermissions) {
        return isAdmin || isPeople;
      }

      if (error || permissionsLoading) return false;
      return perms.every((p) => permissionIds.includes(p));
    },
    [permissionIds, error, permissionsLoading, useGranularPermissions, isAdmin, isPeople]
  );

  /**
   * Verifica se pode realizar ação em um módulo específico
   */
  const canModule = useCallback(
    (module: string, action: string): boolean => {
      return can(`${module}.${action}`);
    },
    [can]
  );

  const isLoading = useGranularPermissions ? permissionsLoading : rolesLoading;

  return {
    permissions,
    permissionIds,
    isLoading,
    error,
    can,
    canAny,
    canAll,
    canModule,
    organizationId,
    useGranularPermissions,
  };
}

/**
 * Constantes de permissões para uso no código
 */
export const PERMISSIONS = {
  // Devices
  DEVICES_VIEW: "devices.view",
  DEVICES_CREATE: "devices.create",
  DEVICES_EDIT: "devices.edit",
  DEVICES_DELETE: "devices.delete",
  
  // Employees
  EMPLOYEES_VIEW: "employees.view",
  EMPLOYEES_VIEW_ALL: "employees.view_all",
  EMPLOYEES_EDIT: "employees.edit",
  EMPLOYEES_DELETE: "employees.delete",
  
  // Time Off
  TIME_OFF_VIEW: "time_off.view",
  TIME_OFF_CREATE: "time_off.create",
  TIME_OFF_APPROVE: "time_off.approve",
  TIME_OFF_DELETE: "time_off.delete",
  
  // Certificates
  CERTIFICATES_VIEW: "certificates.view",
  CERTIFICATES_CREATE: "certificates.create",
  CERTIFICATES_DELETE: "certificates.delete",
  
  // Trainings
  TRAININGS_VIEW: "trainings.view",
  TRAININGS_CREATE: "trainings.create",
  TRAININGS_DELETE: "trainings.delete",
  
  // Jobs
  JOBS_VIEW: "jobs.view",
  JOBS_CREATE: "jobs.create",
  JOBS_EDIT: "jobs.edit",
  JOBS_DELETE: "jobs.delete",
  JOBS_PUBLISH: "jobs.publish",
  
  // Positions
  POSITIONS_VIEW: "positions.view",
  POSITIONS_CREATE: "positions.create",
  POSITIONS_EDIT: "positions.edit",
  POSITIONS_DELETE: "positions.delete",
  
  // Applications
  APPLICATIONS_VIEW: "applications.view",
  APPLICATIONS_MANAGE: "applications.manage",
  APPLICATIONS_DELETE: "applications.delete",
  
  // Users/Access
  USERS_VIEW: "users.view",
  USERS_MANAGE_ROLES: "users.manage_roles",
  
  // Admin
  ADMIN_VIEW_COSTS: "admin.view_costs",
  ADMIN_SYSTEM_SETTINGS: "admin.system_settings",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = typeof PERMISSIONS[PermissionKey];
