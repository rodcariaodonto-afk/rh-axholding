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
import { useLegalEntities, useUpsertLegalEntity, useDeleteLegalEntity, type LegalEntity } from "@/hooks/useLegalEntities";
import { Skeleton } from "@/components/ui/skeleton";

export default function LegalEntities() {
  const { data: items = [], isLoading } = useLegalEntities();
  const upsert = useUpsertLegalEntity();
  const del = useDeleteLegalEntity();
  const [editing, setEditing] = useState<Partial<LegalEntity> | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CNPJs Operacionais</h1>
          <p className="text-muted-foreground">Pessoas jurídicas vinculadas a folha, AFD e centros de custo</p>
        </div>
        <Button onClick={() => setEditing({ legal_name: "", cnpj: "", active: true })}>
          <Plus className="size-4 mr-2" /> Novo CNPJ
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Cadastrados</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum CNPJ cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((le) => (
                  <TableRow key={le.id}>
                    <TableCell>{le.legal_name}</TableCell>
                    <TableCell>{le.trade_name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{le.cnpj}</TableCell>
                    <TableCell>
                      <Badge variant={le.active ? "default" : "secondary"}>
                        {le.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(le)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (confirm(`Remover "${le.legal_name}"?`)) del.mutate(le.id);
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
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Novo"} CNPJ</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Razão Social *</Label>
                <Input value={editing.legal_name ?? ""} onChange={(e) => setEditing({ ...editing, legal_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nome Fantasia</Label>
                  <Input value={editing.trade_name ?? ""} onChange={(e) => setEditing({ ...editing, trade_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>CNPJ *</Label>
                  <Input value={editing.cnpj ?? ""} onChange={(e) => setEditing({ ...editing, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Inscrição Estadual</Label>
                  <Input value={editing.state_registration ?? ""} onChange={(e) => setEditing({ ...editing, state_registration: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Inscrição Municipal</Label>
                  <Input value={editing.municipal_registration ?? ""} onChange={(e) => setEditing({ ...editing, municipal_registration: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>CNAE</Label>
                <Input value={editing.cnae_code ?? ""} onChange={(e) => setEditing({ ...editing, cnae_code: e.target.value })} />
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
              disabled={!editing?.legal_name || !editing?.cnpj || upsert.isPending}
              onClick={() => {
                if (!editing) return;
                upsert.mutate(
                  { ...editing, legal_name: editing.legal_name!, cnpj: editing.cnpj! },
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
