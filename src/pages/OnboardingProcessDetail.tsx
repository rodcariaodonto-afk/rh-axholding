import { useParams, useNavigate } from "react-router-dom";
import { useOnboardingProcess, useOnboardingProcesses } from "@/hooks/useOnboardingProcesses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Copy, RefreshCw, FileText, Check, X, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pendente: "outline", enviado: "secondary", aprovado: "default", rejeitado: "destructive",
};

export default function OnboardingProcessDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { process, tasks, documents, toggleTask, reviewDocument } = useOnboardingProcess(id);
  const { regenerateToken } = useOnboardingProcesses();
  const [reviewDoc, setReviewDoc] = useState<{ id: string; label: string } | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  if (process.isLoading || !process.data) {
    return <div className="p-6"><p className="text-muted-foreground">Carregando...</p></div>;
  }
  const p = process.data;
  const PUBLIC_BASE_URL = "https://www.rhaxis.com.br";
  const portalUrl = p.public_token ? `${PUBLIC_BASE_URL}/onboarding/portal/${p.public_token}` : null;

  const copyLink = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    toast.success("Link copiado");
  };

  const downloadDoc = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from("onboarding-docs").createSignedUrl(path, 60);
    if (error || !data) return toast.error("Erro ao baixar");
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/onboarding-processes")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{p.employee?.full_name}</h1>
          <p className="text-sm text-muted-foreground">{p.employee?.email}</p>
        </div>
        <Badge className="ml-auto">{p.status}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Portal do colaborador</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {portalUrl ? (
            <>
              <div className="flex gap-2 items-center">
                <code className="flex-1 text-xs bg-muted p-2 rounded break-all">{portalUrl}</code>
                <Button size="sm" variant="outline" onClick={copyLink}><Copy className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" onClick={() => p.id && regenerateToken.mutate(p.id)}>
                  <RefreshCw className="h-3 w-3 mr-1" />Novo link
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-x-3">
                <span>Iniciado: {p.portal_started_at ? new Date(p.portal_started_at).toLocaleString("pt-BR") : "—"}</span>
                <span>Enviado: {p.portal_submitted_at ? new Date(p.portal_submitted_at).toLocaleString("pt-BR") : "—"}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum link gerado.</p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist">
        <TabsList>
          <TabsTrigger value="checklist">Checklist ({tasks.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="documents">Documentos ({documents.data?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-2 mt-4">
          {tasks.data?.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <Checkbox
                  checked={t.status === "concluido"}
                  onCheckedChange={(v) =>
                    toggleTask.mutate({ task_id: t.id, status: v ? "concluido" : "pendente" })
                  }
                />
                <div className="flex-1">
                  <p className={t.status === "concluido" ? "line-through text-muted-foreground" : "font-medium"}>{t.title}</p>
                  <p className="text-xs text-muted-foreground">Responsável: {t.responsible_role} · Tipo: {t.task_type}</p>
                </div>
                {t.required && <Badge variant="outline" className="text-xs">Obrigatório</Badge>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="space-y-2 mt-4">
          {documents.data?.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{d.doc_label}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.file_name ?? "Sem arquivo"} {d.uploaded_at && `· enviado ${new Date(d.uploaded_at).toLocaleDateString("pt-BR")}`}
                  </p>
                  {d.review_notes && <p className="text-xs text-destructive mt-1">{d.review_notes}</p>}
                </div>
                <Badge variant={statusVariant[d.status]}>{d.status}</Badge>
                {d.file_path && (
                  <Button size="sm" variant="ghost" onClick={() => downloadDoc(d.file_path!, d.file_name ?? "doc")}>
                    <Download className="h-3 w-3" />
                  </Button>
                )}
                {d.status === "enviado" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => reviewDocument.mutate({ document_id: d.id, status: "aprovado" })}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setReviewDoc({ id: d.id, label: d.doc_label }); setReviewNotes(""); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!reviewDoc} onOpenChange={(o) => !o && setReviewDoc(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar: {reviewDoc?.label}</DialogTitle></DialogHeader>
          <Textarea placeholder="Motivo da rejeição" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDoc(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              if (!reviewDoc) return;
              reviewDocument.mutate({ document_id: reviewDoc.id, status: "rejeitado", notes: reviewNotes });
              setReviewDoc(null);
            }}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
