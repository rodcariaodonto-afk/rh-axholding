import { useState } from "react";
import { useMedicalExams } from "@/hooks/useMedicalExams";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { differenceInDays } from "date-fns";

const resultVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  apto: "default",
  apto_com_restricoes: "secondary",
  inapto: "destructive",
  pendente: "outline",
};

const typeLabel: Record<string, string> = {
  admissional: "Admissional",
  periodico: "Periódico",
  retorno_ao_trabalho: "Retorno ao Trabalho",
  mudanca_de_funcao: "Mudança de Função",
  demissional: "Demissional",
  complementar: "Complementar",
};

export default function MedicalExams() {
  const { list } = useMedicalExams();
  const [filter, setFilter] = useState<"todos" | "vencendo" | "vencidos">("todos");

  const filtered = list.data?.filter((e) => {
    if (filter === "todos" || !e.valid_until) return filter === "todos";
    const days = differenceInDays(new Date(e.valid_until), new Date());
    if (filter === "vencendo") return days >= 0 && days <= 30;
    if (filter === "vencidos") return days < 0;
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">ASO — Exames Ocupacionais</h1>
        <p className="text-muted-foreground">Atestados de Saúde Ocupacional dos colaboradores</p>
      </div>

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
        <CardHeader>
          <CardTitle>Exames ({filtered?.length ?? 0})</CardTitle>
        </CardHeader>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.employee?.full_name ?? "-"}</TableCell>
                    <TableCell>{typeLabel[e.exam_type]}</TableCell>
                    <TableCell>{new Date(e.exam_date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{e.valid_until ? new Date(e.valid_until).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell>{e.result ? <Badge variant={resultVariant[e.result]}>{e.result.replace(/_/g, " ")}</Badge> : "-"}</TableCell>
                    <TableCell>{e.doctor_name ?? "-"}</TableCell>
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
