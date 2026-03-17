import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import { useJourneyConfigByEmployee } from "@/hooks/useJourneyConfig";

const JOURNEY_LABELS: Record<string, string> = {
  "44h": "CLT 44h semanais",
  "6x1": "Escala 6x1",
  horista: "Horista",
  comercial: "Comercial",
  plantao: "Plantão",
  customizada: "Customizada",
};

const DAY_LABELS: Record<string, string> = {
  seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo",
};

export function BancoHorasConfig() {
  const [employeeId, setEmployeeId] = useState<string>("");
  const { data: employees = [] } = useEmployees();
  const activeEmployees = useMemo(() => (employees || []).filter((e) => e.status === "active"), [employees]);
  const { data: config, isLoading } = useJourneyConfigByEmployee(employeeId || undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Colaborador</label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {activeEmployees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/journey-config"><ExternalLink className="mr-2 h-4 w-4" />Gerenciar Jornadas</Link>
        </Button>
      </div>

      {!employeeId ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione um colaborador.</CardContent></Card>
      ) : isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !config ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma configuração de jornada ativa para este colaborador.
          <br />
          <Button variant="link" asChild className="mt-2"><Link to="/journey-config">Configurar agora →</Link></Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Jornada</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span>{JOURNEY_LABELS[config.tipo_jornada] || config.tipo_jornada}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Horas/Semana</span><span>{Number(config.horas_semana)}h</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Horas/Dia</span><span>{Number(config.horas_dia)}h</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dias</span><span>{config.dias_trabalho.map((d) => DAY_LABELS[d]?.slice(0, 3) || d).join(", ")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vigência</span><span>{config.data_vigencia}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={config.is_active ? "default" : "secondary"}>{config.is_active ? "Ativo" : "Inativo"}</Badge></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Tolerâncias & Fatores</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Tolerância atraso</span><span>{config.tolerancia_atraso} min</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tolerância saída</span><span>{config.tolerancia_saida_antecipada} min</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Intervalo</span><span>{config.intervalo_padrao} min</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">HE Normal</span><span>{Number(config.fator_hora_extra_normal)}x</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">HE Noturna</span><span>{Number(config.fator_hora_extra_noturna)}x</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sábado</span><span>{Number(config.fator_sabado)}x</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Domingo</span><span>{Number(config.fator_domingo)}x</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Feriado</span><span>{Number(config.fator_feriado)}x</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Compensação auto</span><span>{config.compensacao_automatica ? "Sim" : "Não"}</span></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
