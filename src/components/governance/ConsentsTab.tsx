import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export function ConsentsTab() {
  const { organizationId } = useCurrentOrganization();
  const qc = useQueryClient();

  const [revokeTarget, setRevokeTarget] = useState<any | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const { data: consents = [] } = useQuery({
    queryKey: ["consents", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase.from("data_consents").select("*")
        .eq("organization_id", organizationId!).order("updated_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const revoke = useMutation({
    mutationFn: async ({ consent, reason }: { consent: any; reason: string }) => {
      const { error } = await supabase.functions.invoke("governance-consent-update", {
        body: {
          organization_id: consent.organization_id,
          subject_type: consent.subject_type,
          subject_id: consent.subject_id,
          purpose: consent.purpose,
          consent_status: "revoked",
          legal_basis: consent.legal_basis,
          ai_processing_allowed: consent.ai_processing_allowed,
          talent_pool_opt_in: consent.talent_pool_opt_in,
          privacy_notes: reason,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Consentimento revogado");
      qc.invalidateQueries({ queryKey: ["consents", organizationId] });
      setRevokeTarget(null);
      setRevokeReason("");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao revogar consentimento"),
  });

  function openRevoke(c: any) {
    setRevokeTarget(c);
    setRevokeReason("");
  }

  function closeRevoke() {
    setRevokeTarget(null);
    setRevokeReason("");
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Consentimentos e base legal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Registre concessão, revogação e base legal por colaborador ou candidato. Consentimentos novos podem ser
            criados via API/Edge Function (governance-consent-update) ou nos fluxos de candidatura e admissão.
          </p>
        </CardHeader>
        <CardContent>
          {consents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum consentimento registrado.</p>
          ) : (
            <div className="space-y-2">
              {consents.map((c) => (
                <div
                  key={c.id}
                  className="border rounded-md p-3 flex items-center justify-between text-sm flex-wrap gap-2"
                >
                  <div>
                    <div className="font-medium">{c.purpose}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.subject_type} · {c.subject_id.slice(0, 8)} · base legal: {c.legal_basis}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.ai_processing_allowed && <Badge variant="outline">IA permitida</Badge>}
                    {c.talent_pool_opt_in && <Badge variant="outline">Banco de talentos</Badge>}
                    <Badge
                      variant={
                        c.consent_status === "granted"
                          ? "default"
                          : c.consent_status === "revoked"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {c.consent_status}
                    </Badge>
                    {c.consent_status === "granted" && (
                      <Button variant="outline" size="sm" onClick={() => openRevoke(c)}>
                        Revogar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!revokeTarget} onOpenChange={(o) => { if (!o) closeRevoke(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revogar consentimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Você está revogando o consentimento para:{" "}
              <strong>{revokeTarget?.purpose}</strong>
            </p>
            <div className="space-y-1">
              <Label>Motivo da revogação</Label>
              <Textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Descreva o motivo da revogação..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRevoke}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!revokeReason.trim() || revoke.isPending}
              onClick={() => revoke.mutate({ consent: revokeTarget, reason: revokeReason })}
            >
              {revoke.isPending ? "Revogando..." : "Confirmar revogação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
