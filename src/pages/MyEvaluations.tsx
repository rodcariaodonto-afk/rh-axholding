import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, CheckCircle2, Inbox, Calendar } from "lucide-react";
import { useMyPendingEvaluations } from "@/hooks/useMyPendingEvaluations";
import { useMyReceivedEvaluations } from "@/hooks/useMyReceivedEvaluations";
import { PendingEvaluationCard } from "@/components/evaluation/PendingEvaluationCard";
import { ReceivedEvaluationCard } from "@/components/evaluation/ReceivedEvaluationCard";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Icon className="size-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyEvaluations() {
  const [activeTab, setActiveTab] = useState("pending");
  const { data: pendingGroups = [], isLoading: isLoadingPending } = useMyPendingEvaluations();
  const { data: receivedEvaluations = [], isLoading: isLoadingReceived } = useMyReceivedEvaluations();

  const totalPending = pendingGroups.reduce(
    (acc, group) => acc + group.total_count - group.completed_count,
    0
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Minhas Avaliações</h1>
          <p className="text-muted-foreground">
            Avaliações de desempenho que você precisa realizar e seus resultados
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <ClipboardList className="size-4" />
              Pendentes
              {totalPending > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {totalPending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              Recebidas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            {isLoadingPending ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : pendingGroups.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Nenhuma avaliação pendente"
                description="Você está em dia com suas avaliações!"
              />
            ) : (
              <div className="space-y-8">
                {pendingGroups.map((group) => {
                  const daysRemaining = differenceInDays(new Date(group.cycle_end_date), new Date());
                  
                  return (
                    <div key={group.cycle_id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{group.cycle_name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Calendar className="size-3.5" />
                            Prazo: {format(new Date(group.cycle_end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            {daysRemaining >= 0 && daysRemaining <= 7 && (
                              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600">
                                {daysRemaining} dias
                              </Badge>
                            )}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {group.completed_count}/{group.total_count} concluídas
                        </Badge>
                      </div>
                      
                      <div className="grid gap-3">
                        {group.evaluations.map((evaluation) => (
                          <PendingEvaluationCard 
                            key={evaluation.participant_id} 
                            evaluation={evaluation} 
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-6">
            {isLoadingReceived ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : receivedEvaluations.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Nenhuma avaliação recebida"
                description="Você ainda não possui resultados de avaliações concluídas."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {receivedEvaluations.map((evaluation) => (
                  <ReceivedEvaluationCard 
                    key={evaluation.cycle_id} 
                    evaluation={evaluation} 
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
