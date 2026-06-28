import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { FolderOpen, Upload, Eye, Download, Trash2 } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { useDocumentosCentral, useDeleteDocumento, getDocumentoSignedUrl, type DocumentoCentral } from "@/hooks/useDocumentosCentral";
import { useEmployees } from "@/hooks/useEmployees";
import { DocumentoUploadDialog, CATEGORIAS_DOCUMENTO } from "@/components/DocumentoUploadDialog";
import { toast } from "sonner";

function getStatus(expiresAt: string | null): { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string } {
  if (!expiresAt) {
    return { label: "Válido", variant: "outline", className: "bg-green-500/10 text-green-700 border-green-300 dark:text-green-400" };
  }
  const days = differenceInCalendarDays(new Date(expiresAt + "T12:00:00"), new Date());
  if (days < 0) {
    return { label: "Vencido", variant: "destructive", className: "bg-red-500/10 text-red-700 border-red-300 dark:text-red-400" };
  }
  if (days <= 30) {
    return { label: `A vencer em ${days}d`, variant: "outline", className: "bg-yellow-500/10 text-yellow-700 border-yellow-300 dark:text-yellow-500" };
  }
  return { label: "Válido", variant: "outline", className: "bg-green-500/10 text-green-700 border-green-300 dark:text-green-400" };
}

function getCategoriaLabel(value: string): string {
  return CATEGORIAS_DOCUMENTO.find((c) => c.value === value)?.label ?? value;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentosCentral() {
  const { data: documents = [], isLoading } = useDocumentosCentral();
  const { data: employees = [] } = useEmployees();
  const { mutate: deleteDoc, isPending: isDeleting } = useDeleteDocumento();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentoCentral | null>(null);

  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const activeEmployees = useMemo(() => employees.filter((e) => e.status === "active"), [employees]);

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (filterEmployee !== "all" && doc.employee_id !== filterEmployee) return false;
      if (filterCategory !== "all" && doc.category !== filterCategory) return false;
      if (filterStart && doc.created_at < filterStart) return false;
      if (filterEnd && doc.created_at.slice(0, 10) > filterEnd) return false;
      return true;
    });
  }, [documents, filterEmployee, filterCategory, filterStart, filterEnd]);

  async function handleView(doc: DocumentoCentral) {
    try {
      const url = await getDocumentoSignedUrl(doc.file_url);
      window.open(url, "_blank");
    } catch {
      toast.error("Não foi possível abrir o documento.");
    }
  }

  async function handleDownload(doc: DocumentoCentral) {
    try {
      const url = await getDocumentoSignedUrl(doc.file_url);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.document_name;
      a.click();
    } catch {
      toast.error("Não foi possível baixar o documento.");
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteDoc({ id: deleteTarget.id, file_url: deleteTarget.file_url });
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Central de Documentos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Repositório centralizado para fiscalização e uso interno
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Upload className="size-4" />
          Upload de Documento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Funcionário</label>
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os funcionários</SelectItem>
              {activeEmployees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name || emp.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Categoria</label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {CATEGORIAS_DOCUMENTO.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">De</label>
          <Input
            type="date"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Até</label>
          <Input
            type="date"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
            className="w-40"
          />
        </div>

        {(filterEmployee !== "all" || filterCategory !== "all" || filterStart || filterEnd) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterEmployee("all"); setFilterCategory("all"); setFilterStart(""); setFilterEnd(""); }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-lg">
          <FolderOpen className="size-12 mb-3 opacity-30" />
          <p className="text-base font-medium">Nenhum documento encontrado</p>
          <p className="text-sm mt-1">
            {documents.length === 0
              ? 'Clique em "Upload de Documento" para adicionar o primeiro arquivo.'
              : "Tente ajustar os filtros acima."}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data Upload</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => {
                const status = getStatus(doc.expires_at);
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="text-sm font-medium">
                      {doc.employee_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate" title={doc.document_name}>
                      {doc.document_name}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getCategoriaLabel(doc.category)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(doc.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.expires_at ? format(new Date(doc.expires_at + "T12:00:00"), "dd/MM/yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatBytes(doc.file_size)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${status.className}`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Visualizar"
                          onClick={() => handleView(doc)}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Baixar"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Excluir"
                          onClick={() => setDeleteTarget(doc)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <DocumentoUploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.document_name}</strong> será permanentemente excluído do sistema e do Storage. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
