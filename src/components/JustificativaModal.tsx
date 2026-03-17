import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, X } from "lucide-react";
import { type JustificativaPonto } from "@/hooks/useJustificativasPonto";

const MOTIVOS_POR_TIPO: Record<string, string[]> = {
  falta: ["Problema de saúde", "Emergência familiar", "Problema de transporte", "Compromisso pessoal", "Outro"],
  atraso: ["Trânsito", "Problema de transporte público", "Consulta médica", "Problema pessoal", "Outro"],
  atestado: ["Consulta médica", "Exame", "Cirurgia", "Acompanhamento familiar", "Outro"],
  licenca_inss: ["Doença", "Acidente de trabalho", "Maternidade", "Outro"],
};

const TIPO_LABELS: Record<string, string> = {
  falta: "Falta",
  atraso: "Atraso",
  atestado: "Atestado",
  licenca_inss: "Licença INSS",
};

interface JustificativaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  justificativa: JustificativaPonto | null;
  onSubmit: (data: {
    id: string;
    motivo: string;
    descricao_justificativa: string;
    arquivo_url?: string | null;
    tipo_documento?: string;
  }) => void;
  onUploadFile?: (file: File, justificativaId: string) => Promise<string | null>;
  isSubmitting?: boolean;
}

export function JustificativaModal({
  open,
  onOpenChange,
  justificativa,
  onSubmit,
  onUploadFile,
  isSubmitting,
}: JustificativaModalProps) {
  const [motivo, setMotivo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!justificativa || !motivo || descricao.length < 10) return;

    let arquivo_url: string | null = null;
    if (file && onUploadFile) {
      setUploading(true);
      arquivo_url = await onUploadFile(file, justificativa.id);
      setUploading(false);
    }

    onSubmit({
      id: justificativa.id,
      motivo,
      descricao_justificativa: descricao,
      arquivo_url,
      tipo_documento: file?.type,
    });

    setMotivo("");
    setDescricao("");
    setFile(null);
  };

  const motivos = justificativa ? MOTIVOS_POR_TIPO[justificativa.tipo_registro] || MOTIVOS_POR_TIPO.falta : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert("Arquivo deve ter no máximo 5MB");
      return;
    }
    setFile(f);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Justificar {TIPO_LABELS[justificativa?.tipo_registro || ""] || "Evento"} —{" "}
            {justificativa?.data_evento
              ? new Date(justificativa.data_evento + "T00:00:00").toLocaleDateString("pt-BR")
              : ""}
          </DialogTitle>
        </DialogHeader>

        {justificativa && (
          <div className="space-y-4">
            {/* Info do evento */}
            <div className="rounded-md border p-3 space-y-1 bg-muted/50">
              <p className="text-sm"><span className="font-medium">Tipo:</span> {TIPO_LABELS[justificativa.tipo_registro]}</p>
              <p className="text-sm"><span className="font-medium">Data:</span> {new Date(justificativa.data_evento + "T00:00:00").toLocaleDateString("pt-BR")}</p>
              {justificativa.horario_evento && (
                <p className="text-sm"><span className="font-medium">Horário:</span> {justificativa.horario_evento}</p>
              )}
              {justificativa.descricao_evento && (
                <p className="text-sm"><span className="font-medium">Descrição:</span> {justificativa.descricao_evento}</p>
              )}
            </div>

            {/* Motivo */}
            <div>
              <Label>Motivo *</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                <SelectContent>
                  {motivos.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div>
              <Label>Descrição detalhada * (mín. 10 caracteres)</Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Descreva os detalhes da justificativa..."
              />
              <p className="text-xs text-muted-foreground mt-1">{descricao.length}/500</p>
            </div>

            {/* Anexo */}
            <div>
              <Label>Anexo (opcional, máx 5MB)</Label>
              <div className="mt-1">
                {file ? (
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <Badge variant="secondary">{file.name}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFile(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar arquivo
                  </Button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || uploading || !motivo || descricao.length < 10}
          >
            {uploading ? "Enviando arquivo..." : isSubmitting ? "Enviando..." : "Enviar Justificativa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
