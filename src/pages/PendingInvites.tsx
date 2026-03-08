import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { usePendingInvites, useCancelInvite, useResendInvite, PendingEmployee } from "@/hooks/usePendingInvites";
import { NewEmployeeDialog } from "@/components/NewEmployeeDialog";
import { Plus, MoreHorizontal, RefreshCw, XCircle, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  draft: { label: "Rascunho", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  invited: { label: "Pendente", variant: "default", icon: <Clock className="h-3 w-3" /> },
  accepted: { label: "Aceito", variant: "outline", icon: <CheckCircle2 className="h-3 w-3" /> },
  expired: { label: "Expirado", variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: "Cancelado", variant: "secondary", icon: <XCircle className="h-3 w-3" /> },
};

export default function PendingInvites() {
  const { data: invites, isLoading } = usePendingInvites();
  const { mutate: cancelInvite, isPending: isCancelling } = useCancelInvite();
  const { mutate: resendInvite, isPending: isResending } = useResendInvite();
  
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<PendingEmployee | null>(null);

  const handleCancelClick = (invite: PendingEmployee) => {
    setSelectedInvite(invite);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedInvite) {
      cancelInvite(selectedInvite.id);
      setCancelDialogOpen(false);
      setSelectedInvite(null);
    }
  };

  const handleResend = (invite: PendingEmployee) => {
    resendInvite(invite);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Convites Pendentes</h1>
            <p className="text-muted-foreground">
              Gerencie convites enviados para novos colaboradores
            </p>
          </div>
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Convite
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enviado</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : invites?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum convite pendente
                  </TableCell>
                </TableRow>
              ) : (
                invites?.map((invite) => {
                  const status = statusConfig[invite.status] || statusConfig.draft;
                  return (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.full_name}</TableCell>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>{invite.department?.name || "—"}</TableCell>
                      <TableCell>{invite.position?.title || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                          {status.icon}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invite.invite_sent_at
                          ? formatDistanceToNow(new Date(invite.invite_sent_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleResend(invite)}
                              disabled={isResending}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reenviar Convite
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCancelClick(invite)}
                              disabled={isCancelling}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar Convite
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <NewEmployeeDialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen} />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Convite</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o convite para{" "}
              <strong>{selectedInvite?.full_name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
