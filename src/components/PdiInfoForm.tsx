import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerWithYearMonth } from "@/components/ui/date-picker-with-year-month";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreatePdi } from "@/hooks/useCreatePdi";
import { useUpdatePdi } from "@/hooks/useUpdatePdi";
import { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const pdiInfoSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  start_date: z.date({ required_error: "Data de início obrigatória" }),
  due_date: z.date({ required_error: "Data de entrega obrigatória" }),
  current_state: z.string().optional(),
  desired_state: z.string().optional(),
  objective: z.string().optional(),
}).refine((data) => data.due_date >= data.start_date, {
  message: "Data de entrega deve ser posterior à data de início",
  path: ["due_date"],
});

type PdiInfoFormData = z.infer<typeof pdiInfoSchema>;

interface PdiInfoFormProps {
  employeeId: string;
  pdi?: any;
  onSuccess?: () => void;
}

export const PdiInfoForm = ({ employeeId, pdi, onSuccess }: PdiInfoFormProps) => {
  const createPdi = useCreatePdi();
  const updatePdi = useUpdatePdi();
  
  const form = useForm<PdiInfoFormData>({
    resolver: zodResolver(pdiInfoSchema),
    defaultValues: {
      title: "",
      current_state: "",
      desired_state: "",
      objective: "",
    },
  });

  useEffect(() => {
    if (pdi) {
      form.reset({
        title: pdi.title,
        start_date: new Date(pdi.start_date),
        due_date: new Date(pdi.due_date),
        current_state: pdi.current_state || "",
        desired_state: pdi.desired_state || "",
        objective: pdi.objective || "",
      });
    }
  }, [pdi, form]);

  const onSubmit = (data: PdiInfoFormData) => {
    const payload = {
      title: data.title,
      start_date: format(data.start_date, "yyyy-MM-dd"),
      due_date: format(data.due_date, "yyyy-MM-dd"),
      current_state: data.current_state,
      desired_state: data.desired_state,
      objective: data.objective,
    };

    if (pdi) {
      updatePdi.mutate({ id: pdi.id, ...payload });
    } else {
      createPdi.mutate(
        { employee_id: employeeId, ...payload },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        }
      );
    }
  };

  const isFinalized = !!pdi?.finalized_at;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input {...field} disabled={isFinalized} placeholder="Ex: PDI 2025 - Desenvolvimento Técnico" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Início *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button 
                        variant="outline" 
                        disabled={isFinalized} 
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerWithYearMonth selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Entrega *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button 
                        variant="outline" 
                        disabled={isFinalized} 
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerWithYearMonth 
                      selected={field.value} 
                      onSelect={field.onChange}
                      fromYear={new Date().getFullYear()}
                      toYear={new Date().getFullYear() + 10}
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
          name="current_state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Onde está (opcional)</FormLabel>
              <FormControl>
                <Textarea {...field} disabled={isFinalized} rows={3} placeholder="Descreva a situação atual do colaborador..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="desired_state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Onde quer chegar (opcional)</FormLabel>
              <FormControl>
                <Textarea {...field} disabled={isFinalized} rows={3} placeholder="Descreva o objetivo futuro desejado..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="objective"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objetivo (opcional)</FormLabel>
              <FormControl>
                <Textarea {...field} disabled={isFinalized} rows={2} placeholder="Objetivo geral do PDI..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isFinalized || createPdi.isPending || updatePdi.isPending}>
            {pdi ? "Salvar Alterações" : "Criar PDI"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
