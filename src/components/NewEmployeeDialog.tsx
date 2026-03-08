import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateEmployee } from "@/hooks/useCreateEmployee";
import { Mail } from "lucide-react";

interface NewEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewEmployeeDialog({ open, onOpenChange }: NewEmployeeDialogProps) {
  const { mutate: inviteEmployee, isPending } = useCreateEmployee(() => {
    onOpenChange(false);
    resetForm();
  });

  const [formData, setFormData] = useState({ email: "", full_name: "" });

  const resetForm = () => setFormData({ email: "", full_name: "" });

  const handleSubmit = () => {
    if (!formData.full_name.trim() || !formData.email.trim()) return;
    inviteEmployee(formData);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const isValid = formData.full_name.trim() && formData.email.trim() && formData.email.includes("@");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          onOpenChange(false);
          resetForm();
        }
      }}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Convidar Novo Colaborador</DialogTitle>
          <DialogDescription>
            Preencha os dados do colaborador. Após o envio, ele receberá um email para criar sua conta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Digite o nome completo"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email Corporativo *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@empresa.com"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Os demais dados (departamento, cargo, contrato) podem ser preenchidos após o convite.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            <Mail className="h-4 w-4 mr-2" />
            {isPending ? "Enviando..." : "Enviar Convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
