import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useJobApplications, type JobApplication, type CandidateStage } from "@/hooks/useJobApplications";
import { useUpdateCandidateStage, STAGE_LABELS } from "@/hooks/useUpdateCandidateStage";
import CandidateDrawer from "./CandidateDrawer";
import AIReportModal from "./AIReportModal";
import { getAllProfiles, getProfileByCode } from "@/lib/profiler/profiles";
import { getProfilerInitials } from "@/lib/profiler/utils";

const PROFILER_OPTIONS = [
  { value: "all", label: "Todos os perfis" },
  ...getAllProfiles().map(p => ({ value: p.code, label: p.name })),
  { value: "none", label: "Sem profiler" },
];

const KANBAN_STAGES: CandidateStage[] = ["selecao", "fit_cultural", "fit_tecnico", "pre_admissao"];

interface CandidateKanbanBoardProps {
  jobId: string;
  jobTitle?: string;
  isDemoMode?: boolean;
  jobData?: {
    title?: string;
    description?: string | null;
    requirements?: string | null;
    position?: { title: string } | null;
    department?: { name: string } | null;
  };
}

interface CandidateCardProps {
  candidate: JobApplication;
  onClick: () => void;
  onScoreClick: () => void;
  isDragging?: boolean;
}

const calculateAge = (birthDate: string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const getScoreColor = (score: number | null) => {
  if (score === null) return "secondary";
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  if (score >= 40) return "orange";
  return "error";
};

const CandidateCard = ({ candidate, onClick, onScoreClick, isDragging }: CandidateCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const age = calculateAge(candidate.candidate_birth_date);
  const location = candidate.candidate_city && candidate.candidate_state 
    ? `${candidate.candidate_city}` 
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between items-start gap-2" onClick={onClick}>
        {/* Left side */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate hover:text-primary transition-colors">
            {candidate.candidate_name}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {[age && `${age} anos`, location].filter(Boolean).join(", ") || "—"}
          </p>
        </div>
        {/* Right side */}
        <div className="flex flex-col items-end gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onScoreClick(); }}
            className="hover:opacity-80 transition-opacity"
          >
            {candidate.ai_score !== null ? (
              <Badge variant={getScoreColor(candidate.ai_score)} className="text-xs font-semibold">
                {candidate.ai_score}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </button>
          {candidate.profiler_result_code ? (
            (() => {
              const profile = getProfileByCode(candidate.profiler_result_code);
              return profile ? (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{
                    borderColor: profile.color,
                    color: profile.color,
                    backgroundColor: `${profile.color.replace(')', ', 0.1)')}`,
                  }}
                >
                  {getProfilerInitials(candidate.profiler_result_code)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  {getProfilerInitials(candidate.profiler_result_code)}
                </Badge>
              );
            })()
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </div>
    </div>
  );
};

const DragOverlayCard = ({ candidate }: { candidate: JobApplication }) => {
  const age = calculateAge(candidate.candidate_birth_date);
  const location = candidate.candidate_city && candidate.candidate_state 
    ? `${candidate.candidate_city}` 
    : null;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg cursor-grabbing">
      <div className="flex justify-between items-start gap-2">
        {/* Left side */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {candidate.candidate_name}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {[age && `${age} anos`, location].filter(Boolean).join(", ") || "—"}
          </p>
        </div>
        {/* Right side */}
        <div className="flex flex-col items-end gap-1">
          {candidate.ai_score !== null ? (
            <Badge variant={getScoreColor(candidate.ai_score)} className="text-xs font-semibold">
              {candidate.ai_score}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          {candidate.profiler_result_code ? (
            (() => {
              const profile = getProfileByCode(candidate.profiler_result_code);
              return profile ? (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{
                    borderColor: profile.color,
                    color: profile.color,
                    backgroundColor: `${profile.color.replace(')', ', 0.1)')}`,
                  }}
                >
                  {getProfilerInitials(candidate.profiler_result_code)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  {getProfilerInitials(candidate.profiler_result_code)}
                </Badge>
              );
            })()
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </div>
    </div>
  );
};

interface KanbanColumnProps {
  stage: CandidateStage;
  candidates: JobApplication[];
  onCandidateClick: (candidate: JobApplication) => void;
  onScoreClick: (candidate: JobApplication) => void;
  activeId: string | null;
}

const KanbanColumn = ({ stage, candidates, onCandidateClick, onScoreClick, activeId }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${stage}`,
    data: { stage },
  });

  return (
    <div className="flex-1 min-w-[250px] max-w-[300px]">
      <div 
        ref={setNodeRef}
        className={`bg-muted/50 rounded-lg p-3 h-full flex flex-col transition-colors ${
          isOver ? "bg-muted ring-2 ring-primary/50" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">{STAGE_LABELS[stage]}</h3>
          <Badge variant="secondary" className="text-xs">
            {candidates.length}
          </Badge>
        </div>
        <ScrollArea className="flex-1 -mx-1 px-1">
          <SortableContext items={candidates.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 min-h-[200px]">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() => onCandidateClick(candidate)}
                  onScoreClick={() => onScoreClick(candidate)}
                  isDragging={activeId === candidate.id}
                />
              ))}
              {candidates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum candidato
                </div>
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  );
};

const CandidateKanbanBoard = ({ jobId, jobTitle = "Vaga", jobData, isDemoMode = false }: CandidateKanbanBoardProps) => {
  const { data: candidates, isLoading } = useJobApplications(jobId, { isDemoMode });
  const updateStageMutation = useUpdateCandidateStage();

  const [drawerState, setDrawerState] = useState<{
    open: boolean;
    candidate: JobApplication | null;
  }>({ open: false, candidate: null });

  const [aiReportModal, setAIReportModal] = useState<{
    open: boolean;
    candidate: JobApplication | null;
  }>({ open: false, candidate: null });

  const [minScore, setMinScore] = useState<string>("");
  const [profilerFilter, setProfilerFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"score_desc" | "score_asc" | "date_desc" | "date_asc">("score_desc");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];

    let result = [...candidates];

    // Filter by minimum score
    const minScoreNum = parseInt(minScore);
    if (!isNaN(minScoreNum) && minScoreNum > 0) {
      result = result.filter(c => c.ai_score !== null && c.ai_score >= minScoreNum);
    }

    // Filter by profiler
    if (profilerFilter !== "all") {
      if (profilerFilter === "none") {
        result = result.filter(c => !c.profiler_result_code);
      } else {
        result = result.filter(c => c.profiler_result_code === profilerFilter);
      }
    }

    return result;
  }, [candidates, minScore, profilerFilter]);

  const candidatesByStage = useMemo(() => {
    const result: Record<CandidateStage, JobApplication[]> = {
      selecao: [],
      fit_cultural: [],
      fit_tecnico: [],
      pre_admissao: [],
      banco_talentos: [],
      rejeitado: [],
      contratado: [],
    };

    filteredCandidates.forEach(candidate => {
      const stage = candidate.stage || "selecao";
      if (result[stage]) {
        result[stage].push(candidate);
      }
    });

    // Sort each stage based on selected order
    Object.keys(result).forEach(stage => {
      result[stage as CandidateStage].sort((a, b) => {
        switch (sortOrder) {
          case "score_desc":
            if (a.ai_score === null && b.ai_score === null) return 0;
            if (a.ai_score === null) return 1;
            if (b.ai_score === null) return -1;
            return b.ai_score - a.ai_score;
          case "score_asc":
            if (a.ai_score === null && b.ai_score === null) return 0;
            if (a.ai_score === null) return 1;
            if (b.ai_score === null) return -1;
            return a.ai_score - b.ai_score;
          case "date_desc":
            return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
          case "date_asc":
            return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
          default:
            return 0;
        }
      });
    });

    return result;
  }, [filteredCandidates, sortOrder]);

  const activeCandidate = useMemo(() => {
    if (!activeId || !candidates) return null;
    return candidates.find(c => c.id === activeId) || null;
  }, [activeId, candidates]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const candidateId = active.id as string;
    const candidate = candidates?.find(c => c.id === candidateId);
    if (!candidate) return;

    // Find target stage from the drop zone
    let targetStage: CandidateStage | null = null;
    const overId = over.id as string;

    // Check if dropped on a column
    if (overId.startsWith("column-")) {
      targetStage = overId.replace("column-", "") as CandidateStage;
    } else {
      // Check if dropped over another candidate - get their stage
      const targetCandidate = candidates?.find(c => c.id === overId);
      if (targetCandidate) {
        targetStage = targetCandidate.stage || "selecao";
      }
    }

    // If we found a target stage and it's different from current, update
    if (targetStage && KANBAN_STAGES.includes(targetStage)) {
      const currentStage = candidate.stage || "selecao";
      if (currentStage !== targetStage) {
        updateStageMutation.mutate({
          candidateIds: [candidateId],
          stage: targetStage,
          jobId,
        });
      }
    }
  };

  const handleOpenDrawer = (candidate: JobApplication) => {
    setDrawerState({ open: true, candidate });
  };

  const handleViewAIReport = (candidate: JobApplication) => {
    setAIReportModal({ open: true, candidate });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seleção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[400px] w-[250px]" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seleção ({candidates?.length || 0} candidatos)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={profilerFilter} onValueChange={setProfilerFilter}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="Filtrar por perfil" />
                </SelectTrigger>
                <SelectContent>
                  {PROFILER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Nota mínima"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="w-32 h-9"
                min={0}
                max={100}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Ordenar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setSortOrder("score_desc")}
                    className={sortOrder === "score_desc" ? "bg-accent" : ""}
                  >
                    Maior pontuação IA
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortOrder("score_asc")}
                    className={sortOrder === "score_asc" ? "bg-accent" : ""}
                  >
                    Menor pontuação IA
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortOrder("date_desc")}
                    className={sortOrder === "date_desc" ? "bg-accent" : ""}
                  >
                    Mais recentes
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortOrder("date_asc")}
                    className={sortOrder === "date_asc" ? "bg-accent" : ""}
                  >
                    Mais antigos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {KANBAN_STAGES.map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  candidates={candidatesByStage[stage]}
                  onCandidateClick={handleOpenDrawer}
                  onScoreClick={handleViewAIReport}
                  activeId={activeId}
                />
              ))}
            </div>
            <DragOverlay>
              {activeCandidate ? (
                <DragOverlayCard candidate={activeCandidate} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>

      <CandidateDrawer
        open={drawerState.open}
        onOpenChange={(open) => setDrawerState((prev) => ({ ...prev, open }))}
        candidate={drawerState.candidate}
        jobData={jobData}
      />

      <AIReportModal
        open={aiReportModal.open}
        onOpenChange={(open) => setAIReportModal((prev) => ({ ...prev, open }))}
        candidateName={aiReportModal.candidate?.candidate_name || ""}
        jobTitle={jobTitle}
        score={aiReportModal.candidate?.ai_score || null}
        report={aiReportModal.candidate?.ai_report || null}
      />
    </>
  );
};

export default CandidateKanbanBoard;
