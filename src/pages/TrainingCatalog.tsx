import { useState } from "react";
import Layout from "@/components/Layout";
import { useTrainingCatalog } from "@/hooks/useTrainingCatalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { BookOpen, Plus, ExternalLink, Clock, DollarSign, Trash2 } from "lucide-react";
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

const FORMAT_LABELS: Record<string, string> = {
  online: "Online",
  presencial: "Presencial",
  hibrido: "Híbrido",
};

export default function TrainingCatalog() {
  const { items, isLoading, createItem, deleteItem, isCreating } = useTrainingCatalog();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    provider: "",
    format: "online",
    duration_hours: "",
    cost: "",
    category: "",
    url: "",
  });

  const resetForm = () => setForm({ name: "", description: "", provider: "", format: "online", duration_hours: "", cost: "", category: "", url: "" });

  const handleSubmit = () => {
    if (!form.name) return;
    createItem({
      name: form.name,
      description: form.description || undefined,
      provider: form.provider || undefined,
      format: form.format,
      duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : undefined,
      cost: form.cost ? parseFloat(form.cost) : undefined,
      category: form.category || undefined,
      url: form.url || undefined,
    });
    setIsDialogOpen(false);
    resetForm();
  };

  const filtered = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Catálogo de Treinamentos</h1>
            <p className="text-muted-foreground">Treinamentos disponíveis para os colaboradores</p>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Treinamento
          </Button>
        </div>

        <Input
          placeholder="Buscar treinamento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum treinamento no catálogo</h3>
            <p className="text-sm text-muted-foreground">Adicione treinamentos para que os colaboradores possam solicitá-los.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <Badge variant="outline">{FORMAT_LABELS[item.format || "online"] || item.format}</Badge>
                  </div>
                  {item.provider && <p className="text-sm text-muted-foreground">{item.provider}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {item.duration_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {item.duration_hours}h
                      </span>
                    )}
                    {item.cost != null && item.cost > 0 && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        R$ {Number(item.cost).toFixed(2)}
                      </span>
                    )}
                    {item.category && <Badge variant="secondary" className="text-xs">{item.category}</Badge>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    {item.url && (
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Acessar
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Treinamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provedor</Label>
                  <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="Udemy, Alura..." />
                </div>
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duração (horas)</Label>
                  <Input type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Custo (R$)</Label>
                  <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Técnico, Liderança..." />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isCreating || !form.name}>
                {isCreating ? "Salvando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover treinamento?</AlertDialogTitle>
              <AlertDialogDescription>O treinamento será desativado do catálogo.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { if (deleteId) { deleteItem(deleteId); setDeleteId(null); } }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
