import { useState, useMemo } from "react";
import { useEpiCatalog, useEpiDeliveries } from "@/hooks/useEpi";
import { useEmployees } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RotateCcw, PenLine } from "lucide-react";
import { format } from "date-fns";

const STATUS: Record<string, { label: string; variant: any }> = {
  entregue: { label: "Entregue", variant: "secondary" },
  aguardando_assinatura: { label: "Aguardando assinatura", variant: "outline" },
  assinado: { label: "Assinado", variant: "default" },
  devolvido: { label: "Devolvido", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export default function EpiDeliveries() {
  const { list: catalog } = useEpiCatalog();
  const { list, deliver, sign, returnEpi } = useEpiDeliveries();
  const { data: employees } = useEmployees();
  const [openNew, setOpenNew] = useState(false);
  const [returnFor, setReturnFor] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => (list.data ?? []).filter(d =>
    !filter ||
    d.employee?.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
    d.epi?.name?.toLowerCase().includes(filter.toLowerCase())
  ), [list.data, filter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">EPIs — Entregas</h1>
          <p className="text-muted-foreground">Ficha de entrega, assinatura e devolução</p>
        </div>
        <Button onClick={() => setOpenNew(true)}><Plus className="h-4 w-4 mr-2" /> Nova entrega</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entregas</CardTitle>
          <Input placeholder="Filtrar por colaborador ou EPI..." value={filter} onChange={e => setFilter(e.target.value)} className="max-w-sm mt-2" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Data</TableHead><TableHead>Colaborador</TableHead><TableHead>EPI</TableHead>
              <TableHead>CA</TableHead><TableHead className="text-right">Qtd</TableHead>
              <TableHead>Status</TableHead><TableHead>Devolução prev.</TableHead><TableHead>Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{format(new Date(d.delivered_at), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{d.employee?.full_name ?? "—"}</TableCell>
                  <TableCell>{d.epi?.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{d.ca_at_delivery ?? "—"}</TableCell>
                  <TableCell className="text-right">{d.quantity}</TableCell>
                  <TableCell><Badge variant={STATUS[d.status]?.variant}>{STATUS[d.status]?.label}</Badge></TableCell>
                  <TableCell>{d.expected_return_at ? format(new Date(d.expected_return_at), "dd/MM/yyyy") : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {d.status === "aguardando_assinatura" && (
                        <Button size="sm" variant="outline" onClick={() => sign.mutate(d.id)}><PenLine className="h-4 w-4 mr-1" /> Assinar</Button>
                      )}
                      {d.status !== "devolvido" && d.status !== "cancelado" && (
                        <Button size="sm" variant="ghost" onClick={() => setReturnFor(d.id)}><RotateCcw className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma entrega</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Nova entrega */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova entrega de EPI</DialogTitle></DialogHeader>
          <NewDeliveryForm
            catalog={catalog.data ?? []}
            employees={employees ?? []}
            onSubmit={async (i) => { await deliver.mutateAsync(i); setOpenNew(false); }}
          />
        </DialogContent>
      </Dialog>

      {/* Devolução */}
      <Dialog open={!!returnFor} onOpenChange={(o) => !o && setReturnFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar devolução</DialogTitle></DialogHeader>
          <ReturnForm onSubmit={async (qty, cond) => {
            await returnEpi.mutateAsync({ delivery_id: returnFor!, returned_qty: qty, return_condition: cond });
            setReturnFor(null);
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewDeliveryForm({ catalog, employees, onSubmit }: any) {
  const [epiId, setEpiId] = useState("");
  const [empId, setEmpId] = useState("");
  const [qty, setQty] = useState(1);
  const [expected, setExpected] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <div className="space-y-3">
      <div>
        <Label>EPI *</Label>
        <Select value={epiId} onValueChange={setEpiId}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {catalog.filter((c: any) => c.is_active).map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name} ({c.stock_qty} {c.unit})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Colaborador *</Label>
        <Select value={empId} onValueChange={setEmpId}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Quantidade *</Label><Input type="number" min={1} value={qty} onChange={e => setQty(+e.target.value)} /></div>
        <div><Label>Devolução prevista</Label><Input type="date" value={expected} onChange={e => setExpected(e.target.value)} /></div>
      </div>
      <div><Label>Observações</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
      <DialogFooter>
        <Button disabled={!epiId || !empId || qty < 1} onClick={() => onSubmit({ epi_id: epiId, employee_id: empId, quantity: qty, expected_return_at: expected || null, notes })}>Entregar</Button>
      </DialogFooter>
    </div>
  );
}

function ReturnForm({ onSubmit }: any) {
  const [qty, setQty] = useState<number | "">("");
  const [cond, setCond] = useState("bom");
  return (
    <div className="space-y-3">
      <div><Label>Quantidade devolvida (vazio = total)</Label><Input type="number" value={qty} onChange={e => setQty(e.target.value ? +e.target.value : "")} /></div>
      <div>
        <Label>Condição</Label>
        <Select value={cond} onValueChange={setCond}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bom">Bom estado (volta ao estoque)</SelectItem>
            <SelectItem value="danificado">Danificado</SelectItem>
            <SelectItem value="descartado">Descartado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter><Button onClick={() => onSubmit(qty || undefined, cond)}>Confirmar devolução</Button></DialogFooter>
    </div>
  );
}
