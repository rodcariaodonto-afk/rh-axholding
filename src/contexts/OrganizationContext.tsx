import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserOrganizations, UserOrganization } from "@/hooks/useUserOrganizations";

const STORAGE_KEY = "popcode_current_org_id";

interface OrganizationContextValue {
  currentOrganization: UserOrganization | null;
  organizations: UserOrganization[];
  setCurrentOrganization: (org: UserOrganization) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: organizations = [], isLoading: orgsLoading } = useUserOrganizations(user?.id);
  const [currentOrganization, setCurrentOrgState] = useState<UserOrganization | null>(null);

  // Carregar org salva do localStorage ou usar primeira disponível
  useEffect(() => {
    if (orgsLoading || organizations.length === 0) return;

    const savedOrgId = localStorage.getItem(STORAGE_KEY);
    
    if (savedOrgId) {
      const savedOrg = organizations.find((org) => org.id === savedOrgId);
      if (savedOrg) {
        setCurrentOrgState(savedOrg);
        return;
      }
    }

    // Fallback: usar primeira organização
    setCurrentOrgState(organizations[0]);
  }, [organizations, orgsLoading]);

  const setCurrentOrganization = (org: UserOrganization) => {
    localStorage.setItem(STORAGE_KEY, org.id);
    setCurrentOrgState(org);
  };

  const isLoading = authLoading || orgsLoading;

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        setCurrentOrganization,
        isLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganizationContext must be used within an OrganizationProvider");
  }
  return context;
}
