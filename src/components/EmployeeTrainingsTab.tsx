import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useEmployeeTrainings,
  useCareerPoints,
  useDeleteTraining,
  EmployeeTraining,
} from "@/hooks/useEmployeeTrainings";
import { useUserRole } from "@/hooks/useUserRole";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  GraduationCap,
  Award,
  Clock,
  Star,
  Plus,
  Pencil,
  Trash2,
  Link2,
  Filter,
  FileText,
  ExternalLink,
} from "lucide-react";
import { TrainingDialog } from "./TrainingDialog";

interface EmployeeTrainingsTabProps {
  employeeId: string;
}

export function EmployeeTrainingsTab({ employeeId }: EmployeeTrainingsTabProps) {
  const { isAdmin, isPeople, canDeleteTrainings } = useUserRole();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [pdiFilter, setPdiFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<EmployeeTraining | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: trainings, isLoading } = useEmployeeTrainings({ employeeId });
  const { data: careerPoints } = useCareerPoints(employeeId);
  const deleteTraining = useDeleteTraining();

  const canManage = isAdmin || isPeople;
  const canDeleteTraining = canDeleteTrainings;

  const filteredTrainings = useMemo(() => {
    if (!trainings) return [];

    return trainings.filter((t) => {
      if (typeFilter !== "all" && t.training_type !== typeFilter) return false;
      if (pdiFilter === "pdi" && !t.from_pdi) return false;
      if (pdiFilter === "manual" && t.from_pdi) return false;
      return true;
    });
  }, [trainings, typeFilter, pdiFilter]);

  const stats = useMemo(() => {
    if (!trainings) return { totalHours: 0, totalCertifications: 0, totalPoints: 0 };

    return {
      totalHours: trainings.reduce((sum, t) => sum + t.hours, 0),
      totalCertifications: trainings.filter((t) => t.training_type === "certificacao").length,
      totalPoints: careerPoints?.total_points || 0,
    };
  }, [trainings, careerPoints]);

  const handleEdit = (training: EmployeeTraining) => {
    setEditingTraining(training);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteTraining.mutateAsync({ trainingId: deletingId, employeeId });
    setDeletingId(null);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingTraining(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              em {trainings?.length || 0} treinamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificações</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCertifications}</div>
            <p className="text-xs text-muted-foreground">certificações obtidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos de Carreira</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <p className="text-xs text-muted-foreground">para enquadramento</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="treinamento">Treinamentos</SelectItem>
              <SelectItem value="certificacao">Certificações</SelectItem>
            </SelectContent>
          </Select>

          <Select value={pdiFilter} onValueChange={setPdiFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              <SelectItem value="pdi">Vindos do PDI</SelectItem>
              <SelectItem value="manual">Cadastro manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Treinamento
        </Button>
      </div>

      {/* Tabela de Treinamentos */}
      <Card>
        <CardContent className="p-0">
          {filteredTrainings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum treinamento encontrado</p>
              <p className="text-sm">
                {trainings?.length === 0
                  ? "Cadastre o primeiro treinamento do colaborador"
                  : "Tente ajustar os filtros"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Horas</TableHead>
                  <TableHead>Conclusão</TableHead>
                  <TableHead className="text-center">Pontos</TableHead>
                  <TableHead className="text-center">Certificado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainings.map((training) => (
                  <TableRow key={training.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{training.name}</span>
                        {training.from_pdi && (
                          <Badge
                            variant="secondary"
                            className="bg-secondary text-secondary-foreground"
                          >
                            <Link2 className="h-3 w-3 mr-1" />
                            PDI
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={training.training_type === "certificacao" ? "default" : "secondary"}
                      >
                        {training.training_type === "certificacao" ? (
                          <>
                            <Award className="h-3 w-3 mr-1" />
                            Certificação
                          </>
                        ) : (
                          <>
                            <GraduationCap className="h-3 w-3 mr-1" />
                            Treinamento
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{training.hours}h</TableCell>
                    <TableCell>
                      {format(new Date(training.completion_date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      {training.generates_points ? (
                        <Badge variant="outline">
                          <Star className="h-3 w-3 mr-1" />
                          {training.career_points}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {training.certificate_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(training.certificate_url!, '_blank')}
                          className="text-primary"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(training)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteTraining && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(training.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Cadastro/Edição */}
      <TrainingDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        employeeId={employeeId}
        training={editingTraining}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treinamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O treinamento será removido
              permanentemente e os pontos serão recalculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
