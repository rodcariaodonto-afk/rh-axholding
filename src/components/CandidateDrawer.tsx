import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Brain,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Accessibility,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import type { JobApplication } from "@/hooks/useJobApplications";
import {
  BRAZILIAN_STATES,
  RACE_OPTIONS,
  GENDER_OPTIONS,
  SEXUAL_ORIENTATION_OPTIONS,
  PCD_TYPE_OPTIONS,
  getLabelByValue,
} from "@/constants/brazilData";
import { getProfileByCode, type Profile } from "@/lib/profiler/profiles";
import { getProfilerInitials } from "@/lib/profiler/utils";
import { useRetryAIAnalysis } from "@/hooks/useRetryAIAnalysis";

interface CandidateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: JobApplication | null;
  jobData?: {
    title?: string;
    description?: string | null;
    requirements?: string | null;
    position?: { title: string } | null;
    department?: { name: string } | null;
  };
}

interface ProfilerScores {
  D: number;
  I: number;
  S: number;
  C: number;
}

const ProfileScoreBar = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{value}%</span>
    </div>
    <Progress value={value} className={`h-2 ${color}`} />
  </div>
);

const CandidateDrawer = ({
  open,
  onOpenChange,
  candidate,
  jobData,
}: CandidateDrawerProps) => {
  const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null);
  const [resumeInlineUrl, setResumeInlineUrl] = useState<string | null>(null);
  const [resumeDownloadUrl, setResumeDownloadUrl] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("info");

  const resumeAbortRef = useRef<AbortController | null>(null);
  const resumeLoadIdRef = useRef(0);

  const retryAIAnalysis = useRetryAIAnalysis();

  // Cleanup blob URL when component unmounts or candidate changes
  useEffect(() => {
    return () => {
      if (resumeBlobUrl) {
        URL.revokeObjectURL(resumeBlobUrl);
      }
    };
  }, [resumeBlobUrl]);

  // Reset resume state when candidate changes
  useEffect(() => {
    // Cancel any in-flight request tied to the previous candidate
    resumeAbortRef.current?.abort();
    resumeAbortRef.current = null;

    if (resumeBlobUrl) {
      URL.revokeObjectURL(resumeBlobUrl);
    }
    setResumeBlobUrl(null);
    setResumeInlineUrl(null);
    setResumeDownloadUrl(null);
    setResumeError(null);
    setLoadingResume(false);
    setActiveTab("info");
  }, [candidate?.id]);

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    if (
      tab === "resume" &&
      candidate?.resume_url &&
      !resumeInlineUrl &&
      !resumeBlobUrl &&
      !loadingResume
    ) {
      await loadResume();
    }
  };

  const loadResume = async () => {
    if (!candidate?.resume_url) return;

    // Cancel previous load (e.g. quick tab switches / candidate switches)
    resumeAbortRef.current?.abort();
    const controller = new AbortController();
    resumeAbortRef.current = controller;
    const loadId = ++resumeLoadIdRef.current;

    setLoadingResume(true);
    setResumeError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Normalize resume_url: strip any leading slash for storage path
      const storagePath = candidate.resume_url.startsWith("/")
        ? candidate.resume_url.slice(1)
        : candidate.resume_url;

      const ext = storagePath.split(".").pop()?.toLowerCase();

      // 1) Generate signed URL (doesn't guarantee the file exists)
      const { data: signedData, error: signedError } = await supabase.storage
        .from("resumes")
        .createSignedUrl(storagePath, 3600);

      if (controller.signal.aborted || loadId !== resumeLoadIdRef.current) return;

      if (signedError) {
        console.error("[CandidateDrawer] Signed URL error:", signedError);
        throw new Error("Não foi possível gerar URL de acesso ao arquivo.");
      }

      const rawSignedUrl =
        (signedData as any)?.signedUrl ?? (signedData as any)?.signedURL;

      if (!rawSignedUrl || typeof rawSignedUrl !== "string") {
        throw new Error("URL de acesso não retornada pelo servidor.");
      }

      // Some backends return a relative signed URL (e.g. /object/sign/...).
      // Convert it to an absolute URL so it works in window.open.
      const absoluteSignedUrl = rawSignedUrl.startsWith("http")
        ? rawSignedUrl
        : `${supabaseUrl}/storage/v1${rawSignedUrl.startsWith("/") ? rawSignedUrl : "/" + rawSignedUrl}`;

      setResumeDownloadUrl(absoluteSignedUrl);

      // Inline preview: only PDFs are reliably renderable
      if (ext && ext !== "pdf") {
        setResumeInlineUrl(null);
        setResumeBlobUrl(null);
        setResumeError(
          "Pré-visualização não disponível para este formato. Use \"Abrir em nova aba\"."
        );
        return;
      }

      // 2) Download to a blob and render via blob: URL (avoids iframe restrictions)
      // Use a timeout to avoid hanging indefinitely on slow/stuck requests
      const timeoutId = setTimeout(() => controller.abort(), 30_000);
      let res: Response;
      try {
        res = await fetch(absoluteSignedUrl, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (controller.signal.aborted || loadId !== resumeLoadIdRef.current) return;

      if (!res.ok) {
        throw new Error(
          `Não foi possível baixar o currículo (HTTP ${res.status}). Ele pode não existir no storage.`
        );
      }

      const downloadedBlob = await res.blob();
      const contentTypeHeader = res.headers.get("content-type") || "";

      // Guard against empty blobs (file may have been deleted from storage)
      if (!downloadedBlob || downloadedBlob.size === 0) {
        throw new Error(
          "O arquivo do currículo está vazio ou não existe mais no storage."
        );
      }

      // Force PDF MIME so the browser renders reliably
      const forcedType =
        ext === "pdf" ? "application/pdf" : downloadedBlob.type || contentTypeHeader;

      const typedBlob = forcedType
        ? new Blob([downloadedBlob], { type: forcedType })
        : downloadedBlob;

      const objectUrl = URL.createObjectURL(typedBlob);

      if (controller.signal.aborted || loadId !== resumeLoadIdRef.current) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      setResumeInlineUrl(null);
      setResumeBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return objectUrl;
      });
    } catch (error) {
      // If a newer load replaced this one, silently bail out
      if (loadId !== resumeLoadIdRef.current) return;

      // Aborted by candidate-change useEffect — bail silently (useEffect resets state)
      if (controller.signal.aborted && resumeAbortRef.current !== controller) return;

      // Timeout or other abort: treat as a normal error
      const errorMessage =
        controller.signal.aborted
          ? "Tempo esgotado ao baixar o currículo. Tente novamente."
          : error instanceof Error
            ? error.message
            : "Não foi possível acessar o arquivo.";

      console.error("[CandidateDrawer] Error loading resume:", error);
      setResumeError(errorMessage);
      toast({
        title: "Erro ao carregar currículo",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Always reset loading if this is still the active load
      if (loadId === resumeLoadIdRef.current) {
        setLoadingResume(false);
      }
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStateLabel = (value: string | null) => {
    return getLabelByValue(BRAZILIAN_STATES, value);
  };

  const getProfilerScores = (): ProfilerScores => {
    if (!candidate?.profiler_result_detail) {
      return { D: 0, I: 0, S: 0, C: 0 };
    }

    const detail = candidate.profiler_result_detail as any;
    const scores = detail?.data?.scores || detail?.scores;

    if (!scores) {
      return { D: 0, I: 0, S: 0, C: 0 };
    }

    // Calculate percentages from raw scores
    const rawScores = {
      EXE: scores?.EXE || 0,
      COM: scores?.COM || 0,
      PLA: scores?.PLA || 0,
      ANA: scores?.ANA || 0,
    };
    const maxScore = Math.max(...Object.values(rawScores), 1);

    return {
      D: Math.round((rawScores.EXE / maxScore) * 100),
      I: Math.round((rawScores.COM / maxScore) * 100),
      S: Math.round((rawScores.PLA / maxScore) * 100),
      C: Math.round((rawScores.ANA / maxScore) * 100),
    };
  };

  if (!candidate) return null;

  // Get the full profile from the profiles database using the code
  const profileFromDb: Profile | null = candidate.profiler_result_code 
    ? getProfileByCode(candidate.profiler_result_code) 
    : null;
  const profilerScores = getProfilerScores();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <SheetTitle className="text-xl">{candidate.candidate_name}</SheetTitle>
            {candidate.profiler_result_code && (
              <Badge variant="secondary" className="text-sm">
                {getProfilerInitials(candidate.profiler_result_code)}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="mt-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Info</span>
            </TabsTrigger>
            <TabsTrigger value="profiler" className="flex items-center gap-1">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Profiler</span>
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Análise IA</span>
            </TabsTrigger>
            <TabsTrigger value="resume" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">CV</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-200px)] mt-4">
            {/* Info Tab */}
            <TabsContent value="info" className="space-y-6 pr-4">
              {/* Personal Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Dados Pessoais
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.candidate_email}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.candidate_phone || "-"}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Nascimento: {formatDate(candidate.candidate_birth_date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {candidate.candidate_city && candidate.candidate_state
                        ? `${candidate.candidate_city}, ${getStateLabel(candidate.candidate_state)}`
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Demographics */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Informações Demográficas
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Raça</p>
                    <p className="font-medium">
                      {getLabelByValue(RACE_OPTIONS, candidate.candidate_race)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Gênero</p>
                    <p className="font-medium">
                      {getLabelByValue(GENDER_OPTIONS, candidate.candidate_gender)}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Orientação Sexual
                    </p>
                    <p className="font-medium">
                      {getLabelByValue(
                        SEXUAL_ORIENTATION_OPTIONS,
                        candidate.candidate_sexual_orientation
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* PCD */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Accessibility className="h-4 w-4" />
                  PCD
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={candidate.candidate_pcd ? "default" : "secondary"}>
                      {candidate.candidate_pcd ? "Sim" : "Não"}
                    </Badge>
                  </div>

                  {candidate.candidate_pcd && candidate.candidate_pcd_type && (
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">
                        {getLabelByValue(PCD_TYPE_OPTIONS, candidate.candidate_pcd_type)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Application Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Candidatura
                </h3>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">{formatDate(candidate.applied_at)}</p>
                  </div>

                  {candidate.ai_score !== null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Nota IA</p>
                      <Badge
                        variant={
                          candidate.ai_score >= 70
                            ? "default"
                            : candidate.ai_score >= 50
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {candidate.ai_score}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Profiler Tab - Full Profile Results */}
            <TabsContent value="profiler" className="space-y-6 pr-4">
              {profileFromDb ? (
                <>
                  {/* Profile Header */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-lg px-4 py-1">
                        {profileFromDb.code}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{profileFromDb.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {profileFromDb.subcategory}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* DISC Scores */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Pontuações DISC
                    </h4>
                    <div className="space-y-3">
                      <ProfileScoreBar
                        label="D - Dominância (Executor)"
                        value={profilerScores.D}
                        color="[&>div]:bg-red-500"
                      />
                      <ProfileScoreBar
                        label="I - Influência (Comunicador)"
                        value={profilerScores.I}
                        color="[&>div]:bg-yellow-500"
                      />
                      <ProfileScoreBar
                        label="S - Estabilidade (Planejador)"
                        value={profilerScores.S}
                        color="[&>div]:bg-green-500"
                      />
                      <ProfileScoreBar
                        label="C - Conformidade (Analista)"
                        value={profilerScores.C}
                        color="[&>div]:bg-blue-500"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Summary */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Resumo do Perfil
                    </h4>
                    <p className="text-sm leading-relaxed">{profileFromDb.summary}</p>
                  </div>

                  <Separator />

                  {/* Basic Skills */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Habilidades Básicas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profileFromDb.basicSkills.split(",").map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Main Skills */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Habilidades Principais
                    </h4>
                    <p className="text-sm leading-relaxed">{profileFromDb.mainSkills}</p>
                  </div>

                  <Separator />

                  {/* Main Advantages */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Vantagens Principais
                    </h4>
                    <p className="text-sm leading-relaxed">{profileFromDb.mainAdvantages}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Profiler não realizado</p>
                </div>
              )}
            </TabsContent>

            {/* AI Analysis Tab */}
            <TabsContent value="ai-analysis" className="space-y-6 pr-4">
              {/* Retry Button - only shows if NOT processing */}
              {candidate.ai_analysis_status !== 'pending' && 
               candidate.ai_analysis_status !== 'processing' && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (candidate) {
                        retryAIAnalysis.mutate({ candidate, jobData });
                      }
                    }}
                    disabled={retryAIAnalysis.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${retryAIAnalysis.isPending ? "animate-spin" : ""}`} />
                    {retryAIAnalysis.isPending ? "Analisando..." : "Refazer Análise"}
                  </Button>
                </div>
              )}

              {/* Status: Pending or Processing */}
              {(candidate.ai_analysis_status === 'pending' || 
                candidate.ai_analysis_status === 'processing') && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                  <p className="font-medium">
                    {candidate.ai_analysis_status === 'pending' 
                      ? 'Análise na fila...' 
                      : 'IA processando currículo...'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Isso pode levar alguns segundos
                  </p>
                </div>
              )}

              {/* Status: Error */}
              {candidate.ai_analysis_status === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro na análise</AlertTitle>
                  <AlertDescription>
                    Ocorreu um erro ao processar. Clique em "Refazer Análise" para tentar novamente.
                  </AlertDescription>
                </Alert>
              )}

              {/* Status: Completed - show score and report */}
              {candidate.ai_analysis_status === 'completed' && (
                <>
                  {/* AI Score */}
                  {candidate.ai_score !== null && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Nota de Aderência
                      </h4>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            candidate.ai_score >= 70
                              ? "default"
                              : candidate.ai_score >= 50
                                ? "secondary"
                                : "outline"
                          }
                          className="text-2xl px-4 py-2"
                        >
                          {candidate.ai_score}
                        </Badge>
                        <span className="text-sm text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* AI Report */}
                  {candidate.ai_report ? (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Relatório Detalhado
                      </h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert [&>*]:text-foreground [&_p]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_strong]:text-foreground [&_li]:text-foreground">
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                          {candidate.ai_report}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">Relatório não disponível</p>
                    </div>
                  )}
                </>
              )}

              {/* Status: Not Requested (default) */}
              {(!candidate.ai_analysis_status || 
                candidate.ai_analysis_status === 'not_requested') && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Análise IA não realizada</p>
                  <p className="text-sm mt-2">Clique em "Refazer Análise" para gerar</p>
                </div>
              )}
            </TabsContent>

            {/* Resume Tab */}
            <TabsContent value="resume" className="pr-4">
              {candidate.resume_url ? (
                loadingResume ? (
                  <div className="text-center py-8 space-y-3">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Carregando currículo...</p>
                  </div>
                ) : resumeError ? (
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erro ao carregar</AlertTitle>
                      <AlertDescription>{resumeError}</AlertDescription>
                    </Alert>
                    {resumeDownloadUrl && (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => window.open(resumeDownloadUrl, "_blank")}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Abrir em nova aba
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={loadResume}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar novamente
                    </Button>
                  </div>
                ) : (resumeInlineUrl || resumeBlobUrl) ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => resumeDownloadUrl && window.open(resumeDownloadUrl, "_blank")}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Abrir em nova aba
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={loadResume}
                        title="Recarregar"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <iframe
                      key={resumeInlineUrl ?? resumeBlobUrl ?? candidate.id}
                      src={resumeInlineUrl ?? resumeBlobUrl ?? undefined}
                      className="w-full h-[60vh] border rounded-lg"
                      title="Currículo do candidato"
                      onError={() => {
                        setResumeError(
                          "O navegador não conseguiu exibir o arquivo. Use o botão acima para abrir."
                        );
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-3">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Currículo disponível</p>
                    <Button variant="outline" onClick={loadResume}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Carregar currículo
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Currículo não enviado</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default CandidateDrawer;
