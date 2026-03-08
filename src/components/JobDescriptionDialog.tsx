import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateJobDescription } from "@/hooks/useCreateJobDescription";
import { useUpdateJobDescription } from "@/hooks/useUpdateJobDescription";
import { usePositions } from "@/hooks/usePositions";

const SENIORITY_LEVELS = ["Junior", "Pleno", "Senior"];

const DEFAULT_DESCRIPTION = `### Sobre a Popcode
#### Olá! Nós somos a Popcode!

A Popcode é uma startup brasileira criada para explorar um novo e eficaz canal de comunicação e espaço de mídia, através da criação de aplicativos personalizados para dispositivos iOS (iPhone, iPad e iPod Touch) e Android (smartphones e tablets).

Criamos aplicativos sob medida, moldando-os de acordo com as necessidades dos clientes e usando todos os recursos necessários do aparelho. 

Somos focados no desenvolvimento de aplicativos, com mais de 1 milhão de usuários ativos e com clientes do ramo financeiro. Fornecemos aplicativos para bancos, fintechs e empresas de cartão de crédito.

Estamos em constante ampliação! Atuando no modelo de trabalho Home-Office e Híbrido, a nossa empresa é um dos melhores lugares para se trabalhar, de acordo com o GPTW.

### Vem ser um Popcoder!?
`;

const formSchema = z.object({
  position_type: z.string().min(1, "Cargo é obrigatório"),
  seniority: z.string().min(1, "Senioridade é obrigatória"),
  description: z.string().optional(),
  requirements: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface JobDescription {
  id: string;
  position_type: string;
  seniority: string;
  description: string | null;
  requirements: string | null;
}

interface JobDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobDescription?: JobDescription | null;
}

export function JobDescriptionDialog({ open, onOpenChange, jobDescription }: JobDescriptionDialogProps) {
  const createJobDescription = useCreateJobDescription();
  const updateJobDescription = useUpdateJobDescription();
  const { data: positions } = usePositions();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      position_type: "",
      seniority: "",
      description: DEFAULT_DESCRIPTION,
      requirements: "",
    },
  });

  useEffect(() => {
    if (jobDescription) {
      form.reset({
        position_type: jobDescription.position_type,
        seniority: jobDescription.seniority,
        description: jobDescription.description || "",
        requirements: jobDescription.requirements || "",
      });
    } else {
      form.reset({
        position_type: "",
        seniority: "",
        description: DEFAULT_DESCRIPTION,
        requirements: "",
      });
    }
  }, [jobDescription, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (jobDescription) {
        await updateJobDescription.mutateAsync({
          id: jobDescription.id,
          ...values,
        });
      } else {
        await createJobDescription.mutateAsync({
          position_type: values.position_type,
          seniority: values.seniority,
          description: values.description,
          requirements: values.requirements,
        });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{jobDescription ? "Editar Descritivo" : "Novo Descritivo de Vaga"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="position_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions && positions.length > 0 ? (
                          positions.map((position) => (
                            <SelectItem key={position.id} value={position.title}>
                              {position.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="_empty" disabled>
                            Nenhum cargo cadastrado
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seniority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a senioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SENIORITY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição da vaga..." className="min-h-[150px]" {...field} />
                  </FormControl>
                  <FormDescription>
                    O template padrão inclui informações sobre a empresa. Edite conforme necessário.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requisitos</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Liste os requisitos da vaga..." className="min-h-[120px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createJobDescription.isPending || updateJobDescription.isPending}>
                {jobDescription ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
