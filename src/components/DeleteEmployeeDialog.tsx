import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

interface DeleteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  onConfirm: (params: {
    confirmationName: string;
    reason: "lgpd_request" | "cadastro_erro" | "other";
    reasonDetails?: string;
  }) => void;
  isDeleting: boolean;
}

const DELETION_REASONS = [
  { value: "lgpd_request", label: "Solicitação LGPD do titular" },
  { value: "cadastro_erro", label: "Erro de cadastro" },
  { value: "other", label: "Outro motivo" },
] as const;

export function DeleteEmployeeDialog({
  open,
  onOpenChange,
  employeeName,
  onConfirm,
  isDeleting,
}: DeleteEmployeeDialogProps) {
  const [confirmationName, setConfirmationName] = useState("");
  const [reason, setReason] = useState<"lgpd_request" | "cadastro_erro" | "other" | "">("");
  const [reasonDetails, setReasonDetails] = useState("");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setConfirmationName("");
      setReason("");
      setReasonDetails("");
    }
  }, [open]);

  const isNameMatch = confirmationName.toLowerCase().trim() === employeeName.toLowerCase().trim();
  const canConfirm = isNameMatch && reason !== "";

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      confirmationName,
      reason: reason as "lgpd_request" | "cadastro_erro" | "other",
      reasonDetails: reasonDetails || undefined,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Excluir permanentemente</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p className="font-semibold text-destructive">
              ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL
            </p>
            <p>
              Todos os dados de <strong>{employeeName}</strong> serão excluídos permanentemente:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>PDIs e histórico de desenvolvimento</li>
              <li>Feedbacks enviados e recebidos</li>
              <li>Solicitações de férias</li>
              <li>Contratos e documentos</li>
              <li>Conta de acesso</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da exclusão *</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as typeof reason)}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {DELETION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="reasonDetails">Detalhes do motivo</Label>
              <Textarea
                id="reasonDetails"
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                placeholder="Descreva o motivo da exclusão..."
                rows={2}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmName">
              Para confirmar, digite o nome completo: <strong>{employeeName}</strong>
            </Label>
            <Input
              id="confirmName"
              value={confirmationName}
              onChange={(e) => setConfirmationName(e.target.value)}
              placeholder="Digite o nome completo"
              className={confirmationName && !isNameMatch ? "border-destructive" : ""}
            />
            {confirmationName && !isNameMatch && (
              <p className="text-xs text-destructive">O nome não confere</p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={!canConfirm || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
