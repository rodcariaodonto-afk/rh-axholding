import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, DollarSign } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { usePositions } from "@/hooks/usePositions";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

interface SalaryRange {
  id: string;
  position_id: string | null;
  seniority: string;
  base_salary_min: number;
  base_salary_max: number;
  night_shift_pct: number;
  hazard_pct: number;
  unhealthy_pct: number;
  benefits_total: number;
  effective_from: string;
  effective_until: string | null;
  organization_id: string;
  positions?: { title: string } | null;
}

const seniorityOptions = [
  { value: "intern", label: "Estagiário" },
  { value: "junior", label: "Júnior" },
  { value: "mid", label: "Pleno" },
  { value: "senior", label: "Sênior" },
  { value: "lead", label: "Lead" },
  { value: "manager", label: "Gerente" },
  { value: "director", label: "Diretor" },
];

const emptyForm = {
  position_id: "",
  seniority: "mid",
  base_salary_min: 0,
  base_salary_max: 0,
  night_shift_pct: 0,
  hazard_pct: 0,
  unhealthy_pct: 0,
  benefits_total: 0,
  effective_from: new Date().toISOString().split("T")[0],
  effective_until: "",
};

const SalaryRanges = () => {
  const { organizationId } = useCurrentOrganization();
  const { canEdit } = useUserRole();
  const { data: positions = [] } = usePositions();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: ranges = [], isLoading } = useQuery({
    queryKey: ["salary-ranges", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await (supabase as any)
        .from("salary_ranges")
        .select("*, positions(title)")
        .eq("organization_id", organizationId)
        .order("seniority");
      if (error) throw error;
      return (data || []) as SalaryRange[];
    },
    enabled: !!organizationId,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const payload = {
        position_id: values.position_id || null,
        seniority: values.seniority,
        base_salary_min: values.base_salary_min,
        base_salary_max: values.base_salary_max,
        night_shift_pct: values.night_shift_pct,
        hazard_pct: values.hazard_pct,
        unhealthy_pct: values.unhealthy_pct,
        benefits_total: values.benefits_total,
        effective_from: values.effective_from,
        effective_until: values.effective_until || null,
        organization_id: organizationId!,
      };

      if (editingId) {
        const { error } = await (supabase as any)
          .from("salary_ranges")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("salary_ranges").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-ranges"] });
      toast.success(editingId ? "Faixa atualizada" : "Faixa criada");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar faixa salarial"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("salary_ranges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-ranges"] });
      toast.success("Faixa removida");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (r: SalaryRange) => {
    setEditingId(r.id);
    setForm({
      position_id: r.position_id || "",
      seniority: r.seniority,
      base_salary_min: r.base_salary_min,
      base_salary_max: r.base_salary_max,
      night_shift_pct: r.night_shift_pct,
      hazard_pct: r.hazard_pct,
      unhealthy_pct: r.unhealthy_pct,
      benefits_total: r.benefits_total,
      effective_from: r.effective_from,
      effective_until: r.effective_until || "",
    });
    setDialogOpen(true);
  };

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const getSeniorityLabel = (val: string) =>
    seniorityOptions.find((s) => s.value === val)?.label || val;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faixas Salariais</h1>
          <p className="text-muted-foreground">
            Gerencie as faixas salariais por cargo e senioridade.
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            Nova Faixa
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo</TableHead>
                <TableHead>Senioridade</TableHead>
                <TableHead className="text-right">Salário Mín.</TableHead>
                <TableHead className="text-right">Salário Máx.</TableHead>
                <TableHead className="text-right">Benefícios</TableHead>
                <TableHead>Vigência</TableHead>
                {canEdit && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranges.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.positions?.title || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getSeniorityLabel(r.seniority)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {fmt(r.base_salary_min)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {fmt(r.base_salary_max)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {fmt(r.benefits_total)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.effective_from).toLocaleDateString("pt-BR")}
                    {r.effective_until
                      ? ` — ${new Date(r.effective_until).toLocaleDateString("pt-BR")}`
                      : " — atual"}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(r.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {ranges.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <DollarSign className="size-10 mx-auto mb-2 opacity-30" />
                    Nenhuma faixa salarial cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Faixa" : "Nova Faixa Salarial"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Cargo</Label>
              <Select value={form.position_id} onValueChange={(v) => setForm({ ...form, position_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                <SelectContent>
                  {positions.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Senioridade</Label>
              <Select value={form.seniority} onValueChange={(v) => setForm({ ...form, seniority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {seniorityOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Salário Mínimo</Label>
                <Input type="number" value={form.base_salary_min} onChange={(e) => setForm({ ...form, base_salary_min: +e.target.value })} />
              </div>
              <div>
                <Label>Salário Máximo</Label>
                <Input type="number" value={form.base_salary_max} onChange={(e) => setForm({ ...form, base_salary_max: +e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Noturno (%)</Label>
                <Input type="number" value={form.night_shift_pct} onChange={(e) => setForm({ ...form, night_shift_pct: +e.target.value })} />
              </div>
              <div>
                <Label>Periculosidade (%)</Label>
                <Input type="number" value={form.hazard_pct} onChange={(e) => setForm({ ...form, hazard_pct: +e.target.value })} />
              </div>
              <div>
                <Label>Insalubridade (%)</Label>
                <Input type="number" value={form.unhealthy_pct} onChange={(e) => setForm({ ...form, unhealthy_pct: +e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Total Benefícios (R$)</Label>
                <Input type="number" value={form.benefits_total} onChange={(e) => setForm({ ...form, benefits_total: +e.target.value })} />
              </div>
              <div>
                <Label>Vigência desde</Label>
                <Input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryRanges;
