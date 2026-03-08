import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Share2, Building2, Briefcase, Calendar, Copy, Check, Pencil, FileText } from "lucide-react";
import { useJobById } from "@/hooks/useJobById";
import CandidateKanbanBoard from "@/components/CandidateKanbanBoard";

import { JOB_STATUS_LABELS, JOB_STATUS_VARIANTS } from "@/types/job";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";
  const { data: job, isLoading } = useJobById(id);
  const [copied, setCopied] = useState(false);
  
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);

  const applicationUrl = `${window.location.origin}/vagas/${id}/aplicar`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(applicationUrl);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link de candidatura foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Vaga não encontrada</h1>
          <Button onClick={() => navigate("/vagas")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Vagas
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/vagas")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                <Badge variant={JOB_STATUS_VARIANTS[job.status]}>
                  {JOB_STATUS_LABELS[job.status]}
                </Badge>
                {job.positions && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {job.positions.title}
                  </span>
                )}
                {job.departments && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {job.departments.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(job.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(job.description || job.requirements) && (
              <Button variant="outline" onClick={() => setDetailsDrawerOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/vagas/${job.id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar Vaga
            </Button>
            <Button variant="outline" onClick={handleCopyLink}>
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? "Copiado!" : "Copiar Link"}
            </Button>
            <Button variant="outline" asChild>
              <a href={applicationUrl} target="_blank" rel="noopener noreferrer">
                <Share2 className="h-4 w-4 mr-2" />
                Abrir Formulário
              </a>
            </Button>
          </div>
        </div>

        {/* Candidates Kanban Board */}
        <CandidateKanbanBoard 
          jobId={job.id} 
          jobTitle={job.title}
          isDemoMode={isDemoMode}
          jobData={{
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            position: job.positions,
            department: job.departments,
          }}
        />
      </div>


      {/* Details Drawer */}
      <Sheet open={detailsDrawerOpen} onOpenChange={setDetailsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Vaga</SheetTitle>
            <SheetDescription>
              {[job.positions?.title, job.departments?.name].filter(Boolean).join(" • ")}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {job.description && (
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <div className="prose prose-sm max-w-none dark:prose-invert [&>*]:text-foreground [&_p]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_strong]:text-foreground [&_li]:text-foreground [&_ul]:my-2 [&_li]:my-0">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{job.description}</ReactMarkdown>
                </div>
              </div>
            )}

            {job.requirements && (
              <div>
                <h3 className="font-semibold mb-2">Requisitos</h3>
                <div className="prose prose-sm max-w-none dark:prose-invert [&>*]:text-foreground [&_p]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_strong]:text-foreground [&_li]:text-foreground [&_ul]:my-2 [&_li]:my-0">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{job.requirements}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
};

export default JobDetailPage;
