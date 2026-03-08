import { usePdis } from "@/hooks/usePdis";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Calendar, TrendingUp } from "lucide-react";
import { useState } from "react";
import { PdiDialog } from "./PdiDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PdiTabProps {
  employeeId: string;
}

export const PdiTab = ({ employeeId }: PdiTabProps) => {
  const { data: pdis, isLoading } = usePdis(employeeId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "outline" | "info" | "warning" | "success" | "error"; label: string }> = {
      rascunho: { variant: "outline", label: "Rascunho" },
      em_andamento: { variant: "info", label: "Em Andamento" },
      entregue: { variant: "warning", label: "Entregue" },
      concluido: { variant: "success", label: "Concluído" },
      cancelado: { variant: "error", label: "Cancelado" },
    };
    const config = variants[status] || variants.rascunho;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Planos de Desenvolvimento Individual
        </h3>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Criar PDI
        </Button>
      </div>

      {pdis?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum PDI encontrado. Crie o primeiro PDI para este colaborador.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pdis?.map((pdi) => (
            <Card 
              key={pdi.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/employees/${employeeId}/pdi/${pdi.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{pdi.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(pdi.start_date), "dd/MM/yyyy", { locale: ptBR })} 
                      {" → "}
                      {format(new Date(pdi.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  {getStatusBadge(pdi.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso</span>
                  <span className="font-semibold">{pdi.progress?.toFixed(0)}%</span>
                </div>
                <Progress value={pdi.progress || 0} />
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Engajamento: {((pdi.engagement_score || 0) * 100).toFixed(0)}%
                  </div>
                  <div>
                    {pdi.goals?.length || 0} meta(s)
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PdiDialog
        employeeId={employeeId}
        pdiId={null}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};
