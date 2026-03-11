import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartments } from "@/hooks/useDepartments";
import { supabase } from "@/integrations/supabase/client";
import { usePositions } from "@/hooks/usePositions";
import { useUnits } from "@/hooks/useUnits";
import { useEmployees } from "@/hooks/useEmployees";
import { useCreateEmployee } from "@/hooks/useCreateEmployee";
import { toast } from "sonner";

function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(cleaned[10]);
}

function formatCPF(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

export default function NewEmployeePage() {
  const navigate = useNavigate();
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const { data: units } = useUnits();
  const { data: employees } = useEmployees();
  const createEmployee = useCreateEmployee();

  const [activeTab, setActiveTab] = useState("personal");
  const [saving, setSaving] = useState(false);

  // Personal data
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("Brasileira");

  // Professional data
  const [corporateEmail, setCorporateEmail] = useState("");
  const [positionId, setPositionId] = useState("");
  const [cboCode, setCboCode] = useState("");
  const [seniority, setSeniority] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [contractType, setContractType] = useState("clt");
  const [weeklyHours, setWeeklyHours] = useState("44");
  const [unitId, setUnitId] = useState("");
  const [baseSalary, setBaseSalary] = useState("");

  // Benefits
  const [transportVoucher, setTransportVoucher] = useState("");
  const [mealVoucher, setMealVoucher] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [dentalInsurance, setDentalInsurance] = useState("");
  const [otherBenefits, setOtherBenefits] = useState("");

  const cpfValid = cpf.length === 0 || validateCPF(cpf);

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!corporateEmail.trim()) {
      toast.error("Email corporativo é obrigatório");
      return;
    }
    if (cpf && !validateCPF(cpf)) {
      toast.error("CPF inválido");
      return;
    }

    setSaving(true);
    try {
      const empType = contractType === "pj" ? "contractor" : contractType === "intern" ? "intern" : "full_time";
      const result = await createEmployee.mutateAsync({
        full_name: fullName.trim(),
        email: corporateEmail.trim(),
        skip_invite: true,
        department_id: departmentId || null,
        base_position_id: positionId || null,
        position_level_detail: seniority || null,
        unit_id: unitId || null,
        manager_id: managerId || null,
        employment_type: empType,
        hire_date: hireDate || null,
        base_salary: baseSalary ? parseFloat(baseSalary) : null,
        contract_type: contractType || null,
      });

      // Update extra fields on the created employee (cpf, cbo, etc.)
      const employeeId = result?.employee_id;
      if (employeeId) {
        const updates: Record<string, any> = {};
        if (cpf) updates.cpf = cpf.replace(/\D/g, "");
        if (cboCode) updates.cbo_code = cboCode;
        if (birthDate) updates.birth_date = birthDate;
        if (gender) updates.gender = gender;
        if (nationality) updates.nationality = nationality;
        if (weeklyHours) updates.weekly_hours = parseFloat(weeklyHours);
        
        if (Object.keys(updates).length > 0) {
          await supabase.from("employees").update(updates).eq("id", employeeId);
        }

        // Update contract benefits
        const benefitUpdates: Record<string, any> = {};
        if (transportVoucher) benefitUpdates.transportation_voucher = parseFloat(transportVoucher);
        if (mealVoucher) benefitUpdates.meal_voucher = parseFloat(mealVoucher);
        if (healthInsurance) benefitUpdates.health_insurance = parseFloat(healthInsurance);
        if (dentalInsurance) benefitUpdates.dental_insurance = parseFloat(dentalInsurance);
        if (otherBenefits) benefitUpdates.other_benefits = parseFloat(otherBenefits);
        
        if (Object.keys(benefitUpdates).length > 0) {
          await supabase.from("employees_contracts").update(benefitUpdates).eq("user_id", employeeId).eq("is_active", true);
        }
      }

      toast.success("Colaborador cadastrado com sucesso!");
      navigate("/employees");
    } catch (error) {
      toast.error("Erro ao cadastrar colaborador");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { value: "personal", label: "Dados Pessoais" },
    { value: "professional", label: "Dados Profissionais" },
    { value: "benefits", label: "Benefícios" },
    { value: "summary", label: "Resumo" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Colaborador</h1>
          <p className="text-muted-foreground">Cadastre manualmente um novo colaborador</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formatCPF(cpf)}
                  onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
                  placeholder="000.000.000-00"
                  className={!cpfValid ? "border-destructive" : ""}
                />
                {!cpfValid && <p className="text-xs text-destructive">CPF inválido</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="non_binary">Não-binário</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefiro não dizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="personalEmail">Email Pessoal</Label>
                <Input id="personalEmail" type="email" value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} placeholder="email@pessoal.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidade</Label>
                <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setActiveTab("professional")}>Próximo</Button>
          </div>
        </TabsContent>

        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle>Dados Profissionais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="corporateEmail">Email Corporativo *</Label>
                <Input id="corporateEmail" type="email" value={corporateEmail} onChange={(e) => setCorporateEmail(e.target.value)} placeholder="email@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Select value={positionId} onValueChange={setPositionId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                  <SelectContent>
                    {positions?.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cboCode">CBO</Label>
                <Input id="cboCode" value={cboCode} onChange={(e) => setCboCode(e.target.value)} placeholder="Código CBO" />
              </div>
              <div className="space-y-2">
                <Label>Senioridade</Label>
                <Select value={seniority} onValueChange={setSeniority}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Júnior</SelectItem>
                    <SelectItem value="pleno">Pleno</SelectItem>
                    <SelectItem value="senior">Sênior</SelectItem>
                    <SelectItem value="specialist">Especialista</SelectItem>
                    <SelectItem value="lead">Líder</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="director">Diretor</SelectItem>
                    <SelectItem value="c_level">C-Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gestor</Label>
                <Select value={managerId} onValueChange={setManagerId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {employees?.filter(e => e.status === "active").map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hireDate">Data de Admissão</Label>
                <Input id="hireDate" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Contrato</Label>
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="pj">PJ</SelectItem>
                    <SelectItem value="intern">Estágio</SelectItem>
                    <SelectItem value="temporary">Temporário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weeklyHours">Jornada Semanal (horas)</Label>
                <Input id="weeklyHours" type="number" value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={unitId} onValueChange={setUnitId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {units?.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseSalary">Salário Base</Label>
                <Input id="baseSalary" type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} placeholder="0.00" />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setActiveTab("personal")}>Anterior</Button>
            <Button onClick={() => setActiveTab("benefits")}>Próximo</Button>
          </div>
        </TabsContent>

        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>Benefícios</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transportVoucher">Vale Transporte (R$)</Label>
                <Input id="transportVoucher" type="number" value={transportVoucher} onChange={(e) => setTransportVoucher(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mealVoucher">Vale Refeição (R$)</Label>
                <Input id="mealVoucher" type="number" value={mealVoucher} onChange={(e) => setMealVoucher(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="healthInsurance">Plano de Saúde (R$)</Label>
                <Input id="healthInsurance" type="number" value={healthInsurance} onChange={(e) => setHealthInsurance(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dentalInsurance">Plano Odontológico (R$)</Label>
                <Input id="dentalInsurance" type="number" value={dentalInsurance} onChange={(e) => setDentalInsurance(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherBenefits">Outros Benefícios (R$)</Label>
                <Input id="otherBenefits" type="number" value={otherBenefits} onChange={(e) => setOtherBenefits(e.target.value)} placeholder="0.00" />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setActiveTab("professional")}>Anterior</Button>
            <Button onClick={() => setActiveTab("summary")}>Próximo</Button>
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Cadastro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">DADOS PESSOAIS</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Nome:</span> {fullName || "—"}</div>
                  <div><span className="text-muted-foreground">CPF:</span> {cpf ? formatCPF(cpf) : "—"}</div>
                  <div><span className="text-muted-foreground">Nascimento:</span> {birthDate || "—"}</div>
                  <div><span className="text-muted-foreground">Gênero:</span> {gender || "—"}</div>
                  <div><span className="text-muted-foreground">Email pessoal:</span> {personalEmail || "—"}</div>
                  <div><span className="text-muted-foreground">Telefone:</span> {phone || "—"}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">DADOS PROFISSIONAIS</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Email corporativo:</span> {corporateEmail || "—"}</div>
                  <div><span className="text-muted-foreground">Cargo:</span> {positions?.find(p => p.id === positionId)?.title || "—"}</div>
                  <div><span className="text-muted-foreground">Departamento:</span> {departments?.find(d => d.id === departmentId)?.name || "—"}</div>
                  <div><span className="text-muted-foreground">Contrato:</span> {contractType}</div>
                  <div><span className="text-muted-foreground">Admissão:</span> {hireDate || "—"}</div>
                  <div><span className="text-muted-foreground">Jornada:</span> {weeklyHours}h/semana</div>
                  <div><span className="text-muted-foreground">Salário:</span> {baseSalary ? `R$ ${parseFloat(baseSalary).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">BENEFÍCIOS</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">VT:</span> {transportVoucher ? `R$ ${transportVoucher}` : "—"}</div>
                  <div><span className="text-muted-foreground">VR:</span> {mealVoucher ? `R$ ${mealVoucher}` : "—"}</div>
                  <div><span className="text-muted-foreground">Saúde:</span> {healthInsurance ? `R$ ${healthInsurance}` : "—"}</div>
                  <div><span className="text-muted-foreground">Odonto:</span> {dentalInsurance ? `R$ ${dentalInsurance}` : "—"}</div>
                  <div><span className="text-muted-foreground">Outros:</span> {otherBenefits ? `R$ ${otherBenefits}` : "—"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setActiveTab("benefits")}>Anterior</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Colaborador
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
