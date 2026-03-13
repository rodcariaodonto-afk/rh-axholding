import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PdiVersionHistoryProps {
  pdiId: string;
}

export const PdiVersionHistory = ({ pdiId }: PdiVersionHistoryProps) => {
  const { data: versions = [] } = useQuery({
    queryKey: ["pdi-versions", pdiId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_versions")
        .select("*")
        .eq("pdi_id", pdiId)
        .order("version_number", { ascending: false });
      if (error) throw error;
      
      // Fetch employee names for changed_by
      const userIds = [...new Set(data.map((v: any) => v.changed_by))];
      const { data: employees } = await supabase
        .from("employees")
        .select("id, full_name")
        .in("id", userIds);
      
      return data.map((v: any) => ({
        ...v,
        changed_by_name: employees?.find((e: any) => e.id === v.changed_by)?.full_name || "Desconhecido",
      }));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Histórico de Versões
        </CardTitle>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma versão registrada ainda.
          </p>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-3">
              {versions.map((version: any) => (
                <div key={version.id} className="border-l-2 border-primary pl-3 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      v{version.version_number}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(version.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm font-medium mt-1">{version.changed_by_name}</p>
                  {version.change_description && (
                    <p className="text-sm text-muted-foreground">{version.change_description}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
