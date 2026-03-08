import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Sparkles, Loader2, AlertTriangle, Settings } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Layout from "@/components/Layout";
import { usePositionById } from "@/hooks/usePositionById";
import { usePositions } from "@/hooks/usePositions";
import { useCreatePosition } from "@/hooks/useCreatePosition";
import { useUpdatePosition } from "@/hooks/useUpdatePosition";
import { usePositionSeniorityLevels, useUpsertSeniorityLevels, seniorityLevelOrder, SeniorityLevel } from "@/hooks/usePositionSeniorityLevels";
import { useGeneratePositionDescription } from "@/hooks/useGeneratePositionDescription";
import { useOrganizationIntegrations } from "@/hooks/useOrganizationIntegrations";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";
import { toast } from "@/hooks/use-toast";
import { profiles, type Profile } from "@/lib/profiler/profiles";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileSelector } from "@/components/positions/ProfileSelector";
import { SeniorityLevelForm, SeniorityLevelFormData } from "@/components/positions/SeniorityLevelForm";

const formSchema = z.object({
  title: z.string().min(1, "Nome do cargo é obrigatório"),
  description: z.string().optional(),
  parent_position_id: z.string().optional().nullable(),
  has_levels: z.boolean().default(true),
  activities: z.string().optional(),
  expected_profile_code: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PositionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const { organization } = useRequireOrganization();
  const { data: position, isLoading: isLoadingPosition } = usePositionById(id);
  const { data: positions } = usePositions();
  const { data: seniorityLevels, isLoading: isLoadingSeniority } = usePositionSeniorityLevels(id);
  const { data: integrations, isLoading: isLoadingIntegrations } = useOrganizationIntegrations(organization?.id || null);
  
  const createPosition = useCreatePosition();
  const updatePosition = useUpdatePosition();
  const upsertSeniorityLevels = useUpsertSeniorityLevels();
  const generateDescription = useGeneratePositionDescription();

  const [activeTab, setActiveTab] = useState("basic");
  const [seniorityData, setSeniorityData] = useState<Record<SeniorityLevel, SeniorityLevelFormData>>({} as Record<SeniorityLevel, SeniorityLevelFormData>);

  const hasAnthropicIntegration = integrations?.some(
    (i) => i.provider === "anthropic" && i.is_active
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      parent_position_id: null,
      has_levels: true,
      activities: "",
      expected_profile_code: null,
    },
  });

  const hasLevels = form.watch("has_levels");

  // Load position data
  useEffect(() => {
    if (position) {
      form.reset({
        title: position.title,
        description: position.description || "",
        parent_position_id: position.parent_position_id || null,
        has_levels: position.has_levels,
        activities: position.activities || "",
        expected_profile_code: position.expected_profile_code || null,
      });
    }
  }, [position, form]);

  // Load seniority levels data
  useEffect(() => {
    if (seniorityLevels) {
      const data: Record<SeniorityLevel, SeniorityLevelFormData> = {} as Record<SeniorityLevel, SeniorityLevelFormData>;
      seniorityLevels.forEach((level) => {
        data[level.seniority] = {
          enabled: true,
          description: level.description || "",
          salary_min: level.salary_min || undefined,
          salary_max: level.salary_max || undefined,
          required_skills: level.required_skills || [],
          required_soft_skills: level.required_soft_skills || [],
          notes: level.notes || "",
        };
      });
      setSeniorityData(data);
    }
  }, [seniorityLevels]);

  // Filter out current position from parent options
  const parentOptions = positions?.filter((p) => p.id !== id) || [];

  const handleGenerateDescription = async () => {
    if (!hasAnthropicIntegration) {
      toast({
        title: "Integração não configurada",
        description: "Configure a integração com Anthropic nas configurações para usar a geração com IA.",
        variant: "destructive",
        action: (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate("/company-settings/integrations")}
            className="bg-white text-destructive hover:bg-white/90 border-0"
          >
            Configurar
          </Button>
        ),
      });
      return;
    }

    const title = form.getValues("title");
    if (!title) {
      toast({
        title: "Nome obrigatório",
        description: "Preencha o nome do cargo antes de gerar a descrição.",
        variant: "destructive",
      });
      return;
    }

    const parentId = form.getValues("parent_position_id");
    const parentPosition = parentId ? positions?.find((p) => p.id === parentId) : null;

    try {
      const result = await generateDescription.mutateAsync({
        title,
        expected_profile_code: form.getValues("expected_profile_code") || undefined,
        activities: form.getValues("activities") || undefined,
        parent_position_title: parentPosition?.title,
      });

      form.setValue("description", result.description);
      toast({
        title: "Descrição gerada",
        description: "A descrição foi gerada com sucesso. Revise e ajuste conforme necessário.",
      });
    } catch (error) {
      // Error is already handled by the hook
    }
  };

  const handleSeniorityChange = (seniority: SeniorityLevel, data: SeniorityLevelFormData) => {
    setSeniorityData((prev) => ({
      ...prev,
      [seniority]: data,
    }));
  };

  const onSubmit = async (data: FormValues) => {
    try {
      let positionId = id;

      if (isEditing) {
        await updatePosition.mutateAsync({
          id: id!,
          title: data.title,
          description: data.description || null,
          parent_position_id: data.parent_position_id || null,
          has_levels: data.has_levels,
          activities: data.activities || null,
          expected_profile_code: data.expected_profile_code || null,
        });
      } else {
        const result = await createPosition.mutateAsync({
          title: data.title,
          description: data.description || undefined,
          has_levels: data.has_levels,
        });
        positionId = result.id;

        // Update with additional fields
        await updatePosition.mutateAsync({
          id: positionId,
          parent_position_id: data.parent_position_id || null,
          activities: data.activities || null,
          expected_profile_code: data.expected_profile_code || null,
        });
      }

      // Save seniority levels if has_levels is true
      if (data.has_levels && positionId) {
        const levels = seniorityLevelOrder
          .filter((seniority) => seniorityData[seniority]?.enabled)
          .map((seniority) => ({
            seniority,
            description: seniorityData[seniority]?.description || null,
            salary_min: seniorityData[seniority]?.salary_min || null,
            salary_max: seniorityData[seniority]?.salary_max || null,
            required_skills: seniorityData[seniority]?.required_skills || [],
            required_soft_skills: seniorityData[seniority]?.required_soft_skills || [],
            notes: seniorityData[seniority]?.notes || null,
          }));

        await upsertSeniorityLevels.mutateAsync({
          positionId,
          levels,
        });
      }

      toast({
        title: "Sucesso",
        description: isEditing ? "Cargo atualizado com sucesso." : "Cargo criado com sucesso.",
      });
      navigate("/positions");
    } catch (error) {
      // Errors are handled by individual hooks
    }
  };

  const isLoading = isEditing && (isLoadingPosition || isLoadingSeniority);
  const isSaving = createPosition.isPending || updatePosition.isPending || upsertSeniorityLevels.isPending;

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/positions">Cargos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isEditing ? "Editar Cargo" : "Novo Cargo"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {!isLoadingIntegrations && !hasAnthropicIntegration && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-600 dark:text-amber-400">
              Geração com IA desabilitada
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Configure a integração com Anthropic para habilitar a geração 
                automática de descrições de cargo.
              </span>
              <Button asChild variant="outline" size="sm" className="ml-4 shrink-0">
                <Link to="/company-settings/integrations">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? "Editar Cargo" : "Novo Cargo"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-6">
                      <TabsTrigger value="basic">Básico</TabsTrigger>
                      <TabsTrigger value="description">Descrição</TabsTrigger>
                      <TabsTrigger value="profile">Perfil</TabsTrigger>
                      <TabsTrigger value="seniority" disabled={!hasLevels}>
                        Senioridades
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Cargo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Desenvolvedor iOS" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="parent_position_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo Superior</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                              value={field.value || "none"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o cargo superior" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Nenhum (cargo raiz)</SelectItem>
                                {parentOptions.map((pos) => (
                                  <SelectItem key={pos.id} value={pos.id}>
                                    {pos.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Defina a hierarquia organizacional
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="has_levels"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Possui Níveis de Senioridade</FormLabel>
                              <FormDescription>
                                Este cargo tem diferentes níveis (Júnior, Pleno, Sênior, etc.)?
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
                    </TabsContent>

                    <TabsContent value="description" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição do Cargo</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descrição detalhada do cargo..."
                                className="min-h-[200px] font-mono text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Suporta formatação Markdown
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateDescription}
                        disabled={generateDescription.isPending || !form.getValues("title")}
                        className="w-full"
                      >
                        {generateDescription.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Gerar com IA Especialista
                          </>
                        )}
                      </Button>

                      <FormField
                        control={form.control}
                        name="activities"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Atividades e Responsabilidades</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Liste as principais atividades e responsabilidades..."
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Detalhe as atividades específicas do cargo
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="profile" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="expected_profile_code"
                        render={({ field }) => (
                          <ProfileSelector
                            value={field.value || undefined}
                            onChange={(value) => field.onChange(value || null)}
                          />
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="seniority" className="space-y-4">
                      {!hasLevels ? (
                        <p className="text-muted-foreground text-center py-8">
                          Ative "Possui Níveis de Senioridade" na aba Básico para configurar os níveis.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {seniorityLevelOrder.map((seniority) => (
                            <SeniorityLevelForm
                              key={seniority}
                              seniority={seniority}
                              data={seniorityData[seniority]}
                              onChange={(data) => handleSeniorityChange(seniority, data)}
                            />
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/positions")}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : isEditing ? (
                        "Salvar Alterações"
                      ) : (
                        "Criar Cargo"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
