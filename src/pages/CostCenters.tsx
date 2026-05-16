import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCostCenters, useUpsertCostCenter, useDeleteCostCenter, type CostCenter } from "@/hooks/useCostCenters";
import { Skeleton } from "@/components/ui/skeleton";

export default function CostCenters() {
  const { data: items = [], isLoading } = useCostCenters();
  const upsert = useUpsertCostCenter();
  const del = useDeleteCostCenter();
  const [editing, setEditing] = useState<Partial<CostCenter> | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="text-muted-foreground">Cadastro de centros de custo da organização</p>
        </div>
        <Button onClick={() => setEditing({ code: "", name: "", active: true })}>
          <Plus className="size-4 mr-2" /> Novo
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Cadastrados</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum centro de custo cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((cc) => (
                  <TableRow key={cc.id}>
                    <TableCell className="font-mono">{cc.code}</TableCell>
                    <TableCell>{cc.name}</TableCell>
                    <TableCell className="font-mono text-xs">{cc.cnpj || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={cc.active ? "default" : "secondary"}>
                        {cc.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(cc)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (confirm(`Remover "${cc.name}"?`)) del.mutate(cc.id);
                      }}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Novo"} centro de custo</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Código *</Label>
                  <Input value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Nome *</Label>
                  <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>CNPJ (opcional)</Label>
                <Input value={editing.cnpj ?? ""} onChange={(e) => setEditing({ ...editing, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                <Label>Ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button
              disabled={!editing?.code || !editing?.name || upsert.isPending}
              onClick={() => {
                if (!editing) return;
                upsert.mutate(
                  { ...editing, code: editing.code!, name: editing.name! },
                  { onSuccess: () => setEditing(null) }
                );
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
