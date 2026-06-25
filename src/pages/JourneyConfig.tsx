import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Copy, Trash2, CalendarClock } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import {
  useJourneyConfigs,
  useCreateJourneyConfig,
  useUpdateJourneyConfig,
  useDeleteJourneyConfig,
  type JourneyConfig,
  type JourneyConfigInsert,
} from "@/hooks/useJourneyConfig";
import { useEscalaOverrides, useDeleteEscalaOverride } from "@/hooks/useEscalaOverrides";
import { EscalaOverrideDialog } from "@/components/time-tracking/EscalaOverrideDialog";

const JOURNEY_TYPES = [
  { value: "44h", label: "CLT 44h semanais" },
  { value: "6x1", label: "Escala 6x1" },
  { value: "horista", label: "Horista" },
  { value: "comercial", label: "Comercial" },
  { value: "plantao", label: "Plantão" },
  { value: "customizada", label: "Customizada" },
];

const WEEKDAYS = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sáb" },
  { value: "dom", label: "Dom" },
];

const defaultForm: Omit<JourneyConfigInsert, "organization_id"> = {
  employee_id: "",
  tipo_jornada: "44h",
  horas_semana: 44,
  horas_dia: 8,
  dias_trabalho: ["seg", "ter", "qua", "qui", "sex"],
  tolerancia_atraso: 10,
  tolerancia_saida_antecipada: 10,
  intervalo_padrao: 60,
  fator_hora_extra_normal: 1.5,
  fator_hora_extra_noturna: 2.0,
  fator_sabado: 1.5,
  fator_domingo: 2.0,
  fator_feriado: 2.0,
  limite_saldo_negativo: -2400,
  validade_horas_dias: 365,
  compensacao_automatica: false,
  observacoes: null,
  data_vigencia: new Date().toISOString().split("T")[0],
  data_termino: null,
  is_active: true,
};

export default function JourneyConfig() {
  const { organizationId } = useCurrentOrganization();
  const { data: configs = [], isLoading } = useJourneyConfigs();
  const { data: employees = [] } = useEmployees();
  const createMutation = useCreateJourneyConfig();
  const updateMutation = useUpdateJourneyConfig();
  const deleteMutation = useDeleteJourneyConfig();

  const { data: overrides = [] } = useEscalaOverrides();
  const deleteOverrideMutation = useDeleteEscalaOverride();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [step, setStep] = useState(0);

  const activeEmployees = useMemo(
    () => (employees || []).filter((e) => e.status === "active"),
    [employees]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setStep(0);
    setDialogOpen(true);
  };

  const openEdit = (config: JourneyConfig) => {
    setEditingId(config.id);
    setForm({
      employee_id: config.employee_id,
      tipo_jornada: config.tipo_jornada,
      horas_semana: Number(config.horas_semana),
      horas_dia: Number(config.horas_dia),
      dias_trabalho: config.dias_trabalho,
      tolerancia_atraso: config.tolerancia_atraso,
      tolerancia_saida_antecipada: config.tolerancia_saida_antecipada,
      intervalo_padrao: config.intervalo_padrao,
      fator_hora_extra_normal: Number(config.fator_hora_extra_normal),
      fator_hora_extra_noturna: Number(config.fator_hora_extra_noturna),
      fator_sabado: Number(config.fator_sabado),
      fator_domingo: Number(config.fator_domingo),
      fator_feriado: Number(config.fator_feriado),
      limite_saldo_negativo: config.limite_saldo_negativo,
      validade_horas_dias: config.validade_horas_dias,
      compensacao_automatica: config.compensacao_automatica,
      observacoes: config.observacoes,
      data_vigencia: config.data_vigencia,
      data_termino: config.data_termino,
      is_active: config.is_active,
    });
    setStep(0);
    setDialogOpen(true);
  };

  const openDuplicate = (config: JourneyConfig) => {
    setEditingId(null);
    setForm({
      employee_id: "",
      tipo_jornada: config.tipo_jornada,
      horas_semana: Number(config.horas_semana),
      horas_dia: Number(config.horas_dia),
      dias_trabalho: config.dias_trabalho,
      tolerancia_atraso: config.tolerancia_atraso,
      tolerancia_saida_antecipada: config.tolerancia_saida_antecipada,
      intervalo_padrao: config.intervalo_padrao,
      fator_hora_extra_normal: Number(config.fator_hora_extra_normal),
      fator_hora_extra_noturna: Number(config.fator_hora_extra_noturna),
      fator_sabado: Number(config.fator_sabado),
      fator_domingo: Number(config.fator_domingo),
      fator_feriado: Number(config.fator_feriado),
      limite_saldo_negativo: config.limite_saldo_negativo,
      validade_horas_dias: config.validade_horas_dias,
      compensacao_automatica: config.compensacao_automatica,
      observacoes: config.observacoes,
      data_vigencia: new Date().toISOString().split("T")[0],
      data_termino: null,
      is_active: true,
    });
    setStep(0);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!organizationId || !form.employee_id) return;
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...form } as any);
    } else {
      await createMutation.mutateAsync({ ...form, organization_id: organizationId } as any);
    }
    setDialogOpen(false);
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      dias_trabalho: prev.dias_trabalho.includes(day)
        ? prev.dias_trabalho.filter((d) => d !== day)
        : [...prev.dias_trabalho, day],
    }));
  };

  const STEPS = ["Jornada", "Tolerâncias", "Fatores", "Banco de Horas", "Resumo"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parametrização de Jornada</h1>
          <p className="text-muted-foreground">Configure a jornada de trabalho por colaborador</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOverrideDialogOpen(true)}>
            <CalendarClock className="mr-2 h-4 w-4" />Override por Dia
          </Button>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nova Configuração</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-48 w-full" /></div>
          ) : configs.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Nenhuma configuração de jornada cadastrada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo Jornada</TableHead>
                  <TableHead>Horas/Semana</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.employees?.full_name || c.employees?.email || "—"}</TableCell>
                    <TableCell>{JOURNEY_TYPES.find((j) => j.value === c.tipo_jornada)?.label || c.tipo_jornada}</TableCell>
                    <TableCell>{Number(c.horas_semana)}h</TableCell>
                    <TableCell>{c.data_vigencia}{c.data_termino ? ` → ${c.data_termino}` : ""}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "secondary"}>
                        {c.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openDuplicate(c)}><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Lista de overrides */}
      <div>
        <h2 className="text-base font-semibold mb-3">Overrides por Dia</h2>
        <Card>
          <CardContent className="p-0">
            {overrides.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhum override cadastrado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo de Turno</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overrides.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">
                        {o.employees?.full_name || o.employees?.email || "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(o.data + "T12:00:00Z").toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        {{ normal: "Trabalho Normal", hora_extra: "Hora Extra", folga: "Folga", feriado_trabalhado: "Feriado Trabalhado" }[o.tipo_turno]}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{o.entrada || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{o.saida || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{o.motivo}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteOverrideMutation.mutate(o.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <EscalaOverrideDialog
        open={overrideDialogOpen}
        onClose={() => setOverrideDialogOpen(false)}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Nova"} Configuração de Jornada</DialogTitle>
          </DialogHeader>

          {/* Step indicators */}
          <div className="flex gap-1 mb-4">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
                  i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Step 0: Jornada */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Colaborador</Label>
                <Select value={form.employee_id} onValueChange={(v) => setForm((p) => ({ ...p, employee_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Jornada</Label>
                <Select value={form.tipo_jornada} onValueChange={(v) => setForm((p) => ({ ...p, tipo_jornada: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOURNEY_TYPES.map((j) => (
                      <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horas/Semana</Label>
                  <Input type="number" value={form.horas_semana} onChange={(e) => setForm((p) => ({ ...p, horas_semana: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Horas/Dia</Label>
                  <Input type="number" value={form.horas_dia} onChange={(e) => setForm((p) => ({ ...p, horas_dia: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label>Dias de trabalho</Label>
                <div className="flex gap-2 mt-1">
                  {WEEKDAYS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        form.dias_trabalho.includes(d.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vigência</Label>
                  <Input type="date" value={form.data_vigencia} onChange={(e) => setForm((p) => ({ ...p, data_vigencia: e.target.value }))} />
                </div>
                <div>
                  <Label>Término (opcional)</Label>
                  <Input type="date" value={form.data_termino || ""} onChange={(e) => setForm((p) => ({ ...p, data_termino: e.target.value || null }))} />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Tolerâncias */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Tolerância atraso (min)</Label>
                  <Input type="number" value={form.tolerancia_atraso} onChange={(e) => setForm((p) => ({ ...p, tolerancia_atraso: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Tolerância saída (min)</Label>
                  <Input type="number" value={form.tolerancia_saida_antecipada} onChange={(e) => setForm((p) => ({ ...p, tolerancia_saida_antecipada: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Intervalo padrão (min)</Label>
                  <Input type="number" value={form.intervalo_padrao} onChange={(e) => setForm((p) => ({ ...p, intervalo_padrao: Number(e.target.value) }))} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Fatores */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>HE Normal</Label><Input type="number" step="0.1" value={form.fator_hora_extra_normal} onChange={(e) => setForm((p) => ({ ...p, fator_hora_extra_normal: Number(e.target.value) }))} /></div>
                <div><Label>HE Noturna</Label><Input type="number" step="0.1" value={form.fator_hora_extra_noturna} onChange={(e) => setForm((p) => ({ ...p, fator_hora_extra_noturna: Number(e.target.value) }))} /></div>
                <div><Label>Sábado</Label><Input type="number" step="0.1" value={form.fator_sabado} onChange={(e) => setForm((p) => ({ ...p, fator_sabado: Number(e.target.value) }))} /></div>
                <div><Label>Domingo</Label><Input type="number" step="0.1" value={form.fator_domingo} onChange={(e) => setForm((p) => ({ ...p, fator_domingo: Number(e.target.value) }))} /></div>
                <div><Label>Feriado</Label><Input type="number" step="0.1" value={form.fator_feriado} onChange={(e) => setForm((p) => ({ ...p, fator_feriado: Number(e.target.value) }))} /></div>
              </div>
            </div>
          )}

          {/* Step 3: Banco de Horas */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Limite saldo negativo (min)</Label>
                  <Input type="number" value={form.limite_saldo_negativo} onChange={(e) => setForm((p) => ({ ...p, limite_saldo_negativo: Number(e.target.value) }))} />
                  <p className="text-xs text-muted-foreground mt-1">{Math.floor(Math.abs(form.limite_saldo_negativo) / 60)}h{String(Math.abs(form.limite_saldo_negativo) % 60).padStart(2, "0")}min</p>
                </div>
                <div>
                  <Label>Validade (dias)</Label>
                  <Input type="number" value={form.validade_horas_dias} onChange={(e) => setForm((p) => ({ ...p, validade_horas_dias: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.compensacao_automatica} onCheckedChange={(v) => setForm((p) => ({ ...p, compensacao_automatica: v }))} />
                <Label>Compensação automática</Label>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={form.observacoes || ""} onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value || null }))} rows={3} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))} />
                <Label>Configuração ativa</Label>
              </div>
            </div>
          )}

          {/* Step 4: Resumo */}
          {step === 4 && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Colaborador:</span> {activeEmployees.find((e) => e.id === form.employee_id)?.full_name || "—"}</div>
                <div><span className="text-muted-foreground">Tipo:</span> {JOURNEY_TYPES.find((j) => j.value === form.tipo_jornada)?.label}</div>
                <div><span className="text-muted-foreground">Horas/Semana:</span> {form.horas_semana}h</div>
                <div><span className="text-muted-foreground">Horas/Dia:</span> {form.horas_dia}h</div>
                <div><span className="text-muted-foreground">Tolerância atraso:</span> {form.tolerancia_atraso} min</div>
                <div><span className="text-muted-foreground">Intervalo:</span> {form.intervalo_padrao} min</div>
                <div><span className="text-muted-foreground">HE Normal:</span> {form.fator_hora_extra_normal}x</div>
                <div><span className="text-muted-foreground">HE Noturna:</span> {form.fator_hora_extra_noturna}x</div>
                <div><span className="text-muted-foreground">Sábado:</span> {form.fator_sabado}x</div>
                <div><span className="text-muted-foreground">Domingo:</span> {form.fator_domingo}x</div>
                <div><span className="text-muted-foreground">Feriado:</span> {form.fator_feriado}x</div>
                <div><span className="text-muted-foreground">Compensação auto:</span> {form.compensacao_automatica ? "Sim" : "Não"}</div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {step > 0 && <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Anterior</Button>}
            </div>
            <div className="flex gap-2">
              {step < 4 ? (
                <Button onClick={() => setStep((s) => s + 1)}>Próximo</Button>
              ) : (
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Salvar" : "Criar"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
