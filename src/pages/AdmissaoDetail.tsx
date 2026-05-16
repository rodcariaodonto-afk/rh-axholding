import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAdmission, useAdmissionAction } from "@/hooks/useAdmissions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Copy, RefreshCw, CheckCircle2, XCircle, Ban, FileText, ListChecks, User2, History,
} from "lucide-react";
import { toast } from "sonner";

const docStatusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  submitted: "secondary",
  approved: "default",
  rejected: "destructive",
};

export default function AdmissaoDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useAdmission(id);
  const action = useAdmissionAction();
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  if (isLoading || !data) {
    return <div className="space-y-3"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full" /></div>;
  }

  const { process, checklist, documents, form, events } = data;
  const inviteUrl = process.invite_token ? `${window.location.origin}/admissoes-publica/${process.invite_token}` : null;

  const copyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Link copiado");
  };

  const doAction = async (payload: Record<string, unknown>, successMsg: string) => {
    try {
      await action.mutateAsync({ process_id: id, ...payload });
      toast.success(successMsg);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const reviewDoc = async (status: "approved" | "rejected") => {
    if (!reviewing) return;
    await doAction(
      { action: "review_document", document_id: reviewing, status, review_notes: reviewNotes },
      status === "approved" ? "Documento aprovado" : "Documento rejeitado",
    );
    setReviewing(null);
    setReviewNotes("");
  };

  const downloadDoc = async (docPath: string, docName: string) => {
    const { data: signed } = await supabase.storage.from("admission-uploads").createSignedUrl(docPath, 60);
    if (signed?.signedUrl) {
      const a = document.createElement("a");
      a.href = signed.signedUrl;
      a.download = docName;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/admissoes"><ArrowLeft className="size-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{process.candidate_name}</h1>
          <p className="text-sm text-muted-foreground">{process.candidate_email}</p>
        </div>
        <Badge>{process.status}</Badge>
      </div>

      {inviteUrl && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Link de convite</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted p-2 rounded truncate">{inviteUrl}</code>
            <Button size="sm" variant="outline" onClick={copyInvite}><Copy className="size-3 mr-1" />Copiar</Button>
            <Button size="sm" variant="outline" onClick={() => doAction({ action: "resend_invite" }, "Convite renovado")}>
              <RefreshCw className="size-3 mr-1" />Renovar
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="checklist">
        <TabsList>
          <TabsTrigger value="checklist"><ListChecks className="size-4 mr-1" />Checklist</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="size-4 mr-1" />Documentos</TabsTrigger>
          <TabsTrigger value="form"><User2 className="size-4 mr-1" />Dados</TabsTrigger>
          <TabsTrigger value="events"><History className="size-4 mr-1" />Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-2">
          {checklist.length === 0 ? <p className="text-sm text-muted-foreground p-4">Sem itens.</p> : checklist.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === "done" ? "default" : "outline"}>{item.status}</Badge>
                  {item.status !== "done" && (
                    <Button size="sm" variant="outline" onClick={() => doAction({ action: "update_checklist", item_id: item.id, status: "done" }, "Item concluído")}>
                      <CheckCircle2 className="size-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="space-y-2">
          {documents.length === 0 ? <p className="text-sm text-muted-foreground p-4">Sem documentos.</p> : documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between py-3 gap-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{doc.doc_label} {doc.required && <span className="text-destructive">*</span>}</p>
                  <p className="text-xs text-muted-foreground">{doc.file_name || "Aguardando envio"}</p>
                </div>
                <Badge variant={docStatusVariant[doc.status] || "outline"}>{doc.status}</Badge>
                {doc.file_path && (
                  <Button size="sm" variant="outline" onClick={() => downloadDoc(doc.file_path as string, doc.file_name || "doc")}>Baixar</Button>
                )}
                {doc.status === "submitted" && (
                  <Dialog open={reviewing === doc.id} onOpenChange={(o) => !o && setReviewing(null)}>
                    <DialogTrigger asChild><Button size="sm" onClick={() => setReviewing(doc.id)}>Revisar</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Revisar documento</DialogTitle></DialogHeader>
                      <Textarea placeholder="Observações (opcional)" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} />
                      <DialogFooter>
                        <Button variant="destructive" onClick={() => reviewDoc("rejected")}><XCircle className="size-4 mr-1" />Rejeitar</Button>
                        <Button onClick={() => reviewDoc("approved")}><CheckCircle2 className="size-4 mr-1" />Aprovar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="form">
          <Card><CardContent className="py-4">
            {form?.payload ? (
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">{JSON.stringify(form.payload, null, 2)}</pre>
            ) : <p className="text-sm text-muted-foreground">Candidato ainda não preencheu o formulário.</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-2">
          {events.length === 0 ? <p className="text-sm text-muted-foreground p-4">Nenhum evento.</p> : events.map((ev) => (
            <Card key={ev.id}><CardContent className="py-2 text-sm flex justify-between">
              <span><strong>{ev.event_type}</strong> — {ev.description || "—"}</span>
              <span className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString("pt-BR")}</span>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        {!["completed", "cancelled"].includes(process.status) && (
          <>
            <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <DialogTrigger asChild><Button variant="outline"><Ban className="size-4 mr-1" />Cancelar processo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cancelar admissão</DialogTitle></DialogHeader>
                <Textarea placeholder="Motivo" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setCancelOpen(false)}>Voltar</Button>
                  <Button variant="destructive" onClick={async () => {
                    await doAction({ action: "cancel", reason: cancelReason }, "Processo cancelado");
                    setCancelOpen(false);
                  }}>Confirmar cancelamento</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={() => doAction({ action: "complete" }, "Admissão concluída e colaborador criado")}>
              <CheckCircle2 className="size-4 mr-1" />Concluir admissão
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
