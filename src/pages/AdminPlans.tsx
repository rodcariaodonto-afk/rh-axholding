import PlatformAdminRoute from "@/components/PlatformAdminRoute";
import { usePlans } from "@/hooks/usePlans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function PlansInner() {
  const { data: plans = [], isLoading } = usePlans();

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">Planos SaaS</h1>
        <p className="text-muted-foreground">Catálogo de planos oferecidos aos clientes RHAXIS</p>
      </div>

      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{p.name}</CardTitle>
                  {p.is_active && <Badge>Ativo</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">
                  R$ {(p.price_cents / 100).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground">{p.description}</p>
                <div className="text-xs space-y-1">
                  <div><strong>Módulos inclusos:</strong> {p.default_modules.length}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.default_modules.map((m) => (
                      <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPlans() {
  return (
    <PlatformAdminRoute>
      <PlansInner />
    </PlatformAdminRoute>
  );
}
