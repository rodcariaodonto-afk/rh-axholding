import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePositions } from "@/hooks/usePositions";
import { useDepartments } from "@/hooks/useDepartments";
import { useCreateJob } from "@/hooks/useCreateJob";
import { useUpdateJob } from "@/hooks/useUpdateJob";
import type { Job, JobStatus } from "@/types/job";
import { JOB_STATUS_LABELS, DEFAULT_JOB_DESCRIPTION_TEMPLATE } from "@/types/job";

interface JobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job | null;
}

const JobDialog = ({ open, onOpenChange, job }: JobDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(DEFAULT_JOB_DESCRIPTION_TEMPLATE);
  const [requirements, setRequirements] = useState("");
  const [positionId, setPositionId] = useState<string>("_none");
  const [departmentId, setDepartmentId] = useState<string>("_none");
  const [status, setStatus] = useState<JobStatus>("draft");

  const { data: positions } = usePositions();
  const { data: departments } = useDepartments();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  const isEditing = !!job;

  useEffect(() => {
    if (job) {
      setTitle(job.title);
      setDescription(job.description ?? DEFAULT_JOB_DESCRIPTION_TEMPLATE);
      setRequirements(job.requirements ?? "");
      setPositionId(job.position_id ?? "_none");
      setDepartmentId(job.department_id ?? "_none");
      setStatus(job.status);
    } else {
      setTitle("");
      setDescription(DEFAULT_JOB_DESCRIPTION_TEMPLATE);
      setRequirements("");
      setPositionId("_none");
      setDepartmentId("_none");
      setStatus("draft");
    }
  }, [job, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const jobData = {
      title,
      description: description || null,
      requirements: requirements || null,
      position_id: positionId === "_none" ? null : positionId,
      department_id: departmentId === "_none" ? null : departmentId,
      status,
    };

    if (isEditing && job) {
      await updateJob.mutateAsync({ id: job.id, ...jobData });
    } else {
      await createJob.mutateAsync(jobData);
    }

    onOpenChange(false);
  };

  const isPending = createJob.isPending || updateJob.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Vaga" : "Criar Nova Vaga"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Vaga *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Desenvolvedor Frontend Pleno"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Select value={positionId} onValueChange={setPositionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {positions?.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {departments?.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a vaga..."
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              O template padrão inclui informações sobre a empresa. Edite conforme necessário.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requisitos</Label>
            <Textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Liste os requisitos da vaga..."
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar Vaga"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobDialog;
