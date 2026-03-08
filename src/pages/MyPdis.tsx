import { useAuth } from "@/hooks/useAuth";
import { PdiTab } from "@/components/PdiTab";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyPdis() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Meu PDI</h1>
        <p className="text-muted-foreground">Acompanhe seus Planos de Desenvolvimento Individual</p>
      </div>
      <PdiTab employeeId={user.id} />
    </div>
  );
}
