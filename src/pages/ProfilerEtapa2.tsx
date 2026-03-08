import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getAllPerceivedTraits } from "@/lib/profiler/traits";
import { calculateProfile } from "@/lib/profiler/calculateProfile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";

const MIN_SELECTIONS = 5;

const ProfilerEtapa2 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [realTraits, setRealTraits] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const traits = getAllPerceivedTraits();

  useEffect(() => {
    // Load real traits from session storage
    const stored = sessionStorage.getItem("profiler_real_traits");
    if (stored) {
      setRealTraits(JSON.parse(stored));
    } else {
      // If no stored traits, redirect back to step 1
      const params = applicationId ? `?applicationId=${applicationId}` : "";
      navigate(`/profiler-etapa-1${params}`);
    }
  }, [navigate, applicationId]);

  const toggleTrait = (traitId: string) => {
    setSelectedTraits((prev) =>
      prev.includes(traitId)
        ? prev.filter((id) => id !== traitId)
        : [...prev, traitId]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Calculate profile
      const result = calculateProfile(realTraits, selectedTraits);
      
      // Store result in sessionStorage (will be used in final submission)
      sessionStorage.setItem("profiler_result", JSON.stringify(result));
      
      // Clear stored traits
      sessionStorage.removeItem("profiler_real_traits");
      
      toast({
        title: "Teste concluído!",
        description: "Seu perfil comportamental foi calculado com sucesso.",
      });

      // Navigate to results page (keep applicationId param for job application flow)
      const params = applicationId ? `?applicationId=${applicationId}` : "";
      navigate(`/profiler-resultado${params}`);
    } catch (error: any) {
      console.error("Error calculating profile:", error);
      toast({
        title: "Erro ao calcular perfil",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = selectedTraits.length >= MIN_SELECTIONS;
  const progressPercentage = Math.min((selectedTraits.length / MIN_SELECTIONS) * 100, 100);

  return (
    <Layout>
      <div className="flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-3xl space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Etapa 2 de 2</span>
            <span>{selectedTraits.length} selecionado(s)</span>
          </div>
          <Progress value={100} className="h-2" />

          {/* Main Card */}
          <Card className="border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-xl sm:text-2xl">
                Como esperam que você seja
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Selecione pelo menos {MIN_SELECTIONS} adjetivos que descrevem como você 
                acha que as pessoas esperam que você seja no trabalho.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selection progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mínimo necessário: {MIN_SELECTIONS}</span>
                  <span className={cn(
                    "font-medium",
                    canProceed ? "text-green-500" : "text-muted-foreground"
                  )}>
                    {selectedTraits.length}/{MIN_SELECTIONS}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-1.5" />
              </div>

              {/* Traits grid */}
              <div className="flex flex-wrap gap-2 justify-center">
                {traits.map((trait) => {
                  const isSelected = selectedTraits.includes(trait.id);
                  return (
                    <Badge
                      key={trait.id}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-sm py-2 px-4 transition-all hover:scale-105",
                        isSelected 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "hover:bg-secondary"
                      )}
                      onClick={() => toggleTrait(trait.id)}
                    >
                      {trait.label}
                    </Badge>
                  );
                })}
              </div>

              {/* Helper text */}
              <p className="text-center text-sm text-muted-foreground">
                Pense em como as pessoas do seu ambiente de trabalho esperam que você se comporte.
              </p>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!canProceed || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    "Ver Resultado"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilerEtapa2;
