import { useState } from "react";
import { useEpiCatalog, useEpiDeliveries, type EpiItem } from "@/hooks/useEpi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, PackagePlus, Settings2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function EpiCatalog() {
  const { list, upsert, remove } = useEpiCatalog();
  const { stockIn, stockAdjust } = useEpiDeliveries();
  const [editing, setEditing] = useState<Partial<EpiItem> | null>(null);
  const [stockOp, setStockOp] = useState<{ epi: EpiItem; mode: "in" | "adjust" } | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = (list.data ?? []).filter(e =>
    !filter || e.name.toLowerCase().includes(filter.toLowerCase()) || e.code.toLowerCase().includes(filter.toLowerCase())
  );
  const today = new Date();
  const lowStock = (list.data ?? []).filter(e => e.stock_qty <= e.min_stock_qty).length;
  const caExpiring = (list.data ?? []).filter(e => e.ca_expires_at && new Date(e.ca_expires_at) < new Date(today.getTime() + 30 * 86400000)).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">EPIs — Catálogo & Estoque</h1>
          <p className="text-muted-foreground">Cadastro de equipamentos, controle de estoque e validade do CA</p>
        </div>
        <Button onClick={() => setEditing({})}><Plus className="h-4 w-4 mr-2" /> Novo EPI</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">Itens cadastrados</div>
          <div className="text-3xl font-bold">{list.data?.length ?? 0}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            {lowStock > 0 && <AlertTriangle className="h-4 w-4 text-amber-500" />}Estoque baixo
          </div>
          <div className="text-3xl font-bold">{lowStock}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            {caExpiring > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}CA vencendo (30d)
          </div>
          <div className="text-3xl font-bold">{caExpiring}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
          <Input placeholder="Buscar por nome ou código..." value={filter} onChange={e => setFilter(e.target.value)} className="max-w-sm mt-2" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Categoria</TableHead>
              <TableHead>CA</TableHead><TableHead>Validade CA</TableHead>
              <TableHead className="text-right">Estoque</TableHead><TableHead>Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(epi => {
                const low = epi.stock_qty <= epi.min_stock_qty;
                const caExp = epi.ca_expires_at && new Date(epi.ca_expires_at) < new Date(today.getTime() + 30 * 86400000);
                return (
                  <TableRow key={epi.id}>
                    <TableCell className="font-mono">{epi.code}</TableCell>
                    <TableCell>{epi.name}</TableCell>
                    <TableCell>{epi.category ?? "—"}</TableCell>
                    <TableCell>{epi.ca_number ?? "—"}</TableCell>
                    <TableCell>
                      {epi.ca_expires_at ? (
                        <Badge variant={caExp ? "destructive" : "secondary"}>
                          {format(new Date(epi.ca_expires_at), "dd/MM/yyyy")}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={low ? "destructive" : "outline"}>
                        {epi.stock_qty} {epi.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setStockOp({ epi, mode: "in" })}><PackagePlus className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setStockOp({ epi, mode: "adjust" })}><Settings2 className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(epi)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => confirm("Excluir?") && remove.mutate(epi.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum EPI cadastrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Editor */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar EPI" : "Novo EPI"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código *</Label><Input value={editing.code ?? ""} onChange={e => setEditing({ ...editing, code: e.target.value })} /></div>
              <div><Label>Nome *</Label><Input value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Categoria</Label><Input value={editing.category ?? ""} onChange={e => setEditing({ ...editing, category: e.target.value })} placeholder="Capacete, luva, calçado..." /></div>
              <div><Label>Fabricante</Label><Input value={editing.manufacturer ?? ""} onChange={e => setEditing({ ...editing, manufacturer: e.target.value })} /></div>
              <div><Label>CA (nº)</Label><Input value={editing.ca_number ?? ""} onChange={e => setEditing({ ...editing, ca_number: e.target.value })} /></div>
              <div><Label>Validade do CA</Label><Input type="date" value={editing.ca_expires_at ?? ""} onChange={e => setEditing({ ...editing, ca_expires_at: e.target.value })} /></div>
              <div><Label>Unidade</Label><Input value={editing.unit ?? "un"} onChange={e => setEditing({ ...editing, unit: e.target.value })} /></div>
              <div><Label>Estoque atual</Label><Input type="number" value={editing.stock_qty ?? 0} onChange={e => setEditing({ ...editing, stock_qty: +e.target.value })} disabled={!!editing.id} /></div>
              <div><Label>Estoque mínimo</Label><Input type="number" value={editing.min_stock_qty ?? 0} onChange={e => setEditing({ ...editing, min_stock_qty: +e.target.value })} /></div>
              <div><Label>Vida útil (dias)</Label><Input type="number" value={editing.durability_days ?? ""} onChange={e => setEditing({ ...editing, durability_days: e.target.value ? +e.target.value : null as any })} /></div>
              <div className="col-span-2"><Label>Descrição</Label><Textarea value={editing.description ?? ""} onChange={e => setEditing({ ...editing, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!editing?.code || !editing?.name) return;
              await upsert.mutateAsync(editing as any);
              setEditing(null);
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock op */}
      <Dialog open={!!stockOp} onOpenChange={(o) => !o && setStockOp(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{stockOp?.mode === "in" ? "Entrada de estoque" : "Ajuste de estoque"} — {stockOp?.epi.name}</DialogTitle></DialogHeader>
          <StockForm op={stockOp} onSubmit={async (qty, reason, cost) => {
            if (!stockOp) return;
            if (stockOp.mode === "in") {
              await stockIn.mutateAsync({ epi_id: stockOp.epi.id, quantity: qty, unit_cost: cost, reason });
            } else {
              await stockAdjust.mutateAsync({ epi_id: stockOp.epi.id, new_quantity: qty, reason });
            }
            setStockOp(null);
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StockForm({ op, onSubmit }: { op: { epi: EpiItem; mode: "in" | "adjust" } | null; onSubmit: (qty: number, reason: string, cost?: number) => void }) {
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");
  const [cost, setCost] = useState<number | undefined>(undefined);
  if (!op) return null;
  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">Estoque atual: <strong>{op.epi.stock_qty} {op.epi.unit}</strong></div>
      <div>
        <Label>{op.mode === "in" ? "Quantidade a adicionar" : "Novo estoque total"}</Label>
        <Input type="number" value={qty} onChange={e => setQty(+e.target.value)} />
      </div>
      {op.mode === "in" && (
        <div><Label>Custo unitário (opcional)</Label><Input type="number" step="0.01" value={cost ?? ""} onChange={e => setCost(e.target.value ? +e.target.value : undefined)} /></div>
      )}
      <div><Label>Motivo</Label><Input value={reason} onChange={e => setReason(e.target.value)} placeholder="NF 1234, contagem física, etc." /></div>
      <DialogFooter><Button onClick={() => onSubmit(qty, reason, cost)} disabled={qty <= 0 && op.mode === "in"}>Confirmar</Button></DialogFooter>
    </div>
  );
}
