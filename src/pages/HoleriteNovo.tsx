import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePayrollBatchAction } from "@/hooks/usePayrollBatches";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const RECEIPT_TYPES = [
  { value: "holerite", label: "Holerite mensal" },
  { value: "decimo_terceiro", label: "13º salário" },
  { value: "ferias", label: "Férias" },
  { value: "rescisao", label: "Rescisão" },
  { value: "recibo", label: "Outro recibo" },
];

export default function HoleriteNovo() {
  const nav = useNavigate();
  const action = usePayrollBatchAction();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ competency: "", receipt_type: "holerite", description: "" });
  const [batchId, setBatchId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const createBatch = async () => {
    if (!form.competency || !form.receipt_type) { toast.error("Competência e tipo são obrigatórios"); return; }
    try {
      const res = await action.mutateAsync({ action: "create", ...form });
      setBatchId(res.batch.id);
      setStep(2);
    } catch (e) { toast.error((e as Error).message); }
  };

  const uploadAll = async () => {
    if (!batchId || files.length === 0) return;
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    const uploaded: { file_path: string; file_name: string; file_size: number }[] = [];
    try {
      for (const file of files) {
        const { data: signed, error } = await supabase.functions.invoke("payroll-batch", {
          body: { action: "signed_upload_url", batch_id: batchId, file_name: file.name },
        });
        if (error || signed?.error) throw new Error(error?.message || signed.error);
        const upRes = await fetch(signed.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/pdf" },
          body: file,
        });
        if (!upRes.ok) throw new Error(`Falha em ${file.name}`);
        uploaded.push({ file_path: signed.path, file_name: file.name, file_size: file.size });
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
      const result = await action.mutateAsync({ action: "add_files", batch_id: batchId, files: uploaded });
      toast.success(`${result.matched} match / ${result.unmatched} pendente(s)`);
      nav(`/holerites/${batchId}`);
    } catch (e) { toast.error((e as Error).message); } finally { setUploading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/holerites"><ArrowLeft className="size-4" /></Link></Button>
        <h1 className="text-xl font-bold">Novo lote de holerites</h1>
      </div>

      <div className="flex gap-2 text-sm">
        <span className={step >= 1 ? "font-medium" : "text-muted-foreground"}>1. Identificação</span>
        <span className="text-muted-foreground">→</span>
        <span className={step >= 2 ? "font-medium" : "text-muted-foreground"}>2. Upload</span>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Identificação do lote</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Competência *</Label>
              <Input placeholder="2026-05" value={form.competency} onChange={(e) => setForm({ ...form, competency: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Formato AAAA-MM</p>
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.receipt_type} onValueChange={(v) => setForm({ ...form, receipt_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RECEIPT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button onClick={createBatch} disabled={action.isPending} className="w-full">
              {action.isPending ? <Loader2 className="size-4 animate-spin" /> : "Criar e continuar"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload de arquivos</CardTitle>
            <p className="text-xs text-muted-foreground">
              O sistema extrai o CPF do nome do arquivo para vincular ao colaborador.
              Use formato como <code>nome_12345678900.pdf</code>.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition">
              <Upload className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Selecione arquivos PDF</p>
              <p className="text-xs text-muted-foreground">Múltiplos arquivos suportados</p>
              <input type="file" multiple accept="application/pdf" className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            </label>

            {files.length > 0 && (
              <div className="space-y-1 max-h-60 overflow-auto border rounded p-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm py-1">
                    <FileText className="size-3 text-muted-foreground" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <Progress value={(progress.done / progress.total) * 100} />
                <p className="text-xs text-muted-foreground text-center">{progress.done} de {progress.total} enviados</p>
              </div>
            )}

            <Button onClick={uploadAll} disabled={files.length === 0 || uploading} className="w-full" size="lg">
              {uploading ? <><Loader2 className="size-4 animate-spin mr-2" />Enviando…</> : `Enviar ${files.length} arquivo(s)`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
