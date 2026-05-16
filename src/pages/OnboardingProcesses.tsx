import { useState } from "react";
import { useOnboardingProcesses } from "@/hooks/useOnboardingProcesses";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  pendente: "outline",
  em_andamento: "secondary",
  concluido: "default",
  cancelado: "outline",
};
const statusLabel: Record<string, string> = {
  pendente: "Pendente", em_andamento: "Em andamento", concluido: "Concluído", cancelado: "Cancelado",
};

export default function OnboardingProcesses() {
  const { list, create } = useOnboardingProcesses();
  const { employees } = useEmployees();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [expected, setExpected] = useState("");

  const handleCreate = async () => {
    if (!employeeId) return;
    await create.mutateAsync({ employee_id: employeeId, expected_completion_at: expected || undefined });
    setOpen(false); setEmployeeId(""); setExpected("");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Digital</h1>
          <p className="text-muted-foreground">Processos de admissão digital com checklist, documentos e portal do colaborador</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo processo</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processos ({list.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : !list.data?.length ? (
            <p className="text-muted-foreground text-sm">Nenhum processo de onboarding criado ainda. Clique em "Novo processo" para iniciar.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/onboarding-processes/${p.id}`)}>
                    <TableCell className="font-medium">{p.employee?.full_name ?? "-"}</TableCell>
                    <TableCell><Badge variant={statusVariant[p.status]}>{statusLabel[p.status]}</Badge></TableCell>
                    <TableCell>{p.started_at ? new Date(p.started_at).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell>{p.expected_completion_at ? new Date(p.expected_completion_at).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell>
                      {p.portal_submitted_at ? <Badge>Enviado</Badge> :
                        p.portal_started_at ? <Badge variant="secondary">Em preenchimento</Badge> :
                        <Badge variant="outline">Não acessado</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/onboarding-processes/${p.id}`); }}>
                        Abrir <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo processo de onboarding</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger><SelectValue placeholder="Selecione um colaborador" /></SelectTrigger>
                <SelectContent>
                  {employees.data?.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name} — {e.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Serão criadas etapas padrão (documentos, exame, contrato, integração) e lista de documentos obrigatórios.</p>
            </div>
            <div>
              <Label>Previsão de conclusão</Label>
              <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!employeeId || create.isPending}>Criar processo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
