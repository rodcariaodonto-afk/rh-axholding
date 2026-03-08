import { useParams, Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useOrganization, useActiveJobsForCareers } from "@/hooks/useOrganization";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Users, 
  Building2, 
  Globe, 
  Search, 
  Briefcase,
  ChevronRight,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CareersPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: organization, isLoading: orgLoading } = useOrganization(slug || "demo", isDemoMode);
  const { data: jobs, isLoading: jobsLoading } = useActiveJobsForCareers(organization?.id, isDemoMode);

  const filteredJobs = jobs?.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.seniority?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <FileText className="size-16 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Organização não encontrada</h1>
        <p className="text-muted-foreground">O link que você acessou não existe ou foi removido.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="flex justify-center mb-6">
            {organization.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={organization.name}
                className="size-16 rounded-lg"
              />
            ) : (
              <div className="size-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="size-8 text-primary" />
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-bold mb-4">
            Trabalhe na {organization.name}
          </h1>
          
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            {organization.employee_count && (
              <div className="flex items-center gap-1.5">
                <Users className="size-4" />
                <span>{organization.employee_count}</span>
              </div>
            )}
            {organization.industry && (
              <div className="flex items-center gap-1.5">
                <Building2 className="size-4" />
                <span>{organization.industry}</span>
              </div>
            )}
            {organization.website && (
              <a 
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Globe className="size-4" />
                <span>Website</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Jobs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Briefcase className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Vagas Abertas ({filteredJobs.length})
            </h2>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vagas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Jobs List */}
        {jobsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Briefcase className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-1">Nenhuma vaga encontrada</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm 
                  ? "Tente buscar com outros termos" 
                  : "No momento não há vagas abertas"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <Link 
                key={job.id} 
                to={`/vagas/${job.id}/aplicar`}
                className="block"
              >
                <Card className="hover:shadow-md hover:border-border/80 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {job.seniority && (
                            <Badge variant="secondary" className="text-xs">
                              {job.seniority}
                            </Badge>
                          )}
                          {job.work_model && (
                            <Badge variant="outline" className="text-xs">
                              {job.work_model === "remote" ? "Remoto" : 
                               job.work_model === "hybrid" ? "Híbrido" : "Presencial"}
                            </Badge>
                          )}
                          {job.unit_city && (
                            <Badge variant="outline" className="text-xs">
                              <Building2 className="size-3 mr-1" />
                              {job.unit_city}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {format(new Date(job.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {organization.name}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default CareersPage;
