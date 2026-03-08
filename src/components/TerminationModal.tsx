import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePickerWithYearMonth } from "@/components/ui/date-picker-with-year-month";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  TERMINATION_REASON_GROUPS,
  TERMINATION_DECISION_OPTIONS,
  TERMINATION_CAUSE_OPTIONS,
  getInferredDecision,
} from "@/constants/terminationOptions";

interface TerminationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: TerminationData) => void;
  employeeName: string;
  initialData?: TerminationData | null;
  isEdit?: boolean;
}

export interface TerminationData {
  termination_date: string;
  termination_reason: string;
  termination_decision: string;
  termination_cause: string;
  termination_cost: number;
  termination_notes?: string;
}

export const TerminationModal = ({
  open,
  onClose,
  onConfirm,
  employeeName,
  initialData,
  isEdit = false,
}: TerminationModalProps) => {
  // Format number with thousand separators (1234.56 -> 1.234,56)
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Parse Brazilian format to number (1.234,56 -> 1234.56)
  const parseCurrency = (value: string): number => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
  };

  // Parse ISO date string as local date (avoiding UTC timezone shift)
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Format date to ISO string using local timezone
  const formatLocalDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  const [terminationDate, setTerminationDate] = useState<Date | undefined>(new Date());
  const [terminationReason, setTerminationReason] = useState("");
  const [terminationDecision, setTerminationDecision] = useState("");
  const [terminationCause, setTerminationCause] = useState("");
  const [terminationCost, setTerminationCost] = useState("");
  const [terminationNotes, setTerminationNotes] = useState("");

  // Handle currency input with masking
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove everything except digits
    const digits = value.replace(/\D/g, '');
    
    if (!digits) {
      setTerminationCost('');
      return;
    }
    
    // Convert to number (cents to reais)
    const numValue = parseInt(digits, 10) / 100;
    
    // Format with thousand separators
    setTerminationCost(formatCurrency(numValue));
  };

  // Inferência automática: quando o motivo legal muda, preenche a decisão
  useEffect(() => {
    if (terminationReason) {
      const inferred = getInferredDecision(terminationReason);
      if (inferred) {
        setTerminationDecision(inferred);
      }
    }
  }, [terminationReason]);

  useEffect(() => {
    if (initialData && open) {
      setTerminationDate(initialData.termination_date ? parseLocalDate(initialData.termination_date) : new Date());
      setTerminationReason(initialData.termination_reason || "");
      setTerminationDecision(initialData.termination_decision || "");
      setTerminationCause(initialData.termination_cause || "");
      // Format number to Brazilian currency format with thousand separators
      setTerminationCost(initialData.termination_cost ? formatCurrency(initialData.termination_cost) : "");
      setTerminationNotes(initialData.termination_notes || "");
    } else if (!initialData && open) {
      setTerminationDate(new Date());
      setTerminationReason("");
      setTerminationDecision("");
      setTerminationCause("");
      setTerminationCost("");
      setTerminationNotes("");
    }
  }, [initialData, open]);

  const handleConfirm = () => {
    if (!terminationDate || !terminationReason || !terminationDecision || !terminationCause) {
      return;
    }

    onConfirm({
      termination_date: formatLocalDate(terminationDate),
      termination_reason: terminationReason,
      termination_decision: terminationDecision,
      termination_cause: terminationCause,
      termination_cost: parseCurrency(terminationCost),
      termination_notes: terminationNotes || undefined,
    });

    // Reset form
    setTerminationDate(new Date());
    setTerminationReason("");
    setTerminationDecision("");
    setTerminationCause("");
    setTerminationCost("");
    setTerminationNotes("");
  };

  const handleClose = () => {
    setTerminationDate(new Date());
    setTerminationReason("");
    setTerminationDecision("");
    setTerminationCause("");
    setTerminationCost("");
    setTerminationNotes("");
    onClose();
  };

  const isValid = terminationDate && terminationReason && terminationDecision && terminationCause;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Desligamento" : "Registrar Desligamento"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Edite os dados do desligamento de ${employeeName}.` : `Preencha os dados do desligamento de ${employeeName}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Data de Demissão */}
          <div className="grid gap-2">
            <Label htmlFor="termination_date">Data de Demissão *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !terminationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {terminationDate ? format(terminationDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DatePickerWithYearMonth
                  selected={terminationDate}
                  onSelect={setTerminationDate}
                  fromYear={2000}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Motivo de Desligamento (CLT/eSocial) */}
          <div className="grid gap-2">
            <Label htmlFor="termination_reason">Motivo de Desligamento (CLT/eSocial) *</Label>
            <Select value={terminationReason} onValueChange={setTerminationReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo legal" />
              </SelectTrigger>
              <SelectContent>
                {TERMINATION_REASON_GROUPS.map((group) => (
                  <SelectGroup key={group.category}>
                    <SelectLabel className="font-semibold text-foreground">{group.category}</SelectLabel>
                    {group.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Decisão de Demissão (RadioGroup) */}
          <div className="grid gap-2">
            <Label>Decisão de Demissão *</Label>
            <RadioGroup 
              value={terminationDecision} 
              onValueChange={setTerminationDecision}
              className="flex gap-4"
            >
              {TERMINATION_DECISION_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Motivo da Demissão (classificação interna) */}
          <div className="grid gap-2">
            <Label htmlFor="termination_cause">Motivo da Demissão (classificação interna) *</Label>
            <Select value={terminationCause} onValueChange={setTerminationCause}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo interno" />
              </SelectTrigger>
              <SelectContent>
                {TERMINATION_CAUSE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor da Rescisão */}
          <div className="grid gap-2">
            <Label htmlFor="termination_cost">Valor da Rescisão</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="termination_cost"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                className="pl-10"
                value={terminationCost}
                onChange={handleCurrencyChange}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="grid gap-2">
            <Label htmlFor="termination_notes">Observações (opcional)</Label>
            <Textarea
              id="termination_notes"
              placeholder="Anotações adicionais sobre o desligamento..."
              value={terminationNotes}
              onChange={(e) => setTerminationNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            {isEdit ? "Salvar Alterações" : "Confirmar Desligamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
