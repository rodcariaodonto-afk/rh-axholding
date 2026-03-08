import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useSkillAreas } from "@/hooks/useSkillAreas";
import { useHardSkills, type HardSkillWithArea } from "@/hooks/useHardSkills";
import { useSoftSkills, type SoftSkill } from "@/hooks/useSoftSkills";
import { useEvaluationCycles, useUpdateCycleStatus, useDeleteEvaluationCycle } from "@/hooks/useEvaluationCycles";
import { EvaluationCycleCard } from "@/components/evaluation/EvaluationCycleCard";
import { 
  Wrench, 
  Heart, 
  Settings, 
  Plus, 
  RotateCw, 
  ClipboardList,
  Inbox,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getLevelColor = (level: number) => {
  if (level <= 1) return "bg-muted text-muted-foreground";
  if (level <= 2) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  if (level <= 3) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (level <= 4) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
};

const PerformanceEvaluation = () => {
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<string | null>(null);
  
  const { organization, isLoading: orgLoading } = useCurrentOrganization();
  const organizationId = organization?.id;

  const { data: skillAreas = [], isLoading: areasLoading } = useSkillAreas(organizationId);
  const { data: hardSkills = [], isLoading: hardLoading } = useHardSkills(organizationId);
  const { data: softSkillsData = [], isLoading: softLoading } = useSoftSkills(organizationId);
  const { data: cycles = [], isLoading: cyclesLoading } = useEvaluationCycles(organizationId);
  
  const updateStatus = useUpdateCycleStatus();
  const deleteCycle = useDeleteEvaluationCycle();

  // Group hard skills by area
  const hardSkillsByArea = skillAreas
    .filter(area => area.is_active)
    .map(area => ({
      id: area.id,
      name: area.name,
      skills: hardSkills.filter(skill => skill.area_id === area.id && skill.is_active),
    }))
    .filter(area => area.skills.length > 0);

  // Add skills without area
  const skillsWithoutArea = hardSkills.filter(skill => !skill.area_id && skill.is_active);
  if (skillsWithoutArea.length > 0) {
    hardSkillsByArea.push({
      id: "no-area",
      name: "Outras Competências",
      skills: skillsWithoutArea,
    });
  }

  const filteredAreas = selectedArea === "all" 
    ? hardSkillsByArea 
    : hardSkillsByArea.filter(area => area.id === selectedArea);

  const activeSoftSkills = softSkillsData.filter(s => s.is_active);

  const isLoading = orgLoading || areasLoading || hardLoading || softLoading || cyclesLoading;

  const handleActivate = (id: string) => updateStatus.mutate({ id, status: 'active' });
  const handlePause = (id: string) => updateStatus.mutate({ id, status: 'draft' });
  const handleComplete = (id: string) => updateStatus.mutate({ id, status: 'completed' });
  const handleCancel = (id: string) => updateStatus.mutate({ id, status: 'cancelled' });
  
  const handleDeleteClick = (id: string) => {
    setCycleToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (cycleToDelete) {
      deleteCycle.mutate(cycleToDelete);
      setDeleteDialogOpen(false);
      setCycleToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Layout>
    );
  }

  const hasNoCompetencies = hardSkillsByArea.length === 0 && activeSoftSkills.length === 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Avaliação de Desempenho</h1>
            <p className="text-muted-foreground">
              Gerencie ciclos de avaliação e competências da sua equipe
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/skills-management">
                <Settings className="h-4 w-4 mr-2" />
                Gerenciar Competências
              </Link>
            </Button>
            <Button asChild>
              <Link to="/performance-evaluation/new">
                <Plus className="h-4 w-4 mr-2" />
                Nova Avaliação
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="cycles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cycles" className="flex items-center gap-2">
              <RotateCw className="size-4" />
              Ciclos
            </TabsTrigger>
            <TabsTrigger value="competencies" className="flex items-center gap-2">
              <ClipboardList className="size-4" />
              Competências
            </TabsTrigger>
          </TabsList>

          {/* Cycles Tab */}
          <TabsContent value="cycles" className="space-y-6">
            {cycles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Inbox className="size-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Nenhum ciclo de avaliação</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Crie seu primeiro ciclo de avaliação de desempenho
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/performance-evaluation/new">
                      <Plus className="size-4 mr-2" />
                      Criar Avaliação
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {cycles.map((cycle) => (
                  <EvaluationCycleCard
                    key={cycle.id}
                    cycle={cycle}
                    onActivate={handleActivate}
                    onPause={handlePause}
                    onComplete={handleComplete}
                    onCancel={handleCancel}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Competencies Tab */}
          <TabsContent value="competencies" className="space-y-8">
            {hasNoCompetencies ? (
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <p className="text-muted-foreground">
                    Nenhuma competência cadastrada ainda.
                  </p>
                  <Button asChild>
                    <Link to="/skills-management">
                      Cadastrar Competências
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Hard Skills Section */}
                {hardSkillsByArea.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">Hard Skills</h2>
                        <p className="text-sm text-muted-foreground">
                          Competências técnicas específicas por área de atuação
                        </p>
                      </div>
                    </div>

                    {/* Area Filter */}
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={selectedArea === "all" ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedArea("all")}
                      >
                        Todas as áreas
                      </Badge>
                      {hardSkillsByArea.map((area) => (
                        <Badge
                          key={area.id}
                          variant={selectedArea === area.id ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedArea(area.id)}
                        >
                          {area.name}
                        </Badge>
                      ))}
                    </div>

                    {/* Hard Skills by Area */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredAreas.map((area) => (
                        <Card key={area.id} className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                              {area.name}
                              <Badge variant="secondary" className="ml-auto">
                                {area.skills.length} skills
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <Accordion type="single" collapsible className="w-full">
                              {area.skills.map((skill, index) => (
                                <AccordionItem 
                                  key={skill.id} 
                                  value={skill.id} 
                                  className={index === area.skills.length - 1 ? "border-b-0" : ""}
                                >
                                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                                    <span className="text-left">{skill.name}</span>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="grid grid-cols-3 gap-2 pt-2">
                                      <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">Júnior</span>
                                        <Badge className={`${getLevelColor(skill.level_junior)} w-full justify-center`}>
                                          {skill.level_junior} pontos
                                        </Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">Pleno</span>
                                        <Badge className={`${getLevelColor(skill.level_pleno)} w-full justify-center`}>
                                          {skill.level_pleno} pontos
                                        </Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">Sênior</span>
                                        <Badge className={`${getLevelColor(skill.level_senior)} w-full justify-center`}>
                                          {skill.level_senior} pontos
                                        </Badge>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}

                {/* Soft Skills Section */}
                {activeSoftSkills.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                        <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">Soft Skills</h2>
                        <p className="text-sm text-muted-foreground">
                          Competências comportamentais aplicadas a todas as áreas
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {activeSoftSkills.map((skill) => (
                        <Card key={skill.id} className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium">{skill.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {skill.description && (
                              <p className="text-sm text-muted-foreground">{skill.description}</p>
                            )}
                            
                            <div className="space-y-3">
                              {/* Junior */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">Júnior</span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {skill.level_junior} pts
                                  </Badge>
                                </div>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <div
                                      key={n}
                                      className={`h-1.5 flex-1 rounded-full ${
                                        n <= skill.level_junior
                                          ? "bg-blue-500"
                                          : "bg-muted"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Pleno */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">Pleno</span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {skill.level_pleno} pts
                                  </Badge>
                                </div>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <div
                                      key={n}
                                      className={`h-1.5 flex-1 rounded-full ${
                                        n <= skill.level_pleno
                                          ? "bg-emerald-500"
                                          : "bg-muted"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Senior */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium">Sênior</span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {skill.level_senior} pts
                                  </Badge>
                                </div>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <div
                                      key={n}
                                      className={`h-1.5 flex-1 rounded-full ${
                                        n <= skill.level_senior
                                          ? "bg-purple-500"
                                          : "bg-muted"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir ciclo de avaliação?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todos os participantes e respostas associados serão excluídos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default PerformanceEvaluation;
