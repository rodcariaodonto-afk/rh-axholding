import { useOrganizationContext } from "@/contexts/OrganizationContext";

/**
 * Hook para acessar a organização ativa do contexto
 * 
 * Diferente de useRequireOrganization que apenas pega a primeira org,
 * este hook usa o Context e permite troca de org ativa.
 */
export function useCurrentOrganization() {
  const { currentOrganization, organizations, setCurrentOrganization, isLoading } =
    useOrganizationContext();

  return {
    organizationId: currentOrganization?.id ?? null,
    organization: currentOrganization,
    setOrganization: setCurrentOrganization,
    organizations,
    isLoading,
  };
}
