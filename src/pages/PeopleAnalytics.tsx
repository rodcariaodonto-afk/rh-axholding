import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { OverviewTab } from "@/components/analytics/OverviewTab";
import { HiringRetentionTab } from "@/components/analytics/HiringRetentionTab";
import { DiversityTab } from "@/components/analytics/DiversityTab";
import { LearningTab } from "@/components/analytics/LearningTab";
import { BarChart3, Users, Palette, GraduationCap } from "lucide-react";

export default function PeopleAnalytics() {
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  const { data, isLoading, error } = useAnalyticsData(isDemoMode);

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            Erro ao carregar dados de analytics.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="size-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="hiring" className="gap-2">
              <Users className="size-4" />
              <span className="hidden sm:inline">Contratação & Retenção</span>
            </TabsTrigger>
            <TabsTrigger value="diversity" className="gap-2">
              <Palette className="size-4" />
              <span className="hidden sm:inline">Diversidade</span>
            </TabsTrigger>
            <TabsTrigger value="learning" className="gap-2">
              <GraduationCap className="size-4" />
              <span className="hidden sm:inline">Aprendizagem</span>
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-[350px]" />
                <Skeleton className="h-[350px]" />
              </div>
            </div>
          ) : data ? (
            <>
              <TabsContent value="overview" className="space-y-6 mt-0">
                <OverviewTab data={data} />
              </TabsContent>

              <TabsContent value="hiring" className="space-y-6 mt-0">
                <HiringRetentionTab data={data} />
              </TabsContent>

              <TabsContent value="diversity" className="space-y-6 mt-0">
                <DiversityTab data={data} />
              </TabsContent>

              <TabsContent value="learning" className="space-y-6 mt-0">
                <LearningTab isDemoMode={isDemoMode} />
              </TabsContent>
            </>
          ) : null}
        </Tabs>
      </div>
    </Layout>
  );
}
