import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeedbacks, calculateAverageScore, Feedback } from "@/hooks/useFeedbacks";
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { SendFeedbackDialog } from "./SendFeedbackDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  userId: string;
}

const ITEMS_PER_PAGE = 5;

const FeedbackIndicator = ({ type }: { type: "positive" | "neutral" | "negative" }) => {
  const colors = {
    positive: "bg-green-500",
    neutral: "bg-yellow-500",
    negative: "bg-red-500",
  };

  return <div className={`w-3 h-3 rounded-full ${colors[type]}`} />;
};

const LikertScale = ({ average }: { average: number }) => {
  const position = (average / 10) * 100;

  return (
    <div className="relative w-48 h-4 rounded-full overflow-hidden" 
         style={{ background: "linear-gradient(to right, hsl(0, 70%, 50%), hsl(45, 70%, 50%), hsl(120, 70%, 50%))" }}>
      <div 
        className="absolute top-0 w-1 h-full bg-white border border-gray-800 shadow-md"
        style={{ left: `calc(${position}% - 2px)` }}
      />
    </div>
  );
};

interface FeedbackListProps {
  feedbacks: Feedback[];
  type: "sent" | "received";
  onSelect: (feedback: Feedback) => void;
}

const FeedbackList = ({ feedbacks, type, onSelect }: FeedbackListProps) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(feedbacks.length / ITEMS_PER_PAGE);
  const paginatedFeedbacks = feedbacks.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  if (feedbacks.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum feedback {type === "sent" ? "enviado" : "recebido"}.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="space-y-2 min-h-[180px]">
        {paginatedFeedbacks.map((feedback) => {
          const name = type === "sent" 
            ? feedback.receiver?.full_name || feedback.receiver?.email || "Usuário"
            : feedback.sender?.full_name || feedback.sender?.email || "Usuário";
          
          return (
            <button
              key={feedback.id}
              onClick={() => onSelect(feedback)}
              className="flex items-center gap-2 w-full text-left hover:bg-muted/50 p-1 rounded transition-colors"
            >
              <FeedbackIndicator type={feedback.feedback_type} />
              <span className="text-sm truncate flex-1">{name}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(feedback.created_at), "dd/MM/yy", { locale: ptBR })}
              </span>
            </button>
          );
        })}
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

const getFeedbackTypeLabel = (type: "positive" | "neutral" | "negative") => {
  const labels = {
    positive: "Positivo",
    neutral: "Neutro",
    negative: "Negativo",
  };
  return labels[type];
};

export function MyFeedbacksSection({ userId }: Props) {
  const { data, isLoading } = useFeedbacks(userId);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const receivedFeedbacks = data?.received || [];
  const sentFeedbacks = data?.sent || [];
  const averageScore = calculateAverageScore(receivedFeedbacks);

  const isSentFeedback = selectedFeedback
    ? sentFeedbacks.some(f => f.id === selectedFeedback.id)
    : false;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Meus Feedbacks
            </CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              {averageScore !== null ? (
                <>
                  <span className="text-sm text-muted-foreground">Média: {averageScore.toFixed(1)}</span>
                  <LikertScale average={averageScore} />
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Sem feedbacks recebidos</span>
              )}
              <SendFeedbackDialog currentUserId={userId} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-3">Recebidos ({receivedFeedbacks.length})</h4>
              <FeedbackList feedbacks={receivedFeedbacks} type="received" onSelect={setSelectedFeedback} />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3">Enviados ({sentFeedbacks.length})</h4>
              <FeedbackList feedbacks={sentFeedbacks} type="sent" onSelect={setSelectedFeedback} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FeedbackIndicator type={selectedFeedback?.feedback_type || "neutral"} />
              Feedback {getFeedbackTypeLabel(selectedFeedback?.feedback_type || "neutral")}
            </DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span>{format(new Date(selectedFeedback.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isSentFeedback ? "Para:" : "De:"}</span>
                  <span>
                    {isSentFeedback
                      ? selectedFeedback.receiver?.full_name || selectedFeedback.receiver?.email
                      : selectedFeedback.sender?.full_name || selectedFeedback.sender?.email}
                  </span>
                </div>
              </div>
              {selectedFeedback.message && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Mensagem:</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>
              )}
              {!selectedFeedback.message && (
                <p className="text-sm text-muted-foreground italic">Nenhuma mensagem adicionada.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
