import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PeopleRouteProps {
  children: React.ReactNode;
}

const PeopleRoute = ({ children }: PeopleRouteProps) => {
  const { user, loading } = useAuth();
  const { isAdmin, isPeople, isLoading: isLoadingRoles } = useUserRole(user?.id);
  const navigate = useNavigate();
  const location = useLocation();

  const hasAccess = isAdmin || isPeople;

  useEffect(() => {
    if (!loading && !isLoadingRoles) {
      if (!user) {
        navigate("/auth");
      } else if (!hasAccess) {
        // Don't redirect to "/" if we're on setup - that would cause infinite loop
        // Instead, redirect to people-analytics which is a safe default for regular users
        const isSetupRoute = location.pathname === "/setup" || location.pathname === "/onboarding";
        if (!isSetupRoute) {
          navigate("/profile");
        }
      }
    }
  }, [user, loading, isLoadingRoles, isAdmin, isPeople, navigate, location.pathname]);

  if (loading || isLoadingRoles) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || !hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

export default PeopleRoute;
