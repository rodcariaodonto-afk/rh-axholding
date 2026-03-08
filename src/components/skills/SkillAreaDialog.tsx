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
import { useCreateSkillArea, useUpdateSkillArea, type SkillArea } from "@/hooks/useSkillAreas";
import { toast } from "sonner";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  slug: z.string().min(2, "Slug deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  display_order: z.number().min(0),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface SkillAreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  skillArea?: SkillArea | null;
}

export function SkillAreaDialog({
  open,
  onOpenChange,
  organizationId,
  skillArea,
}: SkillAreaDialogProps) {
  const isEditing = !!skillArea;
  const createMutation = useCreateSkillArea();
  const updateMutation = useUpdateSkillArea();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      display_order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (skillArea) {
        form.reset({
          name: skillArea.name,
          slug: skillArea.slug,
          description: skillArea.description || "",
          display_order: skillArea.display_order,
          is_active: skillArea.is_active,
        });
      } else {
        form.reset({
          name: "",
          slug: "",
          description: "",
          display_order: 0,
          is_active: true,
        });
      }
    }
  }, [open, skillArea, form]);

  const nameValue = form.watch("name");
  useEffect(() => {
    if (!isEditing && nameValue) {
      form.setValue("slug", slugify(nameValue));
    }
  }, [nameValue, isEditing, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && skillArea) {
        await updateMutation.mutateAsync({
          id: skillArea.id,
          ...values,
        });
        toast.success("Área atualizada com sucesso!");
      } else {
        await createMutation.mutateAsync({
          organization_id: organizationId,
          name: values.name,
          slug: values.slug,
          description: values.description,
          display_order: values.display_order,
          is_active: values.is_active,
        });
        toast.success("Área criada com sucesso!");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar área");
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Área" : "Nova Área"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite as informações da área de competência."
              : "Crie uma nova área para agrupar competências técnicas."}
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
                    <Input placeholder="Ex: Desenvolvedor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="desenvolvedor" {...field} />
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
                      placeholder="Descrição opcional da área..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="display_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem de exibição</FormLabel>
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
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label>Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      Áreas inativas não aparecem nas listagens
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

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
