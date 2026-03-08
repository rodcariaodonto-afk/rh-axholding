import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { hasInviteTokenInHash } from "@/lib/inviteDetection";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, hasOrganization, isLoading } = useRequireOrganization();
  const { hasUsers: hasAnyOrganization, isLoading: isCheckingSystem } = useSystemStatus();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || isCheckingSystem) return;

    // Not logged in -> redirect to auth
    if (!user) {
      navigate("/auth");
      return;
    }

    // If invite tokens detected, redirect to accept-invite
    if (hasInviteTokenInHash()) {
      navigate("/accept-invite");
      return;
    }

    // No organization in the entire system -> redirect to auth
    // (shows the "Configuração Inicial" admin creation form)
    // Allow /onboarding through (admin just created, needs to create org)
    if (!hasOrganization && !hasAnyOrganization && location.pathname !== "/onboarding") {
      navigate("/auth");
      return;
    }

    // Logged in but no organization -> redirect to onboarding
    // (unless already on onboarding page)
    if (!hasOrganization && location.pathname !== "/onboarding") {
      navigate("/onboarding");
      return;
    }
  }, [user, hasOrganization, hasAnyOrganization, isLoading, isCheckingSystem, navigate, location.pathname]);

  if (isLoading || isCheckingSystem) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Allow access to onboarding even without organization
  if (!hasOrganization && location.pathname === "/onboarding") {
    return <>{children}</>;
  }

  if (!hasOrganization) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
