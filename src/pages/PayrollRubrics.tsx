import { useState } from "react";
import { usePayrollRubrics } from "@/hooks/usePayrollCompetency";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

const kindOptions = [
  { value: "provento", label: "Provento" },
  { value: "desconto", label: "Desconto" },
  { value: "informativo", label: "Informativo" },
  { value: "base", label: "Base de cálculo" },
];

export default function PayrollRubrics() {
  const { data: rubrics = [], isLoading } = usePayrollRubrics();
  const { organizationId } = useCurrentOrganization();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const save = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        const { id, ...patch } = payload;
        const { error } = await supabase.from("payroll_rubrics" as any).update(patch).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payroll_rubrics" as any).insert({
          ...payload, organization_id: organizationId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Rubrica salva");
      qc.invalidateQueries({ queryKey: ["payroll_rubrics"] });
      setOpen(false); setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("payroll_rubrics" as any).update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payroll_rubrics"] }),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rubricas de Folha</h1>
          <p className="text-muted-foreground">Catálogo de proventos, descontos e bases de cálculo</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}><Plus className="size-4 mr-2" />Nova rubrica</Button>
          </DialogTrigger>
          <RubricDialog editing={editing} onSave={(p) => save.mutate(p)} loading={save.isPending} />
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Rubricas ({rubrics.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Carregando…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Ativa</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubrics.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell>{r.description}</TableCell>
                    <TableCell><Badge variant="outline">{r.kind}</Badge></TableCell>
                    <TableCell>{r.is_system ? <Badge variant="secondary">Sistema</Badge> : <Badge>Custom</Badge>}</TableCell>
                    <TableCell>
                      <Switch checked={r.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: r.id, is_active: v })} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RubricDialog({ editing, onSave, loading }: { editing: any | null; onSave: (p: any) => void; loading: boolean }) {
  const [form, setForm] = useState<any>(editing ?? { code: "", description: "", kind: "provento", is_active: true, sort_order: 100 });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? "Editar rubrica" : "Nova rubrica"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{kindOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Ordem</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
          <div className="flex items-end gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Ativa</Label></div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(form)} disabled={loading || !form.code || !form.description}>Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
}
