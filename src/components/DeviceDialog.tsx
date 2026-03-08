import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEmployees } from "@/hooks/useEmployees";
import {
  Dialog,
  DialogContent,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Device, DeviceType } from "@/types/device";
import { DEVICE_TYPE_LABELS, DEVICE_TYPE_ICONS, DEVICE_STATUS_LABELS } from "@/constants/device";

// Schema base com campos comuns
const baseSchema = z.object({
  user_name: z.string().min(1, "Nome do usuário é obrigatório"),
  user_id: z.string().min(1, "Selecione um usuário"),
  device_type: z.enum(['computer', 'monitor', 'mouse', 'keyboard', 'headset', 'webcam', 'phone', 'tablet', 'apple_tv', 'chromecast', 'cable', 'charger', 'other'] as const),
  status: z.enum(['borrowed', 'available', 'office', 'defective', 'returned', 'not_found', 'maintenance', 'pending_format', 'pending_return', 'sold', 'donated'] as const),
  model: z.string().min(1, "Modelo é obrigatório"),
  year: z.coerce.number().min(1900).max(2100),
  serial: z.string().optional(),
  warranty_date: z.string()
    .optional()
    .refine((date) => {
      if (!date || date === '') return true;
      const parsedDate = new Date(date);
      const minDate = new Date('2022-01-01');
      const maxDate = new Date('2100-12-31');
      return parsedDate >= minDate && parsedDate <= maxDate && !isNaN(parsedDate.getTime());
    }, { message: "Data de garantia inválida. Use uma data entre 2022 e 2100." }),
  notes: z.string().optional(),
});

// Schema para computador
const computerSchema = baseSchema.extend({
  processor: z.string().min(1, "Processador é obrigatório"),
  ram: z.coerce.number().min(1, "RAM é obrigatória"),
  disk: z.coerce.number().min(1, "Disco é obrigatório"),
  screen_size: z.coerce.number().optional(),
  hexnode_registered: z.boolean().default(false),
});

// Schema para monitor
const monitorSchema = baseSchema.extend({
  screen_size: z.coerce.number().min(1, "Tamanho da tela é obrigatório"),
  processor: z.string().optional(),
  ram: z.coerce.number().optional(),
  disk: z.coerce.number().optional(),
  hexnode_registered: z.boolean().default(false).optional(),
});

// Schema unificado que valida dinamicamente baseado no tipo
const unifiedSchema = baseSchema.extend({
  processor: z.string().optional(),
  ram: z.coerce.number().optional(),
  disk: z.coerce.number().optional(),
  screen_size: z.coerce.number().optional(),
  hexnode_registered: z.boolean().default(false).optional(),
}).superRefine((data, ctx) => {
  // Validação para computador
  if (data.device_type === 'computer') {
    if (!data.processor || data.processor.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Processador é obrigatório",
        path: ['processor'],
      });
    }
    if (!data.ram || data.ram < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "RAM é obrigatória",
        path: ['ram'],
      });
    }
    if (!data.disk || data.disk < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Disco é obrigatório",
        path: ['disk'],
      });
    }
  }
  
  // Validação para monitor
  if (data.device_type === 'monitor') {
    if (!data.screen_size || data.screen_size < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tamanho da tela é obrigatório",
        path: ['screen_size'],
      });
    }
  }
});

type FormSchema = z.infer<typeof unifiedSchema>;

interface DeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  onSave: (device: Device) => void;
}

const DeviceDialog = ({
  open,
  onOpenChange,
  device,
  onSave,
}: DeviceDialogProps) => {
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  
  const form = useForm<FormSchema>({
    resolver: zodResolver(unifiedSchema),
    defaultValues: {
      user_name: "",
      user_id: "",
      device_type: "computer" as DeviceType,
      status: "borrowed",
      model: "",
      year: new Date().getFullYear(),
      processor: "",
      ram: 8,
      disk: 256,
      screen_size: undefined,
      hexnode_registered: false,
      serial: "",
      warranty_date: "",
      notes: "",
    },
  });

  const watchDeviceType = form.watch("device_type");

  useEffect(() => {
    if (device) {
      form.reset({
        user_name: device.user_name,
        user_id: device.user_id || "",
        device_type: device.device_type,
        status: device.status,
        model: device.model,
        year: device.year,
        processor: device.processor || "",
        ram: device.ram || 8,
        disk: device.disk || 256,
        screen_size: device.screen_size || undefined,
        hexnode_registered: device.hexnode_registered || false,
        serial: device.serial || "",
        warranty_date: device.warranty_date || "",
        notes: device.notes || "",
      });
    } else {
      form.reset({
        user_name: "",
        user_id: "",
        device_type: "computer" as DeviceType,
        status: "borrowed",
        model: "",
        year: new Date().getFullYear(),
        processor: "",
        ram: 8,
        disk: 256,
        screen_size: undefined,
        hexnode_registered: false,
        serial: "",
        warranty_date: "",
        notes: "",
      });
    }
  }, [device, form]);

  const onSubmit = (values: FormSchema) => {
    onSave({
      id: device?.id || "",
      user_name: values.user_name,
      user_id: values.user_id,
      device_type: values.device_type,
      status: values.status,
      model: values.model,
      year: values.year,
      processor: values.processor || undefined,
      ram: values.ram || undefined,
      disk: values.disk || undefined,
      screen_size: values.screen_size || undefined,
      hexnode_registered: values.device_type === 'computer' ? (values.hexnode_registered || false) : false,
      serial: values.serial?.trim() || undefined,
      warranty_date: values.warranty_date?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    });
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {device ? "Editar Dispositivo" : "Adicionar Novo Dispositivo"}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="device_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Equipamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(DEVICE_TYPE_LABELS).map(([value, label]) => {
                          const Icon = DEVICE_TYPE_ICONS[value as DeviceType];
                          return (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {label}
                              </div>
                            </SelectItem>
                          );
                        })}
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
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(DEVICE_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável (@popcode.com.br)</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      const selectedEmployee = employees.find(p => p.id === value);
                      if (selectedEmployee) {
                        form.setValue("user_name", selectedEmployee.full_name || selectedEmployee.email.split('@')[0]);
                      }
                    }}
                    value={field.value}
                    disabled={loadingEmployees}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.email}
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
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl>
                    <Input placeholder='Macbook Pro 16"' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchDeviceType === 'monitor' && (
                <FormField
                  control={form.control}
                  name="screen_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho da Tela (polegadas)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="27" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {watchDeviceType === 'computer' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="processor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processador</FormLabel>
                        <FormControl>
                          <Input placeholder="M1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="screen_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamanho da Tela (opcional)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="16" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RAM (GB)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="16" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="disk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disk (GB)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="512" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="hexnode_registered"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Cadastrado no Hexnode
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC123XYZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warranty_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Garantia até (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        min="2022-01-01"
                        max="2100-12-31"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDialog;
