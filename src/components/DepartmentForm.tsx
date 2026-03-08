import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCreateDepartment } from "@/hooks/useCreateDepartment";
import { useUpdateDepartment } from "@/hooks/useUpdateDepartment";
import { useEmployees } from "@/hooks/useEmployees";
import { Loader2 } from "lucide-react";

const departmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  description: z.string().optional(),
  manager_id: z.string().optional().nullable(),
  monthly_budget: z.coerce.number().min(0, "Orçamento deve ser positivo").optional().nullable(),
  location: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  extension: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface Department {
  id: string;
  name: string;
  description?: string | null;
  manager_id?: string | null;
  monthly_budget?: number | null;
  location?: string | null;
  phone?: string | null;
  fax?: string | null;
  extension?: string | null;
  email?: string | null;
}

interface DepartmentFormProps {
  department?: Department | null;
  isLoading?: boolean;
}

export function DepartmentForm({ department, isLoading }: DepartmentFormProps) {
  const navigate = useNavigate();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const { data: employees } = useEmployees();

  const activeEmployees = employees?.filter(e => e.status === "active") || [];

  const maskPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const maskCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const num = parseInt(digits, 10) / 100;
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseCurrency = (masked: string): number | null => {
    if (!masked) return null;
    const cleaned = masked.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      description: "",
      manager_id: null,
      monthly_budget: null,
      location: "",
      phone: "",
      fax: "",
      extension: "",
      email: "",
    },
  });

  useEffect(() => {
    if (department) {
      form.reset({
        name: department.name || "",
        description: department.description || "",
        manager_id: department.manager_id || null,
        monthly_budget: department.monthly_budget ?? null,
        location: department.location || "",
        phone: department.phone || "",
        fax: department.fax || "",
        extension: department.extension || "",
        email: department.email || "",
      });
    }
  }, [department, form]);

  const onSubmit = async (data: DepartmentFormData) => {
    const payload = {
      name: data.name,
      description: data.description,
      manager_id: data.manager_id === "none" ? null : (data.manager_id || null),
      monthly_budget: data.monthly_budget ?? null,
      location: data.location || null,
      phone: data.phone || null,
      fax: data.fax || null,
      extension: data.extension || null,
      email: data.email || null,
    };

    if (department) {
      await updateMutation.mutateAsync({ 
        id: department.id, 
        ...payload
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate("/departments");
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {department ? "Editar Departamento" : "Novo Departamento"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do departamento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {activeEmployees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name || employee.email}
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição do departamento (opcional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Orçamento e Localização */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Orçamento e Localização</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthly_budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orçamento Mensal</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0,00"
                          inputMode="numeric"
                          value={field.value != null ? maskCurrency((field.value * 100).toFixed(0)) : ""}
                          onChange={(e) => {
                            const masked = maskCurrency(e.target.value);
                            field.onChange(parseCurrency(masked));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localização</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Sala 101, Bloco A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Contato</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(maskPhone(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="extension"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ramal</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1234"
                          inputMode="numeric"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fax</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 0000-0000"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(maskPhone(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="departamento@empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/departments")}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {department ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
