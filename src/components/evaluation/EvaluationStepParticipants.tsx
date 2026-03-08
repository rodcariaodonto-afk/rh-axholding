import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { EvaluationFormData, EvaluationRelationship } from "@/types/evaluation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Wand2, Users } from "lucide-react";
import { RELATIONSHIP_LABELS, EVALUATION_TYPE_OPTIONS } from "@/constants/evaluationOptions";
import { toast } from "@/hooks/use-toast";

interface EvaluationStepParticipantsProps {
  form: UseFormReturn<EvaluationFormData>;
  employees?: Array<{
    id: string;
    full_name: string;
    manager_id: string | null;
    hire_date: string | null;
    contract_type: string | null;
  }>;
}

interface ParticipantEntry {
  evaluator_id: string;
  evaluated_id: string;
  relationship: EvaluationRelationship;
}

export function EvaluationStepParticipants({
  form,
  employees = []
}: EvaluationStepParticipantsProps) {
  const participants = form.watch("participants");
  const evaluationType = form.watch("evaluation_type");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEvaluator, setNewEvaluator] = useState<string>("");
  const [newEvaluated, setNewEvaluated] = useState<string>("");
  const [newRelationship, setNewRelationship] = useState<EvaluationRelationship>("manager");

  const handleAddParticipant = () => {
    if (!newEvaluator || !newEvaluated) return;

    const newEntry: ParticipantEntry = {
      evaluator_id: newEvaluator,
      evaluated_id: newEvaluated,
      relationship: newRelationship,
    };

    form.setValue("participants", [...participants, newEntry]);
    setNewEvaluator("");
    setNewEvaluated("");
    setNewRelationship("manager");
    setIsAddDialogOpen(false);
  };

  const handleRemoveParticipant = (index: number) => {
    const updated = participants.filter((_, i) => i !== index);
    form.setValue("participants", updated);
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp?.full_name || "Desconhecido";
  };

  const getEmployeePhoto = (_id: string) => {
    return null;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const evaluationTypeLabel = EVALUATION_TYPE_OPTIONS.find(
    opt => opt.id === evaluationType
  )?.name || evaluationType;

  const handleAutoGenerate = () => {
    const evaluation_type = form.watch("evaluation_type");
    const allow_self_evaluation = form.watch("allow_self_evaluation");
    const admission_cutoff_date = form.watch("admission_cutoff_date");
    const contract_types = form.watch("contract_types");

    if (evaluation_type === 'custom') {
      toast({
        title: "Tipo customizado",
        description: "Tipo customizado: adicione manualmente",
        variant: "default",
      });
      return;
    }

    // Filter eligible employees
    let eligibleEmployees = employees.filter(emp => emp.id);

    if (admission_cutoff_date) {
      eligibleEmployees = eligibleEmployees.filter(emp => {
        if (!emp.hire_date) return false;
        const hireDate = new Date(emp.hire_date);
        return hireDate <= admission_cutoff_date;
      });
    }

    if (contract_types && contract_types.length > 0) {
      eligibleEmployees = eligibleEmployees.filter(emp => {
        return emp.contract_type && contract_types.includes(emp.contract_type);
      });
    }

    const newPairs: ParticipantEntry[] = [];

    // Helper to check if pair already exists
    const pairExists = (evaluatorId: string, evaluatedId: string) => {
      return [...participants, ...newPairs].some(
        p => p.evaluator_id === evaluatorId && p.evaluated_id === evaluatedId
      );
    };

    // Generate pairs based on evaluation type
    if (evaluation_type === '90' || evaluation_type === '180' || evaluation_type === '360') {
      // 90: Manager evaluates employee
      eligibleEmployees.forEach(emp => {
        if (emp.manager_id && !pairExists(emp.manager_id, emp.id)) {
          newPairs.push({
            evaluator_id: emp.manager_id,
            evaluated_id: emp.id,
            relationship: 'manager'
          });
        }
      });

      // 180: Add reverse (employee evaluates manager)
      if (evaluation_type === '180' || evaluation_type === '360') {
        eligibleEmployees.forEach(emp => {
          if (emp.manager_id && !pairExists(emp.id, emp.manager_id)) {
            newPairs.push({
              evaluator_id: emp.id,
              evaluated_id: emp.manager_id,
              relationship: 'direct_report'
            });
          }
        });
      }

      // 360: Add peer evaluations
      if (evaluation_type === '360') {
        const employeesByManager = new Map<string, typeof eligibleEmployees>();

        eligibleEmployees.forEach(emp => {
          if (emp.manager_id) {
            if (!employeesByManager.has(emp.manager_id)) {
              employeesByManager.set(emp.manager_id, []);
            }
            employeesByManager.get(emp.manager_id)!.push(emp);
          }
        });

        // Add mutual peer evaluations for employees with same manager
        employeesByManager.forEach(peers => {
          for (let i = 0; i < peers.length; i++) {
            for (let j = i + 1; j < peers.length; j++) {
              const peer1 = peers[i];
              const peer2 = peers[j];

              if (!pairExists(peer1.id, peer2.id)) {
                newPairs.push({
                  evaluator_id: peer1.id,
                  evaluated_id: peer2.id,
                  relationship: 'peer'
                });
              }

              if (!pairExists(peer2.id, peer1.id)) {
                newPairs.push({
                  evaluator_id: peer2.id,
                  evaluated_id: peer1.id,
                  relationship: 'peer'
                });
              }
            }
          }
        });
      }
    }

    // Add self-evaluations if enabled
    if (allow_self_evaluation) {
      eligibleEmployees.forEach(emp => {
        if (!pairExists(emp.id, emp.id)) {
          newPairs.push({
            evaluator_id: emp.id,
            evaluated_id: emp.id,
            relationship: 'self'
          });
        }
      });
    }

    if (newPairs.length > 0) {
      form.setValue("participants", [...participants, ...newPairs]);
      toast({
        title: "Pares gerados",
        description: `${newPairs.length} par(es) de avaliação gerado(s) automaticamente`,
      });
    } else {
      toast({
        title: "Nenhum par gerado",
        description: "Nenhum par novo foi gerado com os critérios atuais",
        variant: "default",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Avaliações Configuradas</h3>
          <p className="text-sm text-muted-foreground">
            Tipo selecionado: <Badge variant="secondary">{evaluationTypeLabel}</Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoGenerate}
            disabled={evaluationType === 'custom'}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Gerar automaticamente
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Avaliação</DialogTitle>
                <DialogDescription>
                  Defina quem será o avaliador e o avaliado
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Avaliador</Label>
                  <Select value={newEvaluator} onValueChange={setNewEvaluator}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o avaliador" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Avaliado</Label>
                  <Select value={newEvaluated} onValueChange={setNewEvaluated}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o avaliado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Relação</Label>
                  <Select
                    value={newRelationship}
                    onValueChange={(val) => setNewRelationship(val as EvaluationRelationship)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleAddParticipant}
                  disabled={!newEvaluator || !newEvaluated}
                >
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      {participants.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma avaliação configurada</p>
          <p className="text-sm">
            Clique em "Gerar automaticamente" ou "Adicionar" para começar
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avaliador</TableHead>
                  <TableHead>Avaliado</TableHead>
                  <TableHead>Relação</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getEmployeePhoto(participant.evaluator_id) || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(getEmployeeName(participant.evaluator_id))}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {getEmployeeName(participant.evaluator_id)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getEmployeePhoto(participant.evaluated_id) || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(getEmployeeName(participant.evaluated_id))}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {getEmployeeName(participant.evaluated_id)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {RELATIONSHIP_LABELS[participant.relationship] || participant.relationship}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveParticipant(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground">
            Total: {participants.length} avaliações configuradas
          </p>
        </>
      )}
    </div>
  );
}
