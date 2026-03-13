import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface TimeOffRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  returned_at?: string | null;
  return_confirmed_by?: string | null;
  return_notes?: string | null;
}

interface TimeOffCompletionTabProps {
  requests: TimeOffRequest[];
  employees: any[];
  isManager: boolean;
  userId?: string;
}

export const TimeOffCompletionTab = ({ requests, employees, isManager, userId }: TimeOffCompletionTabProps) => {
  const queryClient = useQueryClient();
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; request: TimeOffRequest | null }>({
    open: false,
    request: null,
  });
  const [returnNotes, setReturnNotes] = useState("");

  const completableRequests = useMemo(() => {
    return requests
      .filter(r => r.status === "approved" && isPast(parseISO(r.end_date)))
      .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
  }, [requests]);

  const confirmReturn = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes: string }) => {
      const { error } = await supabase
        .from("time_off_requests")
        .update({
          returned_at: new Date().toISOString(),
          return_confirmed_by: userId,
          return_notes: notes || null,
        })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-off-requests"] });
      toast({ title: "Retorno confirmado com sucesso!" });
      setConfirmModal({ open: false, request: null });
      setReturnNotes("");
    },
    onError: () => {
      toast({ title: "Erro ao confirmar retorno", variant: "destructive" });
    },
  });

  const getEmployeeName = (employeeId: string) => {
    const emp = employees?.find((e: any) => e.id === employeeId);
    return emp?.full_name || emp?.email || "—";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Conclusão de Férias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completableRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma férias pendente de conclusão.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Status Retorno</TableHead>
                  {isManager && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {completableRequests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {getEmployeeName(request.employee_id)}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(request.start_date), "dd/MM/yyyy", { locale: ptBR })} —{" "}
                      {format(parseISO(request.end_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{request.total_days}</TableCell>
                    <TableCell>
                      {request.returned_at ? (
                        <Badge variant="success">
                          Retornou em {format(parseISO(request.returned_at), "dd/MM/yyyy", { locale: ptBR })}
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <Clock className="h-3 w-3 mr-1" />
                          Aguardando retorno
                        </Badge>
                      )}
                    </TableCell>
                    {isManager && (
                      <TableCell className="text-right">
                        {!request.returned_at && (
                          <Button
                            size="sm"
                            onClick={() => setConfirmModal({ open: true, request })}
                          >
                            Confirmar Retorno
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={confirmModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmModal({ open: false, request: null });
            setReturnNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Retorno de Férias</DialogTitle>
          </DialogHeader>
          {confirmModal.request && (
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <p><strong>Colaborador:</strong> {getEmployeeName(confirmModal.request.employee_id)}</p>
                <p>
                  <strong>Período:</strong>{" "}
                  {format(parseISO(confirmModal.request.start_date), "dd/MM/yyyy")} —{" "}
                  {format(parseISO(confirmModal.request.end_date), "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Observações (opcional)</label>
                <Textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Notas sobre o retorno..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModal({ open: false, request: null })}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (confirmModal.request) {
                  confirmReturn.mutate({ requestId: confirmModal.request.id, notes: returnNotes });
                }
              }}
              disabled={confirmReturn.isPending}
            >
              Confirmar Retorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
