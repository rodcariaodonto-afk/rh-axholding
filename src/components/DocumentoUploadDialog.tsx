import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useUploadDocumento } from "@/hooks/useDocumentosCentral";

export const CATEGORIAS_DOCUMENTO = [
  { value: "admissao", label: "Admissão" },
  { value: "demissao", label: "Demissão" },
  { value: "contrato", label: "Contrato" },
  { value: "aso_saude", label: "ASO / Saúde" },
  { value: "treinamento", label: "Treinamento" },
  { value: "fiscal", label: "Fiscal" },
  { value: "outros", label: "Outros" },
];

interface DocumentoUploadDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DocumentoUploadDialog({ open, onClose }: DocumentoUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: employees = [] } = useEmployees();
  const { mutateAsync: upload, isPending } = useUploadDocumento();

  const activeEmployees = employees.filter((e) => e.status === "active");

  const [employeeId, setEmployeeId] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [category, setCategory] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [file, setFile] = useState<File | null>(null);

  function reset() {
    setEmployeeId("");
    setDocumentName("");
    setCategory("");
    setExpiresAt("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !documentName) setDocumentName(f.name.replace(/\.[^.]+$/, ""));
  }

  async function handleSave() {
    if (!employeeId || !documentName.trim() || !category || !file) return;

    await upload({
      employee_id: employeeId,
      document_name: documentName.trim(),
      category,
      expires_at: expiresAt || null,
      file,
    });

    handleClose();
  }

  const canSave = !!employeeId && !!documentName.trim() && !!category && !!file && !isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload de Documento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Funcionário <span className="text-destructive">*</span></Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar funcionário..." />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name || emp.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="document-name">Nome do documento <span className="text-destructive">*</span></Label>
            <Input
              id="document-name"
              placeholder="Ex: Contrato de Trabalho"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Categoria <span className="text-destructive">*</span></Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar categoria..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_DOCUMENTO.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expires-at">Data de validade <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              id="expires-at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Arquivo <span className="text-destructive">*</span></Label>
            <div
              className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="text-sm">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <Upload className="size-8 mx-auto mb-1 opacity-50" />
                  <p className="text-sm">Clique para selecionar arquivo</p>
                  <p className="text-xs mt-0.5">PDF, JPG, PNG, DOC — até 10 MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isPending ? "Enviando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
