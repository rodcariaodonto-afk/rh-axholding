import { useState } from "react";
import { useWorkPolicies, useCreateWorkPolicy, useDeleteWorkPolicy } from "@/hooks/useWorkPolicies";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Building2, Laptop, Home } from "lucide-react";

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Building2; variant: "default" | "secondary" | "outline" }> = {
  presencial: { label: "Presencial", icon: Building2, variant: "default" },
  hybrid: { label: "Híbrido", icon: Laptop, variant: "secondary" },
  remote: { label: "Remoto", icon: Home, variant: "outline" },
};

export default function WorkPolicies() {
  const { data: policies, isLoading } = useWorkPolicies();
  const createPolicy = useCreateWorkPolicy();
  const deletePolicy = useDeleteWorkPolicy();

  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("presencial");
  const [description, setDescription] = useState("");
  const [officeDaysWeek, setOfficeDaysWeek] = useState("");
  const [officeDaysMonth, setOfficeDaysMonth] = useState("");

  const resetForm = () => {
    setName(""); setType("presencial"); setDescription(""); setOfficeDaysWeek(""); setOfficeDaysMonth("");
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createPolicy.mutateAsync({
      name: name.trim(),
      type,
      description: description || undefined,
      in_office_days_per_week: officeDaysWeek ? parseInt(officeDaysWeek) : undefined,
      in_office_days_per_month: officeDaysMonth ? parseInt(officeDaysMonth) : undefined,
    });
    resetForm();
    setShowDialog(false);
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Políticas de Trabalho</h1>
          <p className="text-muted-foreground">Defina regras de trabalho presencial, híbrido e remoto</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Política
        </Button>
      </div>

      {policies?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma política cadastrada</h2>
            <p className="text-muted-foreground mb-4">Crie políticas para definir o modelo de trabalho da sua equipe.</p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira política
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies?.map((p) => {
            const config = TYPE_CONFIG[p.type] || TYPE_CONFIG.presencial;
            const Icon = config.icon;
            return (
              <Card key={p.id} className="relative group">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{p.name}</h3>
                        <Badge variant={config.variant} className="mt-1">{config.label}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deletePolicy.mutate(p.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                  )}
                  <div className="flex gap-4 text-sm">
                    {p.in_office_days_per_week != null && (
                      <div>
                        <span className="text-muted-foreground">Dias/semana:</span>{" "}
                        <span className="font-medium">{p.in_office_days_per_week}</span>
                      </div>
                    )}
                    {p.in_office_days_per_month != null && (
                      <div>
                        <span className="text-muted-foreground">Dias/mês:</span>{" "}
                        <span className="font-medium">{p.in_office_days_per_month}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Política de Trabalho</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Híbrido 3x2" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                  <SelectItem value="remote">Remoto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Descreva a política..." />
            </div>
            {type === "hybrid" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dias presenciais/semana</Label>
                  <Input type="number" value={officeDaysWeek} onChange={(e) => setOfficeDaysWeek(e.target.value)} min={0} max={7} />
                </div>
                <div className="space-y-2">
                  <Label>Dias presenciais/mês</Label>
                  <Input type="number" value={officeDaysMonth} onChange={(e) => setOfficeDaysMonth(e.target.value)} min={0} max={31} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createPolicy.isPending}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
