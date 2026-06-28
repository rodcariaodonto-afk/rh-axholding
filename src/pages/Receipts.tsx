import { useState, useMemo } from "react";
import { useReceipts, type Receipt } from "@/hooks/useReceipts";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, PenLine, Download } from "lucide-react";

const RECEIPT_TYPE_OPTIONS: { value: Receipt["receipt_type"]; label: string }[] = [
  { value: "vale", label: "Vale" },
  { value: "adiantamento", label: "Adiantamento" },
  { value: "epi", label: "EPI" },
  { value: "uniforme", label: "Uniforme" },
  { value: "ferramenta", label: "Ferramenta" },
  { value: "treinamento", label: "Treinamento" },
  { value: "outro", label: "Outro" },
];

const typeLabel: Record<string, string> = Object.fromEntries(
  RECEIPT_TYPE_OPTIONS.map((t) => [t.value, t.label])
);

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pendente: "outline",
  aguardando_assinatura: "secondary",
  assinado: "default",
  cancelado: "destructive",
};

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  aguardando_assinatura: "Aguardando assinatura",
  assinado: "Assinado",
  cancelado: "Cancelado",
};

const EMPTY_FORM = {
  employee_id: "",
  receipt_type: "" as Receipt["receipt_type"] | "",
  description: "",
  amount: "",
  reference_competency: "",
  delivered_at: "",
};

export default function Receipts() {
  const { list, create, acknowledge } = useReceipts();
  const { data: employees = [] } = useEmployees();
  const activeEmployees = useMemo(() => employees.filter((e) => e.status === "active"), [employees]);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const canSave =
    !!form.employee_id && !!form.receipt_type && !!form.description.trim() && !create.isPending;

  function closeCreate() {
    setCreateOpen(false);
    setForm({ ...EMPTY_FORM });
  }

  function handleCreate() {
    if (!canSave) return;
    create.mutate(
      {
        employee_id: form.employee_id,
        receipt_type: form.receipt_type as Receipt["receipt_type"],
        description: form.description,
        amount: form.amount ? Number(form.amount) : null,
        reference_competency: form.reference_competency || null,
        delivered_at: form.delivered_at || null,
      },
      { onSuccess: closeCreate },
    );
  }

  function handleDownload(r: Receipt) {
    const employeeName = r.employee?.full_name ?? r.employee?.email ?? "-";
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Recibo</title>
<style>
body{font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto}
h1{font-size:20px;margin-bottom:4px}
p{color:#666;margin-bottom:16px;font-size:13px}
table{width:100%;border-collapse:collapse}
td,th{border:1px solid #ccc;padding:8px 10px;text-align:left;font-size:13px}
th{background:#f5f5f5;font-weight:600;width:38%}
.btn{margin-top:20px;padding:8px 18px;cursor:pointer}
@media print{.btn{display:none}}
</style></head>
<body>
<h1>Recibo — ${typeLabel[r.receipt_type] ?? r.receipt_type}</h1>
<p>Gerado em ${new Date().toLocaleString("pt-BR")}</p>
<table>
<tr><th>Colaborador</th><td>${employeeName}</td></tr>
<tr><th>Tipo</th><td>${typeLabel[r.receipt_type] ?? r.receipt_type}</td></tr>
<tr><th>Descrição</th><td>${r.description}</td></tr>
<tr><th>Valor</th><td>${r.amount ? `R$ ${Number(r.amount).toFixed(2)}` : "—"}</td></tr>
<tr><th>Competência</th><td>${r.reference_competency ?? "—"}</td></tr>
<tr><th>Data de entrega</th><td>${r.delivered_at ? new Date(r.delivered_at).toLocaleDateString("pt-BR") : "—"}</td></tr>
<tr><th>Status</th><td>${statusLabel[r.status] ?? r.status}</td></tr>
<tr><th>Assinado em</th><td>${r.acknowledged_at ? new Date(r.acknowledged_at).toLocaleString("pt-BR") : "—"}</td></tr>
</table>
<button class="btn" onclick="window.print()">Imprimir / Salvar PDF</button>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Recibos</h1>
          <p className="text-muted-foreground">Vale, EPI, uniforme, ferramentas e demais recibos com ciência</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Novo Recibo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recibos ({list.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : !list.data?.length ? (
            <p className="text-muted-foreground text-sm">Nenhum recibo registrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employee?.full_name ?? "-"}</TableCell>
                    <TableCell>{typeLabel[r.receipt_type]}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={r.description}>{r.description}</TableCell>
                    <TableCell className="text-right">{r.amount ? `R$ ${Number(r.amount).toFixed(2)}` : "-"}</TableCell>
                    <TableCell>{r.delivered_at ? new Date(r.delivered_at).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[r.status]}>
                        {statusLabel[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(r.status === "pendente" || r.status === "aguardando_assinatura") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            title="Assinar recibo"
                            disabled={acknowledge.isPending}
                            onClick={() => acknowledge.mutate(r.id)}
                          >
                            <PenLine className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Baixar PDF"
                          onClick={() => handleDownload(r)}
                        >
                          <Download className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) closeCreate(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Recibo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1">
              <Label>Funcionário *</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm((f) => ({ ...f, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Tipo de recibo *</Label>
              <Select
                value={form.receipt_type}
                onValueChange={(v) => setForm((f) => ({ ...f, receipt_type: v as Receipt["receipt_type"] }))}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {RECEIPT_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Descrição *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descreva o recibo..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1">
                <Label>Competência</Label>
                <Input
                  type="month"
                  value={form.reference_competency}
                  onChange={(e) => setForm((f) => ({ ...f, reference_competency: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Data de entrega</Label>
              <Input
                type="date"
                value={form.delivered_at}
                onChange={(e) => setForm((f) => ({ ...f, delivered_at: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCreate}>Cancelar</Button>
            <Button disabled={!canSave} onClick={handleCreate}>
              {create.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
