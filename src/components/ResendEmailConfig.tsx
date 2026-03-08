import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ResendEmailConfigProps {
  organizationId: string;
}

export function ResendEmailConfig({ organizationId }: ResendEmailConfigProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("organizations")
        .select("invite_from_email, invite_from_name")
        .eq("id", organizationId)
        .single();
      if (data) {
        setFromEmail(data.invite_from_email || "");
        setFromName(data.invite_from_name || "");
      }
      setIsLoading(false);
    }
    load();
  }, [organizationId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          invite_from_email: fromEmail.trim() || null,
          invite_from_name: fromName.trim() || null,
        })
        .eq("id", organizationId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      toast({
        title: "Configuração salva",
        description: "Email remetente atualizado com sucesso.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">Configuração do Email de Convite</CardTitle>
            <p className="text-sm text-muted-foreground">
              Defina o remetente dos emails enviados via Resend
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from_email">Email Remetente *</Label>
            <Input
              id="from_email"
              type="email"
              placeholder="rh@suaempresa.com"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deve ser um email do domínio verificado no Resend
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from_name">Nome do Remetente</Label>
            <Input
              id="from_name"
              placeholder="RH Empresa"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nome exibido ao destinatário (ex: "RH Popcode")
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={!fromEmail.trim() || isSaving}
          size="sm"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configuração
        </Button>
      </CardContent>
    </Card>
  );
}
