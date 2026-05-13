import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const KIND_LABEL: Record<string, string> = {
  access: "Acesso", rectification: "Correção", portability: "Portabilidade",
  anonymization: "Anonimização", deletion: "Exclusão", restriction: "Restrição",
  consent_revocation: "Revogação consent.", review: "Revisão",
};

export function DsrTab() {
  const { organizationId } = useCurrentOrganization();
  const qc = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["dsr-list", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase.from("data_subject_requests").select("*")
        .eq("organization_id", organizationId!).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.functions.invoke("governance-dsr-resolve", {
        body: { organization_id: organizationId, request_id: id, status },
      });
      if (error) throw error;
      toast.success("Atualizado.");
      qc.invalidateQueries({ queryKey: ["dsr-list", organizationId] });
    } catch (e) {
      toast.error("Falha: " + String(e));
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Pedidos dos titulares</CardTitle></CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pedido registrado. Pedidos públicos chegam pelo portal LGPD.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="border rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{KIND_LABEL[r.request_kind] ?? r.request_kind}</Badge>
                    <Badge variant={r.priority === "urgent" ? "destructive" : "secondary"}>{r.priority}</Badge>
                    <span className="text-sm font-medium">{r.subject_name ?? r.subject_email ?? r.subject_id?.slice(0, 8) ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">({r.subject_type})</span>
                  </div>
                  <Badge>{r.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Criado {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  {r.due_at && ` · Prazo ${format(new Date(r.due_at), "dd/MM/yyyy", { locale: ptBR })}`}
                </div>
                {r.resolution_notes && <p className="text-sm">{r.resolution_notes}</p>}
                <div className="flex gap-2">
                  {r.status !== "in_progress" && <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "in_progress")}>Em andamento</Button>}
                  {r.status !== "resolved" && <Button size="sm" onClick={() => updateStatus(r.id, "resolved")}>Resolver</Button>}
                  {r.status !== "rejected" && <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, "rejected")}>Rejeitar</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
