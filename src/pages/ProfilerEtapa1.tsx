import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getAllRealTraits, Trait } from "@/lib/profiler/traits";
import { cn } from "@/lib/utils";
import Layout from "@/components/Layout";

const MIN_SELECTIONS = 5;

const ProfilerEtapa1 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  
  const traits = getAllRealTraits();

  const toggleTrait = (traitId: string) => {
    setSelectedTraits((prev) =>
      prev.includes(traitId)
        ? prev.filter((id) => id !== traitId)
        : [...prev, traitId]
    );
  };

  const handleNext = () => {
    // Store selections in sessionStorage for next step
    sessionStorage.setItem("profiler_real_traits", JSON.stringify(selectedTraits));
    const params = applicationId ? `?applicationId=${applicationId}` : "";
    navigate(`/profiler-etapa-2${params}`);
  };

  const canProceed = selectedTraits.length >= MIN_SELECTIONS;
  const progressPercentage = Math.min((selectedTraits.length / MIN_SELECTIONS) * 100, 100);

  return (
    <Layout>
      <div className="flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-3xl space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Etapa 1 de 2</span>
            <span>{selectedTraits.length} selecionado(s)</span>
          </div>
          <Progress value={50} className="h-2" />

          {/* Main Card */}
          <Card className="border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-xl sm:text-2xl">
                Como você realmente é
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Selecione pelo menos {MIN_SELECTIONS} adjetivos que descrevem como você realmente é, 
                independente do que esperam de você.
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
                Clique nos adjetivos para selecioná-los. Você pode selecionar quantos quiser, 
                mas o mínimo são {MIN_SELECTIONS}.
              </p>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                >
                  Voltar
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed}
                >
                  Próxima Etapa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilerEtapa1;
