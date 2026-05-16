import { useParams, useNavigate, Link } from "react-router-dom";
import { useTerminationProcess, useTerminationAction } from "@/hooks/useTerminationProcess";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const STATUS_ORDER = [
  "iniciado", "aviso_previo", "exames", "calculos",
  "documentos", "assinatura", "homologacao", "pagamento", "concluido",
];

const statusLabel: Record<string, string> = {
  iniciado: "Iniciado",
  aviso_previo: "Aviso prévio",
  exames: "Exames",
  calculos: "Cálculos",
  documentos: "Documentos",
  assinatura: "Assinatura",
  homologacao: "Homologação",
  pagamento: "Pagamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default function TerminationProcessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useTerminationProcess(id);
  const action = useTerminationAction();
  const [details, setDetails] = useState<any>({});

  useEffect(() => {
    if (data?.details) setDetails(data.details);
  }, [data?.details]);

  if (isLoading || !data) {
    return <Layout><Skeleton className="h-96 w-full" /></Layout>;
  }

  const { process, checklist, events } = data;
  const requiredPending = checklist.filter((i) => i.required && i.status !== "done").length;
  const isFinal = process.status === "concluido" || process.status === "cancelado";

  const handleSaveDetails = async () => {
    try {
      const numericFields = [
        "notice_days", "pending_vacation_days", "proportional_vacation_days", "proportional_13th_months",
        "fgts_balance", "fgts_penalty_pct", "fgts_penalty_amount", "vacation_amount",
        "thirteenth_amount", "notice_amount", "other_credits", "other_debits", "total_amount",
      ];
      const payload: any = { ...details };
      for (const k of numericFields) if (payload[k] !== undefined && payload[k] !== "") payload[k] = Number(payload[k]);
      await action.mutateAsync({ action: "save_details", process_id: id, details: payload });
      toast.success("Detalhes salvos");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleComplete = async () => {
    try {
      await action.mutateAsync({ action: "complete", process_id: id });
      toast.success("Rescisão concluída");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCancel = async () => {
    const reason = prompt("Motivo do cancelamento:");
    if (!reason) return;
    try {
      await action.mutateAsync({ action: "cancel", process_id: id, reason });
      toast.success("Processo cancelado");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/terminations")}>
              <ArrowLeft className="size-4 mr-2" />Voltar
            </Button>
            <h1 className="text-3xl font-bold mt-2">Processo de Rescisão</h1>
            <p className="text-muted-foreground">
              {process.employee?.full_name ?? "-"} ·{" "}
              <Badge variant="outline">{statusLabel[process.status]}</Badge>
            </p>
          </div>
          {!isFinal && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>Cancelar processo</Button>
              <Button onClick={handleComplete} disabled={requiredPending > 0}>
                Concluir rescisão
              </Button>
            </div>
          )}
        </div>

        {/* Status stepper */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {STATUS_ORDER.map((s) => {
                const currentIdx = STATUS_ORDER.indexOf(process.status);
                const idx = STATUS_ORDER.indexOf(s);
                const done = idx < currentIdx || process.status === "concluido";
                const active = s === process.status;
                return (
                  <button
                    key={s}
                    disabled={isFinal}
                    onClick={() => action.mutate({ action: "advance_status", process_id: id, status: s })}
                    className={`px-3 py-1.5 text-xs rounded-md border ${active ? "bg-primary text-primary-foreground" : done ? "bg-muted" : "bg-background"}`}
                  >
                    {statusLabel[s]}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="checklist">
          <TabsList>
            <TabsTrigger value="checklist">Checklist ({checklist.length})</TabsTrigger>
            <TabsTrigger value="calculos">Cálculos</TabsTrigger>
            <TabsTrigger value="eventos">Eventos ({events.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist">
            <Card>
              <CardHeader>
                <CardTitle>Checklist de rescisão</CardTitle>
                {requiredPending > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {requiredPending} item(ns) obrigatório(s) pendente(s)
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 border rounded-md">
                    <Checkbox
                      checked={item.status === "done"}
                      disabled={isFinal}
                      onCheckedChange={(c) => action.mutate({
                        action: "update_checklist_item", process_id: id, item_id: item.id,
                        status: c ? "done" : "pending",
                      })}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {item.title}
                        {item.required && <span className="text-destructive ml-1">*</span>}
                      </p>
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      {item.done_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Concluído em {format(new Date(item.done_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    {item.status === "done" ? <CheckCircle2 className="size-4 text-primary" /> : <XCircle className="size-4 text-muted-foreground" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculos">
            <Card>
              <CardHeader><CardTitle>Cálculos rescisórios</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Tipo de aviso</Label>
                    <Select value={details.notice_type ?? ""} onValueChange={(v) => setDetails({ ...details, notice_type: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="worked">Trabalhado</SelectItem>
                        <SelectItem value="indemnified">Indenizado</SelectItem>
                        <SelectItem value="waived">Dispensado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <FieldNum label="Dias de aviso" value={details.notice_days} onChange={(v) => setDetails({ ...details, notice_days: v })} />
                  <FieldNum label="Férias vencidas (dias)" value={details.pending_vacation_days} onChange={(v) => setDetails({ ...details, pending_vacation_days: v })} />
                  <FieldNum label="Férias prop. (dias)" value={details.proportional_vacation_days} onChange={(v) => setDetails({ ...details, proportional_vacation_days: v })} />
                  <FieldNum label="13º proporcional (meses)" value={details.proportional_13th_months} onChange={(v) => setDetails({ ...details, proportional_13th_months: v })} />
                  <FieldNum label="Saldo FGTS (R$)" value={details.fgts_balance} onChange={(v) => setDetails({ ...details, fgts_balance: v })} />
                  <FieldNum label="Multa FGTS (%)" value={details.fgts_penalty_pct} onChange={(v) => setDetails({ ...details, fgts_penalty_pct: v })} />
                  <FieldNum label="Multa FGTS (R$)" value={details.fgts_penalty_amount} onChange={(v) => setDetails({ ...details, fgts_penalty_amount: v })} />
                  <FieldNum label="Valor de férias (R$)" value={details.vacation_amount} onChange={(v) => setDetails({ ...details, vacation_amount: v })} />
                  <FieldNum label="Valor de 13º (R$)" value={details.thirteenth_amount} onChange={(v) => setDetails({ ...details, thirteenth_amount: v })} />
                  <FieldNum label="Valor do aviso (R$)" value={details.notice_amount} onChange={(v) => setDetails({ ...details, notice_amount: v })} />
                  <FieldNum label="Outros créditos (R$)" value={details.other_credits} onChange={(v) => setDetails({ ...details, other_credits: v })} />
                  <FieldNum label="Outros débitos (R$)" value={details.other_debits} onChange={(v) => setDetails({ ...details, other_debits: v })} />
                  <FieldNum label="Total líquido (R$)" value={details.total_amount} onChange={(v) => setDetails({ ...details, total_amount: v })} />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={details.notes ?? ""} onChange={(e) => setDetails({ ...details, notes: e.target.value })} />
                </div>
                <Button onClick={handleSaveDetails} disabled={isFinal}>Salvar cálculos</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eventos">
            <Card>
              <CardHeader><CardTitle>Linha do tempo</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum evento.</p>
                ) : events.map((e) => (
                  <div key={e.id} className="flex gap-3 text-sm border-l-2 pl-3 py-1">
                    <span className="text-muted-foreground">{format(new Date(e.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                    <span className="font-medium">{e.event_type}</span>
                    {e.metadata && Object.keys(e.metadata).length > 0 && (
                      <code className="text-xs text-muted-foreground">{JSON.stringify(e.metadata)}</code>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function FieldNum({ label, value, onChange }: { label: string; value: any; onChange: (v: any) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" step="0.01" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
