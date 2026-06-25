import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateFeriado, type FeriadoTipo } from "@/hooks/useFeriados";

const TIPO_OPTIONS: { value: FeriadoTipo; label: string }[] = [
  { value: "nacional", label: "Nacional" },
  { value: "estadual", label: "Estadual" },
  { value: "municipal", label: "Municipal" },
  { value: "facultativo", label: "Ponto Facultativo" },
];

interface FeriadoDialogProps {
  open: boolean;
  onClose: () => void;
}

const defaultForm = {
  nome: "",
  data: "",
  tipo: "nacional" as FeriadoTipo,
  recorrente: false,
};

export function FeriadoDialog({ open, onClose }: FeriadoDialogProps) {
  const { mutate, isPending } = useCreateFeriado();
  const [form, setForm] = useState(defaultForm);

  function handleClose() {
    setForm(defaultForm);
    onClose();
  }

  function handleSave() {
    if (!form.nome.trim() || !form.data) return;
    mutate(
      { nome: form.nome.trim(), data: form.data, tipo: form.tipo, recorrente: form.recorrente },
      { onSuccess: handleClose },
    );
  }

  const isSaveDisabled = isPending || !form.nome.trim() || !form.data;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Feriado</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
            <Input
              id="nome"
              placeholder="Ex: Natal, Proclamação da República..."
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            />
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
            <Label htmlFor="tipo">Tipo <span className="text-destructive">*</span></Label>
            <Select
              value={form.tipo}
              onValueChange={(v) => setForm((p) => ({ ...p, tipo: v as FeriadoTipo }))}
            >
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="recorrente"
              checked={form.recorrente}
              onCheckedChange={(v) => setForm((p) => ({ ...p, recorrente: v }))}
            />
            <Label htmlFor="recorrente" className="cursor-pointer">
              Recorrente anualmente
            </Label>
          </div>
          {form.recorrente && (
            <p className="text-xs text-muted-foreground -mt-2 pl-0.5">
              O ano será ignorado na comparação — o feriado se aplica todo ano nessa data.
            </p>
          )}
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
