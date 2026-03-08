import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Briefcase,
  LayoutGrid,
  List,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  Send,
  XCircle,
} from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useDeleteJob } from "@/hooks/useDeleteJob";
import { useUpdateJob } from "@/hooks/useUpdateJob";
import { useUserRole } from "@/hooks/useUserRole";
import JobDialog from "./JobDialog";
import JobsFilters from "./JobsFilters";
import type { Job, JobStatus } from "@/types/job";
import { JOB_STATUS_LABELS, JOB_STATUS_VARIANTS } from "@/types/job";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ViewMode = "cards" | "list";

interface JobsListProps {
  isDemoMode?: boolean;
}

const JobsList = ({ isDemoMode = false }: JobsListProps) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const { data: jobs, isLoading } = useJobs({
    status: statusFilter,
    positionId: positionFilter,
    isDemoMode,
  });
  const deleteJob = useDeleteJob();
  const updateJob = useUpdateJob();
  const { isAdmin, isPeople } = useUserRole();

  const canManageJobs = !isDemoMode && (isAdmin || isPeople);

  const handleJobClick = (job: Job) => {
    navigate(`/vagas/${job.id}`);
  };

  const handleEdit = (job: Job) => {
    navigate(`/vagas/${job.id}/edit`);
  };

  const handleDelete = (job: Job) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (jobToDelete) {
      await deleteJob.mutateAsync(jobToDelete.id);
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handlePublish = async (job: Job) => {
    await updateJob.mutateAsync({ id: job.id, status: "active" });
  };

  const handleClose = async (job: Job) => {
    await updateJob.mutateAsync({ id: job.id, status: "closed" });
  };

  const handleCreateNew = () => {
    navigate("/vagas/new");
  };

  const handleViewCandidates = (job: Job) => {
    navigate(`/vagas/${job.id}`);
  };

  const renderJobCard = (job: Job) => (
    <Card 
      key={job.id} 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleJobClick(job)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{job.title}</CardTitle>
            {job.positions && (
              <p className="text-sm text-muted-foreground">{job.positions.title}</p>
            )}
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge variant={JOB_STATUS_VARIANTS[job.status]}>
              {JOB_STATUS_LABELS[job.status]}
            </Badge>
            {canManageJobs && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(job)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  {job.status === "draft" && (
                    <DropdownMenuItem onClick={() => handlePublish(job)}>
                      <Send className="h-4 w-4 mr-2" />
                      Publicar
                    </DropdownMenuItem>
                  )}
                  {job.status === "active" && (
                    <DropdownMenuItem onClick={() => handleClose(job)}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Encerrar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleViewCandidates(job)}>
                    <Users className="h-4 w-4 mr-2" />
                    Ver Candidatos
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => handleDelete(job)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {job.departments && (
          <p className="text-sm text-muted-foreground mb-2">
            Departamento: {job.departments.name}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Criada em {format(new Date(job.created_at), "dd/MM/yyyy", { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  );

  const renderTableRow = (job: Job) => (
    <TableRow 
      key={job.id} 
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => handleJobClick(job)}
    >
      <TableCell className="font-medium">{job.title}</TableCell>
      <TableCell>{job.positions?.title ?? "-"}</TableCell>
      <TableCell>{job.departments?.name ?? "-"}</TableCell>
      <TableCell>
        <Badge variant={JOB_STATUS_VARIANTS[job.status]}>
          {JOB_STATUS_LABELS[job.status]}
        </Badge>
      </TableCell>
      <TableCell>
        {format(new Date(job.created_at), "dd/MM/yyyy", { locale: ptBR })}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        {canManageJobs && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(job)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {job.status === "draft" && (
                <DropdownMenuItem onClick={() => handlePublish(job)}>
                  <Send className="h-4 w-4 mr-2" />
                  Publicar
                </DropdownMenuItem>
              )}
              {job.status === "active" && (
                <DropdownMenuItem onClick={() => handleClose(job)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Encerrar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleViewCandidates(job)}>
                <Users className="h-4 w-4 mr-2" />
                Ver Candidatos
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => handleDelete(job)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle>Vagas</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <JobsFilters
            statusFilter={statusFilter}
            positionFilter={positionFilter}
            onStatusChange={setStatusFilter}
            onPositionChange={setPositionFilter}
          />

          {/* View mode toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {canManageJobs && (
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Vaga
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Jobs listing */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {/* Ícone decorativo */}
            <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-muted-foreground/20 bg-muted/50">
                <Briefcase className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-md border-2 border-background bg-muted-foreground/20">
                <Plus className="h-4 w-4 text-muted-foreground/60" />
              </div>
            </div>
            
            {/* Título */}
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhuma vaga ainda
            </h3>
            
            {/* Subtítulo */}
            <p className="text-muted-foreground max-w-sm mb-6">
              Comece criando sua primeira vaga de emprego para atrair candidatos qualificados.
            </p>
            
            {/* Botão de ação */}
            {canManageJobs && (
              <Button onClick={handleCreateNew} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Nova Vaga
              </Button>
            )}
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs?.map(renderJobCard)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs?.map(renderTableRow)}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Dialog for create/edit */}
      <JobDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={selectedJob}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vaga?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a vaga "{jobToDelete?.title}"? 
              Esta ação não pode ser desfeita.
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
    </Card>
  );
};

export default JobsList;
