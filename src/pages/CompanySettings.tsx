import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  MapPin,
  Heart,
  Gift,
  Code,
  Clock,
  Link as LinkIcon,
  Save,
  Globe,
  Linkedin,
  Instagram,
  Twitter,
  Upload,
  ImageIcon,
  Loader2,
  Trash2,
  Plug,
  ChevronRight,
  Palette,
} from "lucide-react";
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  WORK_POLICIES,
  INTERVIEW_FORMATS,
  HIRING_TIMES,
  EMPLOYEE_COUNTS,
  AVAILABLE_BENEFITS,
} from "@/hooks/useOrganizationSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function CompanySettings() {
  const { data: settings, isLoading } = useOrganizationSettings();
  const updateSettings = useUpdateOrganizationSettings();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    industry: "",
    employee_count: "",
    website: "",
    logo_url: "",
    headquarters_city: "",
    work_policy: "",
    team_structure: "",
    benefits: [] as string[],
    work_environment: "",
    tech_stack: "",
    interview_format: "",
    hiring_time: "",
    hiring_process_description: "",
    linkedin_url: "",
    instagram_handle: "",
    twitter_handle: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || "",
        slug: settings.slug || "",
        description: settings.description || "",
        industry: settings.industry || "",
        employee_count: settings.employee_count || "",
        website: settings.website || "",
        logo_url: settings.logo_url || "",
        headquarters_city: settings.headquarters_city || "",
        work_policy: settings.work_policy || "",
        team_structure: settings.team_structure || "",
        benefits: settings.benefits || [],
        work_environment: settings.work_environment || "",
        tech_stack: settings.tech_stack || "",
        interview_format: settings.interview_format || "",
        hiring_time: settings.hiring_time || "",
        hiring_process_description: settings.hiring_process_description || "",
        linkedin_url: settings.linkedin_url || "",
        instagram_handle: settings.instagram_handle || "",
        twitter_handle: settings.twitter_handle || "",
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(formData);
  };

  const toggleBenefit = (benefit: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter((b) => b !== benefit)
        : [...prev.benefits, benefit],
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Apenas PNG, JPG ou WEBP são permitidos.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 1MB.",
        variant: "destructive",
      });
      return;
    }

    // Validar dimensões
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = async () => {
      URL.revokeObjectURL(img.src);
      
      if (img.width > 500 || img.height > 500) {
        toast({
          title: "Dimensões inválidas",
          description: "A imagem deve ter no máximo 500x500 pixels.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);

      try {
        const fileExt = file.name.split(".").pop();
        const filePath = `${settings?.id || formData.slug}/${Date.now()}-logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("company-logos")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("company-logos")
          .getPublicUrl(filePath);

        const newLogoUrl = publicUrl.publicUrl;

        // Save logo_url to DB immediately
        const { error: updateError } = await supabase
          .from("organizations")
          .update({ logo_url: newLogoUrl })
          .eq("id", settings!.id);

        if (updateError) throw updateError;

        setFormData((prev) => ({ ...prev, logo_url: newLogoUrl }));
        
        toast({
          title: "Logo salvo",
          description: "O logo foi enviado e salvo com sucesso.",
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Erro no upload",
          description: "Não foi possível enviar o logo.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };
  };

  const handleRemoveLogo = async () => {
    if (formData.logo_url) {
      try {
        // Extract full path after bucket name
        const urlParts = formData.logo_url.split("/company-logos/");
        const storagePath = urlParts[1];
        if (storagePath) {
          await supabase.storage.from("company-logos").remove([storagePath]);
        }

        // Update DB immediately
        await supabase
          .from("organizations")
          .update({ logo_url: null })
          .eq("id", settings!.id);

        setFormData((prev) => ({ ...prev, logo_url: "" }));
        toast({
          title: "Logo removido",
          description: "O logo foi removido com sucesso.",
        });
      } catch (error) {
        console.error("Remove logo error:", error);
        toast({
          title: "Erro",
          description: "Não foi possível remover o logo.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Configurações da Empresa</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure as informações que serão exibidas para candidatos
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            <Save className="size-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                  <CardDescription>Dados essenciais da empresa</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Identificador (slug)</Label>
                  <Input value={formData.slug} disabled className="bg-muted" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Setor de Atuação</Label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Ex: Tecnologia, Saúde, Educação..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tamanho da Empresa</Label>
                  <Select
                    value={formData.employee_count}
                    onValueChange={(value) => setFormData({ ...formData, employee_count: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_COUNTS.map((count) => (
                        <SelectItem key={count.value} value={count.value}>
                          {count.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição da Empresa</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva sua empresa, o que fazem, como trabalham..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 50 caracteres • {formData.description.length}/2000
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Logo da Empresa */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <ImageIcon className="size-5 text-violet-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Logo da Empresa</CardTitle>
                  <CardDescription>Sua identidade visual para candidatos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="size-24 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
                    {formData.logo_url ? (
                      <img 
                        src={formData.logo_url} 
                        alt="Logo" 
                        className="size-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <ImageIcon className={`size-8 text-muted-foreground ${formData.logo_url ? 'hidden' : ''}`} />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="size-4 mr-2" />
                      )}
                      {isUploading ? "Enviando..." : "Upload Logo"}
                    </Button>
                    {formData.logo_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>PNG, JPG ou WEBP. Máx 1MB.</p>
                  <p>Recomendado: 500x500px (proporção quadrada)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização & Estrutura */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <MapPin className="size-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-lg">Localização & Estrutura</CardTitle>
                  <CardDescription>Onde e como vocês trabalham</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade Sede</Label>
                  <Input
                    value={formData.headquarters_city}
                    onChange={(e) => setFormData({ ...formData, headquarters_city: e.target.value })}
                    placeholder="Ex: São Paulo, SP"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Política de Trabalho</Label>
                  <Select
                    value={formData.work_policy}
                    onValueChange={(value) => setFormData({ ...formData, work_policy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a política" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_POLICIES.map((policy) => (
                        <SelectItem key={policy.value} value={policy.value}>
                          {policy.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estrutura de Times</Label>
                <Textarea
                  value={formData.team_structure}
                  onChange={(e) => setFormData({ ...formData, team_structure: e.target.value })}
                  placeholder="Ex: Squads multidisciplinares com autonomia, células ágeis com PO dedicado..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cultura & Valores */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Heart className="size-5 text-pink-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Cultura & Valores</CardTitle>
                  <CardDescription>O que define a identidade da sua empresa</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ambiente de Trabalho</Label>
                <Textarea
                  value={formData.work_environment}
                  onChange={(e) => setFormData({ ...formData, work_environment: e.target.value })}
                  placeholder="Descreva o ambiente de trabalho, instalações, cultura do dia-a-dia..."
                  rows={4}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Para configurar Missão, Visão e Valores detalhados, acesse a página{" "}
                <a href="/culture" className="text-primary hover:underline">
                  Cultura
                </a>
                .
              </p>
            </CardContent>
          </Card>

          {/* Benefícios */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Gift className="size-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Benefícios</CardTitle>
                  <CardDescription>O que vocês oferecem aos colaboradores</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Benefícios Oferecidos</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_BENEFITS.map((benefit) => (
                    <Badge
                      key={benefit}
                      variant={formData.benefits.includes(benefit) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleBenefit(benefit)}
                    >
                      {benefit}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.benefits.length} benefícios selecionados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tecnologia */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Code className="size-5 text-cyan-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Tecnologia</CardTitle>
                  <CardDescription>Stack e ferramentas que vocês usam</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Stack de Tecnologias</Label>
                <Textarea
                  value={formData.tech_stack}
                  onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                  placeholder="Ex: React, Node.js, AWS, PostgreSQL..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Tecnologias principais usadas na empresa
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Processo Seletivo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Clock className="size-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Processo Seletivo</CardTitle>
                  <CardDescription>Como vocês contratam</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Formato de Entrevistas</Label>
                  <Select
                    value={formData.interview_format}
                    onValueChange={(value) => setFormData({ ...formData, interview_format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVIEW_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tempo Médio do Processo</Label>
                  <Select
                    value={formData.hiring_time}
                    onValueChange={(value) => setFormData({ ...formData, hiring_time: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a duração" />
                    </SelectTrigger>
                    <SelectContent>
                      {HIRING_TIMES.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição do Processo</Label>
                <Textarea
                  value={formData.hiring_process_description}
                  onChange={(e) =>
                    setFormData({ ...formData, hiring_process_description: e.target.value })
                  }
                  placeholder="Descreva as etapas do processo seletivo, avaliações, duração estimada..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Links & Redes Sociais */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <LinkIcon className="size-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Links & Redes Sociais</CardTitle>
                  <CardDescription>Sua presença online</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="size-4" />
                    Website
                  </Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.empresa.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Linkedin className="size-4" />
                    LinkedIn
                  </Label>
                  <Input
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    placeholder="linkedin.com/company/empresa"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="size-4" />
                    Instagram
                  </Label>
                  <Input
                    value={formData.instagram_handle}
                    onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                    placeholder="@empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Twitter className="size-4" />
                    Twitter/X
                  </Label>
                  <Input
                    value={formData.twitter_handle}
                    onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                    placeholder="@empresa"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integrações */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Plug className="size-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Integrações</CardTitle>
                  <CardDescription>Conecte serviços externos à sua organização</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Gerencie API keys de serviços como Fireflies (análise de entrevistas), 
                Anthropic/OpenAI (análise de candidatos) e outros.
              </p>
              <Button variant="outline" asChild>
                <a href="/company-settings/integrations">
                  Gerenciar Integrações
                  <ChevronRight className="size-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Personalização Visual */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Palette className="size-5 text-violet-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Personalização Visual</CardTitle>
                  <CardDescription>Customize cores, fontes e aparência da plataforma</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Personalize as cores, tipografia e estilos visuais da plataforma 
                para toda a sua organização.
              </p>
              <Button variant="outline" asChild>
                <a href="/theme-editor">
                  Editar Tema
                  <ChevronRight className="size-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
