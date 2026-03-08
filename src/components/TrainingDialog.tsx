import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithYearMonth } from "@/components/ui/date-picker-with-year-month";
import { Link2, Upload, FileText, X, Loader2, Trash2 } from "lucide-react";
import {
  EmployeeTraining,
  TrainingFormData,
  useCreateTraining,
  useUpdateTraining,
  useDeleteTraining,
} from "@/hooks/useEmployeeTrainings";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  training_type: z.enum(["treinamento", "certificacao"]),
  description: z.string().optional(),
  hours: z.coerce.number().min(1, "Carga horária deve ser maior que 0"),
  completion_date: z.string().min(1, "Data de conclusão é obrigatória"),
  cost: z.coerce.number().optional(),
  sponsor: z.enum(["empresa", "colaborador"]).optional(),
  generates_points: z.boolean().optional(),
  career_points: z.coerce.number().optional(),
});

interface TrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  training?: EmployeeTraining | null;
}

export function TrainingDialog({
  open,
  onOpenChange,
  employeeId,
  training,
}: TrainingDialogProps) {
  const { user } = useAuth();
  const { canDeleteCertificates, canDeleteTrainings } = useUserRole();
  const createTraining = useCreateTraining();
  const updateTraining = useUpdateTraining();
  const deleteTraining = useDeleteTraining();
  
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      training_type: "treinamento",
      description: "",
      hours: 0,
      completion_date: "",
      cost: undefined,
      sponsor: "empresa",
      generates_points: false,
      career_points: 0,
    },
  });

  const generatesPoints = form.watch("generates_points");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo permitido: 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use PDF, JPEG, PNG ou WebP");
      return;
    }

    setCertificateFile(file);
  };

  const uploadCertificate = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${employeeId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('training-certificates')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('training-certificates')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading certificate:', error);
      toast.error("Erro ao fazer upload do certificado");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteCertificateFromStorage = async (url: string): Promise<boolean> => {
    try {
      const bucketName = 'training-certificates';
      const urlParts = url.split(`${bucketName}/`);
      if (urlParts.length < 2) return false;
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting certificate from storage:', error);
      return false;
    }
  };

  const removeCertificate = async () => {
    // Se há URL salva no banco, excluir do Storage
    if (certificateUrl && training?.certificate_url) {
      setIsDeleting(true);
      const deleted = await deleteCertificateFromStorage(certificateUrl);
      setIsDeleting(false);
      
      if (!deleted) {
        toast.error("Erro ao excluir certificado do servidor");
        return;
      }
      toast.success("Certificado excluído");
    }
    
    setCertificateFile(null);
    setCertificateUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (training) {
      form.reset({
        name: training.name,
        training_type: training.training_type,
        description: training.description || "",
        hours: training.hours,
        completion_date: training.completion_date,
        cost: training.cost ?? undefined,
        sponsor: training.sponsor,
        generates_points: training.generates_points,
        career_points: training.career_points ?? 0,
      });
      setCertificateUrl(training.certificate_url || null);
      setCertificateFile(null);
    } else {
      form.reset({
        name: "",
        training_type: "treinamento",
        description: "",
        hours: 0,
        completion_date: "",
        cost: undefined,
        sponsor: "empresa",
        generates_points: false,
        career_points: 0,
      });
      setCertificateUrl(null);
      setCertificateFile(null);
    }
  }, [training, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id) return;

    // Upload certificate if a new file was selected
    let finalCertificateUrl = certificateUrl;
    if (certificateFile) {
      const uploadedUrl = await uploadCertificate(certificateFile);
      if (uploadedUrl) {
        finalCertificateUrl = uploadedUrl;
      }
    }

    const data: TrainingFormData = {
      name: values.name,
      training_type: values.training_type,
      description: values.description,
      hours: values.hours,
      completion_date: values.completion_date,
      cost: values.cost,
      sponsor: values.sponsor,
      generates_points: values.generates_points,
      career_points: values.generates_points ? values.career_points : undefined,
      certificate_url: finalCertificateUrl || undefined,
    };

    if (training) {
      await updateTraining.mutateAsync({
        trainingId: training.id,
        employeeId,
        data,
      });
    } else {
      await createTraining.mutateAsync({
        employeeId,
        data,
        createdBy: user.id,
      });
    }

    onOpenChange(false);
  };

  const handleDeleteTraining = async () => {
    if (!training) return;
    
    // Se há certificado, excluir do Storage primeiro
    if (training.certificate_url) {
      await deleteCertificateFromStorage(training.certificate_url);
    }
    
    await deleteTraining.mutateAsync({
      trainingId: training.id,
      employeeId,
    });
    
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  const isLoading = createTraining.isPending || updateTraining.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {training ? "Editar" : "Novo"} Treinamento
            {training?.from_pdi && (
              <Badge variant="secondary">
                <Link2 className="h-3 w-3 mr-1" />
                PDI
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Treinamento *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Curso de React Avançado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="training_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="treinamento">Treinamento</SelectItem>
                        <SelectItem value="certificacao">Certificação</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carga Horária *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="40" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="completion_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Conclusão *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? format(parse(field.value, "yyyy-MM-dd", new Date()), "dd/MM/yyyy", { locale: ptBR })
                            : <span>Selecione a data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DatePickerWithYearMonth
                        selected={field.value ? parse(field.value, "yyyy-MM-dd", new Date()) : null}
                        onSelect={(date) => {
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                        }}
                        toYear={new Date().getFullYear() + 1}
                      />
                    </PopoverContent>
                  </Popover>
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
                      placeholder="Descreva o conteúdo do treinamento..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0,00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sponsor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custeado por</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="empresa">Empresa</SelectItem>
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <FormField
                control={form.control}
                name="generates_points"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Gera pontos para enquadramento?</FormLabel>
                      <FormDescription>
                        Ative para somar pontos na carreira do colaborador
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {generatesPoints && (
                <FormField
                  control={form.control}
                  name="career_points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pontos *</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Certificate Upload Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <FormLabel>Comprovante/Certificado</FormLabel>
              <FormDescription>
                Anexe o certificado ou comprovante do treinamento (PDF, JPEG, PNG - máx. 10MB)
              </FormDescription>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
              />

              {!certificateFile && !certificateUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar arquivo
                </Button>
              ) : (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate max-w-[200px]">
                      {certificateFile?.name || "Certificado anexado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {certificateUrl && !certificateFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(certificateUrl, '_blank')}
                      >
                        Ver
                      </Button>
                    )}
                    {canDeleteCertificates && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeCertificate}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-2 pt-4">
              {/* Lado esquerdo - Botão de exclusão */}
              <div>
                {training && canDeleteTrainings && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isLoading || isUploading || deleteTraining.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
              
              {/* Lado direito - Cancelar e Salvar */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : isLoading ? (
                    "Salvando..."
                  ) : training ? (
                    "Salvar"
                  ) : (
                    "Cadastrar"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>

        {/* AlertDialog de confirmação de exclusão */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir treinamento?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O treinamento "{training?.name}" será 
                removido permanentemente e os pontos de carreira serão recalculados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTraining}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteTraining.isPending}
              >
                {deleteTraining.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
