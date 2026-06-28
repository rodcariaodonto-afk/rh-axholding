import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Upload, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTimeClockDevices,
  useUpsertDevice,
  useDeleteDevice,
  useDeviceSyncLogs,
  type TimeClockDevice,
  type TimeClockDeviceType,
  type TimeClockIntegrationMode,
  type TimeClockDeviceStatus,
} from "@/hooks/useTimeClockDevices";
import { useCostCenters } from "@/hooks/useCostCenters";
import { useLegalEntities } from "@/hooks/useLegalEntities";
import { useOrganizationLocations } from "@/hooks/useOrganizationLocations";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const DEVICE_TYPES: { value: TimeClockDeviceType; label: string }[] = [
  { value: "rep_p", label: "REP-P (Programa)" },
  { value: "rep_a", label: "REP-A (Alternativo)" },
  { value: "rep_c", label: "REP-C (Convencional)" },
  { value: "tablet_kiosk", label: "Tablet / Quiosque" },
  { value: "mobile_app", label: "App Mobile" },
  { value: "web", label: "Web" },
  { value: "qr_gps", label: "QR Code + GPS" },
  { value: "biometric", label: "Biometria" },
  { value: "manual_upload", label: "Upload Manual" },
];

const INTEGRATION_MODES: { value: TimeClockIntegrationMode; label: string }[] = [
  { value: "native", label: "Nativo (RHAXIS)" },
  { value: "api", label: "API" },
  { value: "webhook", label: "Webhook" },
  { value: "afd_file", label: "Arquivo AFD" },
  { value: "csv_file", label: "Arquivo CSV" },
  { value: "manual_upload", label: "Upload Manual" },
];

const STATUS_OPTIONS: { value: TimeClockDeviceStatus; label: string }[] = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "offline", label: "Offline" },
  { value: "error", label: "Erro" },
  { value: "pending", label: "Pendente" },
];

export function DevicesTab() {
  const { data: devices = [], isLoading } = useTimeClockDevices();
  const { data: costCenters = [] } = useCostCenters({ activeOnly: true });
  const { data: legalEntities = [] } = useLegalEntities({ activeOnly: true });
  const { locations = [] } = useOrganizationLocations();
  const upsert = useUpsertDevice();
  const del = useDeleteDevice();
  const [editing, setEditing] = useState<Partial<TimeClockDevice> | null>(null);
  const [importingDevice, setImportingDevice] = useState<TimeClockDevice | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dispositivos de ponto</h2>
          <p className="text-sm text-muted-foreground">REPs, tablets, apps, web, QR e biometria</p>
        </div>
        <Button onClick={() => setEditing({ name: "", device_type: "web", integration_mode: "native", status: "active" })}>
          <Plus className="size-4 mr-2" /> Novo dispositivo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-40 w-full" /></div>
          ) : devices.length === 0 ? (
            <p className="text-sm text-muted-foreground p-8 text-center">Nenhum dispositivo cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Integração</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Sync</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{DEVICE_TYPES.find((t) => t.value === d.device_type)?.label ?? d.device_type}</TableCell>
                    <TableCell>{INTEGRATION_MODES.find((m) => m.value === d.integration_mode)?.label ?? d.integration_mode}</TableCell>
                    <TableCell className="text-xs">
                      {costCenters.find((c) => c.id === d.cost_center_id)?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.status === "active" ? "default" : d.status === "error" ? "destructive" : "secondary"}>
                        {STATUS_OPTIONS.find((s) => s.value === d.status)?.label ?? d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.last_sync_at ? format(new Date(d.last_sync_at), "dd/MM HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {(d.integration_mode === "afd_file" || d.integration_mode === "csv_file" || d.integration_mode === "manual_upload") && (
                        <Button variant="ghost" size="sm" onClick={() => setImportingDevice(d)}>
                          <Upload className="size-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setEditing(d)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (confirm(`Remover dispositivo "${d.name}"?`)) del.mutate(d.id);
                      }}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Novo"} dispositivo</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Nome *</Label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Tipo *</Label>
                <Select value={editing.device_type} onValueChange={(v) => setEditing({ ...editing, device_type: v as TimeClockDeviceType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Modo de integração</Label>
                <Select value={editing.integration_mode} onValueChange={(v) => setEditing({ ...editing, integration_mode: v as TimeClockIntegrationMode })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INTEGRATION_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Provedor</Label>
                <Input value={editing.provider ?? ""} onChange={(e) => setEditing({ ...editing, provider: e.target.value })} placeholder="Henry, Topdata, ..." />
              </div>
              <div className="space-y-1">
                <Label>Modelo</Label>
                <Input value={editing.model ?? ""} onChange={(e) => setEditing({ ...editing, model: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Número de série</Label>
                <Input value={editing.serial_number ?? ""} onChange={(e) => setEditing({ ...editing, serial_number: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as TimeClockDeviceStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Centro de custo</Label>
                <Select value={editing.cost_center_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, cost_center_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {costCenters.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} · {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>CNPJ operacional</Label>
                <Select value={editing.legal_entity_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, legal_entity_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {legalEntities.map((l) => <SelectItem key={l.id} value={l.id}>{l.legal_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Local de trabalho</Label>
                <Select value={editing.work_location_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, work_location_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {locations.map((loc: { id: string; name: string }) => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button
              disabled={!editing?.name || !editing?.device_type || upsert.isPending}
              onClick={() => {
                if (!editing) return;
                upsert.mutate(
                  { ...editing, name: editing.name!, device_type: editing.device_type! },
                  { onSuccess: () => setEditing(null) }
                );
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      {importingDevice && (
        <ImportAfdDialog device={importingDevice} onClose={() => setImportingDevice(null)} />
      )}
    </div>
  );
}

function ImportAfdDialog({ device, onClose }: { device: TimeClockDevice; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { organization } = useCurrentOrganization();
  const { data: logs = [], refetch } = useDeviceSyncLogs(device.id);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !organization?.id) return;
    setUploading(true);
    try {
      // Upload to storage via edge function (service role)
      const path = `${organization.id}/${device.id}/${Date.now()}_${file.name}`;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("path", path);
      fd.append("device_id", device.id);
      fd.append("organization_id", organization.id);

      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/time-clock-import`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha na importação");
      toast({
        title: "Importação concluída",
        description: `Recebidos: ${json.received} · Aceitos: ${json.accepted} · Duplicados: ${json.duplicated} · Rejeitados: ${json.rejected}`,
      });
      refetch();

      // Processar eventos pendentes → time_entries
      const { error: procError } = await supabase.functions.invoke("time-clock-process", {
        body: { organization_id: organization.id },
      });
      if (procError) {
        console.warn("[time-clock-process]", procError.message);
        toast({
          title: "Aviso de processamento",
          description: "Arquivo importado, mas a conversão para registros de ponto falhou. Os eventos permanecerão pendentes.",
          variant: "destructive",
        });
      }

      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar arquivo — {device.name}</DialogTitle>
        </DialogHeader>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload AFD / CSV</CardTitle>
            <CardDescription>Arquivo será armazenado e processado de forma assíncrona</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input ref={fileRef} type="file" accept=".txt,.afd,.csv" />
            <Button onClick={handleUpload} disabled={uploading}>
              <Upload className="size-4 mr-2" />
              {uploading ? "Enviando..." : "Enviar e processar"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4" /> Últimas importações
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6 text-center">Nenhuma importação ainda</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recebidos</TableHead>
                    <TableHead>Aceitos</TableHead>
                    <TableHead>Duplicados</TableHead>
                    <TableHead>Rejeitados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.slice(0, 10).map((l: { id: string; created_at: string; sync_status: string; events_received: number; events_accepted: number; events_duplicated: number; events_rejected: number }) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{format(new Date(l.created_at), "dd/MM HH:mm")}</TableCell>
                      <TableCell>
                        <Badge variant={l.sync_status === "success" ? "default" : "destructive"}>{l.sync_status}</Badge>
                      </TableCell>
                      <TableCell>{l.events_received}</TableCell>
                      <TableCell>{l.events_accepted}</TableCell>
                      <TableCell>{l.events_duplicated}</TableCell>
                      <TableCell>{l.events_rejected}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
