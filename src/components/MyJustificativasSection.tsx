import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileWarning, Eye, Edit, XCircle, RefreshCw, Download } from "lucide-react";
import { useJustificativasPonto, type JustificativaPonto } from "@/hooks/useJustificativasPonto";
import { JustificativaModal } from "@/components/JustificativaModal";
import { JustificativaDetalhesModal } from "@/components/JustificativaDetalhesModal";

const TIPO_LABELS: Record<string, string> = {
  falta: "Falta",
  atraso: "Atraso",
  atestado: "Atestado",
  licenca_inss: "Licença INSS",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; bg: string }> = {
  pendente_justificativa: { label: "Pendente", variant: "outline", bg: "bg-yellow-50 dark:bg-yellow-950/20" },
  pendente_aprovacao: { label: "Enviada", variant: "secondary", bg: "bg-orange-50 dark:bg-orange-950/20" },
  aprovada: { label: "Aprovada", variant: "default", bg: "bg-green-50 dark:bg-green-950/20" },
  rejeitada: { label: "Rejeitada", variant: "destructive", bg: "bg-red-50 dark:bg-red-950/20" },
};

interface Props {
  userId: string;
}

export function MyJustificativasSection({ userId }: Props) {
  const { justificativas, isLoading, update, cancel, uploadFile, isUpdating } = useJustificativasPonto(userId);
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [selected, setSelected] = useState<JustificativaPonto | null>(null);

  const filtered = useMemo(() => {
    return justificativas.filter((j) => {
      if (filterTipo !== "all" && j.tipo_registro !== filterTipo) return false;
      if (filterStatus !== "all" && j.status !== filterStatus) return false;
      return true;
    });
  }, [justificativas, filterTipo, filterStatus]);

  const counts = useMemo(() => ({
    pendentes: justificativas.filter((j) => j.status === "pendente_justificativa").length,
    enviadas: justificativas.filter((j) => j.status === "pendente_aprovacao").length,
    aprovadas: justificativas.filter((j) => j.status === "aprovada").length,
    rejeitadas: justificativas.filter((j) => j.status === "rejeitada").length,
  }), [justificativas]);

  const conformidade = justificativas.length > 0
    ? Math.round(((counts.aprovadas) / justificativas.length) * 100)
    : 100;

  const handleJustificar = (j: JustificativaPonto) => {
    setSelected(j);
    setModalOpen(true);
  };

  const handleVerDetalhes = (j: JustificativaPonto) => {
    setSelected(j);
    setDetalhesOpen(true);
  };

  const handleSubmitJustificativa = (data: { id: string; motivo: string; descricao_justificativa: string; arquivo_url?: string | null; tipo_documento?: string }) => {
    update({
      id: data.id,
      motivo: data.motivo,
      descricao_justificativa: data.descricao_justificativa,
      arquivo_url: data.arquivo_url || undefined,
      tipo_documento: data.tipo_documento,
      status: "pendente_aprovacao",
      data_envio: new Date().toISOString(),
    } as any);
    setModalOpen(false);
  };

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5" />
            Justificativas de Ponto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{counts.pendentes}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">{counts.enviadas}</p>
              <p className="text-xs text-muted-foreground">Enviadas</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{counts.aprovadas}</p>
              <p className="text-xs text-muted-foreground">Aprovadas</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{counts.rejeitadas}</p>
              <p className="text-xs text-muted-foreground">Rejeitadas</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(TIPO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterTipo !== "all" || filterStatus !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterTipo("all"); setFilterStatus("all"); }}>
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Tabela */}
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma justificativa encontrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Justificativa</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((j) => {
                  const st = STATUS_CONFIG[j.status] || STATUS_CONFIG.pendente_justificativa;
                  return (
                    <TableRow key={j.id} className={st.bg}>
                      <TableCell className="text-sm">
                        {new Date(j.data_evento + "T00:00:00").toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{TIPO_LABELS[j.tipo_registro] || j.tipo_registro}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">
                        {j.descricao_evento || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">
                        {j.descricao_justificativa || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {j.status === "pendente_justificativa" && (
                            <Button variant="outline" size="sm" onClick={() => handleJustificar(j)}>
                              Justificar
                            </Button>
                          )}
                          {j.status === "pendente_aprovacao" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleJustificar(j)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => cancel(j.id)}>
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {j.status === "aprovada" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleVerDetalhes(j)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {j.arquivo_url && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <a href={j.arquivo_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </>
                          )}
                          {j.status === "rejeitada" && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleJustificar(j)}>
                                <RefreshCw className="mr-1 h-3 w-3" />
                                Justificar
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleVerDetalhes(j)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <JustificativaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        justificativa={selected}
        onSubmit={handleSubmitJustificativa}
        onUploadFile={uploadFile}
        isSubmitting={isUpdating}
      />

      <JustificativaDetalhesModal
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        justificativa={selected}
      />
    </>
  );
}
