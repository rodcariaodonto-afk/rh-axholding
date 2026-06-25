import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone } from "lucide-react";
import { useComunicadosByEmployee, useDeleteComunicado, type Comunicado } from "@/hooks/useComunicados";
import { ComunicadoDialog } from "@/components/ComunicadoDialog";

const PRIORITY_BADGE: Record<string, { label: string; variant: "outline" | "secondary" | "destructive" }> = {
  normal:     { label: "Normal",     variant: "outline" },
  importante: { label: "Importante", variant: "secondary" },
  urgente:    { label: "Urgente",    variant: "destructive" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface ComunicadosEmployeeTabProps {
  employeeId: string;
}

export function ComunicadosEmployeeTab({ employeeId }: ComunicadosEmployeeTabProps) {
  const { data: comunicados = [], isLoading } = useComunicadosByEmployee(employeeId);
  const deleteMutation = useDeleteComunicado();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Comunicados enviados diretamente para este colaborador.
        </p>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Megaphone className="mr-1.5 h-3.5 w-3.5" />Enviar Comunicado
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : comunicados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Megaphone className="size-8 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">Nenhum comunicado individual enviado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comunicados.map((c: Comunicado) => {
            const badge = PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.normal;
            return (
              <Card key={c.id}>
                <CardContent className="py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => deleteMutation.mutate(c.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <span className="text-destructive text-xs">✕</span>
                    </Button>
                  </div>
                  <p className="font-medium text-sm">{c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.message}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ComunicadoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        defaultDestinatarioTipo="individual"
        defaultEmployeeId={employeeId}
        lockDestinatario
      />
    </div>
  );
}
