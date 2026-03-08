import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePdiById } from "@/hooks/usePdiById";
import { PdiInfoForm } from "./PdiInfoForm";
import { PdiGoalsManager } from "./PdiGoalsManager";
import { PdiProgressView } from "./PdiProgressView";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface PdiDialogProps {
  employeeId: string;
  pdiId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PdiDialog = ({ employeeId, pdiId, open, onOpenChange }: PdiDialogProps) => {
  const { data: pdi, isLoading } = usePdiById(pdiId || undefined);
  const [activeTab, setActiveTab] = useState("info");

  const handlePdiCreated = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {pdiId ? (pdi?.title || "Carregando...") : "Novo PDI"}
          </DialogTitle>
        </DialogHeader>

        {isLoading && pdiId ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="goals" disabled={!pdiId}>
                Metas
              </TabsTrigger>
              <TabsTrigger value="progress" disabled={!pdiId}>
                Progresso
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <PdiInfoForm 
                employeeId={employeeId} 
                pdi={pdi} 
                onSuccess={handlePdiCreated}
              />
            </TabsContent>

            <TabsContent value="goals" className="space-y-4 mt-4">
              {pdiId && <PdiGoalsManager pdiId={pdiId} pdi={pdi} />}
            </TabsContent>

            <TabsContent value="progress" className="space-y-4 mt-4">
              {pdiId && <PdiProgressView pdiId={pdiId} pdi={pdi} />}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
