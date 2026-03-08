import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
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
import { DatePickerWithYearMonth } from "@/components/ui/date-picker-with-year-month";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEmployeeById } from "@/hooks/useEmployeeById";
import { useUpdateEmployee } from "@/hooks/useUpdateEmployee";
import { useEmployeeContact } from "@/hooks/useEmployeeContact";
import { useEmployeeContract } from "@/hooks/useEmployeeContract";
import { useDepartments } from "@/hooks/useDepartments";
import { usePositions } from "@/hooks/usePositions";
import { useUnits } from "@/hooks/useUnits";
import { useEmployees } from "@/hooks/useEmployees";
import { usePositionLevels, getPositionLevelLabel } from "@/hooks/usePositionLevels";
import { Skeleton } from "@/components/ui/skeleton";
import { PdiTab } from "./PdiTab";
import { AvatarUpload } from "./AvatarUpload";
import { parseDateFromDB, formatDateForDB } from "@/lib/dateUtils";

const personalSchema = z.object({
  full_name: z.string().min(1, "Nome obrigatório"),
  birth_date: z.date().optional().nullable(),
  gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say"]).optional().nullable(),
  nationality: z.string().optional().nullable(),
  birthplace: z.string().optional().nullable(),
  ethnicity: z.enum(["white", "black", "brown", "asian", "indigenous", "not_declared"]).optional().nullable(),
  marital_status: z.enum(["single", "married", "divorced", "widowed", "domestic_partnership", "prefer_not_to_say"]).optional().nullable(),
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
});

const contactSchema = z.object({
  personal_email: z.string().email().optional().or(z.literal("")),
  mobile_phone: z.string().optional(),
  home_phone: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  country: z.string().min(1),
  zip_code: z.string().min(1),
  state: z.string().min(1),
  city: z.string().min(1),
  neighborhood: z.string().optional(),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
});

const contractSchema = z.object({
  contract_type: z.enum(["clt", "pj", "internship", "temporary", "other"]),
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
  is_active: z.boolean(),
});

interface EmployeeDialogProps {
  employeeId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDialog({ employeeId, open, onOpenChange }: EmployeeDialogProps) {
  const { data: employee, isLoading } = useEmployeeById(employeeId || undefined);
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const { data: units } = useUnits();
  const { data: employees } = useEmployees();
  const positionLevels = usePositionLevels();
  const { mutate: updateEmployee, isPending: isUpdatingEmployee } = useUpdateEmployee(() => {
    // Toast de sucesso já é mostrado no hook
  });
  const { contact, updateContact, isUpdating: isUpdatingContact } = useEmployeeContact(employeeId || undefined);
  const { contracts, createContract, updateContract, isCreating, isUpdating: isUpdatingContract } = useEmployeeContract(employeeId || undefined);

  const personalForm = useForm<z.infer<typeof personalSchema>>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      employment_type: "full_time",
      status: "active",
    },
  });

  const contactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      country: "BR",
      zip_code: "00000-000",
      state: "SP",
      city: "São Paulo",
      street: "A preencher",
      number: "0",
    },
  });

  const contractForm = useForm<z.infer<typeof contractSchema>>({
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
      is_active: true,
    },
  });

  const selectedPosition = positions?.find(p => p.id === personalForm.watch("base_position_id"));

  useEffect(() => {
    if (employee) {
      personalForm.reset({
        full_name: employee.full_name || "",
        birth_date: parseDateFromDB(employee.birth_date),
        gender: employee.gender || null,
        nationality: employee.nationality || null,
        birthplace: employee.birthplace || null,
        ethnicity: employee.ethnicity || null,
        marital_status: employee.marital_status || null,
        education_level: employee.education_level || null,
        education_course: employee.education_course || null,
        department_id: employee.department_id || null,
        base_position_id: employee.base_position_id || null,
        position_level_detail: employee.position_level_detail || null,
        unit_id: employee.unit_id || null,
        manager_id: employee.manager_id || null,
        employment_type: employee.employment_type,
        status: employee.status,
        termination_date: parseDateFromDB(employee.termination_date),
      });
    }
  }, [employee, personalForm]);

  useEffect(() => {
    if (contact) {
      contactForm.reset({
        personal_email: contact.personal_email || "",
        mobile_phone: contact.mobile_phone || "",
        home_phone: contact.home_phone || "",
        emergency_contact_name: contact.emergency_contact_name || "",
        emergency_contact_phone: contact.emergency_contact_phone || "",
        country: contact.country,
        zip_code: contact.zip_code,
        state: contact.state,
        city: contact.city,
        neighborhood: contact.neighborhood || "",
        street: contact.street,
        number: contact.number,
        complement: contact.complement || "",
      });
    }
  }, [contact, contactForm]);

  useEffect(() => {
    if (contracts && contracts.length > 0) {
      const activeContract = contracts.find((c) => c.is_active) || contracts[0];
      contractForm.reset({
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
        is_active: activeContract.is_active,
      });
    }
  }, [contracts, contractForm]);

  const onSubmitPersonal = (data: z.infer<typeof personalSchema>) => {
    if (!employeeId) return;
    
    updateEmployee({
      id: employeeId,
      full_name: data.full_name,
      birth_date: formatDateForDB(data.birth_date),
      gender: data.gender || undefined,
      nationality: data.nationality || undefined,
      birthplace: data.birthplace || undefined,
      ethnicity: data.ethnicity || undefined,
      marital_status: data.marital_status || undefined,
      education_level: data.education_level || undefined,
      education_course: data.education_course || undefined,
      department_id: data.department_id || undefined,
      base_position_id: data.base_position_id || undefined,
      position_level_detail: data.position_level_detail || undefined,
      unit_id: data.unit_id || undefined,
      manager_id: data.manager_id || undefined,
      employment_type: data.employment_type,
      status: data.status,
      termination_date: formatDateForDB(data.termination_date),
    });
  };

  const onSubmitContact = (data: z.infer<typeof contactSchema>) => {
    updateContact(data);
  };

  const onSubmitContract = (data: z.infer<typeof contractSchema>) => {
    if (!employeeId) return;
    
    const contractData = {
      user_id: employeeId,
      contract_type: data.contract_type,
      hire_date: formatDateForDB(data.hire_date) as string,
      probation_days: data.probation_days,
      contract_start_date: formatDateForDB(data.contract_start_date),
      contract_duration_days: data.contract_duration_days,
      contract_end_date: formatDateForDB(data.contract_end_date),
      base_salary: data.base_salary,
      health_insurance: data.health_insurance,
      dental_insurance: data.dental_insurance,
      transportation_voucher: data.transportation_voucher,
      meal_voucher: data.meal_voucher,
      other_benefits: data.other_benefits,
      is_active: data.is_active,
    };

    if (contracts && contracts.length > 0) {
      const activeContract = contracts.find((c) => c.is_active) || contracts[0];
      updateContract({ ...contractData, id: activeContract.id });
    } else {
      createContract(contractData);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <Skeleton className="h-[400px] w-full" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            {employeeId && (
              <AvatarUpload
                userId={employeeId}
                currentPhotoUrl={employee?.photo_url}
                fullName={employee?.full_name}
                size="md"
                editable={true}
              />
            )}
            <div>
              <DialogTitle>
                {employeeId ? employee?.full_name || "Editar Funcionário" : "Novo Funcionário"}
              </DialogTitle>
              {employeeId && employee?.email && (
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Pessoal</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
            <TabsTrigger value="contract">Contrato</TabsTrigger>
            <TabsTrigger value="pdi">PDI</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 pt-6">
            <Form {...personalForm}>
              <form onSubmit={personalForm.handleSubmit(onSubmitPersonal)} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={personalForm.control}
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
                    control={personalForm.control}
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
                    control={personalForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Gênero</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
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
                    control={personalForm.control}
                    name="department_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Departamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
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
                    control={personalForm.control}
                    name="base_position_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Cargo</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Limpar o nível se o novo cargo não tem níveis
                            const pos = positions?.find(p => p.id === value);
                            if (pos && !pos.has_levels) {
                              personalForm.setValue("position_level_detail", null);
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
                    control={personalForm.control}
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
                    control={personalForm.control}
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
                    control={personalForm.control}
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

                  {personalForm.watch("status") === "terminated" && (
                    <FormField
                      control={personalForm.control}
                      name="termination_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Desligamento</FormLabel>
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
                                fromYear={2000}
                                toYear={new Date().getFullYear()}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isUpdatingEmployee}
                >
                  {isUpdatingEmployee ? "Salvando..." : "Salvar Dados Pessoais"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 pt-6">
            <Form {...contactForm}>
              <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={contactForm.control}
                    name="personal_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Pessoal</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contactForm.control}
                    name="mobile_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="(00) 00000-0000"
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              const formatted = value
                                .replace(/^(\d{2})(\d)/g, "($1) $2")
                                .replace(/(\d{5})(\d)/, "$1-$2")
                                .slice(0, 15);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={contactForm.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="00000-000"
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              const formatted = value.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
                              field.onChange(formatted);
                            }}
                            onBlur={async (e) => {
                              const cep = e.target.value.replace(/\D/g, "");
                              if (cep.length === 8) {
                                try {
                                  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                                  const data = await response.json();
                                  if (!data.erro) {
                                    contactForm.setValue("street", data.logradouro || "");
                                    contactForm.setValue("neighborhood", data.bairro || "");
                                    contactForm.setValue("city", data.localidade || "");
                                    contactForm.setValue("state", data.uf || "");
                                  }
                                } catch (error) {
                                  console.error("Erro ao buscar CEP:", error);
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contactForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contactForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={contactForm.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Rua</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contactForm.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isUpdatingContact}>
                  {isUpdatingContact ? "Salvando..." : "Salvar Dados de Contato"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="contract" className="space-y-4 pt-6">
            <Form {...contractForm}>
              <form 
                onSubmit={contractForm.handleSubmit(onSubmitContract)} 
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={contractForm.control}
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
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contractForm.control}
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
                  control={contractForm.control}
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
                    control={contractForm.control}
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
                    control={contractForm.control}
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
                    control={contractForm.control}
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
                      control={contractForm.control}
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
                  control={contractForm.control}
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

                <Button type="submit" className="w-full" disabled={isCreating || isUpdatingContract}>
                  {(isCreating || isUpdatingContract) ? "Salvando..." : "Salvar Dados Contratuais"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="pdi" className="space-y-4 pt-6">
            {employeeId && <PdiTab employeeId={employeeId} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
