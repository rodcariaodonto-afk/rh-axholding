import { useState } from "react";
import { useMedicalExams } from "@/hooks/useMedicalExams";
import { useMedicalSchedules, useMedicalExamAction } from "@/hooks/useTerminationProcess";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarPlus, FilePlus2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const resultVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  apto: "default",
  apto_com_restricoes: "secondary",
  inapto: "destructive",
  pendente: "outline",
};

const examTypeOptions = [
  { value: "admissional", label: "Admissional" },
  { value: "periodico", label: "Periódico" },
  { value: "retorno_ao_trabalho", label: "Retorno ao Trabalho" },
  { value: "mudanca_de_funcao", label: "Mudança de Função" },
  { value: "demissional", label: "Demissional" },
  { value: "complementar", label: "Complementar" },
];

const typeLabel = Object.fromEntries(examTypeOptions.map((o) => [o.value, o.label]));

const scheduleStatusLabel: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  realizado: "Realizado",
  cancelado: "Cancelado",
  remarcado: "Remarcado",
  nao_compareceu: "Não compareceu",
};

export default function MedicalExams() {
  const { list } = useMedicalExams();
  const schedules = useMedicalSchedules();
  const { data: employees } = useEmployees();
  const action = useMedicalExamAction();
  const [filter, setFilter] = useState<"todos" | "vencendo" | "vencidos">("todos");
  const [openSchedule, setOpenSchedule] = useState(false);
  const [openExam, setOpenExam] = useState(false);

  const filtered = list.data?.filter((e) => {
    if (filter === "todos" || !e.valid_until) return filter === "todos";
    const days = differenceInDays(new Date(e.valid_until), new Date());
    if (filter === "vencendo") return days >= 0 && days <= 30;
    if (filter === "vencidos") return days < 0;
    return true;
  });

  const activeEmployees = (employees ?? []).filter((e) => e.status === "active");

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">ASO — Saúde Ocupacional</h1>
          <p className="text-muted-foreground">Agendamentos e Atestados de Saúde Ocupacional</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openSchedule} onOpenChange={setOpenSchedule}>
            <DialogTrigger asChild>
              <Button variant="outline"><CalendarPlus className="size-4 mr-2" />Agendar exame</Button>
            </DialogTrigger>
            <ScheduleDialog employees={activeEmployees} onClose={() => setOpenSchedule(false)} action={action} />
          </Dialog>
          <Dialog open={openExam} onOpenChange={setOpenExam}>
            <DialogTrigger asChild>
              <Button><FilePlus2 className="size-4 mr-2" />Registrar exame</Button>
            </DialogTrigger>
            <RegisterExamDialog employees={activeEmployees} onClose={() => setOpenExam(false)} action={action} />
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="exames">
        <TabsList>
          <TabsTrigger value="exames">Exames realizados</TabsTrigger>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="exames" className="space-y-4">
          <div className="flex gap-2">
            {(["todos", "vencendo", "vencidos"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-md border ${filter === f ? "bg-primary text-primary-foreground" : "bg-background"}`}
              >
                {f === "todos" ? "Todos" : f === "vencendo" ? "Vencendo (30d)" : "Vencidos"}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle>Exames ({filtered?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              {list.isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : !filtered?.length ? (
                <p className="text-muted-foreground text-sm">Nenhum exame registrado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Válido até</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Arquivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.employee?.full_name ?? "-"}</TableCell>
                        <TableCell>{typeLabel[e.exam_type]}</TableCell>
                        <TableCell>{format(new Date(e.exam_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        <TableCell>{e.valid_until ? format(new Date(e.valid_until), "dd/MM/yyyy", { locale: ptBR }) : "-"}</TableCell>
                        <TableCell>{e.result ? <Badge variant={resultVariant[e.result]}>{e.result.replace(/_/g, " ")}</Badge> : "-"}</TableCell>
                        <TableCell>{e.doctor_name ?? "-"}</TableCell>
                        <TableCell>
                          {e.file_path ? (
                            <Button size="sm" variant="ghost" onClick={async () => {
                              const { data } = await supabase.storage.from("medical-exams").createSignedUrl(e.file_path!, 60);
                              if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                            }}>Abrir</Button>
                          ) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agendamentos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Agendamentos ({schedules.data?.length ?? 0})</CardTitle></CardHeader>
            <CardContent>
              {schedules.isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : !schedules.data?.length ? (
                <p className="text-muted-foreground text-sm">Nenhum agendamento cadastrado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Clínica</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.data.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.employee?.full_name ?? "-"}</TableCell>
                        <TableCell>{typeLabel[s.exam_type]}</TableCell>
                        <TableCell>{format(new Date(s.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell>{s.clinic_name ?? "-"}</TableCell>
                        <TableCell><Badge variant="outline">{scheduleStatusLabel[s.status] ?? s.status}</Badge></TableCell>
                        <TableCell className="space-x-2">
                          {s.status !== "cancelado" && s.status !== "realizado" && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => action.mutate({
                                action: "update_schedule", schedule_id: s.id, status: "confirmado",
                              })}>Confirmar</Button>
                              <Button size="sm" variant="ghost" onClick={() => {
                                if (confirm("Cancelar agendamento?")) {
                                  action.mutate({ action: "cancel_schedule", schedule_id: s.id });
                                }
                              }}>Cancelar</Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScheduleDialog({ employees, onClose, action }: { employees: any[]; onClose: () => void; action: any }) {
  const [form, setForm] = useState({
    employee_id: "", exam_type: "periodico", scheduled_at: "", clinic_name: "", clinic_address: "", clinic_phone: "", doctor_name: "", notes: "",
  });
  const submit = async () => {
    if (!form.employee_id || !form.scheduled_at) {
      toast.error("Colaborador e data são obrigatórios");
      return;
    }
    try {
      await action.mutateAsync({ action: "create_schedule", ...form });
      toast.success("Agendamento criado");
      onClose();
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Agendar exame ocupacional</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Colaborador</Label>
          <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo de exame</Label>
          <Select value={form.exam_type} onValueChange={(v) => setForm({ ...form, exam_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {examTypeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Data e horário</Label>
          <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Clínica</Label><Input value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={form.clinic_phone} onChange={(e) => setForm({ ...form, clinic_phone: e.target.value })} /></div>
        </div>
        <div><Label>Endereço</Label><Input value={form.clinic_address} onChange={(e) => setForm({ ...form, clinic_address: e.target.value })} /></div>
        <div><Label>Médico responsável</Label><Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} /></div>
        <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit} disabled={action.isPending}>Agendar</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function RegisterExamDialog({ employees, onClose, action }: { employees: any[]; onClose: () => void; action: any }) {
  const [form, setForm] = useState<any>({
    employee_id: "", exam_type: "periodico", exam_date: "", valid_until: "",
    doctor_name: "", doctor_crm: "", clinic_name: "", result: "apto", restrictions: "", notes: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const submit = async () => {
    if (!form.employee_id || !form.exam_date) { toast.error("Campos obrigatórios faltando"); return; }
    setUploading(true);
    try {
      let file_path: string | undefined;
      if (file) {
        const res = await action.mutateAsync({
          action: "signed_upload_url", employee_id: form.employee_id, file_name: file.name,
        });
        const up = await supabase.storage.from("medical-exams").uploadToSignedUrl(res.path, res.token, file);
        if (up.error) throw up.error;
        file_path = res.path;
      }
      await action.mutateAsync({ action: "register_exam", ...form, file_path });
      toast.success("Exame registrado");
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>Registrar exame ocupacional</DialogTitle></DialogHeader>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Colaborador</Label>
            <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.exam_type} onValueChange={(v) => setForm({ ...form, exam_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{examTypeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Data do exame</Label><Input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} /></div>
          <div><Label>Válido até</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
          <div><Label>Médico</Label><Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} /></div>
          <div><Label>CRM</Label><Input value={form.doctor_crm} onChange={(e) => setForm({ ...form, doctor_crm: e.target.value })} /></div>
          <div><Label>Clínica</Label><Input value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} /></div>
          <div>
            <Label>Resultado</Label>
            <Select value={form.result} onValueChange={(v) => setForm({ ...form, result: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apto">Apto</SelectItem>
                <SelectItem value="apto_com_restricoes">Apto com restrições</SelectItem>
                <SelectItem value="inapto">Inapto</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Restrições</Label><Textarea value={form.restrictions} onChange={(e) => setForm({ ...form, restrictions: e.target.value })} /></div>
        <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div>
          <Label>Arquivo do ASO (PDF)</Label>
          <div className="flex items-center gap-2">
            <Input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Upload className="size-4 text-muted-foreground" />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit} disabled={uploading || action.isPending}>{uploading ? "Enviando..." : "Registrar"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
