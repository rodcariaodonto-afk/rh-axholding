import { useState } from "react";
import { useWorkSchedules, useCreateWorkSchedule, useDeleteWorkSchedule, type WorkSchedule } from "@/hooks/useWorkSchedules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Trash2, Clock, CalendarClock } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  standard: "Padrão",
  shift: "Turno",
  flexible: "Flexível",
  "12x36": "12x36",
};

const DAY_LABELS: Record<string, string> = {
  mon: "Seg", tue: "Ter", wed: "Qua", thu: "Qui", fri: "Sex", sat: "Sáb", sun: "Dom",
};

export default function WorkSchedules() {
  const { data: schedules, isLoading } = useWorkSchedules();
  const createSchedule = useCreateWorkSchedule();
  const deleteSchedule = useDeleteWorkSchedule();

  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("standard");
  const [hoursPerWeek, setHoursPerWeek] = useState("44");
  const [hoursPerDay, setHoursPerDay] = useState("8");
  const [lateTolerance, setLateTolerance] = useState("10");

  const resetForm = () => {
    setName(""); setType("standard"); setHoursPerWeek("44"); setHoursPerDay("8"); setLateTolerance("10");
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createSchedule.mutateAsync({
      name: name.trim(),
      type,
      hours_per_week: parseFloat(hoursPerWeek),
      hours_per_day: parseFloat(hoursPerDay),
      late_tolerance_minutes: parseInt(lateTolerance),
    });
    resetForm();
    setShowDialog(false);
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Escalas de Trabalho</h1>
          <p className="text-muted-foreground">Configure jornadas, turnos e escalas</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Escala
        </Button>
      </div>

      {schedules?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarClock className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma escala cadastrada</h2>
            <p className="text-muted-foreground mb-4">Crie escalas para definir as jornadas de trabalho da sua equipe.</p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira escala
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Horas/Semana</TableHead>
                  <TableHead>Horas/Dia</TableHead>
                  <TableHead>Tolerância</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules?.map((s) => {
                  const days = Array.isArray(s.work_days) ? s.work_days : [];
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {s.name}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{TYPE_LABELS[s.type] || s.type}</Badge></TableCell>
                      <TableCell>{s.hours_per_week}h</TableCell>
                      <TableCell>{s.hours_per_day}h</TableCell>
                      <TableCell>{s.late_tolerance_minutes} min</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {days.map((d: string) => (
                            <Badge key={d} variant="secondary" className="text-[10px] px-1">{DAY_LABELS[d] || d}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteSchedule.mutate(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Escala</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: CLT Padrão 44h" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Padrão</SelectItem>
                    <SelectItem value="shift">Turno</SelectItem>
                    <SelectItem value="flexible">Flexível</SelectItem>
                    <SelectItem value="12x36">12x36</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horas/Semana</Label>
                <Input type="number" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horas/Dia</Label>
                <Input type="number" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tolerância (min)</Label>
                <Input type="number" value={lateTolerance} onChange={(e) => setLateTolerance(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createSchedule.isPending}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
