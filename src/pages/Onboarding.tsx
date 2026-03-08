import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2 } from "lucide-react";
import { useCreateOrganization, generateSlug } from "@/hooks/useCreateOrganization";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";
import { EMPLOYEE_COUNTS } from "@/hooks/useOrganizationSettings";

const INDUSTRIES = [
  { value: "tecnologia", label: "Tecnologia" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "financeiro", label: "Financeiro" },
  { value: "varejo", label: "Varejo" },
  { value: "industria", label: "Indústria" },
  { value: "servicos", label: "Serviços" },
  { value: "consultoria", label: "Consultoria" },
  { value: "marketing", label: "Marketing e Publicidade" },
  { value: "logistica", label: "Logística" },
  { value: "outro", label: "Outro" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { hasOrganization, isLoading: checkingOrg, user } = useRequireOrganization();
  const createOrg = useCreateOrganization();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Redirect if user already has an organization
  useEffect(() => {
    if (!checkingOrg && hasOrganization) {
      navigate("/people-analytics");
    }
  }, [checkingOrg, hasOrganization, navigate]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!checkingOrg && !user) {
      navigate("/auth");
    }
  }, [checkingOrg, user, navigate]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugManuallyEdited]);

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !slug.trim()) {
      return;
    }

    await createOrg.mutateAsync({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      industry: industry || undefined,
      employee_count: employeeCount || undefined,
    });

    navigate("/people-analytics");
  };

  if (checkingOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Criar sua Organização</CardTitle>
          <CardDescription>
            Configure sua empresa para começar a usar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Minha Empresa Ltda"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Amigável *</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">/carreiras/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="minha-empresa"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Esta será a URL da sua página de carreiras
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva brevemente sua empresa..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Setor</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind.value} value={ind.value}>
                        {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCount">Nº de Colaboradores</Label>
                <Select value={employeeCount} onValueChange={setEmployeeCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
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

            <Button
              type="submit"
              className="w-full"
              disabled={!name.trim() || !slug.trim() || createOrg.isPending}
            >
              {createOrg.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Organização"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
