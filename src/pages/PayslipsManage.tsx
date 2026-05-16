import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download } from "lucide-react";
import { usePayrollCompetencies } from "@/hooks/usePayrollCompetencies";
import { useOrgPayslips, useUploadPayslip, downloadPayslip } from "@/hooks/usePayslips";
import { useEmployees } from "@/hooks/useEmployees";

export default function PayslipsManage() {
  const { data: comps = [] } = usePayrollCompetencies();
  const [competencyId, setCompetencyId] = useState<string>("");
  const { data: payslips = [] } = useOrgPayslips(competencyId || undefined);
  const { data: employees = [] } = useEmployees();
  const [employeeId, setEmployeeId] = useState<string>("");
  const upload = useUploadPayslip();
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = async (f: File) => {
    if (!competencyId || !employeeId) return;
    await upload.mutateAsync({ competency_id: competencyId, employee_id: employeeId, file: f });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Holerites — Gestão</h1>
        <p className="text-muted-foreground">Publique holerites por competência (upload em lote ou individual)</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Upload individual</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          <Select value={competencyId} onValueChange={setCompetencyId}>
            <SelectTrigger><SelectValue placeholder="Competência" /></SelectTrigger>
            <SelectContent>
              {comps.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.reference_label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger><SelectValue placeholder="Colaborador" /></SelectTrigger>
            <SelectContent>
              {employees.filter((e: any) => e.status === "active").map((e: any) => (
                <SelectItem key={e.id} value={e.id}>{e.full_name ?? e.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input ref={fileRef} type="file" accept="application/pdf"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            disabled={!competencyId || !employeeId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Publicados</CardTitle></CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum holerite publicado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead>Status ciência</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.employees?.full_name ?? p.employees?.email ?? "—"}</TableCell>
                    <TableCell>{p.payroll_competencies?.reference_label ?? "—"}</TableCell>
                    <TableCell className="text-sm">{p.ack_status}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => downloadPayslip(p.file_path, p.id)}>
                        <Download className="size-3.5 mr-1" />PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
