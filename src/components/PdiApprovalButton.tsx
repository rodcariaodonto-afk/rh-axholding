import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle, Clock, XCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
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

interface PdiApprovalButtonProps {
  pdiId: string;
  pdi: any;
}

export const PdiApprovalButton = ({ pdiId, pdi }: PdiApprovalButtonProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin, isPeople } = useUserRole(user?.id);
  const canApprove = isAdmin || isPeople;

  const approvalStatus = pdi?.approval_status || "draft";
  const isFinalized = pdi?.finalized_at !== null;

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Save a version snapshot before submitting
      const { data: versions } = await supabase
        .from("pdi_versions")
        .select("version_number")
        .eq("pdi_id", pdiId)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = ((versions?.[0] as any)?.version_number || 0) + 1;

      await supabase.from("pdi_versions").insert({
        pdi_id: pdiId,
        version_number: nextVersion,
        snapshot: { title: pdi.title, objective: pdi.objective, status: pdi.status },
        changed_by: user!.id,
        change_description: "Enviado para aprovação",
      });

      const { error } = await supabase
        .from("pdis")
        .update({
          approval_status: "pending",
          submitted_for_approval_at: new Date().toISOString(),
        })
        .eq("id", pdiId);
      if (error) throw error;

      // Log the event
      await supabase.from("pdi_logs").insert({
        pdi_id: pdiId,
        logged_by: user!.id,
        event_type: "submitted_for_approval",
        description: "PDI enviado para aprovação",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdi", pdiId] });
      toast({ title: "PDI enviado para aprovação!" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (action: "approved" | "rejected") => {
      const { error } = await supabase
        .from("pdis")
        .update({
          approval_status: action,
          approved_at: action === "approved" ? new Date().toISOString() : null,
          approved_by: action === "approved" ? user!.id : null,
        })
        .eq("id", pdiId);
      if (error) throw error;

      await supabase.from("pdi_logs").insert({
        pdi_id: pdiId,
        logged_by: user!.id,
        event_type: action === "approved" ? "pdi_approved" : "pdi_rejected",
        description: action === "approved" ? "PDI aprovado" : "PDI rejeitado",
      });
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ["pdi", pdiId] });
      toast({ title: action === "approved" ? "PDI aprovado!" : "PDI rejeitado" });
    },
  });

  if (isFinalized) return null;

  const statusBadges: Record<string, JSX.Element> = {
    draft: <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Rascunho</Badge>,
    pending: <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Aguardando Aprovação</Badge>,
    approved: <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>,
    rejected: <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>,
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {statusBadges[approvalStatus]}

      {approvalStatus === "draft" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" disabled={submitMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              Enviar para Aprovação
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enviar PDI para Aprovação</AlertDialogTitle>
              <AlertDialogDescription>
                O PDI será enviado para revisão e aprovação pelo gestor ou RH.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => submitMutation.mutate()}>
                Enviar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {approvalStatus === "rejected" && (
        <Button size="sm" variant="outline" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
          <Send className="h-4 w-4 mr-2" />
          Reenviar para Aprovação
        </Button>
      )}

      {approvalStatus === "pending" && canApprove && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => approveMutation.mutate("approved")} disabled={approveMutation.isPending}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => approveMutation.mutate("rejected")} disabled={approveMutation.isPending}>
            <XCircle className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>
        </div>
      )}
    </div>
  );
};
