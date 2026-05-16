import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdmissions, useCreateAdmission } from "@/hooks/useAdmissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Mail, Calendar, Eye } from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "outline" },
  invited: { label: "Convidado", variant: "secondary" },
  in_progress: { label: "Em andamento", variant: "default" },
  review: { label: "Em revisão", variant: "default" },
  signed: { label: "Assinado", variant: "default" },
  completed: { label: "Concluído", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export default function Admissoes() {
  const { data: admissions = [], isLoading } = useAdmissions();
  const create = useCreateAdmission();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ candidate_name: "", candidate_email: "", candidate_phone: "", expected_start_date: "", contract_type: "clt" });

  const counts = {
    total: admissions.length,
    in_progress: admissions.filter((a) => ["invited", "in_progress", "review"].includes(a.status)).length,
    completed: admissions.filter((a) => a.status === "completed").length,
    cancelled: admissions.filter((a) => a.status === "cancelled").length,
  };

  const handleCreate = async () => {
    if (!form.candidate_name || !form.candidate_email) {
      toast.error("Preencha nome e e-mail");
      return;
    }
    try {
      await create.mutateAsync(form);
      toast.success("Admissão criada com sucesso");
      setOpen(false);
      setForm({ candidate_name: "", candidate_email: "", candidate_phone: "", expected_start_date: "", contract_type: "clt" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admissão Digital</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie processos admissionais ponta-a-ponta: do convite ao candidato até a criação do colaborador.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="size-4 mr-2" />Nova admissão</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Iniciar nova admissão</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label>Nome do candidato *</Label><Input value={form.candidate_name} onChange={(e) => setForm({ ...form, candidate_name: e.target.value })} /></div>
              <div><Label>E-mail *</Label><Input type="email" value={form.candidate_email} onChange={(e) => setForm({ ...form, candidate_email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.candidate_phone} onChange={(e) => setForm({ ...form, candidate_phone: e.target.value })} /></div>
              <div><Label>Data prevista de início</Label><Input type="date" value={form.expected_start_date} onChange={(e) => setForm({ ...form, expected_start_date: e.target.value })} /></div>
              <div><Label>Tipo de contrato</Label><Input value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })} placeholder="clt / pj / estagio / temporario" /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={create.isPending}>Criar admissão</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.total },
          { label: "Em andamento", value: counts.in_progress },
          { label: "Concluídas", value: counts.completed },
          { label: "Canceladas", value: counts.cancelled },
        ].map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{c.label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{c.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Processos</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : admissions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <UserPlus className="size-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-foreground">Nenhuma admissão ainda</p>
              <p className="text-sm mt-1">Comece criando o primeiro processo admissional.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Início previsto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admissions.map((a) => {
                  const st = statusLabels[a.status] || { label: a.status, variant: "outline" as const };
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.candidate_name}</TableCell>
                      <TableCell className="text-muted-foreground"><Mail className="inline size-3 mr-1" />{a.candidate_email}</TableCell>
                      <TableCell><Calendar className="inline size-3 mr-1" />{a.expected_start_date ? new Date(a.expected_start_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost"><Link to={`/admissoes/${a.id}`}><Eye className="size-4" /></Link></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
