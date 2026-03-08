import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail, Cake } from "lucide-react";
import type { Employee } from "@/hooks/useEmployees";

interface BirthdayEmployee extends Employee {
  age: number;
  day: number;
}

interface BirthdayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: BirthdayEmployee[];
}

export default function BirthdayModal({ open, onOpenChange, employees }: BirthdayModalProps) {
  const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long" });

  const handleSendEmail = () => {
    if (employees.length === 0) return;
    
    const emails = employees.map(emp => emp.email).join(",");
    const subject = encodeURIComponent(`Feliz Aniversário! 🎂`);
    const body = encodeURIComponent(
      `Olá!\n\nParabéns pelo seu aniversário! Desejamos a você um dia muito especial.\n\nAtenciosamente,\nEquipe de Pessoas`
    );
    
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5" />
            Aniversariantes de {currentMonth}
          </DialogTitle>
        </DialogHeader>

        {employees.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum aniversariante este mês.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Idade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.day}</TableCell>
                    <TableCell>{emp.full_name || "—"}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell className="text-right">{emp.age} anos</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end mt-4">
              <Button onClick={handleSendEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar E-mail para Todos
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
