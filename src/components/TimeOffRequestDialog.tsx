import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useEmployees } from "@/hooks/useEmployees";
import { useCreateTimeOffRequest } from "@/hooks/useCreateTimeOffRequest";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, AlertCircle, Clock, Info } from "lucide-react";
import { format, isBefore, startOfDay, parseISO, eachDayOfInterval, getDay, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  calculateVacationEligibility,
  calculateAcquisitionPeriods,
  validateVacationPeriod,
  formatEligibilityInfo,
  checkAccumulatedPeriods,
} from "@/lib/cltVacationRules";

interface TimeOffRequest {
  id: string;
  employee_id: string;
  policy_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  notes: string | null;
}

interface TimeOffRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRequest?: TimeOffRequest | null;
}

export function TimeOffRequestDialog({ open, onOpenChange, editRequest }: TimeOffRequestDialogProps) {
  const { user } = useAuth();
  const { isAdmin, isPeople } = useUserRole(user?.id);
  const { data: employees } = useEmployees();
  const createRequest = useCreateTimeOffRequest();
  const queryClient = useQueryClient();

  const canCreateForOthers = isAdmin || isPeople;
  const isEditMode = !!editRequest;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);

  // Update mutation for editing
  const updateRequest = useMutation({
    mutationFn: async (data: {
      id: string;
      policy_id: string;
      start_date: string;
      end_date: string;
      total_days: number;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("time_off_requests")
        .update({
          policy_id: data.policy_id,
          start_date: data.start_date,
          end_date: data.end_date,
          total_days: data.total_days,
          notes: data.notes || null,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-off-requests"] });
      toast({
        title: "Férias atualizadas",
        description: "As férias foram atualizadas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as férias.",
        variant: "destructive",
      });
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (editRequest) {
        setSelectedEmployeeId(editRequest.employee_id);
        setSelectedPolicyId(editRequest.policy_id);
        setStartDate(parseISO(editRequest.start_date));
        setEndDate(parseISO(editRequest.end_date));
        setNotes(editRequest.notes || "");
        setAutoApprove(editRequest.status === "approved");
        setAlreadyTaken(editRequest.status === "approved" && isBefore(parseISO(editRequest.start_date), startOfDay(new Date())));
      } else {
        setSelectedEmployeeId(canCreateForOthers ? "" : user?.id || "");
        setSelectedPolicyId("");
        setStartDate(undefined);
        setEndDate(undefined);
        setNotes("");
        setAutoApprove(false);
        setAlreadyTaken(false);
      }
    }
  }, [open, canCreateForOthers, user?.id, editRequest]);

  // Fetch time-off policies
  const { data: policies } = useQuery({
    queryKey: ["time-off-policies-dialog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_off_policies")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
    enabled: open,
    staleTime: 0,
  });

  // Fetch employee contract (hire date) for CLT validation
  const { data: employeeContract } = useQuery({
    queryKey: ["employee-contract-vacation", selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) return null;
      
      const { data, error } = await supabase
        .from("employees_contracts")
        .select("hire_date")
        .eq("user_id", selectedEmployeeId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedEmployeeId,
  });

  // Fetch approved vacations for accumulation check
  const { data: approvedVacations } = useQuery({
    queryKey: ["approved-vacations", selectedEmployeeId],
    queryFn: async () => {
      if (!selectedEmployeeId) return [];
      
      const vacationPolicy = policies?.find(p => p.name === "Férias");
      if (!vacationPolicy) return [];

      const { data, error } = await supabase
        .from("time_off_requests")
        .select("start_date, end_date, total_days")
        .eq("employee_id", selectedEmployeeId)
        .eq("policy_id", vacationPolicy.id)
        .eq("status", "approved");

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedEmployeeId && !!policies,
  });

  // Fetch employee balance for selected policy
  const { data: balance } = useQuery({
    queryKey: ["time-off-balance", selectedEmployeeId, selectedPolicyId, new Date().getFullYear()],
    queryFn: async () => {
      if (!selectedEmployeeId || !selectedPolicyId) return null;

      const { data, error } = await supabase
        .from("time_off_balances")
        .select("*")
        .eq("employee_id", selectedEmployeeId)
        .eq("policy_id", selectedPolicyId)
        .eq("year", new Date().getFullYear())
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedEmployeeId && !!selectedPolicyId,
  });

  // Get selected policy info
  const selectedPolicy = useMemo(() => {
    return policies?.find(p => p.id === selectedPolicyId);
  }, [policies, selectedPolicyId]);

  const isVacationPolicy = selectedPolicy?.name === "Férias";

  // Calculate vacation eligibility
  const eligibility = useMemo(() => {
    if (!employeeContract?.hire_date) return null;
    return calculateVacationEligibility(employeeContract.hire_date);
  }, [employeeContract]);

  // Calculate acquisition periods
  const acquisitionInfo = useMemo(() => {
    if (!employeeContract?.hire_date) return null;
    return calculateAcquisitionPeriods(employeeContract.hire_date);
  }, [employeeContract]);

  // Check accumulated periods
  const accumulationCheck = useMemo(() => {
    if (!employeeContract?.hire_date || !isVacationPolicy) return null;
    return checkAccumulatedPeriods(employeeContract.hire_date, approvedVacations || []);
  }, [employeeContract, isVacationPolicy, approvedVacations]);

  // Calculate total days breakdown (calendar days, weekdays, weekends)
  const daysBreakdown = useMemo(() => {
    if (!startDate || !endDate) return { total: 0, weekdays: 0, saturdays: 0, sundays: 0 };
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const total = days.length;
    const saturdays = days.filter(d => getDay(d) === 6).length;
    const sundays = days.filter(d => getDay(d) === 0).length;
    const weekdays = total - saturdays - sundays;
    
    return { total, weekdays, saturdays, sundays };
  }, [startDate, endDate]);

  const totalDays = daysBreakdown.total;

  // CLT Vacation validation
  const cltValidation = useMemo(() => {
    // Skip CLT validation for non-vacation policies
    if (!isVacationPolicy) return { isValid: true };
    
    // Admin bypass when registering already taken vacations
    const isAdminBypass = canCreateForOthers && alreadyTaken;
    
    return validateVacationPeriod(
      startDate || null,
      totalDays,
      employeeContract?.hire_date || null,
      isVacationPolicy,
      isAdminBypass
    );
  }, [isVacationPolicy, startDate, totalDays, employeeContract, canCreateForOthers, alreadyTaken]);

  // Combined validation
  const validationError = useMemo(() => {
    if (!selectedEmployeeId) return "Selecione um colaborador";
    if (!selectedPolicyId) return "Selecione o tipo de afastamento";
    
    // CLT validation errors (only if vacation policy selected)
    if (isVacationPolicy && !cltValidation.isValid && cltValidation.error) {
      return cltValidation.error;
    }
    
    if (!startDate) return "Selecione a data de início";
    if (!endDate) return "Selecione a data de fim";
    if (isBefore(endDate, startDate)) return "A data de fim deve ser após a data de início";
    
    // Only validate past dates if not already taken
    if (!alreadyTaken && isBefore(startDate, startOfDay(new Date()))) return "A data de início não pode ser no passado";
    if (totalDays <= 0) return "O período deve conter pelo menos um dia";
    
    // Check balance (if available)
    if (balance && balance.available_days !== null && totalDays > balance.available_days) {
      return `Saldo insuficiente. Disponível: ${balance.available_days} dias`;
    }
    
    // Accumulation check
    if (accumulationCheck && !accumulationCheck.isValid && accumulationCheck.error) {
      return accumulationCheck.error;
    }
    
    return null;
  }, [selectedEmployeeId, selectedPolicyId, startDate, endDate, totalDays, balance, alreadyTaken, isVacationPolicy, cltValidation, accumulationCheck]);

  // Warning message (non-blocking)
  const warningMessage = useMemo(() => {
    if (cltValidation.warning) return cltValidation.warning;
    if (accumulationCheck?.warning) return accumulationCheck.warning;
    return null;
  }, [cltValidation, accumulationCheck]);

  const handleSubmit = () => {
    if (validationError || !startDate || !endDate) return;

    if (isEditMode && editRequest) {
      updateRequest.mutate({
        id: editRequest.id,
        policy_id: selectedPolicyId,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        total_days: totalDays,
        notes: notes || undefined,
      });
    } else {
      createRequest.mutate(
        {
          employee_id: selectedEmployeeId,
          policy_id: selectedPolicyId,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          total_days: totalDays,
          notes: notes || undefined,
          status: canCreateForOthers && (autoApprove || alreadyTaken) ? "approved" : "pending_people",
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  // Calculate minimum start date for calendar
  const minStartDate = useMemo(() => {
    if (alreadyTaken) return undefined; // No restriction for already taken
    
    // For vacation policy, respect the 12 months rule
    if (isVacationPolicy && eligibility && !eligibility.canEnjoy) {
      return eligibility.earliestEnjoyDate;
    }
    
    return startOfDay(new Date());
  }, [alreadyTaken, isVacationPolicy, eligibility]);

  const activeEmployees = employees?.filter((e) => e.status === "active") || [];
  const isPending = createRequest.isPending || updateRequest.isPending;

  // Check if employee can request vacation (10 months rule)
  const canRequestVacation = useMemo(() => {
    if (!isVacationPolicy) return true;
    if (canCreateForOthers && alreadyTaken) return true; // Admin bypass
    if (!eligibility) return true; // No hire date info, allow
    return eligibility.canRequest;
  }, [isVacationPolicy, canCreateForOthers, alreadyTaken, eligibility]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Férias" : "Nova Solicitação de Férias"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Edite os dados das férias."
              : canCreateForOthers 
                ? "Registre férias para um colaborador." 
                : "Solicite suas férias preenchendo o formulário abaixo."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee selector (only for admin/people and not in edit mode) */}
          {canCreateForOthers && !isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="employee">Colaborador *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name || employee.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Policy selector */}
          <div className="space-y-2">
            <Label htmlFor="policy">Tipo de Afastamento *</Label>
            <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {policies?.map((policy) => (
                  <SelectItem key={policy.id} value={policy.id}>
                    {policy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {balance && balance.available_days !== null && (
              <p className="text-sm text-muted-foreground">
                Saldo disponível: <strong>{balance.available_days} dias</strong>
              </p>
            )}
          </div>

          {/* CLT Eligibility Info for Vacation Policy */}
          {isVacationPolicy && selectedEmployeeId && eligibility && !canRequestVacation && (
            <Alert variant="destructive">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>Período aquisitivo não completado</strong>
                <br />
                {formatEligibilityInfo(eligibility)}
              </AlertDescription>
            </Alert>
          )}

          {/* Eligibility info when can request but can't enjoy yet */}
          {isVacationPolicy && selectedEmployeeId && eligibility && canRequestVacation && !eligibility.canEnjoy && !(canCreateForOthers && alreadyTaken) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Você pode solicitar férias!</strong>
                <br />
                {formatEligibilityInfo(eligibility)}
                <br />
                <span className="text-xs text-muted-foreground">
                  O calendário só permitirá datas a partir de {format(eligibility.earliestEnjoyDate, "dd/MM/yyyy")}.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Warning about accumulated periods */}
          {warningMessage && (
            <Alert className="border-warning bg-warning/10">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                {warningMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Date pickers - disabled if can't request */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                    disabled={!canRequestVacation}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => {
                      if (alreadyTaken) return false;
                      if (minStartDate && isBefore(date, minStartDate)) return true;
                      return false;
                    }}
                    initialFocus
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Fim *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    disabled={!canRequestVacation}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? isBefore(date, startDate) : (alreadyTaken ? false : isBefore(date, startOfDay(new Date())))}
                    initialFocus
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Total days display with breakdown */}
          {startDate && endDate && totalDays > 0 && (
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total de dias corridos</p>
                <p className="text-3xl font-bold">{totalDays}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Dias úteis</p>
                  <p className="text-lg font-semibold text-foreground">{daysBreakdown.weekdays}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Sábados</p>
                  <p className="text-lg font-semibold text-warning">{daysBreakdown.saturdays}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Domingos</p>
                  <p className="text-lg font-semibold text-warning">{daysBreakdown.sundays}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações se necessário..."
              rows={3}
              disabled={!canRequestVacation}
            />
          </div>

          {/* Already taken checkbox (only for admin/people) */}
          {canCreateForOthers && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="already-taken">Usufruída</Label>
                <p className="text-sm text-muted-foreground">
                  Marque se as férias já foram usufruídas (permite datas passadas)
                </p>
              </div>
              <Switch
                id="already-taken"
                checked={alreadyTaken}
                onCheckedChange={(checked) => {
                  setAlreadyTaken(checked);
                  if (checked) setAutoApprove(true);
                }}
              />
            </div>
          )}

          {/* Auto-approve toggle (only for admin/people, hidden if already taken) */}
          {canCreateForOthers && !alreadyTaken && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="auto-approve">Aprovar automaticamente</Label>
                <p className="text-sm text-muted-foreground">
                  Marque para registrar as férias já aprovadas
                </p>
              </div>
              <Switch
                id="auto-approve"
                checked={autoApprove}
                onCheckedChange={setAutoApprove}
              />
            </div>
          )}

          {/* Validation error */}
          {validationError && startDate && endDate && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!!validationError || isPending || !canRequestVacation}
          >
            {isPending ? "Salvando..." : isEditMode ? "Salvar Alterações" : canCreateForOthers && autoApprove ? "Registrar Férias" : "Solicitar Férias"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
