import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Clock, Brain, CheckCircle, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";

const ProfilerIntro = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");

  const handleStart = () => {
    const params = applicationId ? `?applicationId=${applicationId}` : "";
    navigate(`/profiler-etapa-1${params}`);
  };

  return (
    <Layout>
      <div className="flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          {/* Main Card */}
          <Card className="border-border">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl">Profiler Comportamental</CardTitle>
              <CardDescription className="text-base mt-2">
                Descubra seu perfil comportamental e como você se relaciona com o ambiente de trabalho
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* What is it */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">O que é este teste?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  O Profiler Comportamental é uma ferramenta de autoconhecimento que identifica 
                  suas principais características comportamentais no ambiente profissional. 
                  Através da seleção de adjetivos que descrevem você, conseguimos mapear seu 
                  perfil e entender melhor como você trabalha, se comunica e toma decisões.
                </p>
              </div>

              {/* Info cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Duração</p>
                    <p className="text-muted-foreground text-sm">5-10 minutos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <ClipboardCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Etapas</p>
                    <p className="text-muted-foreground text-sm">2 etapas simples</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Obrigatório</p>
                    <p className="text-muted-foreground text-sm">Para candidatura</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Como responder</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">1.</span>
                    <span>Responda de forma espontânea, sem pensar muito. Sua primeira impressão é a mais precisa.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">2.</span>
                    <span>Não existem respostas certas ou erradas. O objetivo é conhecer seu perfil autêntico.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">3.</span>
                    <span>Selecione os adjetivos que mais combinam com você em cada etapa.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">4.</span>
                    <span>Ao final, você receberá seu resultado com detalhes sobre seu perfil.</span>
                  </li>
                </ul>
              </div>

              {/* Important notice */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-center">
                  <strong>Importante:</strong> Este teste é parte obrigatória do processo seletivo. 
                  Sem completá-lo, não será possível avançar com sua candidatura.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleStart} 
                  size="lg" 
                  className="w-full text-lg py-6"
                >
                  Iniciar Teste
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => navigate(-1)} 
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar à página anterior
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilerIntro;
