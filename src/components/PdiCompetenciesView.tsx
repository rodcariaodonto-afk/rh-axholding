import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PdiCompetenciesViewProps {
  pdiId: string;
  pdi: any;
}

export const PdiCompetenciesView = ({ pdiId, pdi }: PdiCompetenciesViewProps) => {
  const employeeId = pdi?.employee_id;

  const { data: skills = [], isLoading } = useQuery({
    queryKey: ["employee-skills", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from("employee_skills")
        .select("*, skill:skill_id")
        .eq("employee_id", employeeId)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });

  const { data: hardSkills = [] } = useQuery({
    queryKey: ["hard-skills-lookup"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hard_skills").select("id, name, area_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: softSkills = [] } = useQuery({
    queryKey: ["soft-skills-lookup"],
    queryFn: async () => {
      const { data, error } = await supabase.from("soft_skills").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const getSkillName = (skillId: string, skillType: string) => {
    if (skillType === "hard_skill") {
      return hardSkills.find((s: any) => s.id === skillId)?.name || skillId;
    }
    return softSkills.find((s: any) => s.id === skillId)?.name || skillId;
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  const hardSkillEntries = skills.filter((s: any) => s.skill_type === "hard_skill");
  const softSkillEntries = skills.filter((s: any) => s.skill_type === "soft_skill");

  const renderSkillCard = (skill: any) => {
    const current = skill.current_level || 0;
    const expected = skill.expected_level || 5;
    const percentage = Math.round((current / expected) * 100);
    const gap = expected - current;

    return (
      <div key={skill.id} className="flex items-center gap-4 p-3 border rounded-lg bg-background">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium truncate">{getSkillName(skill.skill_id, skill.skill_type)}</p>
            {gap > 0 && <Badge variant="outline" className="text-[10px] shrink-0">Gap: {gap}</Badge>}
            {gap <= 0 && <Badge variant="success" className="text-[10px] shrink-0">Atingido</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Progress value={percentage} className="flex-1 h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{current}/{expected}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {skills.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Nenhuma competência mapeada para este colaborador.</p>
            <p className="text-sm mt-1">Acesse o módulo de Competências para mapear habilidades.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Competências</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{skills.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Com Gap</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">
                  {skills.filter((s: any) => (s.expected_level || 5) - (s.current_level || 0) > 0).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Atingidas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">
                  {skills.filter((s: any) => (s.expected_level || 5) - (s.current_level || 0) <= 0).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {hardSkillEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hard Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {hardSkillEntries.map(renderSkillCard)}
              </CardContent>
            </Card>
          )}

          {softSkillEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Soft Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {softSkillEntries.map(renderSkillCard)}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
