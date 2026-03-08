import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithYearMonth } from "@/components/ui/date-picker-with-year-month";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { parseDateFromDB } from "@/lib/dateUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const personalSchema = z.object({
  full_name: z.string().min(1, "Nome obrigatório"),
  birth_date: z.date().optional().nullable(),
  gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say"]).optional().nullable(),
  nationality: z.string().optional().nullable(),
  birthplace: z.string().optional().nullable(),
  ethnicity: z.enum(["white", "black", "brown", "asian", "indigenous", "not_declared"]).optional().nullable(),
  marital_status: z.enum(["single", "married", "divorced", "widowed", "domestic_partnership", "prefer_not_to_say"]).optional().nullable(),
  number_of_children: z.number().int().min(0).optional().nullable(),
  education_level: z.enum(["elementary", "high_school", "technical", "undergraduate", "postgraduate", "masters", "doctorate", "postdoc"]).optional().nullable(),
  education_course: z.string().optional().nullable(),
  department_id: z.string().optional().nullable(),
  base_position_id: z.string().optional().nullable(),
  position_level_detail: z.enum(["junior_i", "junior_ii", "junior_iii", "pleno_i", "pleno_ii", "pleno_iii", "senior_i", "senior_ii", "senior_iii"]).optional().nullable(),
  unit_id: z.string().optional().nullable(),
  manager_id: z.string().optional().nullable(),
  employment_type: z.enum(["full_time", "part_time", "contractor", "intern"]),
  status: z.enum(["active", "on_leave", "terminated"]),
  termination_date: z.date().optional().nullable(),
  // Documentos (from employees_legal_docs)
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido")
    .optional()
    .or(z.literal("")),
  rg: z.string().optional().or(z.literal("")),
  rg_issuer: z.string().optional().or(z.literal("")),
  // Dados Bancários (from employees_legal_docs)
  bank_name: z.string().optional().or(z.literal("")),
  bank_agency: z.string().optional().or(z.literal("")),
  bank_account: z.string().optional().or(z.literal("")),
  bank_account_type: z.string().optional().or(z.literal("")),
  pix_key: z.string().optional().or(z.literal("")),
});

export type PersonalFormData = z.infer<typeof personalSchema>;

interface PersonalInfoFormProps {
  employee: any;
  demographics: any;
  legalDocs: any;
  departments: any[];
  positions: any[];
  units: any[];
  employees: any[];
  positionLevels: any[];
  isUpdating: boolean;
  isLegalDocsView?: boolean; // True if viewing masked data (manager)
  canEditLegalDocs?: boolean; // True if user can edit legal docs
  onSubmit: (data: PersonalFormData) => void;
}

export function PersonalInfoForm({
  employee,
  demographics,
  legalDocs,
  departments,
  positions,
  units,
  employees,
  positionLevels,
  isUpdating,
  isLegalDocsView = false,
  canEditLegalDocs = true,
  onSubmit,
}: PersonalInfoFormProps) {
  const form = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      employment_type: "full_time",
      status: "active",
      cpf: "",
      rg: "",
      rg_issuer: "",
      bank_name: "",
      bank_agency: "",
      bank_account: "",
      bank_account_type: "",
      pix_key: "",
    },
  });

  const selectedPosition = positions?.find(p => p.id === form.watch("base_position_id"));

  useEffect(() => {
    if (employee) {
      form.reset({
        full_name: employee.full_name || "",
        // Demographics data (from employees_demographics table or fallback to employees)
        birth_date: parseDateFromDB(demographics?.birth_date || employee.birth_date),
        gender: demographics?.gender || employee.gender || undefined,
        nationality: demographics?.nationality || employee.nationality || undefined,
        birthplace: demographics?.birthplace || employee.birthplace || undefined,
        ethnicity: demographics?.ethnicity || employee.ethnicity || undefined,
        marital_status: demographics?.marital_status || employee.marital_status || undefined,
        number_of_children: demographics?.number_of_children ?? employee.number_of_children ?? undefined,
        education_level: demographics?.education_level || employee.education_level || undefined,
        education_course: demographics?.education_course || employee.education_course || undefined,
        // Organizational data (from employees table)
        department_id: employee.department_id || undefined,
        base_position_id: employee.base_position_id || undefined,
        position_level_detail: employee.position_level_detail || undefined,
        unit_id: employee.unit_id || undefined,
        manager_id: employee.manager_id || undefined,
        employment_type: employee.employment_type,
        status: employee.status,
        termination_date: parseDateFromDB(employee.termination_date),
        // Legal docs and banking data (from employees_legal_docs table)
        cpf: legalDocs?.cpf || "",
        rg: legalDocs?.rg || "",
        rg_issuer: legalDocs?.rg_issuer || "",
        bank_name: legalDocs?.bank_name || "",
        bank_agency: legalDocs?.bank_agency || "",
        bank_account: legalDocs?.bank_account || "",
        bank_account_type: legalDocs?.bank_account_type || "",
        pix_key: legalDocs?.pix_key || "",
      });
    }
  }, [employee, demographics, legalDocs, form]);

  // Check if legal docs fields should be disabled (manager viewing masked data)
  const legalDocsDisabled = isLegalDocsView && !canEditLegalDocs;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {legalDocsDisabled && (
          <Alert variant="default" className="border-warning/50 bg-warning/10">
            <ShieldAlert className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground">
              Você está visualizando dados mascarados deste colaborador. Documentos e dados bancários não podem ser editados.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birth_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Nascimento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal w-full",
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
                      disabled={(date) => date > new Date()}
                      fromYear={1940}
                      toYear={new Date().getFullYear() - 18}
                      defaultMonth={new Date(new Date().getFullYear() - 25, 0, 1)}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Gênero</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="non_binary">Não-binário</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefiro não dizer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Nacionalidade</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="Ex: Brasileiro" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthplace"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Naturalidade</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="Ex: São Paulo, SP" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ethnicity"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Etnia</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="white">Branca</SelectItem>
                    <SelectItem value="black">Preta</SelectItem>
                    <SelectItem value="brown">Parda</SelectItem>
                    <SelectItem value="asian">Amarela</SelectItem>
                    <SelectItem value="indigenous">Indígena</SelectItem>
                    <SelectItem value="not_declared">Prefiro não declarar</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="marital_status"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Estado Civil</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="single">Solteiro(a)</SelectItem>
                    <SelectItem value="married">Casado(a)</SelectItem>
                    <SelectItem value="divorced">Divorciado(a)</SelectItem>
                    <SelectItem value="widowed">Viúvo(a)</SelectItem>
                    <SelectItem value="domestic_partnership">União Estável</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefiro não dizer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="number_of_children"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Qtd. de Filhos</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? null : parseInt(val, 10));
                    }}
                    placeholder="0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="education_level"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Escolaridade</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="elementary">Ensino Fundamental</SelectItem>
                    <SelectItem value="high_school">Ensino Médio</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="undergraduate">Graduação</SelectItem>
                    <SelectItem value="postgraduate">Pós-Graduação</SelectItem>
                    <SelectItem value="masters">Mestrado</SelectItem>
                    <SelectItem value="doctorate">Doutorado</SelectItem>
                    <SelectItem value="postdoc">Pós-Doutorado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="education_course"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Curso / Formação</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="Ex: Administração" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="department_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Departamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
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
            name="base_position_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Cargo</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    const pos = positions?.find(p => p.id === value);
                    if (pos && !pos.has_levels) {
                      form.setValue("position_level_detail", null);
                    }
                  }} 
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {positions?.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id}>
                        {pos.title}
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
            name="position_level_detail"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Nível</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ""}
                  disabled={!selectedPosition?.has_levels}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedPosition?.has_levels ? "Selecione o nível" : "Sem níveis"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {positionLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="manager_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Gestor Direto</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gestor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {employees
                      ?.filter((emp) => emp.id !== employee?.id && emp.status === "active")
                      .map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name || emp.email}
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
            name="unit_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Unidade</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {units?.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employment_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Emprego</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="full_time">Tempo Integral</SelectItem>
                    <SelectItem value="part_time">Meio Período</SelectItem>
                    <SelectItem value="contractor">Contratado</SelectItem>
                    <SelectItem value="intern">Estagiário</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="on_leave">Em Licença</SelectItem>
                    <SelectItem value="terminated">Desligado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Documentos */}
        <div className={cn(legalDocsDisabled && "opacity-60")}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Documentos {legalDocsDisabled && "(Mascarados)"}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value || ""}
                      placeholder="000.000.000-00"
                      disabled={legalDocsDisabled}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        const formatted = value
                          .replace(/(\d{3})(\d)/, "$1.$2")
                          .replace(/(\d{3})(\d)/, "$1.$2")
                          .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
                          .slice(0, 14);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Número do RG" disabled={legalDocsDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rg_issuer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Órgão Emissor</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="SSP-SP" disabled={legalDocsDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Dados Bancários */}
        <div className={cn(legalDocsDisabled && "opacity-60")}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Dados Bancários {legalDocsDisabled && "(Mascarados)"}
          </h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Nome do banco" disabled={legalDocsDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank_agency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agência</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="0000" disabled={legalDocsDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank_account"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="00000-0" disabled={legalDocsDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank_account_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Conta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={legalDocsDisabled}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="checking">Corrente</SelectItem>
                      <SelectItem value="savings">Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="pix_key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chave PIX</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="CPF, email, telefone ou chave aleatória" disabled={legalDocsDisabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isUpdating}>
          {isUpdating ? "Salvando..." : "Salvar Dados Pessoais"}
        </Button>
      </form>
    </Form>
  );
}
