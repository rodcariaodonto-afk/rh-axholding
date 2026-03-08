import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useCreateFeedback } from "@/hooks/useCreateFeedback";

interface Props {
  currentUserId: string;
}

export function SendFeedbackDialog({ currentUserId }: Props) {
  const [open, setOpen] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [feedbackType, setFeedbackType] = useState<"positive" | "neutral" | "negative" | "">("");
  const [message, setMessage] = useState("");

  const { data: employees = [] } = useEmployees();
  const createFeedback = useCreateFeedback();

  const otherEmployees = employees.filter((e) => e.id !== currentUserId && e.status === "active");

  const handleSubmit = () => {
    if (!receiverId || !feedbackType) return;

    createFeedback.mutate(
      {
        receiver_id: receiverId,
        feedback_type: feedbackType,
        message: message.trim() || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setReceiverId("");
          setFeedbackType("");
          setMessage("");
        },
      }
    );
  };

  const feedbackTypeLabels = {
    positive: "Positivo",
    neutral: "Neutro",
    negative: "Negativo",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Enviar Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Colaborador</Label>
            <Select value={receiverId} onValueChange={setReceiverId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {otherEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name || employee.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Feedback</Label>
            <Select value={feedbackType} onValueChange={(v) => setFeedbackType(v as typeof feedbackType)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Positivo
                  </div>
                </SelectItem>
                <SelectItem value="neutral">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    Neutro
                  </div>
                </SelectItem>
                <SelectItem value="negative">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    Negativo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mensagem (opcional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva uma mensagem..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!receiverId || !feedbackType || createFeedback.isPending}
            >
              {createFeedback.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
