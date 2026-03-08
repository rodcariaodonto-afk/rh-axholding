import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SALARY_TYPE_LABELS, JOB_BENEFITS } from "@/constants/jobOptions";
import type { JobFormData, SalaryType } from "@/types/job";

interface JobStepCompensationProps {
  form: UseFormReturn<JobFormData>;
}

export function JobStepCompensation({ form }: JobStepCompensationProps) {
  const salaryType = form.watch("salary_type");
  const showSalaryFields = salaryType === "fixed" || salaryType === "range";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Remuneração e Benefícios</h2>
        <p className="text-muted-foreground">
          Configure a faixa salarial e os benefícios oferecidos
        </p>
      </div>

      <div className="grid gap-6">
        {/* Salary Type */}
        <FormField
          control={form.control}
          name="salary_type"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Tipo de Remuneração</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.entries(SALARY_TYPE_LABELS) as [SalaryType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Salary Fields (conditional) */}
        {showSalaryFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salaryType === "fixed" ? (
              <FormField
                control={form.control}
                name="salary_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        placeholder="Ex: 8000"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? null : parseFloat(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="salary_min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salário Mínimo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={100}
                          placeholder="Ex: 6000"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? null : parseFloat(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salary_max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salário Máximo (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={100}
                          placeholder="Ex: 10000"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? null : parseFloat(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        )}

        {/* Benefits */}
        <FormField
          control={form.control}
          name="benefits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Benefícios</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {JOB_BENEFITS.map((benefit) => {
                  const isChecked = (field.value || []).includes(benefit);
                  return (
                    <div
                      key={benefit}
                      className="flex items-center space-x-2 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`benefit-${benefit}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const current = field.value || [];
                          if (checked) {
                            field.onChange([...current, benefit]);
                          } else {
                            field.onChange(current.filter((b) => b !== benefit));
                          }
                        }}
                      />
                      <label
                        htmlFor={`benefit-${benefit}`}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {benefit}
                      </label>
                    </div>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
