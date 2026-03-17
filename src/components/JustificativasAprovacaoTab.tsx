import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Eye, AlertTriangle } from "lucide-react";
import { useJustificativasPonto, type JustificativaPonto } from "@/hooks/useJustificativasPonto";
import { useEmployees } from "@/hooks/useEmployees";
import { JustificativaDetalhesModal } from "@/components/JustificativaDetalhesModal";

const TIPO_LABELS: Record<string, string> = {
  falta: "Falta",
  atraso: "Atraso",
  atestado: "Atestado",
  licenca_inss: "Licença INSS",
};

export function JustificativasAprovacaoTab() {
  const { justificativas, isLoading, approve, reject, isApproving, isRejecting } = useJustificativasPonto();
  const { data: employees = [] } = useEmployees();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [selected, setSelected] = useState<JustificativaPonto | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  const pendentes = useMemo(
    () => justificativas.filter((j) => j.status === "pendente_aprovacao"),
    [justificativas]
  );

  const getEmployeeName = (id: string) =>
    (employees as any[]).find((e) => e.id === id)?.full_name || "—";

  const diasPendente = (dataEnvio: string | null) => {
    if (!dataEnvio) return 0;
    return Math.floor((Date.now() - new Date(dataEnvio).getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleReject = () => {
    if (!selected || !motivoRejeicao) return;
    reject({ id: selected.id, motivo_rejeicao: motivoRejeicao });
    setRejectModalOpen(false);
    setMotivoRejeicao("");
    setSelected(null);
  };

  if (isLoading) return null;

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead>Dias Pendente</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendentes.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{getEmployeeName(j.employee_id)}</TableCell>
                  <TableCell>{new Date(j.data_evento + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{TIPO_LABELS[j.tipo_registro] || j.tipo_registro}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-sm">{j.motivo || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {j.data_envio ? new Date(j.data_envio).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={diasPendente(j.data_envio) > 3 ? "destructive" : "secondary"}>
                      {diasPendente(j.data_envio)}d
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700"
                        onClick={() => approve(j.id)}
                        disabled={isApproving}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => { setSelected(j); setRejectModalOpen(true); }}
                        disabled={isRejecting}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setSelected(j); setDetalhesOpen(true); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pendentes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <AlertTriangle className="size-10 mx-auto mb-2 opacity-30" />
                    Nenhuma justificativa pendente de aprovação.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de rejeição */}
      <Dialog open={rejectModalOpen} onOpenChange={(o) => { if (!o) { setRejectModalOpen(false); setMotivoRejeicao(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar Justificativa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Informe o motivo da rejeição. O colaborador poderá enviar uma nova justificativa.
            </p>
            <Textarea
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              placeholder="Motivo da rejeição..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!motivoRejeicao || isRejecting}>
              {isRejecting ? "Rejeitando..." : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <JustificativaDetalhesModal
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        justificativa={selected}
        employeeName={selected ? getEmployeeName(selected.employee_id) : undefined}
      />
    </>
  );
}
