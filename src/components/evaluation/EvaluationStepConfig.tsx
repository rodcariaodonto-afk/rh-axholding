import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePickerWithYearMonth } from "@/components/ui/date-picker-with-year-month";
import { CalendarIcon, Users, UserCheck, GitFork, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EVALUATION_TYPE_OPTIONS, CONTRACT_TYPE_OPTIONS } from "@/constants/evaluationOptions";
import type { UseFormReturn } from "react-hook-form";
import type { EvaluationFormData, EvaluationType } from "@/types/evaluation";

interface EvaluationStepConfigProps {
  form: UseFormReturn<EvaluationFormData>;
}

const getEvaluationIcon = (type: EvaluationType) => {
  switch (type) {
    case '90': return UserCheck;
    case '180': return Users;
    case '360': return GitFork;
    default: return Settings2;
  }
};

export function EvaluationStepConfig({ form }: EvaluationStepConfigProps) {
  const evaluationType = form.watch("evaluation_type");
  const allowSelfEvaluation = form.watch("allow_self_evaluation");

  return (
    <div className="space-y-8">
      {/* Tipo de Avaliação */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Tipo de Avaliação</h3>
          <p className="text-sm text-muted-foreground">Escolha como as avaliações serão estruturadas</p>
        </div>
        <FormField
          control={form.control}
          name="evaluation_type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {EVALUATION_TYPE_OPTIONS.map((option) => {
                    const Icon = getEvaluationIcon(option.id);
                    const isSelected = field.value === option.id;
                    return (
                      <FormItem key={option.id}>
                        <FormLabel
                          className={cn(
                            "flex items-start gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/50"
                          )}
                        >
                          <FormControl>
                            <RadioGroupItem value={option.id} className="mt-1" />
                          </FormControl>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Icon className="h-5 w-5 text-primary" />
                              <span className="font-semibold">{option.name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                        </FormLabel>
                      </FormItem>
                    );
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Autoavaliação */}
      <div className="border-t pt-8 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Autoavaliação</h3>
          <p className="text-sm text-muted-foreground">Configure as opções de autoavaliação</p>
        </div>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="allow_self_evaluation"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Permitir autoavaliação</FormLabel>
                  <FormDescription>
                    Colaboradores podem avaliar a si mesmos
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {allowSelfEvaluation && (
            <FormField
              control={form.control}
              name="include_self_in_average"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 ml-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Incluir autoavaliação na média</FormLabel>
                    <FormDescription>
                      A nota da autoavaliação será considerada no cálculo da média final
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>
      </div>

      {/* Filtros de Elegibilidade */}
      <div className="border-t pt-8 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Filtros de Elegibilidade</h3>
          <p className="text-sm text-muted-foreground">Defina quais colaboradores serão elegíveis para participar</p>
        </div>
        <div className="space-y-6">
          {/* Admission Cutoff Date */}
          <FormField
            control={form.control}
            name="admission_cutoff_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de admissão até</FormLabel>
                <FormDescription>
                  Apenas colaboradores admitidos até esta data serão elegíveis
                </FormDescription>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full md:w-[300px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Todos os colaboradores</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerWithYearMonth
                      selected={field.value}
                      onSelect={field.onChange}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contract Types */}
          <FormField
            control={form.control}
            name="contract_types"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipos de contrato elegíveis</FormLabel>
                <FormDescription>
                  Selecione quais tipos de vínculo podem participar
                </FormDescription>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {CONTRACT_TYPE_OPTIONS.map((option) => (
                    <FormItem
                      key={option.value}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(option.value)}
                          onCheckedChange={(checked) => {
                            const updated = checked
                              ? [...(field.value || []), option.value]
                              : (field.value || []).filter((v) => v !== option.value);
                            field.onChange(updated);
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        {option.label}
                      </FormLabel>
                    </FormItem>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
