import { useState, useMemo } from "react";
import { useCandidates, useUpdateCandidate } from "@/hooks/useCandidates";
import { useJobs } from "@/hooks/useJobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GripVertical, Mail, Phone } from "lucide-react";

const STAGES = [
  { key: "new", label: "Novos", color: "bg-muted" },
  { key: "screening", label: "Triagem", color: "bg-blue-500/10" },
  { key: "interview", label: "Entrevista", color: "bg-amber-500/10" },
  { key: "offer", label: "Proposta", color: "bg-emerald-500/10" },
  { key: "hired", label: "Contratados", color: "bg-primary/10" },
  { key: "rejected", label: "Rejeitados", color: "bg-destructive/10" },
];

export default function SelectionFunnel() {
  const { data: candidates, isLoading } = useCandidates();
  const { data: jobs } = useJobs();
  const updateCandidate = useUpdateCandidate();
  const [jobFilter, setJobFilter] = useState("all");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!candidates) return [];
    if (jobFilter === "all") return candidates;
    return candidates.filter(c => c.job_id === jobFilter);
  }, [candidates, jobFilter]);

  const getByStage = (stage: string) => filtered.filter(c => c.status === stage);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("candidateId", id);
    setDraggingId(id);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData("candidateId");
    if (candidateId) {
      updateCandidate.mutate({ id: candidateId, status: newStatus } as any);
    }
    setDraggingId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-[600px] w-full" /></div>;
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Funil de Seleção</h1>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrar por vaga" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as vagas</SelectItem>
            {jobs?.map((j) => (
              <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageItems = getByStage(stage.key);
          return (
            <div
              key={stage.key}
              className="flex-shrink-0 w-[280px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <div className={`rounded-lg ${stage.color} p-3 min-h-[500px]`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{stage.label}</h3>
                  <Badge variant="secondary" className="text-xs">{stageItems.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stageItems.map((candidate) => (
                    <Card
                      key={candidate.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate.id)}
                      className={`cursor-grab active:cursor-grabbing transition-opacity ${
                        draggingId === candidate.id ? "opacity-50" : ""
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]">{getInitials(candidate.name)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm truncate">{candidate.name}</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{candidate.email}</span>
                              </div>
                              {candidate.phone && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{candidate.phone}</span>
                                </div>
                              )}
                              {candidate.job_title && (
                                <Badge variant="outline" className="text-[10px] mt-1">{candidate.job_title}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
