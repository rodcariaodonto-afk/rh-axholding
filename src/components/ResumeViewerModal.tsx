import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";

interface ResumeViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeUrl: string | null;
  candidateName: string;
}

const ResumeViewerModal = ({
  open,
  onOpenChange,
  resumeUrl,
  candidateName,
}: ResumeViewerModalProps) => {
  if (!resumeUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Currículo - {candidateName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <iframe
            src={resumeUrl}
            className="w-full h-full border rounded-md"
            title={`Currículo de ${candidateName}`}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" asChild>
            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova aba
            </a>
          </Button>
          <Button asChild>
            <a href={resumeUrl} download>
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeViewerModal;
