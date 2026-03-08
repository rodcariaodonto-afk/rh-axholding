import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerWithYearMonth } from "@/components/ui/date-picker-with-year-month";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { useCreatePdiGoal } from "@/hooks/useCreatePdiGoal";
import { useUpdatePdiGoal } from "@/hooks/useUpdatePdiGoal";
import { usePdiById } from "@/hooks/usePdiById";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const goalSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  due_date: z.date({ required_error: "Data de entrega obrigatória" }),
  description: z.string().optional(),
  action_plan: z.string().optional(),
  goal_type: z.enum(["tecnico", "comportamental", "lideranca", "carreira"]),
  weight: z.coerce.number().min(0.1, "Peso deve ser maior que 0"),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalDialogProps {
  pdiId: string;
  goalId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GoalDialog = ({ pdiId, goalId, open, onOpenChange }: GoalDialogProps) => {
  const { data: pdi } = usePdiById(pdiId);
  const createGoal = useCreatePdiGoal();
  const updateGoal = useUpdatePdiGoal();
  const [checklistItems, setChecklistItems] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      description: "",
      action_plan: "",
      goal_type: "tecnico",
      weight: 1,
    },
  });

  const goal = pdi?.goals?.find((g: any) => g.id === goalId);

  useEffect(() => {
    if (goal) {
      form.reset({
        title: goal.title,
        due_date: new Date(goal.due_date),
        description: goal.description || "",
        action_plan: goal.action_plan || "",
        goal_type: goal.goal_type,
        weight: goal.weight ?? 1,
      });
      const items = Array.isArray(goal.checklist_items) ? goal.checklist_items as any[] : [];
      setChecklistItems(items as any);
    } else {
      form.reset({
        title: "",
        description: "",
        action_plan: "",
        goal_type: "tecnico",
        weight: 1,
      });
      setChecklistItems([]);
    }
  }, [goal, form]);

  const onSubmit = async (data: GoalFormData) => {
    const payload = {
      pdi_id: pdiId,
      title: data.title,
      due_date: format(data.due_date, "yyyy-MM-dd"),
      description: data.description,
      action_plan: data.action_plan,
      goal_type: data.goal_type,
      weight: data.weight,
      checklist_items: checklistItems,
    };

    if (goalId) {
      await updateGoal.mutateAsync({ id: goalId, ...payload });
    } else {
      await createGoal.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems([
        ...checklistItems,
        { id: uuidv4(), text: newChecklistItem.trim(), completed: false }
      ]);
      setNewChecklistItem("");
    }
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter(item => item.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goalId ? "Editar Meta" : "Nova Meta"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Melhorar habilidades de liderança" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} placeholder="1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="goal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Meta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="comportamental">Comportamental</SelectItem>
                      <SelectItem value="lideranca">Liderança</SelectItem>
                      <SelectItem value="carreira">Carreira</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Descreva a meta..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Ação</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Como você irá alcançar esta meta?" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Checklist (opcional)</FormLabel>
              <div className="mt-2 space-y-2">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Input value={item.text} disabled className="flex-1" />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar item ao checklist"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                  />
                  <Button type="button" size="icon" onClick={handleAddChecklistItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createGoal.isPending || updateGoal.isPending}>
                {goalId ? "Salvar Alterações" : "Criar Meta"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
