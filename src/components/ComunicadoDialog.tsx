import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";
import { useUnits } from "@/hooks/useUnits";
import { useEmployees } from "@/hooks/useEmployees";
import { useCreateComunicado, type ComunicadoPriority, type ComunicadoDestinatarioTipo } from "@/hooks/useComunicados";

interface ComunicadoDialogProps {
  open: boolean;
  onClose: () => void;
  defaultDestinatarioTipo?: ComunicadoDestinatarioTipo;
  defaultEmployeeId?: string;
  lockDestinatario?: boolean;
}

const EMPTY = {
  title: "",
  message: "",
  priority: "normal" as ComunicadoPriority,
  destinatario_tipo: "todos" as ComunicadoDestinatarioTipo,
  department_id: "",
  unit_id: "",
  employee_id: "",
  expires_at: null as Date | null,
};

export function ComunicadoDialog({
  open,
  onClose,
  defaultDestinatarioTipo,
  defaultEmployeeId,
  lockDestinatario = false,
}: ComunicadoDialogProps) {
  const [form, setForm] = useState(EMPTY);
  const { data: departments = [] } = useDepartments();
  const { data: units = [] } = useUnits();
  const { data: employees = [] } = useEmployees();
  const create = useCreateComunicado();

  const activeEmployees = (employees as { id: string; full_name?: string; email: string; status: string }[])
    .filter((e) => e.status === "active");

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY,
        destinatario_tipo: defaultDestinatarioTipo ?? "todos",
        employee_id: defaultEmployeeId ?? "",
      });
    }
  }, [open, defaultDestinatarioTipo, defaultEmployeeId]);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    await create.mutateAsync({
      title: form.title.trim(),
      message: form.message.trim(),
      priority: form.priority,
      destinatario_tipo: form.destinatario_tipo,
      department_id: form.destinatario_tipo === "departamento" ? form.department_id || null : null,
      unit_id: form.destinatario_tipo === "unidade" ? form.unit_id || null : null,
      employee_id: form.destinatario_tipo === "individual" ? form.employee_id || null : null,
      expires_at: form.expires_at ? form.expires_at.toISOString() : null,
    });
    onClose();
  };

  const canSubmit = form.title.trim() && form.message.trim() && !create.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Comunicado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <Label>Título *</Label>
            <Input
              className="mt-1"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Título do comunicado"
            />
          </div>

          <div>
            <Label>Mensagem *</Label>
            <Textarea
              className="mt-1"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Escreva o comunicado aqui..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Destinatários</Label>
              <Select
                value={form.destinatario_tipo}
                onValueChange={(v) => set("destinatario_tipo", v as ComunicadoDestinatarioTipo)}
                disabled={lockDestinatario}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="departamento">Por Departamento</SelectItem>
                  <SelectItem value="unidade">Por Unidade</SelectItem>
                  <SelectItem value="individual">Funcionário Específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => set("priority", v as ComunicadoPriority)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="importante">Importante</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.destinatario_tipo === "departamento" && (
            <div>
              <Label>Departamento</Label>
              <Select value={form.department_id} onValueChange={(v) => set("department_id", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(departments as { id: string; name: string }[]).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.destinatario_tipo === "unidade" && (
            <div>
              <Label>Unidade</Label>
              <Select value={form.unit_id} onValueChange={(v) => set("unit_id", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(units as { id: string; name: string }[]).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.destinatario_tipo === "individual" && (
            <div>
              <Label>Funcionário</Label>
              <Select
                value={form.employee_id}
                onValueChange={(v) => set("employee_id", v)}
                disabled={lockDestinatario && !!defaultEmployeeId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Publicar até (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "mt-1 w-full pl-3 text-left font-normal",
                    !form.expires_at && "text-muted-foreground"
                  )}
                >
                  {form.expires_at
                    ? format(form.expires_at, "dd/MM/yyyy", { locale: ptBR })
                    : "Sem expiração"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.expires_at ?? undefined}
                  onSelect={(d) => set("expires_at", d ?? null)}
                  disabled={(date) => date < new Date()}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {create.isPending ? "Publicando..." : "Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
