import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { clearInviteFlow } from "@/lib/inviteDetection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, CheckCircle2 } from "lucide-react";
import { z } from "zod";


const passwordSchema = z.object({
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

interface OrgInfo {
  name: string;
  slug: string;
}

const AcceptInvite = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [userName, setUserName] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const processSession = async (session: import("@supabase/supabase-js").Session) => {
      if (cancelled) return;
      try {
        setSessionReady(true);
        setUserName(session.user.user_metadata?.full_name || session.user.email || "");

        // Ensure organization_member exists (fallback if trigger didn't create it)
        await supabase.rpc("ensure_invite_org_member");

        // Find the organization this user belongs to
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id, organizations(name, slug)")
          .eq("user_id", session.user.id)
          .limit(1)
          .maybeSingle();

        if (membership?.organizations) {
          const org = membership.organizations as unknown as OrgInfo;
          setOrgInfo({ name: org.name, slug: org.slug });
        } else {
          // Fallback: check pending_employees
          const { data: pending } = await supabase
            .from("pending_employees")
            .select("organization_id, organizations:organization_id(name, slug)")
            .eq("email", session.user.email!)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (pending?.organizations) {
            const org = pending.organizations as unknown as OrgInfo;
            setOrgInfo({ name: org.name, slug: org.slug });
          }
        }
      } catch (err) {
        console.error("[AcceptInvite] Error loading invite data:", err);
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth state changes — handles both hash-based (implicit)
    // and code-based (PKCE) flows reliably without arbitrary timeouts
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        if (session) {
          processSession(session);
        }
      }
    );

    // Also check if there's already a session (e.g. tokens already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || sessionReady) return;
      if (session) {
        processSession(session);
      }
    });

    // If no session after 10s, give up
    const timeout = setTimeout(() => {
      if (cancelled || sessionReady) return;
      setLoading(false);
      toast({
        title: "Link inválido ou expirado",
        description: "O convite pode ter expirado. Solicite um novo convite ao administrador.",
        variant: "destructive",
      });
      navigate("/auth");
    }, 10000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, toast, sessionReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      // Ensure org member one more time after password is set
      await supabase.rpc("ensure_invite_org_member");
      // Refetch org queries so ProtectedRoute sees the new membership before navigation
      await queryClient.refetchQueries({ queryKey: ["user-organizations"] });
      clearInviteFlow();

      toast({
        title: "Senha criada com sucesso!",
        description: "Bem-vindo à plataforma. Você será redirecionado.",
      });

      // Small delay for toast visibility
      setTimeout(() => {
        navigate("/people-analytics");
      }, 1500);
    } catch (error: any) {
      const msg = error.message?.toLowerCase() || "";
      let description = "Não foi possível definir a senha. Tente novamente.";
      if (msg.includes("same password")) {
        description = "A nova senha deve ser diferente da anterior.";
      } else if (msg.includes("weak password") || msg.includes("too short")) {
        description = "A senha é muito fraca. Use pelo menos 6 caracteres.";
      }
      toast({
        title: "Erro ao criar senha",
        description,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sessionReady) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="text-center space-y-4">
          {orgInfo && (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-4 py-3 mx-auto">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">{orgInfo.name}</span>
            </div>
          )}
          <div className="space-y-1">
            <CardTitle className="text-2xl">Aceitar Convite</CardTitle>
            <CardDescription>
              {userName ? (
                <>Olá, <strong>{userName}</strong>! Crie sua senha para acessar a plataforma.</>
              ) : (
                "Crie sua senha para acessar a plataforma."
              )}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-primary">
                Email verificado com sucesso
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-password">Senha</Label>
              <Input
                id="invite-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={saving}
                autoFocus
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-confirmPassword">Confirmar Senha</Label>
              <Input
                id="invite-confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={saving}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando senha...
                </>
              ) : (
                "Criar Senha e Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
};

export default AcceptInvite;
