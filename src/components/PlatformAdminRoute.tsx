import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export default function PlatformAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isPlatformAdmin, isLoading } = usePlatformAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || isLoading) return;
    if (!user) navigate("/auth");
  }, [user, loading, isLoading, navigate]);

  if (loading || isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Esta área é exclusiva da equipe Super Admin AXIS (AXHolding).
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
