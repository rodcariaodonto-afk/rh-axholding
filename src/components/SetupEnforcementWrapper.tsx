import { useLocation } from "react-router-dom";
import { useSetupProgress } from "@/hooks/useSetupProgress";
import { SetupModal } from "@/components/SetupModal";
import { Skeleton } from "@/components/ui/skeleton";

interface SetupEnforcementWrapperProps {
  children: React.ReactNode;
}

/**
 * Routes where the setup modal should NOT be shown,
 * because the user navigated there from the setup itself.
 */
const SETUP_EXIT_ROUTES = ["/departments/new"];

/**
 * Wrapper that enforces setup completion for authenticated users with organizations.
 * Shows setup modal if the organization setup is not complete.
 * Should only be used inside routes where organization exists.
 */
const SetupEnforcementWrapper = ({ children }: SetupEnforcementWrapperProps) => {
  const { isLoading, isComplete, isSkipped } = useSetupProgress();
  const location = useLocation();

  const isOnSetupExitRoute = SETUP_EXIT_ROUTES.some((r) =>
    location.pathname.startsWith(r)
  );

  // Derive modal visibility directly — no useEffect/useState to avoid flash
  const showSetupModal = !isLoading && !isOnSetupExitRoute && !isComplete && !isSkipped;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      {children}
      <SetupModal
        open={showSetupModal}
        onOpenChange={() => {}}
      />
    </>
  );
};

export default SetupEnforcementWrapper;
