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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCreateHardSkill, useUpdateHardSkill, type HardSkillWithArea } from "@/hooks/useHardSkills";
import { type SkillArea } from "@/hooks/useSkillAreas";
import { LevelSlidersGroup } from "@/components/skills/LevelSlider";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  area_id: z.string().nullable(),
  description: z.string().optional(),
  level_junior: z.number().min(1).max(5),
  level_pleno: z.number().min(1).max(5),
  level_senior: z.number().min(1).max(5),
  display_order: z.number().min(0),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface HardSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  skillAreas: SkillArea[];
  hardSkill?: HardSkillWithArea | null;
}

export function HardSkillDialog({
  open,
  onOpenChange,
  organizationId,
  skillAreas,
  hardSkill,
}: HardSkillDialogProps) {
  const isEditing = !!hardSkill;
  const createMutation = useCreateHardSkill();
  const updateMutation = useUpdateHardSkill();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      area_id: null,
      description: "",
      level_junior: 2,
      level_pleno: 4,
      level_senior: 5,
      display_order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (hardSkill) {
        form.reset({
          name: hardSkill.name,
          area_id: hardSkill.area_id,
          description: hardSkill.description || "",
          level_junior: hardSkill.level_junior,
          level_pleno: hardSkill.level_pleno,
          level_senior: hardSkill.level_senior,
          display_order: hardSkill.display_order,
          is_active: hardSkill.is_active,
        });
      } else {
        form.reset({
          name: "",
          area_id: null,
          description: "",
          level_junior: 2,
          level_pleno: 4,
          level_senior: 5,
          display_order: 0,
          is_active: true,
        });
      }
    }
  }, [open, hardSkill, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && hardSkill) {
        await updateMutation.mutateAsync({
          id: hardSkill.id,
          ...values,
        });
        toast.success("Hard skill atualizada com sucesso!");
      } else {
        await createMutation.mutateAsync({
          organization_id: organizationId,
          name: values.name,
          area_id: values.area_id,
          description: values.description,
          level_junior: values.level_junior,
          level_pleno: values.level_pleno,
          level_senior: values.level_senior,
          display_order: values.display_order,
          is_active: values.is_active,
        });
        toast.success("Hard skill criada com sucesso!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar hard skill");
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Hard Skill" : "Nova Hard Skill"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite as informações da competência técnica."
              : "Crie uma nova competência técnica."}
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
                    <Input placeholder="Ex: Conhecimento em Git" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área (opcional)</FormLabel>
                  <Select
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma área" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sem área</SelectItem>
                      {skillAreas.filter(a => a.is_active).map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
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
                    <Textarea
                      placeholder="Descrição opcional da competência..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LevelSlidersGroup
              levelJunior={form.watch("level_junior")}
              levelPleno={form.watch("level_pleno")}
              levelSenior={form.watch("level_senior")}
              onChangeJunior={(v) => form.setValue("level_junior", v)}
              onChangePleno={(v) => form.setValue("level_pleno", v)}
              onChangeSenior={(v) => form.setValue("level_senior", v)}
              variant="vertical"
            />

            <div className="flex items-end gap-6">
              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem className="flex-1">
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
