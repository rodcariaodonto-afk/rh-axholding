import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { type JustificativaPonto } from "@/hooks/useJustificativasPonto";

const TIPO_LABELS: Record<string, string> = {
  falta: "Falta",
  atraso: "Atraso",
  atestado: "Atestado",
  licenca_inss: "Licença INSS",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente_justificativa: { label: "Pendente de Justificativa", variant: "outline" },
  pendente_aprovacao: { label: "Pendente de Aprovação", variant: "secondary" },
  aprovada: { label: "Aprovada", variant: "default" },
  rejeitada: { label: "Rejeitada", variant: "destructive" },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  justificativa: JustificativaPonto | null;
  employeeName?: string;
}

export function JustificativaDetalhesModal({ open, onOpenChange, justificativa, employeeName }: Props) {
  if (!justificativa) return null;

  const statusCfg = STATUS_CONFIG[justificativa.status] || STATUS_CONFIG.pendente_justificativa;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes da Justificativa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Tipo</p>
              <p className="text-sm font-medium">{TIPO_LABELS[justificativa.tipo_registro] || justificativa.tipo_registro}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data do Evento</p>
              <p className="text-sm font-medium">{new Date(justificativa.data_evento + "T00:00:00").toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            {employeeName && (
              <div>
                <p className="text-xs text-muted-foreground">Colaborador</p>
                <p className="text-sm font-medium">{employeeName}</p>
              </div>
            )}
          </div>

          {justificativa.descricao_evento && (
            <div>
              <p className="text-xs text-muted-foreground">Descrição do Evento</p>
              <p className="text-sm">{justificativa.descricao_evento}</p>
            </div>
          )}

          {justificativa.motivo && (
            <div>
              <p className="text-xs text-muted-foreground">Motivo</p>
              <p className="text-sm font-medium">{justificativa.motivo}</p>
            </div>
          )}

          {justificativa.descricao_justificativa && (
            <div>
              <p className="text-xs text-muted-foreground">Descrição da Justificativa</p>
              <p className="text-sm">{justificativa.descricao_justificativa}</p>
            </div>
          )}

          {justificativa.arquivo_url && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Anexo</p>
              <Button variant="outline" size="sm" asChild>
                <a href={justificativa.arquivo_url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Comprovante
                </a>
              </Button>
            </div>
          )}

          {justificativa.status === "rejeitada" && justificativa.motivo_rejeicao && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-xs text-destructive font-medium mb-1">Motivo da Rejeição</p>
              <p className="text-sm">{justificativa.motivo_rejeicao}</p>
            </div>
          )}

          {justificativa.data_aprovacao && (
            <div>
              <p className="text-xs text-muted-foreground">Aprovado em</p>
              <p className="text-sm">{new Date(justificativa.data_aprovacao).toLocaleString("pt-BR")}</p>
            </div>
          )}

          {justificativa.data_envio && (
            <div>
              <p className="text-xs text-muted-foreground">Enviado em</p>
              <p className="text-sm">{new Date(justificativa.data_envio).toLocaleString("pt-BR")}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
