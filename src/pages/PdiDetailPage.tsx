import { useParams, useNavigate } from "react-router-dom";
import { usePdiById } from "@/hooks/usePdiById";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle, XCircle, Trash } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PdiInfoForm } from "@/components/PdiInfoForm";
import { PdiGoalsManager } from "@/components/PdiGoalsManager";
import { PdiCommentsSection } from "@/components/PdiCommentsSection";
import { useFinalizePdi } from "@/hooks/useFinalizePdi";
import { useDeletePdi } from "@/hooks/useDeletePdi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PdiDetailPage = () => {
  const { id: employeeId, pdiId } = useParams<{ id: string; pdiId: string }>();
  const navigate = useNavigate();
  const { data: pdi, isLoading } = usePdiById(pdiId);
  const finalizePdi = useFinalizePdi();
  const deletePdi = useDeletePdi();

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  if (!pdi) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">PDI não encontrado.</p>
          <Button variant="link" onClick={() => navigate(`/employees/${employeeId}`)}>
            Voltar ao perfil
          </Button>
        </div>
      </Layout>
    );
  }

  const today = new Date();
  const dueDate = new Date(pdi.due_date);
  const daysUntilDue = differenceInDays(dueDate, today);
  const totalGoals = pdi.goals?.length || 0;
  const completedGoals = pdi.goals?.filter((g: any) => g.status === "concluida").length || 0;
  const isFinalized = pdi.finalized_at !== null;

  const handleDelete = () => {
    deletePdi.mutate(pdiId!, {
      onSuccess: () => navigate(`/employees/${employeeId}`),
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/employees/${employeeId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{pdi.title}</h1>
            <p className="text-sm text-muted-foreground">
              {(pdi.employee as any)?.full_name} • {(pdi.employee as any)?.department?.name}
            </p>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progresso do Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pdi.progress?.toFixed(0)}%</div>
              <Progress value={pdi.progress || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((pdi.engagement_score || 0) * 100).toFixed(0)}%
              </div>
              <Progress value={(pdi.engagement_score || 0) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Metas Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedGoals}/{totalGoals}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(0) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dias até Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${daysUntilDue < 0 ? "text-destructive" : ""}`}>
                {daysUntilDue < 0 ? "Atrasado" : `${daysUntilDue} dias`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info and Goals */}
          <div className="lg:col-span-2 space-y-6">
            {/* PDI Info Form */}
            <Card>
              <CardContent className="pt-6">
                <PdiInfoForm employeeId={employeeId!} pdi={pdi} />
              </CardContent>
            </Card>

            {/* Goals Manager */}
            <Card>
              <CardContent className="pt-6">
                <PdiGoalsManager pdiId={pdiId!} pdi={pdi} />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {!isFinalized && pdi.status === "entregue" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Finalizar como Concluído
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Finalizar PDI como Concluído</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá marcar o PDI como concluído e impedir futuras edições.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => finalizePdi.mutate({ pdiId: pdiId!, status: "concluido" })}
                      >
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {!isFinalized && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar PDI
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar PDI</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá marcar o PDI como cancelado e impedir futuras edições.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => finalizePdi.mutate({ pdiId: pdiId!, status: "cancelado" })}
                        className="bg-destructive"
                      >
                        Confirmar Cancelamento
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {!isFinalized && totalGoals === 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      <Trash className="mr-2 h-4 w-4" />
                      Excluir PDI
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir PDI</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação é permanente e não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                        Confirmar Exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Right Column - Timeline */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Linha do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {pdi.logs?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
                  ) : (
                    <div className="space-y-4">
                      {pdi.logs?.map((log: any) => (
                        <div key={log.id} className="border-l-2 border-primary pl-4 pb-4">
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                          <div className="font-medium text-sm">
                            {log.logged_by_employee?.full_name}
                          </div>
                          <div className="text-sm">{log.description}</div>
                          {log.goal && (
                            <Badge variant="outline" className="mt-1">
                              Meta: {log.goal.title}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <PdiCommentsSection pdiId={pdiId!} comments={pdi.comments || []} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PdiDetailPage;
