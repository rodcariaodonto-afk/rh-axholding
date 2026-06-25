import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Trash2, Users, Building2, LayoutGrid, User } from "lucide-react";
import { useComunicados, useDeleteComunicado, type Comunicado } from "@/hooks/useComunicados";
import { ComunicadoDialog } from "@/components/ComunicadoDialog";

const PRIORITY_BADGE: Record<string, { label: string; variant: "outline" | "secondary" | "destructive" }> = {
  normal:     { label: "Normal",     variant: "outline" },
  importante: { label: "Importante", variant: "secondary" },
  urgente:    { label: "Urgente",    variant: "destructive" },
};

const DESTINATARIO_ICON: Record<string, React.ReactNode> = {
  todos:        <Users className="size-3 mr-1" />,
  departamento: <Building2 className="size-3 mr-1" />,
  unidade:      <LayoutGrid className="size-3 mr-1" />,
  individual:   <User className="size-3 mr-1" />,
};

const DESTINATARIO_LABEL: Record<string, string> = {
  todos:        "Todos",
  departamento: "Departamento",
  unidade:      "Unidade",
  individual:   "Individual",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ComunicadoCard({ c, onDelete }: { c: Comunicado; onDelete: (id: string) => void }) {
  const badge = PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.normal;
  const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false;

  return (
    <Card className={isExpired ? "opacity-50" : ""}>
      <CardContent className="py-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <span className="inline-flex items-center text-xs text-muted-foreground">
              {DESTINATARIO_ICON[c.destinatario_tipo]}
              {DESTINATARIO_LABEL[c.destinatario_tipo]}
            </span>
            {isExpired && <Badge variant="outline" className="text-muted-foreground">Expirado</Badge>}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 h-7 w-7"
            onClick={() => onDelete(c.id)}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>

        <p className="font-semibold text-sm leading-snug">{c.title}</p>
        <p className="text-sm text-muted-foreground line-clamp-3">{c.message}</p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          <span>Publicado em {formatDate(c.created_at)}</span>
          {c.expires_at && <span>· Expira em {formatDate(c.expires_at)}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Comunicados() {
  const { data: comunicados = [], isLoading } = useComunicados();
  const deleteMutation = useDeleteComunicado();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comunicados</h1>
          <p className="text-muted-foreground">Mural de comunicados para toda a organização ou grupos específicos.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Megaphone className="mr-2 h-4 w-4" />Novo Comunicado
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : comunicados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <Megaphone className="size-12 text-muted-foreground opacity-30" />
          <p className="font-medium">Nenhum comunicado publicado ainda.</p>
          <p className="text-sm text-muted-foreground">Crie o primeiro comunicado para toda a equipe.</p>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Megaphone className="mr-1.5 h-3.5 w-3.5" />Criar comunicado
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {comunicados.map((c) => (
            <ComunicadoCard
              key={c.id}
              c={c}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <ComunicadoDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
