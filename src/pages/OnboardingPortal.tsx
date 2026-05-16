import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type PortalData = {
  process: any;
  employee: { full_name: string; email: string };
  organization: { name: string; logo_url: string | null };
  tasks: any[];
  documents: any[];
};

async function callPortal(action: string, token: string, payload?: any) {
  const { data, error } = await supabase.functions.invoke("onboarding-portal", {
    body: { action, token, payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function OnboardingPortal() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await callPortal("get", token);
      setData(res);
    } catch (e: any) {
      setError(e.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const handleUpload = async (docId: string, file: File) => {
    if (!token) return;
    setUploading(docId);
    try {
      const base64 = await fileToBase64(file);
      await callPortal("upload_document", token, {
        document_id: docId,
        file_base64: base64,
        file_name: file.name,
        content_type: file.type,
      });
      toast.success("Documento enviado");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await callPortal("submit", token);
      toast.success("Onboarding enviado para análise do RH");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium">{error ?? "Link inválido"}</p>
            <p className="text-sm text-muted-foreground mt-2">Entre em contato com o RH para receber um novo link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const submitted = !!data.process.portal_submitted_at;
  const requiredDocsPending = data.documents.filter((d) => d.required && d.status === "pendente");
  const canSubmit = requiredDocsPending.length === 0 && !submitted;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b">
        <div className="max-w-4xl mx-auto p-6 flex items-center gap-4">
          {data.organization.logo_url && <img src={data.organization.logo_url} alt="" className="h-10" />}
          <div>
            <h1 className="text-xl font-bold">Onboarding · {data.organization.name}</h1>
            <p className="text-sm text-muted-foreground">Bem-vindo(a), {data.employee.full_name}!</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {submitted && (
          <Card className="border-primary">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p className="text-sm">Suas informações foram enviadas para o RH. Em breve entraremos em contato.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Documentos obrigatórios</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.documents.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 border rounded">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{d.doc_label} {d.required && <span className="text-destructive">*</span>}</p>
                  {d.file_name && <p className="text-xs text-muted-foreground">{d.file_name}</p>}
                </div>
                <Badge variant={d.status === "aprovado" ? "default" : d.status === "rejeitado" ? "destructive" : "secondary"}>
                  {d.status}
                </Badge>
                {!submitted && d.status !== "aprovado" && (
                  <div>
                    <input
                      type="file"
                      id={`f-${d.id}`}
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleUpload(d.id, e.target.files[0])}
                      accept="image/*,application/pdf"
                    />
                    <Label htmlFor={`f-${d.id}`}>
                      <Button size="sm" variant="outline" asChild disabled={uploading === d.id}>
                        <span>{uploading === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                          {d.status === "pendente" ? "Enviar" : "Reenviar"}</span>
                      </Button>
                    </Label>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Próximos passos do seu onboarding</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <div className={`h-2 w-2 rounded-full ${t.status === "concluido" ? "bg-primary" : "bg-muted-foreground/30"}`} />
                <span className={t.status === "concluido" ? "line-through text-muted-foreground" : ""}>{t.title}</span>
                <Badge variant="outline" className="ml-auto text-xs">{t.responsible_role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {!submitted && (
          <Card>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {canSubmit ? "Tudo pronto! Você pode enviar para análise do RH." :
                  `Faltam ${requiredDocsPending.length} documento(s) obrigatório(s).`}
              </p>
              <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enviar para o RH
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
