import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";

const FN_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/admission-public`;

type Doc = { id: string; doc_type: string; doc_label: string; required: boolean; status: string; file_name?: string };
type State = {
  process: { id: string; candidate_name: string; candidate_email: string; status: string };
  organization: { name: string; logo_url?: string };
  documents: Doc[];
  checklist: { id: string; title: string; description?: string; status: string }[];
  form_payload: Record<string, string>;
};

export default function AdmissaoPublica() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchState = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${FN_URL}?token=${token}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro");
      setState(json);
      setForm(json.form_payload || {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchState(); }, [fetchState]);

  const callAction = async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch(FN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action, payload }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Erro");
    return json;
  };

  const saveForm = async () => {
    try {
      await callAction("save_form", form);
      toast.success("Dados salvos");
    } catch (e) { toast.error((e as Error).message); }
  };

  const uploadDoc = async (doc: Doc, file: File) => {
    setUploading(doc.id);
    try {
      const signed = await callAction("signed_upload_url", { document_id: doc.id, file_name: file.name });
      const upRes = await fetch(signed.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!upRes.ok) throw new Error("Falha no upload");
      await callAction("submit_document", {
        document_id: doc.id, file_path: signed.path, file_name: file.name, file_size: file.size,
      });
      toast.success(`${doc.doc_label} enviado`);
      await fetchState();
    } catch (e) { toast.error((e as Error).message); } finally { setUploading(null); }
  };

  const submitForReview = async () => {
    setSubmitting(true);
    try {
      await callAction("submit_for_review");
      toast.success("Enviado para análise do RH");
      await fetchState();
    } catch (e) { toast.error((e as Error).message); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  if (error || !state) return <div className="min-h-screen flex items-center justify-center p-6"><Card><CardContent className="py-8 text-center"><p className="text-destructive font-medium">{error || "Link inválido"}</p></CardContent></Card></div>;

  const allRequiredSubmitted = state.documents.filter(d => d.required).every(d => ["submitted", "approved"].includes(d.status));

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          {state.organization.logo_url && <img src={state.organization.logo_url} alt="" className="h-12 mx-auto mb-3" />}
          <h1 className="text-2xl font-bold">Bem-vindo(a), {state.process.candidate_name}!</h1>
          <p className="text-sm text-muted-foreground mt-1">Admissão em <strong>{state.organization.name}</strong></p>
          <Badge className="mt-2">{state.process.status}</Badge>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Seus dados</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { k: "rg", label: "RG" },
              { k: "cpf", label: "CPF" },
              { k: "phone", label: "Telefone" },
              { k: "address", label: "Endereço completo" },
              { k: "emergency_contact", label: "Contato de emergência" },
              { k: "bank_info", label: "Dados bancários (banco, agência, conta)" },
            ].map((f) => (
              <div key={f.k}>
                <Label>{f.label}</Label>
                <Input value={form[f.k] || ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} />
              </div>
            ))}
            <Button onClick={saveForm} variant="outline" className="w-full">Salvar dados</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Documentos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {state.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 p-3 border rounded">
                <div className="flex-1">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <FileText className="size-4" />{doc.doc_label}
                    {doc.required && <span className="text-destructive">*</span>}
                  </p>
                  {doc.file_name && <p className="text-xs text-muted-foreground">{doc.file_name}</p>}
                </div>
                <Badge variant={doc.status === "approved" ? "default" : doc.status === "rejected" ? "destructive" : "outline"}>
                  {doc.status}
                </Badge>
                {!["approved"].includes(doc.status) && (
                  <label>
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(doc, e.target.files[0])} />
                    <Button asChild size="sm" variant="outline" disabled={uploading === doc.id}>
                      <span>{uploading === doc.id ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}</span>
                    </Button>
                  </label>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {state.process.status !== "review" && (
          <Button onClick={submitForReview} disabled={!allRequiredSubmitted || submitting} className="w-full" size="lg">
            <CheckCircle2 className="size-4 mr-2" />
            {allRequiredSubmitted ? "Enviar para análise do RH" : "Envie todos os documentos obrigatórios"}
          </Button>
        )}
      </div>
    </div>
  );
}
