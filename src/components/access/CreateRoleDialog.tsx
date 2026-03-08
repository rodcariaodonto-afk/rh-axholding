import { useState } from "react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCreateRole } from "@/hooks/useCreateRole";
import { Loader2 } from "lucide-react";

const PERMISSIONS_BY_MODULE: Record<string, { id: string; label: string }[]> = {
  admin: [
    { id: "admin.system_settings", label: "Configurações do sistema" },
    { id: "admin.view_costs", label: "Ver custos" },
  ],
  applications: [
    { id: "applications.view", label: "Ver candidaturas" },
    { id: "applications.manage", label: "Gerenciar candidaturas" },
    { id: "applications.delete", label: "Excluir candidaturas" },
  ],
  certificates: [
    { id: "certificates.view", label: "Ver certificados" },
    { id: "certificates.create", label: "Criar certificados" },
    { id: "certificates.delete", label: "Excluir certificados" },
  ],
  devices: [
    { id: "devices.view", label: "Ver dispositivos" },
    { id: "devices.create", label: "Criar dispositivos" },
    { id: "devices.edit", label: "Editar dispositivos" },
    { id: "devices.delete", label: "Excluir dispositivos" },
  ],
  employees: [
    { id: "employees.view", label: "Ver colaboradores" },
    { id: "employees.view_all", label: "Ver todos colaboradores" },
    { id: "employees.edit", label: "Editar colaboradores" },
    { id: "employees.delete", label: "Excluir colaboradores" },
  ],
  jobs: [
    { id: "jobs.view", label: "Ver vagas" },
    { id: "jobs.create", label: "Criar vagas" },
    { id: "jobs.edit", label: "Editar vagas" },
    { id: "jobs.delete", label: "Excluir vagas" },
    { id: "jobs.publish", label: "Publicar vagas" },
  ],
  positions: [
    { id: "positions.view", label: "Ver cargos" },
    { id: "positions.create", label: "Criar cargos" },
    { id: "positions.edit", label: "Editar cargos" },
    { id: "positions.delete", label: "Excluir cargos" },
  ],
  time_off: [
    { id: "time_off.view", label: "Ver férias/ausências" },
    { id: "time_off.create", label: "Criar solicitações" },
    { id: "time_off.approve", label: "Aprovar solicitações" },
    { id: "time_off.delete", label: "Excluir solicitações" },
  ],
  trainings: [
    { id: "trainings.view", label: "Ver treinamentos" },
    { id: "trainings.create", label: "Criar treinamentos" },
    { id: "trainings.delete", label: "Excluir treinamentos" },
  ],
  users: [
    { id: "users.view", label: "Ver usuários" },
    { id: "users.manage_roles", label: "Gerenciar roles" },
  ],
};

const MODULE_LABELS: Record<string, string> = {
  admin: "Administração",
  applications: "Candidaturas",
  certificates: "Certificados",
  devices: "Dispositivos",
  employees: "Colaboradores",
  jobs: "Vagas",
  positions: "Cargos",
  time_off: "Férias/Ausências",
  trainings: "Treinamentos",
  users: "Usuários",
};

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  slug: z
    .string()
    .min(2, "Identificador deve ter pelo menos 2 caracteres")
    .regex(
      /^[a-z0-9_-]+$/,
      "Identificador deve conter apenas letras minúsculas, números, _ ou -"
    ),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "Selecione pelo menos uma permissão"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoleDialog({ open, onOpenChange }: CreateRoleDialogProps) {
  const createRole = useCreateRole();
  const [expandedModules, setExpandedModules] = useState<string[]>(
    Object.keys(PERMISSIONS_BY_MODULE)
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      permissions: [],
    },
  });

  const selectedPermissions = form.watch("permissions");

  const handleSubmit = async (values: FormValues) => {
    await createRole.mutateAsync({
      name: values.name,
      slug: values.slug,
      description: values.description,
      permissions: values.permissions,
    });
    form.reset();
    onOpenChange(false);
  };

  const toggleModule = (module: string) => {
    setExpandedModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  const selectAllInModule = (module: string, checked: boolean) => {
    const modulePerms = PERMISSIONS_BY_MODULE[module].map((p) => p.id);
    const current = form.getValues("permissions");

    if (checked) {
      const newPerms = [...new Set([...current, ...modulePerms])];
      form.setValue("permissions", newPerms, { shouldValidate: true });
    } else {
      const newPerms = current.filter((p) => !modulePerms.includes(p));
      form.setValue("permissions", newPerms, { shouldValidate: true });
    }
  };

  const isModuleFullySelected = (module: string) => {
    const modulePerms = PERMISSIONS_BY_MODULE[module].map((p) => p.id);
    return modulePerms.every((p) => selectedPermissions.includes(p));
  };

  const isModulePartiallySelected = (module: string) => {
    const modulePerms = PERMISSIONS_BY_MODULE[module].map((p) => p.id);
    return (
      modulePerms.some((p) => selectedPermissions.includes(p)) &&
      !isModuleFullySelected(module)
    );
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    form.setValue("slug", slug);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Criar Role Customizada</DialogTitle>
          <DialogDescription>
            Defina um novo perfil de acesso com permissões específicas para sua
            organização.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Role</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Gestor de RH"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleNameChange(e.target.value);
                        }}
                      />
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
                    <FormLabel>Identificador</FormLabel>
                    <FormControl>
                      <Input placeholder="gestor-rh" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Usado internamente para identificar a role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva as responsabilidades desta role..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <FormLabel>
                    Permissões{" "}
                    <Badge variant="secondary" className="ml-2">
                      {selectedPermissions.length} selecionadas
                    </Badge>
                  </FormLabel>
                  <ScrollArea className="h-[250px] border rounded-md p-3">
                    <div className="space-y-4">
                      {Object.entries(PERMISSIONS_BY_MODULE).map(
                        ([module, permissions]) => (
                          <div key={module} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={isModuleFullySelected(module)}
                                onCheckedChange={(checked) =>
                                  selectAllInModule(module, checked as boolean)
                                }
                                className={
                                  isModulePartiallySelected(module)
                                    ? "data-[state=unchecked]:bg-primary/30"
                                    : ""
                                }
                              />
                              <button
                                type="button"
                                onClick={() => toggleModule(module)}
                                className="font-medium text-sm hover:underline"
                              >
                                {MODULE_LABELS[module] || module}
                              </button>
                            </div>
                            {expandedModules.includes(module) && (
                              <div className="ml-6 grid grid-cols-2 gap-2">
                                {permissions.map((perm) => (
                                  <FormField
                                    key={perm.id}
                                    control={form.control}
                                    name="permissions"
                                    render={({ field }) => (
                                      <FormItem className="flex items-center gap-2 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value.includes(
                                              perm.id
                                            )}
                                            onCheckedChange={(checked) => {
                                              const newValue = checked
                                                ? [...field.value, perm.id]
                                                : field.value.filter(
                                                    (v) => v !== perm.id
                                                  );
                                              field.onChange(newValue);
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-xs font-normal cursor-pointer">
                                          {perm.label}
                                        </FormLabel>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createRole.isPending}>
                {createRole.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Role
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
