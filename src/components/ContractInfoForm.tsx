import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithYearMonth } from "@/components/ui/date-picker-with-year-month";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { parseDateFromDB } from "@/lib/dateUtils";

const contractSchema = z.object({
  contract_type: z.enum(["clt", "pj", "internship", "temporary", "autonomous", "other"]),
  hire_date: z.date(),
  probation_days: z.number().optional(),
  contract_start_date: z.date().nullish(),
  contract_duration_days: z.number().optional(),
  contract_end_date: z.date().nullish(),
  base_salary: z.number().min(0),
  health_insurance: z.number().min(0).optional(),
  dental_insurance: z.number().min(0).optional(),
  transportation_voucher: z.number().min(0).optional(),
  meal_voucher: z.number().min(0).optional(),
  other_benefits: z.number().min(0).optional(),
  weekly_hours: z.number().min(1).max(168).optional(),
  is_active: z.boolean(),
  cost_per_hour: z.number().min(0).optional(),
  hazard_pay_percentage: z.number().min(0).max(100).optional(),
  monthly_hours: z.number().min(0).optional(),
  immediate_supervisor_name: z.string().optional().or(z.literal("")),
  immediate_supervisor_email: z.string().optional().or(z.literal("")),
  immediate_supervisor_registration: z.string().optional().or(z.literal("")),
  badge_barcode: z.string().optional().or(z.literal("")),
  mifare_card: z.string().optional().or(z.literal("")),
  block_time_view: z.boolean().optional(),
  receive_alerts: z.boolean().optional(),
});

export type ContractFormData = z.infer<typeof contractSchema>;

interface ContractInfoFormProps {
  contracts: any[];
  isCreating: boolean;
  isUpdating: boolean;
  onSubmit: (data: ContractFormData) => void;
}

export function ContractInfoForm({ contracts, isCreating, isUpdating, onSubmit }: ContractInfoFormProps) {
  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contract_type: "clt",
      hire_date: new Date(),
      probation_days: 0,
      contract_start_date: undefined,
      contract_duration_days: undefined,
      contract_end_date: undefined,
      base_salary: 0,
      health_insurance: 0,
      dental_insurance: 0,
      transportation_voucher: 0,
      meal_voucher: 0,
      other_benefits: 0,
      weekly_hours: 44,
      is_active: true,
      cost_per_hour: 0,
      hazard_pay_percentage: 0,
      monthly_hours: undefined,
      immediate_supervisor_name: "",
      immediate_supervisor_email: "",
      immediate_supervisor_registration: "",
      badge_barcode: "",
      mifare_card: "",
      block_time_view: false,
      receive_alerts: false,
    },
  });

  useEffect(() => {
    if (contracts && contracts.length > 0) {

      const activeContract = contracts.find((c) => c.is_active) || contracts[0];
      form.reset({
        contract_type: activeContract.contract_type,
        hire_date: parseDateFromDB(activeContract.hire_date) as Date,
        probation_days: activeContract.probation_days || 0,
        contract_start_date: parseDateFromDB(activeContract.contract_start_date),
        contract_duration_days: activeContract.contract_duration_days || undefined,
        contract_end_date: parseDateFromDB(activeContract.contract_end_date),
        base_salary: Number(activeContract.base_salary),
        health_insurance: Number(activeContract.health_insurance) || 0,
        dental_insurance: Number(activeContract.dental_insurance) || 0,
        transportation_voucher: Number(activeContract.transportation_voucher) || 0,
        meal_voucher: Number(activeContract.meal_voucher) || 0,
        other_benefits: Number(activeContract.other_benefits) || 0,
        weekly_hours: Number(activeContract.weekly_hours) || 44,
        is_active: activeContract.is_active,
        cost_per_hour: Number(activeContract.cost_per_hour) || 0,
        hazard_pay_percentage: Number(activeContract.hazard_pay_percentage) || 0,
        monthly_hours: activeContract.monthly_hours ? Number(activeContract.monthly_hours) : undefined,
        immediate_supervisor_name: activeContract.immediate_supervisor_name || "",
        immediate_supervisor_email: activeContract.immediate_supervisor_email || "",
        immediate_supervisor_registration: activeContract.immediate_supervisor_registration || "",
        badge_barcode: activeContract.badge_barcode || "",
        mifare_card: activeContract.mifare_card || "",
        block_time_view: activeContract.block_time_view ?? false,
        receive_alerts: activeContract.receive_alerts ?? false,
      });
    }
  }, [contracts, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contract_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Contrato</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="pj">PJ</SelectItem>
                    <SelectItem value="internship">Estágio</SelectItem>
                    <SelectItem value="temporary">Temporário</SelectItem>
                    <SelectItem value="autonomous">Autônomo</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hire_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Admissão</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerWithYearMonth
                      selected={field.value}
                      onSelect={field.onChange}
                      fromYear={1990}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="probation_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Período de Experiência (dias)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">Valores sugeridos: 45 ou 90 dias</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="base_salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salário Base (R$)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="0,00"
                  value={field.value ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ''}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '');
                    const floatValue = parseFloat(numericValue) / 100;
                    field.onChange(isNaN(floatValue) ? 0 : floatValue);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="health_insurance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plano de Saúde (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={field.value ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ''}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '');
                      const floatValue = parseFloat(numericValue) / 100;
                      field.onChange(isNaN(floatValue) ? 0 : floatValue);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dental_insurance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plano Odontológico (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={field.value ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ''}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '');
                      const floatValue = parseFloat(numericValue) / 100;
                      field.onChange(isNaN(floatValue) ? 0 : floatValue);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="transportation_voucher"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vale Transporte (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={field.value ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ''}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '');
                      const floatValue = parseFloat(numericValue) / 100;
                      field.onChange(isNaN(floatValue) ? 0 : floatValue);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meal_voucher"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vale Refeição (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={field.value ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ''}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '');
                      const floatValue = parseFloat(numericValue) / 100;
                      field.onChange(isNaN(floatValue) ? 0 : floatValue);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="other_benefits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outros Benefícios (R$)</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="0,00"
                  value={field.value ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ''}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '');
                    const floatValue = parseFloat(numericValue) / 100;
                    field.onChange(isNaN(floatValue) ? 0 : floatValue);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weekly_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carga Horária Semanal (horas)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={168}
                  placeholder="44"
                  value={field.value ?? 44}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="cost_per_hour"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo por hora (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={field.value ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ''}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '');
                      const floatValue = parseFloat(numericValue) / 100;
                      field.onChange(isNaN(floatValue) ? 0 : floatValue);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hazard_pay_percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Periculosidade (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="monthly_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carga horária mensal</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="220"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Chefia Imediata</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="immediate_supervisor_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Nome da chefia imediata" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="immediate_supervisor_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} value={field.value || ""} placeholder="email@empresa.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="immediate_supervisor_registration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matrícula</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Matrícula da chefia" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Controle de Acesso</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormField
              control={form.control}
              name="badge_barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de barras do crachá</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Código de barras" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mifare_card"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cartão de proximidade Mifare</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Número do cartão Mifare" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-3">
            <FormField
              control={form.control}
              name="block_time_view"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="font-normal cursor-pointer">
                    Bloquear visualização das batidas pelo funcionário
                  </FormLabel>
                  <FormControl>
                    <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receive_alerts"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="font-normal cursor-pointer">
                    Receber alertas desse funcionário
                  </FormLabel>
                  <FormControl>
                    <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isCreating || isUpdating}>
          {(isCreating || isUpdating) ? "Salvando..." : "Salvar Dados Contratuais"}
        </Button>
      </form>
    </Form>
  );
}
