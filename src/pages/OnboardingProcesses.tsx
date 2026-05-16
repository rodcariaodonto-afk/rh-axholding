import { useOnboardingProcesses } from "@/hooks/useOnboardingProcesses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  pendente: "outline",
  em_andamento: "secondary",
  concluido: "default",
  cancelado: "outline",
};

export default function OnboardingProcesses() {
  const { list, updateStatus } = useOnboardingProcesses();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Onboarding Digital</h1>
        <p className="text-muted-foreground">Processos de admissão digital dos colaboradores</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processos ({list.data?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : !list.data?.length ? (
            <p className="text-muted-foreground text-sm">Nenhum processo de onboarding criado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.employee?.full_name ?? "-"}</TableCell>
                    <TableCell><Badge variant={statusVariant[p.status]}>{p.status}</Badge></TableCell>
                    <TableCell>{p.started_at ? new Date(p.started_at).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell>{p.expected_completion_at ? new Date(p.expected_completion_at).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {p.status === "pendente" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: p.id, status: "em_andamento" })}>Iniciar</Button>
                      )}
                      {p.status === "em_andamento" && (
                        <Button size="sm" onClick={() => updateStatus.mutate({ id: p.id, status: "concluido" })}>Concluir</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
