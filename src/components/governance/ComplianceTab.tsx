import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Download, Loader2, ShieldCheck } from "lucide-react";

export function ComplianceTab() {
  const { organizationId } = useCurrentOrganization();
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any | null>(null);

  const generate = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("governance-compliance-report", {
        body: { organization_id: organizationId },
      });
      if (error) throw error;
      setReport(data);
    } catch (e) {
      toast.error("Falha: " + String(e));
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `compliance-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Relatório de conformidade</CardTitle>
          <div className="flex gap-2">
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Gerar
            </Button>
            {report && <Button variant="outline" onClick={download}><Download className="h-4 w-4 mr-2" />JSON</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {!report ? (
            <p className="text-sm text-muted-foreground">Clique em "Gerar" para produzir o relatório consolidado.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Compliance score</span>
                <div className="text-4xl font-bold">{report.compliance_score}/100</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(report.counts).map(([k, v]) => (
                  <div key={k} className="border rounded-md p-3">
                    <div className="text-xs text-muted-foreground">{k}</div>
                    <div className="text-xl font-semibold">{String(v)}</div>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-medium mb-2">Issues</h4>
                {report.issues.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma issue detectada.</p>
                ) : (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {report.issues.map((i: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 border rounded-md p-3 text-sm">
                        <Badge variant={i.severity === "critical" ? "destructive" : "secondary"}>{i.severity}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">{i.code}</span>
                        <span>{i.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
