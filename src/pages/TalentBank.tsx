import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, UserPlus, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Copy, Check, Share2, Users, Archive, ArchiveRestore } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import CandidateDrawer from "@/components/CandidateDrawer";
import AIReportModal from "@/components/AIReportModal";
import { getAllProfiles } from "@/lib/profiler/profiles";
import { getProfilerInitials } from "@/lib/profiler/utils";
import { TALENT_BANK_JOB_ID } from "@/constants/talentBank";
import type { JobApplication } from "@/hooks/useJobApplications";

const PROFILER_OPTIONS = [
  { value: "all", label: "Todos os perfis" },
  ...getAllProfiles().map(p => ({ value: p.code, label: p.name })),
  { value: "none", label: "Sem profiler" },
];

type SortField = "name" | "email" | "applied_at" | "ai_score" | "profiler" | "desired_seniority";
type SortDirection = "asc" | "desc";

interface TalentBankCandidate extends JobApplication {
  jobs: { title: string } | null;
}

export default function TalentBank() {
  const queryClient = useQueryClient();
  const [activePositionTab, setActivePositionTab] = useState<string>("all");
  const [activeSourceTab, setActiveSourceTab] = useState<"disponiveis" | "arquivados">("disponiveis");
  const [search, setSearch] = useState("");
  const [profilerFilter, setProfilerFilter] = useState("all");
  const [seniorityFilter, setSeniorityFilter] = useState("all");
  const [aiScoreFilter, setAiScoreFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField | null>("applied_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [copied, setCopied] = useState(false);
  
  const [drawerState, setDrawerState] = useState<{
    open: boolean;
    candidate: TalentBankCandidate | null;
  }>({ open: false, candidate: null });
  
  const [aiReportModal, setAIReportModal] = useState<{
    open: boolean;
    candidate: TalentBankCandidate | null;
  }>({ open: false, candidate: null });

  const applicationUrl = `${window.location.origin}/vagas/${TALENT_BANK_JOB_ID}/aplicar`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(applicationUrl);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link de candidatura foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  // Todos os candidatos que se candidataram a qualquer vaga
  const { data: availableCandidates, isLoading: isLoadingAvailable } = useQuery({
    queryKey: ["talent-bank-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select(`
          *,
          jobs:job_id (title)
        `)
        .neq("stage", "banco_talentos")
        .order("applied_at", { ascending: false });

      if (error) throw error;
      return data as TalentBankCandidate[];
    },
  });

  // Candidatos arquivados de outras vagas
  const { data: archivedCandidates, isLoading: isLoadingArchived } = useQuery({
    queryKey: ["talent-bank-archived"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select(`
          *,
          jobs:job_id (title)
        `)
        .eq("stage", "banco_talentos")
        .neq("job_id", TALENT_BANK_JOB_ID)
        .order("applied_at", { ascending: false });

      if (error) throw error;
      return data as TalentBankCandidate[];
    },
  });

  // Get unique position types from available candidates
  const positionTabs = useMemo(() => {
    if (!availableCandidates) return [];
    const positions = [...new Set(availableCandidates.map(c => c.desired_position).filter(Boolean))];
    return positions.sort() as string[];
  }, [availableCandidates]);

  const archiveMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const { error } = await supabase
        .from("job_applications")
        .update({ stage: "banco_talentos" })
        .eq("id", candidateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-bank-available"] });
      queryClient.invalidateQueries({ queryKey: ["talent-bank-archived"] });
      toast({
        title: "Candidato arquivado",
        description: "O candidato foi movido para a aba Arquivados.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível arquivar o candidato.",
        variant: "destructive",
      });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const { error } = await supabase
        .from("job_applications")
        .update({ stage: "selecao" })
        .eq("id", candidateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-bank-available"] });
      queryClient.invalidateQueries({ queryKey: ["talent-bank-archived"] });
      toast({
        title: "Candidato desarquivado",
        description: "O candidato foi movido para a aba Disponíveis.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível desarquivar o candidato.",
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (candidateId: string) => {
      const { error } = await supabase
        .from("job_applications")
        .update({ stage: "rejeitado" })
        .eq("id", candidateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-bank-available"] });
      queryClient.invalidateQueries({ queryKey: ["talent-bank-archived"] });
      toast({
        title: "Candidato removido",
        description: "O candidato foi removido do banco de talentos.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o candidato.",
        variant: "destructive",
      });
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const currentCandidates = activeSourceTab === "disponiveis" ? availableCandidates : archivedCandidates;

  const filteredAndSortedCandidates = useMemo(() => {
    if (!currentCandidates) return [];

    let result = currentCandidates.filter((c) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        c.candidate_name.toLowerCase().includes(searchLower) ||
        c.candidate_email.toLowerCase().includes(searchLower);

      let matchesProfiler = true;
      if (profilerFilter !== "all") {
        if (profilerFilter === "none") {
          matchesProfiler = !c.profiler_result_code;
        } else {
          matchesProfiler = c.profiler_result_code === profilerFilter;
        }
      }

      // Filter by position tab (only for disponiveis)
      let matchesPosition = true;
      if (activeSourceTab === "disponiveis" && activePositionTab !== "all") {
        matchesPosition = c.desired_position === activePositionTab;
      }

      // Filter by seniority
      let matchesSeniority = true;
      if (seniorityFilter !== "all") {
        matchesSeniority = c.desired_seniority === seniorityFilter;
      }

      // Filter by AI score
      let matchesAiScore = true;
      if (aiScoreFilter !== "all") {
        const score = c.ai_score;
        switch (aiScoreFilter) {
          case "high":
            matchesAiScore = score !== null && score >= 80;
            break;
          case "medium":
            matchesAiScore = score !== null && score >= 60 && score < 80;
            break;
          case "low":
            matchesAiScore = score !== null && score < 60;
            break;
          case "none":
            matchesAiScore = score === null;
            break;
        }
      }

      // Filter by location
      let matchesLocation = true;
      if (locationFilter !== "all") {
        if (locationFilter === "aracaju_se") {
          matchesLocation = c.candidate_city === "Aracaju" && c.candidate_state === "SE";
        }
      }

      return matchesSearch && matchesProfiler && matchesPosition && matchesSeniority && matchesAiScore && matchesLocation;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        let valueA: string | number | null = null;
        let valueB: string | number | null = null;

        switch (sortField) {
          case "name":
            valueA = a.candidate_name.toLowerCase();
            valueB = b.candidate_name.toLowerCase();
            break;
          case "email":
            valueA = a.candidate_email.toLowerCase();
            valueB = b.candidate_email.toLowerCase();
            break;
          case "applied_at":
            valueA = a.applied_at;
            valueB = b.applied_at;
            break;
          case "ai_score":
            valueA = a.ai_score ?? -1;
            valueB = b.ai_score ?? -1;
            break;
          case "profiler":
            valueA = a.profiler_result_code || "";
            valueB = b.profiler_result_code || "";
            break;
          case "desired_seniority":
            valueA = a.desired_seniority || "";
            valueB = b.desired_seniority || "";
            break;
        }

        if (valueA === null || valueB === null) return 0;
        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [currentCandidates, search, profilerFilter, activePositionTab, activeSourceTab, seniorityFilter, aiScoreFilter, locationFilter, sortField, sortDirection]);

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <span className="text-muted-foreground text-sm">—</span>;

    let colorClass = "";
    if (score >= 80) {
      colorClass = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    } else if (score >= 60) {
      colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    } else if (score >= 40) {
      colorClass = "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    } else {
      colorClass = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }

    return <Badge className={colorClass}>{score}</Badge>;
  };

  const isLoading = isLoadingAvailable || isLoadingArchived;

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Layout>
    );
  }

  const totalCandidates = (availableCandidates?.length || 0) + (archivedCandidates?.length || 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Banco de Talentos</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCopyLink}>
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? "Copiado!" : "Copiar Link"}
            </Button>
            <Button variant="outline" asChild>
              <a href={applicationUrl} target="_blank" rel="noopener noreferrer">
                <Share2 className="h-4 w-4 mr-2" />
                Abrir Formulário
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground">
              {availableCandidates?.length || 0} disponíveis · {archivedCandidates?.length || 0} arquivados
            </p>
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Candidatos</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-full sm:w-48"
                  />
                </div>
                <Select value={profilerFilter} onValueChange={setProfilerFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFILER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={seniorityFilter} onValueChange={setSeniorityFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Senioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Pleno">Pleno</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={aiScoreFilter} onValueChange={setAiScoreFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Nota IA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta (80+)</SelectItem>
                    <SelectItem value="medium">Média (60-79)</SelectItem>
                    <SelectItem value="low">Baixa (&lt;60)</SelectItem>
                    <SelectItem value="none">Sem nota</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Localização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="aracaju_se">Aracaju/SE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeSourceTab} onValueChange={(v) => setActiveSourceTab(v as "disponiveis" | "arquivados")} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="disponiveis">
                  Disponíveis ({availableCandidates?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="arquivados">
                  Arquivados ({archivedCandidates?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="disponiveis" className="mt-0">
                {/* Position sub-tabs for disponiveis */}
                {positionTabs.length > 0 && (
                  <Tabs value={activePositionTab} onValueChange={setActivePositionTab} className="mb-4">
                    <TabsList className="flex-wrap h-auto gap-1">
                      <TabsTrigger value="all" className="text-xs">
                        Todos ({availableCandidates?.length || 0})
                      </TabsTrigger>
                      {positionTabs.map(pos => {
                        const count = availableCandidates?.filter(c => c.desired_position === pos).length || 0;
                        return (
                          <TabsTrigger key={pos} value={pos} className="text-xs">
                            {pos} ({count})
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </Tabs>
                )}
                {renderCandidatesTable(false)}
              </TabsContent>

              <TabsContent value="arquivados" className="mt-0">
                {renderCandidatesTable(true)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <CandidateDrawer
        open={drawerState.open}
        onOpenChange={(open) => setDrawerState((prev) => ({ ...prev, open }))}
        candidate={drawerState.candidate}
        jobData={{
          title: drawerState.candidate?.desired_position 
            ? `${drawerState.candidate.desired_position} - ${drawerState.candidate.desired_seniority || ''}`
            : "Banco de Talentos",
          description: null,
          requirements: null,
        }}
      />

      <AIReportModal
        open={aiReportModal.open}
        onOpenChange={(open) => setAIReportModal((prev) => ({ ...prev, open }))}
        candidateName={aiReportModal.candidate?.candidate_name || ""}
        jobTitle={aiReportModal.candidate?.desired_position ? `${aiReportModal.candidate.desired_position} - ${aiReportModal.candidate.desired_seniority || ''}` : aiReportModal.candidate?.jobs?.title || "Banco de Talentos"}
        score={aiReportModal.candidate?.ai_score || null}
        report={aiReportModal.candidate?.ai_report || null}
      />
    </Layout>
  );

  function renderCandidatesTable(showOriginalJob: boolean) {
    if (filteredAndSortedCandidates.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          {(activeSourceTab === "disponiveis" ? availableCandidates?.length : archivedCandidates?.length) === 0 
            ? activeSourceTab === "disponiveis"
              ? "Nenhum candidato disponível no banco de talentos."
              : "Nenhum candidato arquivado de outras vagas."
            : "Nenhum candidato encontrado com os filtros aplicados."}
        </p>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center">
                Nome {getSortIcon("name")}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort("email")}
            >
              <div className="flex items-center">
                E-mail {getSortIcon("email")}
              </div>
            </TableHead>
            <TableHead>Vaga</TableHead>
            <TableHead>Cargo Pretendido</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort("desired_seniority")}
            >
              <div className="flex items-center">
                Senioridade {getSortIcon("desired_seniority")}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort("profiler")}
            >
              <div className="flex items-center">
                Perfil {getSortIcon("profiler")}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort("ai_score")}
            >
              <div className="flex items-center">
                Nota {getSortIcon("ai_score")}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort("applied_at")}
            >
              <div className="flex items-center">
                Data {getSortIcon("applied_at")}
              </div>
            </TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedCandidates.map((candidate) => (
            <TableRow key={candidate.id}>
              <TableCell>
                <button
                  onClick={() => setDrawerState({ open: true, candidate })}
                  className="font-medium text-left hover:text-primary hover:underline transition-colors"
                >
                  {candidate.candidate_name}
                </button>
              </TableCell>
              <TableCell>{candidate.candidate_email}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {candidate.jobs?.title || "Banco de Talentos"}
                </Badge>
              </TableCell>
              <TableCell>{candidate.desired_position || "—"}</TableCell>
              <TableCell>{candidate.desired_seniority || "—"}</TableCell>
              <TableCell>
                {candidate.profiler_result_code ? (
                  <Badge variant="secondary">
                    {getProfilerInitials(candidate.profiler_result_code)}
                  </Badge>
                ) : (
                  <Badge variant="outline">Não realizado</Badge>
                )}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => setAIReportModal({ open: true, candidate })}
                  className="focus:outline-none"
                >
                  {getScoreBadge(candidate.ai_score)}
                </button>
              </TableCell>
              <TableCell>
                {format(new Date(candidate.applied_at), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setDrawerState({ open: true, candidate })}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ver detalhes
                    </DropdownMenuItem>
                    {!showOriginalJob && (
                      <DropdownMenuItem
                        onClick={() => archiveMutation.mutate(candidate.id)}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Arquivar
                      </DropdownMenuItem>
                    )}
                    {showOriginalJob && (
                      <DropdownMenuItem
                        onClick={() => unarchiveMutation.mutate(candidate.id)}
                      >
                        <ArchiveRestore className="h-4 w-4 mr-2" />
                        Desarquivar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => removeMutation.mutate(candidate.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover do banco
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
}
