import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, TrendingUp, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface AIReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  jobTitle: string;
  score: number | null;
  report: string | null;
}

const AIReportModal = ({
  open,
  onOpenChange,
  candidateName,
  jobTitle,
  score,
  report,
}: AIReportModalProps) => {
  const getScoreColor = (score: number | null) => {
    if (score === null) return "bg-muted text-muted-foreground";
    if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (score >= 40) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const getScoreLabel = (score: number | null) => {
    if (score === null) return "Não disponível";
    if (score >= 80) return "Alta Aderência";
    if (score >= 60) return "Boa Aderência";
    if (score >= 40) return "Aderência Moderada";
    return "Baixa Aderência";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Análise de Aderência
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 overflow-hidden flex flex-col min-h-0">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b">
            <div>
              <p className="font-semibold text-lg">{candidateName}</p>
              <p className="text-sm text-muted-foreground">Vaga: {jobTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <Badge className={`text-lg px-4 py-1 ${getScoreColor(score)}`}>
                {score !== null ? `${score}/100` : "—"}
              </Badge>
            </div>
          </div>

          {/* Score Summary */}
          <div className={`rounded-lg p-4 ${getScoreColor(score)}`}>
            <div className="flex items-center gap-2">
              {score === null ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <TrendingUp className="h-5 w-5" />
              )}
              <span className="font-medium">{getScoreLabel(score)}</span>
            </div>
          </div>

          {/* Report Content */}
          <div className="flex-1 min-h-0 max-h-[50vh] overflow-y-auto rounded-md border p-4 bg-card">
            {report ? (
              <div className="prose prose-sm max-w-none text-foreground prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-headings:text-foreground prose-ul:my-2 prose-li:my-0 prose-strong:text-foreground prose-code:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkBreaks]}>{report}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>Análise não disponível para este candidato.</p>
                <p className="text-sm">A análise pode estar em processamento ou ocorreu um erro.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIReportModal;
