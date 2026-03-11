import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { User, MapPin, Phone, FileText, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BRAZILIAN_STATES } from "@/constants/brazilData";

const STEPS = [
  { icon: User, label: "Dados Pessoais" },
  { icon: MapPin, label: "Endereço" },
  { icon: Phone, label: "Contato" },
  { icon: CheckCircle2, label: "Conclusão" },
];

export default function EmployeeOnboarding() {
  const { user } = useAuth();
  const { organizationId } = useCurrentOrganization();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    birth_date: "",
    gender: "",
    nationality: "Brasileira",
    // Address
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    // Contact
    personal_phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const progress = ((step + 1) / STEPS.length) * 100;

  const handleSave = async () => {
    if (!user?.id || !organizationId) return;
    setSaving(true);

    try {
      // Update employee personal data
      const { error: empError } = await supabase
        .from("employees")
        .update({
          full_name: form.full_name || undefined,
          birth_date: form.birth_date || undefined,
          gender: (form.gender as any) || undefined,
          nationality: form.nationality || undefined,
        })
        .eq("id", user.id);

      if (empError) throw empError;

      // Upsert contact info
      const { error: contactError } = await supabase
        .from("employees_contact")
        .upsert({
          user_id: user.id,
          zip_code: form.zip_code || "00000-000",
          street: form.street || "—",
          number: form.number || "—",
          complement: form.complement,
          neighborhood: form.neighborhood,
          city: form.city || "—",
          state: form.state || "—",
          country: "Brasil",
          personal_phone: form.personal_phone,
          emergency_contact_name: form.emergency_contact_name,
          emergency_contact_phone: form.emergency_contact_phone,
        }, { onConflict: "user_id" });

      if (contactError) throw contactError;

      toast({ title: "Dados salvos!", description: "Seu cadastro foi atualizado com sucesso." });
      navigate("/profile");
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bem-vindo! 🎉</h1>
        <p className="text-muted-foreground">Complete seu cadastro para começar</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={i} className={i <= step ? "text-primary font-medium" : ""}>
              {s.label}
            </span>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="size-5" />; })()}
            {STEPS[step].label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nome completo *</Label>
                  <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Seu nome completo" />
                </div>
                <div className="space-y-2">
                  <Label>Data de nascimento</Label>
                  <Input type="date" value={form.birth_date} onChange={(e) => update("birth_date", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="non_binary">Não-binário</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefiro não dizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nacionalidade</Label>
                  <Input value={form.nationality} onChange={(e) => update("nationality", e.target.value)} />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input value={form.zip_code} onChange={(e) => update("zip_code", e.target.value)} placeholder="00000-000" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Rua</Label>
                <Input value={form.street} onChange={(e) => update("street", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={form.number} onChange={(e) => update("number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input value={form.complement} onChange={(e) => update("complement", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.state} onValueChange={(v) => update("state", v)}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Telefone pessoal</Label>
                <Input value={form.personal_phone} onChange={(e) => update("personal_phone", e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label>Contato de emergência</Label>
                <Input value={form.emergency_contact_name} onChange={(e) => update("emergency_contact_name", e.target.value)} placeholder="Nome" />
              </div>
              <div className="space-y-2">
                <Label>Telefone emergência</Label>
                <Input value={form.emergency_contact_phone} onChange={(e) => update("emergency_contact_phone", e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="size-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-semibold">Tudo pronto!</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Clique em "Salvar" para finalizar seu cadastro. Você pode editar seus dados
                a qualquer momento no seu perfil.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          <ArrowLeft className="size-4 mr-1.5" />
          Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Próximo
            <ArrowRight className="size-4 ml-1.5" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving || !form.full_name}>
            {saving ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
            Salvar
          </Button>
        )}
      </div>
    </div>
  );
}
