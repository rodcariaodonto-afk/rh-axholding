import { useState, useMemo } from "react";
import { useAssets, useAssetAssignments, type Asset } from "@/hooks/useAssets";
import { useEmployees } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, UserPlus, RotateCcw } from "lucide-react";
import { format } from "date-fns";

const STATUS: Record<string, { label: string; variant: any }> = {
  disponivel: { label: "Disponível", variant: "secondary" },
  em_uso: { label: "Em uso", variant: "default" },
  manutencao: { label: "Manutenção", variant: "outline" },
  devolvido: { label: "Devolvido", variant: "secondary" },
  baixado: { label: "Baixado", variant: "destructive" },
  perdido: { label: "Perdido", variant: "destructive" },
};

export default function AssetsPage() {
  const { list, upsert, remove, assign, returnAsset } = useAssets();
  const { data: assignments } = useAssetAssignments();
  const { data: employees } = useEmployees();
  const [editing, setEditing] = useState<Partial<Asset> | null>(null);
  const [assignFor, setAssignFor] = useState<Asset | null>(null);
  const [returnFor, setReturnFor] = useState<{ assignmentId: string; assetId: string } | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => (list.data ?? []).filter(a =>
    !filter || a.tag.toLowerCase().includes(filter.toLowerCase()) ||
    a.category?.toLowerCase().includes(filter.toLowerCase()) ||
    a.brand?.toLowerCase().includes(filter.toLowerCase()) ||
    a.model?.toLowerCase().includes(filter.toLowerCase())
  ), [list.data, filter]);

  const summary = useMemo(() => {
    const arr = list.data ?? [];
    return {
      total: arr.length,
      em_uso: arr.filter(a => a.status === "em_uso").length,
      disponivel: arr.filter(a => a.status === "disponivel").length,
      manutencao: arr.filter(a => a.status === "manutencao").length,
      valor: arr.reduce((s, a) => s + (Number(a.acquired_value) || 0), 0),
    };
  }, [list.data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patrimônio</h1>
          <p className="text-muted-foreground">Notebooks, celulares, equipamentos e termos de responsabilidade</p>
        </div>
        <Button onClick={() => setEditing({})}><Plus className="h-4 w-4 mr-2" /> Novo item</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Total</div><div className="text-2xl font-bold">{summary.total}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Em uso</div><div className="text-2xl font-bold">{summary.em_uso}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Disponíveis</div><div className="text-2xl font-bold">{summary.disponivel}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Manutenção</div><div className="text-2xl font-bold">{summary.manutencao}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Valor total</div><div className="text-2xl font-bold">{summary.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="items">
        <TabsList><TabsTrigger value="items">Itens</TabsTrigger><TabsTrigger value="assignments">Atribuições</TabsTrigger></TabsList>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Inventário</CardTitle>
              <Input placeholder="Buscar..." value={filter} onChange={e => setFilter(e.target.value)} className="max-w-sm mt-2" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Tag</TableHead><TableHead>Categoria</TableHead><TableHead>Marca/Modelo</TableHead>
                  <TableHead>Série</TableHead><TableHead>Status</TableHead><TableHead>Responsável</TableHead>
                  <TableHead>Valor</TableHead><TableHead>Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono">{a.tag}</TableCell>
                      <TableCell>{a.category}</TableCell>
                      <TableCell>{[a.brand, a.model].filter(Boolean).join(" ") || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{a.serial_number ?? "—"}</TableCell>
                      <TableCell><Badge variant={STATUS[a.status]?.variant}>{STATUS[a.status]?.label}</Badge></TableCell>
                      <TableCell>{a.current_assignee?.full_name ?? "—"}</TableCell>
                      <TableCell>{a.acquired_value ? Number(a.acquired_value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {a.status === "disponivel" && (
                            <Button size="sm" variant="outline" onClick={() => setAssignFor(a)}><UserPlus className="h-4 w-4" /></Button>
                          )}
                          {a.status === "em_uso" && (() => {
                            const act = assignments?.find(x => x.asset_id === a.id && x.status === "ativa");
                            return act ? (
                              <Button size="sm" variant="outline" onClick={() => setReturnFor({ assignmentId: act.id, assetId: a.id })}><RotateCcw className="h-4 w-4" /></Button>
                            ) : null;
                          })()}
                          <Button size="sm" variant="ghost" onClick={() => setEditing(a)}><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => confirm("Excluir?") && remove.mutate(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum item</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader><CardTitle>Histórico de atribuições</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Atribuído em</TableHead><TableHead>Patrimônio</TableHead><TableHead>Colaborador</TableHead>
                  <TableHead>Devolução prev.</TableHead><TableHead>Devolvido em</TableHead><TableHead>Condição</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(assignments ?? []).map(a => (
                    <TableRow key={a.id}>
                      <TableCell>{format(new Date(a.assigned_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{a.asset?.tag} — {a.asset?.category}</TableCell>
                      <TableCell>{a.employee?.full_name ?? "—"}</TableCell>
                      <TableCell>{a.expected_return_at ? format(new Date(a.expected_return_at), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell>{a.returned_at ? format(new Date(a.returned_at), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell>{a.return_condition ?? "—"}</TableCell>
                      <TableCell><Badge variant={a.status === "ativa" ? "default" : "secondary"}>{a.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {(assignments ?? []).length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma atribuição</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Editor */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar patrimônio" : "Novo patrimônio"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tag *</Label><Input value={editing.tag ?? ""} onChange={e => setEditing({ ...editing, tag: e.target.value })} /></div>
              <div><Label>Categoria *</Label><Input value={editing.category ?? ""} onChange={e => setEditing({ ...editing, category: e.target.value })} placeholder="notebook, celular, monitor..." /></div>
              <div><Label>Marca</Label><Input value={editing.brand ?? ""} onChange={e => setEditing({ ...editing, brand: e.target.value })} /></div>
              <div><Label>Modelo</Label><Input value={editing.model ?? ""} onChange={e => setEditing({ ...editing, model: e.target.value })} /></div>
              <div><Label>Nº de série</Label><Input value={editing.serial_number ?? ""} onChange={e => setEditing({ ...editing, serial_number: e.target.value })} /></div>
              <div><Label>Localização</Label><Input value={editing.location ?? ""} onChange={e => setEditing({ ...editing, location: e.target.value })} /></div>
              <div><Label>Data de aquisição</Label><Input type="date" value={editing.acquired_at ?? ""} onChange={e => setEditing({ ...editing, acquired_at: e.target.value })} /></div>
              <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={editing.acquired_value ?? ""} onChange={e => setEditing({ ...editing, acquired_value: e.target.value ? +e.target.value : null as any })} /></div>
              <div><Label>NF / Nota</Label><Input value={editing.invoice_number ?? ""} onChange={e => setEditing({ ...editing, invoice_number: e.target.value })} /></div>
              <div><Label>Garantia até</Label><Input type="date" value={editing.warranty_until ?? ""} onChange={e => setEditing({ ...editing, warranty_until: e.target.value })} /></div>
              <div className="col-span-2"><Label>Observações</Label><Textarea value={editing.notes ?? ""} onChange={e => setEditing({ ...editing, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!editing?.tag || !editing?.category) return;
              await upsert.mutateAsync(editing as any);
              setEditing(null);
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Atribuir */}
      <Dialog open={!!assignFor} onOpenChange={(o) => !o && setAssignFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Atribuir {assignFor?.tag}</DialogTitle></DialogHeader>
          <AssignForm employees={employees ?? []} onSubmit={async (i) => {
            await assign.mutateAsync({ asset_id: assignFor!.id, ...i });
            setAssignFor(null);
          }} />
        </DialogContent>
      </Dialog>

      {/* Devolver */}
      <Dialog open={!!returnFor} onOpenChange={(o) => !o && setReturnFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Devolução</DialogTitle></DialogHeader>
          <ReturnAssetForm onSubmit={async (cond) => {
            await returnAsset.mutateAsync({ assignment_id: returnFor!.assignmentId, asset_id: returnFor!.assetId, return_condition: cond });
            setReturnFor(null);
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssignForm({ employees, onSubmit }: any) {
  const [empId, setEmpId] = useState("");
  const [expected, setExpected] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <div className="space-y-3">
      <div>
        <Label>Colaborador *</Label>
        <Select value={empId} onValueChange={setEmpId}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div><Label>Devolução prevista</Label><Input type="date" value={expected} onChange={e => setExpected(e.target.value)} /></div>
      <div><Label>Observações</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></div>
      <DialogFooter><Button disabled={!empId} onClick={() => onSubmit({ employee_id: empId, expected_return_at: expected || null, notes })}>Atribuir</Button></DialogFooter>
    </div>
  );
}

function ReturnAssetForm({ onSubmit }: any) {
  const [cond, setCond] = useState("bom");
  return (
    <div className="space-y-3">
      <div>
        <Label>Condição</Label>
        <Select value={cond} onValueChange={setCond}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bom">Bom estado (volta a disponível)</SelectItem>
            <SelectItem value="danificado">Danificado (vai para manutenção)</SelectItem>
            <SelectItem value="manutencao">Necessita manutenção</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter><Button onClick={() => onSubmit(cond)}>Confirmar</Button></DialogFooter>
    </div>
  );
}
