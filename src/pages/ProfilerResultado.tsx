import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProfileResult, getScorePercentages, profileLabels } from "@/lib/profiler/calculateProfile";
import { CheckCircle2, Sparkles, Target, Award, TrendingUp, Send, Loader2, Save, Home } from "lucide-react";
import { useCreateJobApplication } from "@/hooks/useCreateJobApplication";
import { useSaveEmployeeProfiler } from "@/hooks/useSaveEmployeeProfiler";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";
import Layout from "@/components/Layout";

const ProfilerResultado = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const [result, setResult] = useState<ProfileResult | null>(null);
  const [pendingApplication, setPendingApplication] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoSaveAttempted, setAutoSaveAttempted] = useState(false);
  
  const { user } = useAuth();
  const createApplication = useCreateJobApplication();
  const saveProfiler = useSaveEmployeeProfiler();

  useEffect(() => {
    const stored = sessionStorage.getItem("profiler_result");
    if (!stored) {
      navigate("/profiler-intro");
      return;
    }
    setResult(JSON.parse(stored));

    // Load pending application data
    const pending = sessionStorage.getItem("pending_application");
    if (pending) {
      setPendingApplication(JSON.parse(pending));
    } else if (applicationId) {
      // Has applicationId (job_id) but no pending data
      // This means the user accessed the URL directly with expired session
      toast({
        title: "Sessão expirada",
        description: "Por favor, preencha o formulário novamente.",
        variant: "destructive",
      });
      navigate(`/vagas/${applicationId}`);
      return;
    }
  }, [navigate, applicationId]);

  // Auto-save for logged-in employees (not during job application flow)
  useEffect(() => {
    const shouldAutoSave = 
      user && 
      !pendingApplication && 
      result && 
      !saved && 
      !autoSaveAttempted && 
      !saveProfiler.isPending;

    if (shouldAutoSave) {
      setAutoSaveAttempted(true);
      saveProfiler.mutateAsync({
        profiler_result_code: result.code,
        profiler_result_detail: result as unknown as Json,
      }).then(() => {
        setSaved(true);
        toast({
          title: "Perfil salvo",
          description: "Seu resultado foi salvo automaticamente no seu perfil.",
        });
      }).catch((error) => {
        console.error("Auto-save failed:", error);
        // Reset to allow manual retry
        setAutoSaveAttempted(false);
      });
    }
  }, [user, pendingApplication, result, saved, autoSaveAttempted, saveProfiler]);

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const handleSubmitApplication = async () => {
    if (!pendingApplication || !result) {
      toast({
        title: "Erro",
        description: "Dados da candidatura não encontrados. Por favor, reinicie o processo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createApplication.mutateAsync({
        job_id: pendingApplication.job_id,
        candidate_name: pendingApplication.candidate_name,
        candidate_email: pendingApplication.candidate_email,
        candidate_birth_date: pendingApplication.candidate_birth_date,
        resume_url: pendingApplication.resume_url,
        profiler_result_code: result.code,
        profiler_result_detail: result,
        job_data: pendingApplication.job_data,
        // Demographic fields
        candidate_state: pendingApplication.candidate_state,
        candidate_city: pendingApplication.candidate_city,
        candidate_phone: pendingApplication.candidate_phone,
        candidate_race: pendingApplication.candidate_race,
        candidate_gender: pendingApplication.candidate_gender,
        candidate_sexual_orientation: pendingApplication.candidate_sexual_orientation,
        candidate_pcd: pendingApplication.candidate_pcd,
        candidate_pcd_type: pendingApplication.candidate_pcd_type,
        // Talent bank fields
        desired_position: pendingApplication.desired_position,
        desired_seniority: pendingApplication.desired_seniority,
      });

      // Clear session storage
      sessionStorage.removeItem("profiler_result");
      sessionStorage.removeItem("pending_application");
      
      setSubmitted(true);
      fireConfetti();
    } catch (error) {
      console.error("Error submitting application:", error);
    }
  };

  const handleSaveToProfile = async () => {
    if (!result) return;

    try {
      await saveProfiler.mutateAsync({
        profiler_result_code: result.code,
        profiler_result_detail: result as unknown as Json,
      });
      setSaved(true);
    } catch (error) {
      console.error("Error saving profiler result:", error);
    }
  };

  const handleFinish = () => {
    const returnUrl = sessionStorage.getItem("application_return_url");
    sessionStorage.removeItem("profiler_result");
    sessionStorage.removeItem("pending_application");
    sessionStorage.removeItem("application_return_url");
    if (returnUrl) {
      navigate(returnUrl);
    } else if (applicationId) {
      navigate("/vagas");
    } else {
      navigate("/");
    }
  };

  if (!result) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-8">
          <div className="animate-pulse text-muted-foreground">Carregando resultado...</div>
        </div>
      </Layout>
    );
  }

  // Show success screen after submission
  if (submitted) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-4 py-8">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Candidatura Enviada!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Obrigado por se candidatar! Sua candidatura foi registrada com sucesso junto com seu perfil comportamental.
              </p>
              <p className="text-sm text-muted-foreground">
                Entraremos em contato em breve.
              </p>
              <Button onClick={handleFinish} className="w-full">
                Voltar às Vagas
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const { profile, scores } = result;
  const percentages = getScorePercentages(scores);

  // Check if user is logged in (employee) and not applying to a job
  const isEmployee = user && !pendingApplication;

  return (
    <Layout>
      <div className="p-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Success indicator */}
          <div className="flex items-center justify-center gap-2 text-green-500">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">Teste concluído com sucesso</span>
          </div>

          {/* Main Result Card */}
          <Card className="border-border overflow-hidden">
            <div 
              className="h-2" 
              style={{ backgroundColor: profile.color }}
            />
            <CardHeader className="text-center pb-4">
              <Badge 
                className="mx-auto mb-4 text-sm px-4 py-1"
                style={{ 
                  backgroundColor: `${profile.color}20`,
                  color: profile.color,
                  borderColor: profile.color 
                }}
              >
                {profile.code}
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl">
                Você é um <span style={{ color: profile.color }}>{profile.name}</span>
              </CardTitle>
              <p className="text-muted-foreground text-lg mt-2">{profile.subcategory}</p>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground max-w-2xl mx-auto">
                {profile.summary}
              </p>
            </CardContent>
          </Card>

          {/* Score Distribution */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Distribuição do Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(percentages).map(([code, percentage]) => (
                <div key={code} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{profileLabels[code]}</span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Detail Cards Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Basic Skills */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Habilidades Básicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {profile.basicSkills}
                </p>
              </CardContent>
            </Card>

            {/* Subcategory */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {profile.subcategory}
                </p>
                <Badge 
                  variant="outline" 
                  className="mt-3"
                  style={{ borderColor: profile.color, color: profile.color }}
                >
                  Perfil {profile.code}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Main Skills - Full Width */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Principais Habilidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {profile.mainSkills}
              </p>
            </CardContent>
          </Card>

          {/* Main Advantages - Full Width */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Principais Vantagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {profile.mainAdvantages}
              </p>
            </CardContent>
          </Card>

          {/* Main Disadvantages - Full Width */}
          <Card className="border-border border-amber-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                Pontos de Atenção e Desenvolvimento
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Áreas que podem exigir atenção especial em PDIs e avaliações
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {profile.mainDisadvantages}
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => window.print()}
              className="sm:flex-1"
            >
              Imprimir Resultado
            </Button>
            
            {pendingApplication ? (
              <Button 
                onClick={handleSubmitApplication}
                className="sm:flex-1"
                disabled={createApplication.isPending}
              >
                {createApplication.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando Candidatura...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Candidatura
                  </>
                )}
              </Button>
            ) : isEmployee ? (
              <>
                <Button 
                  onClick={handleSaveToProfile}
                  className="sm:flex-1"
                  disabled={saveProfiler.isPending || saved}
                >
                  {saveProfiler.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Salvo no Perfil
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar no Meu Perfil
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleFinish}
                  className="sm:flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleFinish}
                className="sm:flex-1"
              >
                Voltar ao Início
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilerResultado;
