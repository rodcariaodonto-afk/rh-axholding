import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SCOPES = [
  { id: "organization", label: "Organização" },
  { id: "employees", label: "Colaboradores" },
  { id: "contracts", label: "Contratos" },
  { id: "contact", label: "Contato" },
  { id: "demographics", label: "Demográficos" },
  { id: "legal_docs", label: "Docs legais" },
  { id: "candidates", label: "Candidatos" },
  { id: "jobs", label: "Vagas" },
  { id: "positions", label: "Cargos" },
  { id: "departments", label: "Departamentos" },
  { id: "pdis", label: "PDIs" },
  { id: "feedbacks", label: "Feedbacks" },
  { id: "evaluations", label: "Avaliações" },
  { id: "time_off", label: "Férias/Afastamentos" },
  { id: "time_tracking", label: "Ponto" },
  { id: "audit", label: "Auditoria" },
  { id: "policies", label: "Políticas" },
  { id: "consents", label: "Consentimentos" },
];

export function ExportsTab() {
  const { organizationId } = useCurrentOrganization();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set(["organization", "employees"]));
  const [subjectId, setSubjectId] = useState("");
  const [subjectType, setSubjectType] = useState<"" | "employee" | "candidate">("");
  const [running, setRunning] = useState(false);

  const { data: exports = [] } = useQuery({
    queryKey: ["data-exports", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase.from("data_exports").select("*")
        .eq("organization_id", organizationId!).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const runExport = async () => {
    if (!organizationId || selected.size === 0) {
      toast.error("Selecione ao menos um escopo.");
      return;
    }
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("governance-export", {
        body: {
          organization_id: organizationId,
          scope: Array.from(selected),
          subject_type: subjectType || null,
          subject_id: subjectId || null,
        },
      });
      if (error) throw error;
      toast.success("Exportação concluída.");
      if (data?.file_url) window.open(data.file_url, "_blank");
      qc.invalidateQueries({ queryKey: ["data-exports", organizationId] });
    } catch (e) {
      toast.error("Falha na exportação: " + String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova exportação JSON</CardTitle>
          <p className="text-sm text-muted-foreground">
            Documentos, currículos e arquivos pesados são excluídos por padrão. Apenas metadados e referências são incluídos.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Escopos</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {SCOPES.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Tipo do titular (opcional)</Label>
              <select className="mt-1 w-full h-10 rounded-md border bg-background px-3" value={subjectType}
                onChange={(e) => setSubjectType(e.target.value as "" | "employee" | "candidate")}>
                <option value="">— Toda a organização —</option>
                <option value="employee">Colaborador</option>
                <option value="candidate">Candidato</option>
              </select>
            </div>
            <div>
              <Label>ID do titular (opcional)</Label>
              <Input value={subjectId} onChange={(e) => setSubjectId(e.target.value)} placeholder="UUID do colaborador/candidato" />
            </div>
          </div>
          <Button onClick={runExport} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Gerar exportação
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma exportação ainda.</p>
          ) : (
            <div className="space-y-2">
              {exports.map((e) => (
                <div key={e.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="text-sm">
                    <div className="font-medium">{format(new Date(e.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
                    <div className="text-muted-foreground">Escopos: {(e.scope ?? []).join(", ") || "—"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={e.status === "completed" ? "default" : e.status === "failed" ? "destructive" : "secondary"}>
                      {e.status}
                    </Badge>
                    {e.file_url && (
                      <Button size="sm" variant="outline" onClick={() => window.open(e.file_url!, "_blank")}>
                        <Download className="h-3 w-3 mr-1" /> Baixar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
