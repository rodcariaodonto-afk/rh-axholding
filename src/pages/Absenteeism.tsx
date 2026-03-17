import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Trash2, AlertTriangle, Upload, FileCheck } from "lucide-react";
import { JustificativasAprovacaoTab } from "@/components/JustificativasAprovacaoTab";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useEmployees } from "@/hooks/useEmployees";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type AbsenteeismType = "absence" | "late" | "medical_certificate" | "inss_leave";

const typeLabels: Record<AbsenteeismType, string> = {
  absence: "Falta",
  late: "Atraso",
  medical_certificate: "Atestado",
  inss_leave: "Licença INSS",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  registered: { label: "Registrado", variant: "secondary" },
  justified: { label: "Justificado", variant: "default" },
  unjustified: { label: "Injustificado", variant: "destructive" },
  under_review: { label: "Em análise", variant: "outline" },
};

const Absenteeism = () => {
  const { organizationId } = useCurrentOrganization();
  const { canEdit } = useUserRole();
  const { user } = useAuth();
  const { data: employees = [] } = useEmployees();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("absence");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    type: "absence" as AbsenteeismType,
    date: new Date().toISOString().split("T")[0],
    start_time: "",
    end_time: "",
    minutes_lost: 0,
    reason: "",
    status: "registered",
    cid_code: "",
    doctor_name: "",
    inss_start_date: "",
    inss_end_date: "",
    inss_protocol: "",
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["absenteeism", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await (supabase as any)
        .from("absenteeism")
        .select("*")
        .eq("organization_id", organizationId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("absenteeism").insert({
        organization_id: organizationId,
        employee_id: form.employee_id,
        type: form.type,
        date: form.date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        minutes_lost: form.minutes_lost,
        reason: form.reason || null,
        status: form.status,
        cid_code: form.cid_code || null,
        doctor_name: form.doctor_name || null,
        inss_start_date: form.inss_start_date || null,
        inss_end_date: form.inss_end_date || null,
        inss_protocol: form.inss_protocol || null,
        registered_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absenteeism"] });
      toast.success("Registro salvo");
      closeDialog();
    },
    onError: () => toast.error("Erro ao salvar registro"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("absenteeism").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["absenteeism"] });
      toast.success("Registro removido");
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setForm({
      employee_id: "",
      type: activeTab,
      date: new Date().toISOString().split("T")[0],
      start_time: "",
      end_time: "",
      minutes_lost: 0,
      reason: "",
      status: "registered",
      cid_code: "",
      doctor_name: "",
      inss_start_date: "",
      inss_end_date: "",
      inss_protocol: "",
    });
  };

  const openNew = () => {
    setForm((f) => ({ ...f, type: activeTab }));
    setDialogOpen(true);
  };

  const filteredRecords = records.filter((r: any) => r.type === activeTab);
  const getEmployeeName = (id: string) =>
    (employees as any[]).find((e) => e.id === id)?.full_name || "—";

  const tabCounts = {
    absence: records.filter((r: any) => r.type === "absence").length,
    late: records.filter((r: any) => r.type === "late").length,
    medical_certificate: records.filter((r: any) => r.type === "medical_certificate").length,
    inss_leave: records.filter((r: any) => r.type === "inss_leave").length,
  };

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
          <h1 className="text-2xl font-bold text-foreground">Absenteísmo</h1>
          <p className="text-muted-foreground">Faltas, atrasos, atestados e licenças INSS.</p>
        </div>
        {canEdit && (
          <Button onClick={openNew}>
            <Plus className="size-4 mr-2" />
            Novo Registro
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AbsenteeismType)}>
        <TabsList>
          <TabsTrigger value="absence">Faltas ({tabCounts.absence})</TabsTrigger>
          <TabsTrigger value="late">Atrasos ({tabCounts.late})</TabsTrigger>
          <TabsTrigger value="medical_certificate">Atestados ({tabCounts.medical_certificate})</TabsTrigger>
          <TabsTrigger value="inss_leave">Licenças INSS ({tabCounts.inss_leave})</TabsTrigger>
        </TabsList>

        {(["absence", "late", "medical_certificate", "inss_leave"] as AbsenteeismType[]).map(
          (tab) => (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Data</TableHead>
                        {tab === "late" && <TableHead>Min. Perdidos</TableHead>}
                        {tab === "medical_certificate" && <TableHead>CID</TableHead>}
                        {tab === "inss_leave" && <TableHead>Período</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Motivo</TableHead>
                        {canEdit && <TableHead className="w-16" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((r: any) => {
                        const st = statusLabels[r.status] || statusLabels.registered;
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{getEmployeeName(r.employee_id)}</TableCell>
                            <TableCell>{new Date(r.date).toLocaleDateString("pt-BR")}</TableCell>
                            {tab === "late" && <TableCell>{r.minutes_lost} min</TableCell>}
                            {tab === "medical_certificate" && <TableCell>{r.cid_code || "—"}</TableCell>}
                            {tab === "inss_leave" && (
                              <TableCell className="text-sm">
                                {r.inss_start_date
                                  ? `${new Date(r.inss_start_date).toLocaleDateString("pt-BR")} — ${r.inss_end_date ? new Date(r.inss_end_date).toLocaleDateString("pt-BR") : "em aberto"}`
                                  : "—"}
                              </TableCell>
                            )}
                            <TableCell>
                              <Badge variant={st.variant}>{st.label}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                              {r.reason || "—"}
                            </TableCell>
                            {canEdit && (
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)}>
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                      {filteredRecords.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                            <AlertTriangle className="size-10 mx-auto mb-2 opacity-30" />
                            Nenhum registro de {typeLabels[tab].toLowerCase()} encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )
        )}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Registro — {typeLabels[form.type]}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Colaborador *</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(employees as any[])
                    .filter((e) => e.status === "active")
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registered">Registrado</SelectItem>
                    <SelectItem value="justified">Justificado</SelectItem>
                    <SelectItem value="unjustified">Injustificado</SelectItem>
                    <SelectItem value="under_review">Em análise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.type === "late" && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Hora início</Label>
                  <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div>
                  <Label>Hora fim</Label>
                  <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                </div>
                <div>
                  <Label>Min. Perdidos</Label>
                  <Input type="number" value={form.minutes_lost} onChange={(e) => setForm({ ...form, minutes_lost: +e.target.value })} />
                </div>
              </div>
            )}

            {form.type === "medical_certificate" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>CID</Label>
                  <Input value={form.cid_code} onChange={(e) => setForm({ ...form, cid_code: e.target.value })} placeholder="Ex: J11" />
                </div>
                <div>
                  <Label>Médico</Label>
                  <Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} />
                </div>
              </div>
            )}

            {form.type === "inss_leave" && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Início Licença</Label>
                  <Input type="date" value={form.inss_start_date} onChange={(e) => setForm({ ...form, inss_start_date: e.target.value })} />
                </div>
                <div>
                  <Label>Fim Licença</Label>
                  <Input type="date" value={form.inss_end_date} onChange={(e) => setForm({ ...form, inss_end_date: e.target.value })} />
                </div>
                <div>
                  <Label>Protocolo INSS</Label>
                  <Input value={form.inss_protocol} onChange={(e) => setForm({ ...form, inss_protocol: e.target.value })} />
                </div>
              </div>
            )}

            <div>
              <Label>Motivo / Observação</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.employee_id}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Absenteeism;
