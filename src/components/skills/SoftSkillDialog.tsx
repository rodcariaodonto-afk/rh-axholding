import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LevelSlidersGroup } from "./LevelSlider";
import { useCreateSoftSkill, useUpdateSoftSkill, type SoftSkill } from "@/hooks/useSoftSkills";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  level_junior: z.number().min(1).max(5),
  level_pleno: z.number().min(1).max(5),
  level_senior: z.number().min(1).max(5),
  display_order: z.number().min(0),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface SoftSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  softSkill?: SoftSkill | null;
}

export function SoftSkillDialog({
  open,
  onOpenChange,
  organizationId,
  softSkill,
}: SoftSkillDialogProps) {
  const isEditing = !!softSkill;
  const createMutation = useCreateSoftSkill();
  const updateMutation = useUpdateSoftSkill();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      level_junior: 2,
      level_pleno: 3,
      level_senior: 5,
      display_order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (softSkill) {
        form.reset({
          name: softSkill.name,
          description: softSkill.description || "",
          level_junior: softSkill.level_junior,
          level_pleno: softSkill.level_pleno,
          level_senior: softSkill.level_senior,
          display_order: softSkill.display_order,
          is_active: softSkill.is_active,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          level_junior: 2,
          level_pleno: 3,
          level_senior: 5,
          display_order: 0,
          is_active: true,
        });
      }
    }
  }, [open, softSkill, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && softSkill) {
        await updateMutation.mutateAsync({
          id: softSkill.id,
          ...values,
        });
        toast.success("Soft skill atualizada com sucesso!");
      } else {
        await createMutation.mutateAsync({
          organization_id: organizationId,
          name: values.name,
          description: values.description,
          level_junior: values.level_junior,
          level_pleno: values.level_pleno,
          level_senior: values.level_senior,
          display_order: values.display_order,
          is_active: values.is_active,
        });
        toast.success("Soft skill criada com sucesso!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar soft skill");
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Soft Skill" : "Nova Soft Skill"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite as informações da competência comportamental."
              : "Crie uma nova competência comportamental."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Comunicação" {...field} />
                  </FormControl>
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
                    <Textarea
                      placeholder="Descrição da competência..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LevelSlidersGroup
              variant="horizontal"
              levelJunior={form.watch("level_junior")}
              levelPleno={form.watch("level_pleno")}
              levelSenior={form.watch("level_senior")}
              onChangeJunior={(v) => form.setValue("level_junior", v)}
              onChangePleno={(v) => form.setValue("level_pleno", v)}
              onChangeSenior={(v) => form.setValue("level_senior", v)}
            />

            <div className="flex items-end gap-6">
              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem className="w-32">
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 pb-2">
                    <Label>Ativa</Label>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
