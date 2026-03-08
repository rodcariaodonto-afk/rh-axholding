import { useRef, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useProfilerHistory, type ProfilerHistoryEntry } from "@/hooks/useProfilerHistory";
import { Calendar, User, FileDown, TrendingUp } from "lucide-react";
import { getProfilerInitials } from "@/lib/profiler/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Json } from "@/integrations/supabase/types";

interface ProfilerResult {
  code: string;
  name: string;
  subcategory?: string;
  summary?: string;
  basicSkills?: string[];
  skills?: string;
  advantages?: string;
  category?: string;
  scores?: {
    D: number;
    I: number;
    S: number;
    C: number;
  };
}

interface ProfilerDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId?: string;
  employeeName?: string | null;
  currentProfileCode?: string | null;
  currentProfileDetail?: Json | null;
  currentCompletedAt?: string | null;
}

function parseProfilerDetail(detail: Json | null | undefined): ProfilerResult | null {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
    return null;
  }
  
  const data = detail as Record<string, unknown>;
  const profile = data.profile as Record<string, unknown> | undefined;
  
  // Se não tem estrutura aninhada, tenta usar diretamente
  if (!profile) {
    return data as unknown as ProfilerResult;
  }
  
  // Converter scores de EXE/COM/PLA/ANA para D/I/S/C em porcentagens
  const rawScores = data.scores as Record<string, number> | undefined;
  let scores = { D: 25, I: 25, S: 25, C: 25 };
  
  if (rawScores) {
    const total = (rawScores.EXE || 0) + (rawScores.COM || 0) + (rawScores.PLA || 0) + (rawScores.ANA || 0);
    if (total > 0) {
      scores = {
        D: Math.round(((rawScores.EXE || 0) / total) * 100),
        I: Math.round(((rawScores.COM || 0) / total) * 100),
        S: Math.round(((rawScores.PLA || 0) / total) * 100),
        C: Math.round(((rawScores.ANA || 0) / total) * 100),
      };
    }
  }
  
  // Converter basicSkills de string para array se necessário
  const basicSkillsRaw = profile.basicSkills;
  const basicSkillsArray = typeof basicSkillsRaw === 'string' 
    ? basicSkillsRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
    : Array.isArray(basicSkillsRaw) ? basicSkillsRaw : [];
  
  return {
    code: (data.code as string) || (profile.code as string) || '',
    name: (profile.name as string) || '',
    subcategory: profile.subcategory as string | undefined,
    summary: profile.summary as string | undefined,
    basicSkills: basicSkillsArray as string[],
    skills: profile.mainSkills as string | undefined,
    advantages: profile.mainAdvantages as string | undefined,
    category: profile.subcategory as string | undefined,
    scores,
  };
}

function ProfileScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-6 font-bold text-sm">{label}</span>
      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm text-muted-foreground">{score}%</span>
    </div>
  );
}

function ProfilerContent({ profile }: { profile: ProfilerResult }) {
  return (
    <div className="space-y-4">
      {/* Nome e Subcategoria */}
      <div>
        <h3 className="text-xl font-bold">{profile.name}</h3>
        {profile.subcategory && (
          <p className="text-muted-foreground">{profile.subcategory}</p>
        )}
      </div>

      {/* Resumo */}
      {profile.summary && (
        <p className="text-sm text-muted-foreground">{profile.summary}</p>
      )}

      {/* Scores */}
      {profile.scores && (
        <div className="space-y-2 py-2">
          <h4 className="text-sm font-semibold mb-3">Distribuição do Perfil</h4>
          <ProfileScoreBar label="D" score={profile.scores.D} color="bg-red-500" />
          <ProfileScoreBar label="I" score={profile.scores.I} color="bg-yellow-500" />
          <ProfileScoreBar label="S" score={profile.scores.S} color="bg-green-500" />
          <ProfileScoreBar label="C" score={profile.scores.C} color="bg-blue-500" />
        </div>
      )}

      <Separator />

      {/* Habilidades Básicas */}
      {profile.basicSkills && profile.basicSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Habilidades Básicas</h4>
          <div className="flex flex-wrap gap-2">
            {profile.basicSkills.map((skill, i) => (
              <Badge key={i} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Principais Habilidades */}
      {profile.skills && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Principais Habilidades</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.skills}</p>
        </div>
      )}

      {/* Principais Vantagens */}
      {profile.advantages && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Principais Vantagens</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.advantages}</p>
        </div>
      )}

      {/* Categoria */}
      {profile.category && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Categoria</h4>
          <Badge variant="outline">{profile.category}</Badge>
        </div>
      )}
    </div>
  );
}

interface EvolutionChartData {
  date: string;
  fullDate: string;
  D: number;
  I: number;
  S: number;
  C: number;
  code: string;
}

function ProfilerEvolutionChart({ history, currentProfile, currentCompletedAt }: { 
  history: ProfilerHistoryEntry[];
  currentProfile: ProfilerResult | null;
  currentCompletedAt?: string | null;
}) {
  const chartData = useMemo(() => {
    const data: EvolutionChartData[] = [];
    
    // Adicionar dados do histórico (ordem cronológica)
    const sortedHistory = [...history].reverse();
    sortedHistory.forEach((entry) => {
      const profile = parseProfilerDetail(entry.profiler_result_detail);
      if (profile?.scores) {
        data.push({
          date: format(new Date(entry.completed_at), "dd/MM/yy"),
          fullDate: format(new Date(entry.completed_at), "dd/MM/yyyy"),
          D: profile.scores.D,
          I: profile.scores.I,
          S: profile.scores.S,
          C: profile.scores.C,
          code: profile.code,
        });
      }
    });
    
    return data;
  }, [history, currentProfile, currentCompletedAt]);

  if (chartData.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Gráfico de evolução disponível após 2 ou mais testes.</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }} 
            className="text-muted-foreground"
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelFormatter={(label, payload) => {
              const item = payload?.[0]?.payload;
              return item ? `${item.fullDate} - ${item.code}` : label;
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="D" 
            name="Dominante" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="I" 
            name="Influenciador" 
            stroke="#eab308" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="S" 
            name="Estável" 
            stroke="#22c55e" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="C" 
            name="Cuidadoso" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ProfilerDetailModal({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  currentProfileCode,
  currentProfileDetail,
  currentCompletedAt,
}: ProfilerDetailModalProps) {
  const { data: history, isLoading: isLoadingHistory } = useProfilerHistory(employeeId);
  const currentProfile = parseProfilerDetail(currentProfileDetail);
  const printRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
        h3 { font-size: 16px; margin-bottom: 8px; }
        h4 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
        p { font-size: 14px; line-height: 1.6; margin-bottom: 8px; }
        .badge { display: inline-block; padding: 2px 8px; background: #f0f0f0; border-radius: 4px; font-size: 12px; margin-right: 4px; }
        .score-bar { display: flex; align-items: center; margin-bottom: 8px; }
        .score-label { width: 24px; font-weight: bold; }
        .score-track { flex: 1; height: 12px; background: #e5e5e5; border-radius: 6px; overflow: hidden; margin: 0 8px; }
        .score-fill { height: 100%; border-radius: 6px; }
        .score-fill.d { background: #ef4444; }
        .score-fill.i { background: #eab308; }
        .score-fill.s { background: #22c55e; }
        .score-fill.c { background: #3b82f6; }
        .score-value { width: 40px; text-align: right; font-size: 12px; }
        .meta { font-size: 12px; color: #666; margin-bottom: 16px; }
        @media print { body { padding: 0; } }
      </style>
    `;

    const profile = currentProfile;
    const completedDate = currentCompletedAt 
      ? format(new Date(currentCompletedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      : '';

    const scoresHtml = profile?.scores ? `
      <h4>Distribuição do Perfil</h4>
      ${['D', 'I', 'S', 'C'].map(key => {
        const score = profile.scores![key as keyof typeof profile.scores];
        return `
          <div class="score-bar">
            <span class="score-label">${key}</span>
            <div class="score-track">
              <div class="score-fill ${key.toLowerCase()}" style="width: ${score}%"></div>
            </div>
            <span class="score-value">${score}%</span>
          </div>
        `;
      }).join('')}
    ` : '';

    const basicSkillsHtml = profile?.basicSkills?.length 
      ? `<h4>Habilidades Básicas</h4><p>${profile.basicSkills.map(s => `<span class="badge">${s}</span>`).join(' ')}</p>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Perfil Comportamental - ${employeeName || 'Funcionário'}</title>
          ${styles}
        </head>
        <body>
          <h1>${employeeName || 'Funcionário'}</h1>
          <p class="meta">Perfil: <strong>${currentProfileCode || '-'}</strong> | Data: ${completedDate}</p>
          
          ${profile ? `
            <h2>${profile.name}</h2>
            ${profile.subcategory ? `<p><em>${profile.subcategory}</em></p>` : ''}
            ${profile.summary ? `<p>${profile.summary}</p>` : ''}
            
            ${scoresHtml}
            
            ${basicSkillsHtml}
            
            ${profile.skills ? `<h4>Principais Habilidades</h4><p>${profile.skills}</p>` : ''}
            
            ${profile.advantages ? `<h4>Principais Vantagens</h4><p>${profile.advantages}</p>` : ''}
            
            ${profile.category ? `<h4>Categoria</h4><p><span class="badge">${profile.category}</span></p>` : ''}
          ` : '<p>Nenhum resultado de profiler disponível.</p>'}
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <span>{employeeName || "Funcionário"}</span>
              {currentProfileCode && (
                <Badge variant="default">{currentProfileCode}</Badge>
              )}
            </DialogTitle>
            {currentProfile && (
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(85vh - 100px)' }}>
          <div className="space-y-6" ref={printRef}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Perfil Atual</h3>
                {currentCompletedAt && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(currentCompletedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                )}
              </div>

              {currentProfile ? (
                <ProfilerContent profile={currentProfile} />
              ) : (
                <p className="text-muted-foreground text-sm">
                  Nenhum resultado de profiler disponível.
                </p>
              )}
            </div>

            <Separator />

            {/* Gráfico de Evolução */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolução do Perfil
              </h3>
              
              {isLoadingHistory ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ProfilerEvolutionChart 
                  history={history || []} 
                  currentProfile={currentProfile}
                  currentCompletedAt={currentCompletedAt}
                />
              )}
            </div>

            <Separator />

            {/* Histórico */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Histórico de Profilers</h3>
              
              {isLoadingHistory ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : history && history.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {history.map((entry) => {
                    const entryProfile = parseProfilerDetail(entry.profiler_result_detail);
                    return (
                      <AccordionItem key={entry.id} value={entry.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{getProfilerInitials(entry.profiler_result_code)}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(entry.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {entryProfile ? (
                            <ProfilerContent profile={entryProfile} />
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              Dados do perfil indisponíveis.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Nenhum histórico de profiler encontrado.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
