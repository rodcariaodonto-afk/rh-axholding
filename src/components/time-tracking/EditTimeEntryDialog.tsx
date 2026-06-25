import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateTimeEntry } from "@/hooks/useUpdateTimeEntry";

interface TimeEntry {
  id: string;
  date: string;
  clock_in: string;
  clock_out: string | null;
  lunch_out?: string | null;
  lunch_return?: string | null;
}

interface EditTimeEntryDialogProps {
  entry: TimeEntry | null;
  onClose: () => void;
}

function toHHmm(isoString: string | null | undefined): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  });
}

export function EditTimeEntryDialog({ entry, onClose }: EditTimeEntryDialogProps) {
  const [clockIn, setClockIn] = useState(() => toHHmm(entry?.clock_in));
  const [lunchOut, setLunchOut] = useState(() => toHHmm(entry?.lunch_out));
  const [lunchReturn, setLunchReturn] = useState(() => toHHmm(entry?.lunch_return));
  const [clockOut, setClockOut] = useState(() => toHHmm(entry?.clock_out));
  const [motivo, setMotivo] = useState("");

  const { mutate, isPending } = useUpdateTimeEntry();

  function handleSave() {
    if (!entry || !motivo.trim()) return;

    mutate(
      {
        id: entry.id,
        date: entry.date,
        clock_in: clockIn,
        lunch_out: lunchOut || null,
        lunch_return: lunchReturn || null,
        clock_out: clockOut || null,
        motivo: motivo.trim(),
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog open={!!entry} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Batida de Ponto</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="clock_in">Entrada</Label>
              <Input
                id="clock_in"
                type="time"
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lunch_out">Saída Almoço</Label>
              <Input
                id="lunch_out"
                type="time"
                value={lunchOut}
                onChange={(e) => setLunchOut(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lunch_return">Retorno Almoço</Label>
              <Input
                id="lunch_return"
                type="time"
                value={lunchReturn}
                onChange={(e) => setLunchReturn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clock_out">Saída</Label>
              <Input
                id="clock_out"
                type="time"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="motivo">
              Motivo da alteração <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo da correção..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending || !motivo.trim()}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
