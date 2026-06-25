import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { useCreateEscalaOverride, type EscalaOverride } from "@/hooks/useEscalaOverrides";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

const TIPO_TURNO_OPTIONS: { value: EscalaOverride["tipo_turno"]; label: string }[] = [
  { value: "normal", label: "Trabalho Normal" },
  { value: "hora_extra", label: "Hora Extra" },
  { value: "folga", label: "Folga" },
  { value: "feriado_trabalhado", label: "Feriado Trabalhado" },
];

interface EscalaOverrideDialogProps {
  open: boolean;
  onClose: () => void;
}

const defaultForm = {
  employee_id: "",
  data: new Date().toISOString().split("T")[0],
  tipo_turno: "normal" as EscalaOverride["tipo_turno"],
  entrada: "",
  saida: "",
  motivo: "",
};

export function EscalaOverrideDialog({ open, onClose }: EscalaOverrideDialogProps) {
  const { organizationId } = useCurrentOrganization();
  const { data: employees = [] } = useEmployees();
  const { mutate, isPending } = useCreateEscalaOverride();

  const [form, setForm] = useState(defaultForm);

  const activeEmployees = (employees as any[]).filter((e) => e.status === "active");

  function handleClose() {
    setForm(defaultForm);
    onClose();
  }

  function handleSave() {
    if (!organizationId || !form.employee_id || !form.motivo.trim()) return;

    mutate(
      {
        organization_id: organizationId,
        employee_id: form.employee_id,
        data: form.data,
        tipo_turno: form.tipo_turno,
        entrada: form.entrada || null,
        saida: form.saida || null,
        motivo: form.motivo.trim(),
      },
      { onSuccess: handleClose },
    );
  }

  const isSaveDisabled =
    isPending ||
    !form.employee_id ||
    !form.data ||
    !form.motivo.trim();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Override de Escala por Dia</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="employee">Colaborador <span className="text-destructive">*</span></Label>
            <Select
              value={form.employee_id}
              onValueChange={(v) => setForm((p) => ({ ...p, employee_id: v }))}
            >
              <SelectTrigger id="employee">
                <SelectValue placeholder="Selecione o colaborador" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name || e.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="data">Data <span className="text-destructive">*</span></Label>
            <Input
              id="data"
              type="date"
              value={form.data}
              onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tipo_turno">Tipo de Turno <span className="text-destructive">*</span></Label>
            <Select
              value={form.tipo_turno}
              onValueChange={(v) => setForm((p) => ({ ...p, tipo_turno: v as EscalaOverride["tipo_turno"] }))}
            >
              <SelectTrigger id="tipo_turno">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPO_TURNO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="entrada">Entrada</Label>
              <Input
                id="entrada"
                type="time"
                value={form.entrada}
                onChange={(e) => setForm((p) => ({ ...p, entrada: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="saida">Saída</Label>
              <Input
                id="saida"
                type="time"
                value={form.saida}
                onChange={(e) => setForm((p) => ({ ...p, saida: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="motivo">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo do override..."
              value={form.motivo}
              onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaveDisabled}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
