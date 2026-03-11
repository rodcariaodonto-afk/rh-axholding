import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useDocumentsCentral, CentralDocument } from "@/hooks/useDocumentsCentral";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, AlertTriangle, Search, FileIcon } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "contrato", label: "Contrato" },
  { value: "certificado", label: "Certificado" },
  { value: "documento_pessoal", label: "Documento Pessoal" },
  { value: "atestado", label: "Atestado" },
  { value: "outro", label: "Outro" },
];

type ExpiryFilter = "all" | "valid" | "expiring" | "expired";

function getExpiryStatus(expiresAt: string | null): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (!expiresAt) return { label: "Sem validade", variant: "outline" };
  const days = differenceInDays(parseISO(expiresAt), new Date());
  if (days < 0) return { label: "Vencido", variant: "destructive" };
  if (days <= 30) return { label: `Vence em ${days}d`, variant: "secondary" };
  return { label: "Válido", variant: "default" };
}

export default function Documents() {
  const { documents, isLoading } = useDocumentsCentral();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>("all");

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchesSearch =
        !search ||
        d.file_name.toLowerCase().includes(search.toLowerCase()) ||
        d.employee_name?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === "all" || d.category === categoryFilter;

      let matchesExpiry = true;
      if (expiryFilter !== "all") {
        if (!d.expires_at) {
          matchesExpiry = expiryFilter === "valid";
        } else {
          const days = differenceInDays(parseISO(d.expires_at), new Date());
          if (expiryFilter === "expired") matchesExpiry = days < 0;
          else if (expiryFilter === "expiring") matchesExpiry = days >= 0 && days <= 30;
          else if (expiryFilter === "valid") matchesExpiry = days > 30;
        }
      }

      return matchesSearch && matchesCategory && matchesExpiry;
    });
  }, [documents, search, categoryFilter, expiryFilter]);

  const expiringCount = documents.filter((d) => {
    if (!d.expires_at) return false;
    const days = differenceInDays(parseISO(d.expires_at), new Date());
    return days >= 0 && days <= 30;
  }).length;

  const expiredCount = documents.filter((d) => {
    if (!d.expires_at) return false;
    return differenceInDays(parseISO(d.expires_at), new Date()) < 0;
  }).length;

  const handleDownload = async (doc: CentralDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("employee-documents")
        .createSignedUrl(doc.file_url, 300);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Erro ao baixar documento");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Gestão centralizada de documentos dos colaboradores</p>
        </div>

        {/* Alert cards */}
        {(expiringCount > 0 || expiredCount > 0) && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {expiredCount > 0 && (
              <Card className="border-destructive/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Documentos Vencidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{expiredCount}</p>
                </CardContent>
              </Card>
            )}
            {expiringCount > 0 && (
              <Card className="border-amber-500/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    Vencendo em 30 dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{expiringCount}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do arquivo ou colaborador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={expiryFilter} onValueChange={(v) => setExpiryFilter(v as ExpiryFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="valid">Válidos</SelectItem>
              <SelectItem value="expiring">Vencendo</SelectItem>
              <SelectItem value="expired">Vencidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <FileIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum documento encontrado</h3>
            <p className="text-sm text-muted-foreground">Ajuste os filtros ou adicione documentos nos perfis dos colaboradores.</p>
          </Card>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Data Upload</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => {
                  const expiry = getExpiryStatus(doc.expires_at);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{doc.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.employee_name}</TableCell>
                      <TableCell>
                        {doc.category ? CATEGORIES.find((c) => c.value === doc.category)?.label || doc.category : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={expiry.variant}>{expiry.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
}
