import { useAuth } from "@/hooks/useAuth";
import { useUserOrganizations } from "@/hooks/useUserOrganizations";

export function useRequireOrganization() {
  const { user, loading: authLoading } = useAuth();
  const { data: organizations, isLoading: orgsLoading } = useUserOrganizations(user?.id);

  const hasOrganization = (organizations?.length ?? 0) > 0;
  const organization = organizations?.[0] ?? null;
  const isLoading = authLoading || orgsLoading;

  return {
    hasOrganization,
    organization,
    organizations: organizations ?? [],
    isLoading,
    user,
  };
}
