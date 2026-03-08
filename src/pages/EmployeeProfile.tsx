import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Fingerprint, UserMinus } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import ProfilerDetailModal from "@/components/ProfilerDetailModal";
import { AvatarUpload } from "@/components/AvatarUpload";
import { useEmployeeById } from "@/hooks/useEmployeeById";
import { useUpdateEmployee } from "@/hooks/useUpdateEmployee";
import { useTerminateEmployee } from "@/hooks/useTerminateEmployee";
import { useEmployeeContact } from "@/hooks/useEmployeeContact";
import { useEmployeeContract } from "@/hooks/useEmployeeContract";
import { useEmployeeDemographics } from "@/hooks/useEmployeeDemographics";
import { useEmployeeLegalDocs } from "@/hooks/useEmployeeLegalDocs";
import { useDepartments } from "@/hooks/useDepartments";
import { usePositions } from "@/hooks/usePositions";
import { useUnits } from "@/hooks/useUnits";
import { useEmployees } from "@/hooks/useEmployees";
import { usePositionLevels } from "@/hooks/usePositionLevels";
import { Skeleton } from "@/components/ui/skeleton";
import { PdiTab } from "@/components/PdiTab";
import { EmployeeDocumentsTab } from "@/components/EmployeeDocumentsTab";
import { EmployeeTrainingsTab } from "@/components/EmployeeTrainingsTab";
import { EmployeeChangesHistory } from "@/components/EmployeeChangesHistory";
import { PersonalInfoForm, type PersonalFormData } from "@/components/PersonalInfoForm";
import { ContactInfoForm, type ContactFormData } from "@/components/ContactInfoForm";
import { ContractInfoForm, type ContractFormData } from "@/components/ContractInfoForm";
import { TerminationModal, type TerminationData } from "@/components/TerminationModal";
import { formatDateForDB } from "@/lib/dateUtils";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [showProfilerModal, setShowProfilerModal] = useState(false);
  const [pendingPersonalData, setPendingPersonalData] = useState<PersonalFormData | null>(null);
  const { canAny } = usePermissions();
  
  const { data: employee, isLoading: isLoadingEmployee } = useEmployeeById(id);
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const { data: units } = useUnits();
  const { data: employees } = useEmployees();
  const positionLevelsData = usePositionLevels();
  const positionLevels = [...positionLevelsData];
  const { mutate: updateEmployee, isPending: isUpdatingEmployee } = useUpdateEmployee();
  const { mutate: terminateEmployee, isPending: isTerminating } = useTerminateEmployee();
  const { contact, updateContact, isUpdating: isUpdatingContact } = useEmployeeContact(id);
  const { contracts, createContract, updateContract, isCreating, isUpdating: isUpdatingContract } = useEmployeeContract(id);
  
  // New hooks for separated PII data
  const { demographics, updateDemographics, isUpdating: isUpdatingDemographics } = useEmployeeDemographics(id);
  const { legalDocs, isView: isLegalDocsView, canEdit: canEditLegalDocs, updateLegalDocs, isUpdating: isUpdatingLegalDocs } = useEmployeeLegalDocs(id);


  const onSubmitPersonal = (data: PersonalFormData) => {
    if (!id) return;
    
    // Check if status changed to terminated and was not terminated before
    if (data.status === "terminated" && employee?.status !== "terminated") {
      setPendingPersonalData(data);
      setShowTerminationModal(true);
      return;
    }
    
    // Update employee data (organizational fields only)
    updateEmployee({
      id,
      full_name: data.full_name,
      department_id: data.department_id || undefined,
      base_position_id: data.base_position_id || undefined,
      position_level_detail: data.position_level_detail || undefined,
      unit_id: data.unit_id || undefined,
      manager_id: data.manager_id || undefined,
      employment_type: data.employment_type,
      status: data.status,
      termination_date: formatDateForDB(data.termination_date),
    });

    // Update demographics data (in employees_demographics table)
    updateDemographics({
      birth_date: formatDateForDB(data.birth_date),
      gender: data.gender || undefined,
      nationality: data.nationality || undefined,
      birthplace: data.birthplace || undefined,
      ethnicity: data.ethnicity || undefined,
      marital_status: data.marital_status || undefined,
      number_of_children: data.number_of_children ?? undefined,
      education_level: data.education_level || undefined,
      education_course: data.education_course || undefined,
    });

    // Update legal docs and banking data (in employees_legal_docs table)
    if (canEditLegalDocs) {
      updateLegalDocs({
        cpf: data.cpf || undefined,
        rg: data.rg || undefined,
        rg_issuer: data.rg_issuer || undefined,
        bank_name: data.bank_name || undefined,
        bank_agency: data.bank_agency || undefined,
        bank_account: data.bank_account || undefined,
        bank_account_type: data.bank_account_type || undefined,
        pix_key: data.pix_key || undefined,
      });
    }
  };

  const onConfirmTermination = (terminationData: TerminationData) => {
    if (!id) return;
    
    terminateEmployee({
      employeeId: id,
      terminationDate: terminationData.termination_date,
      terminationReason: terminationData.termination_reason,
      terminationDecision: terminationData.termination_decision,
      terminationCause: terminationData.termination_cause,
      terminationCost: terminationData.termination_cost,
      terminationNotes: terminationData.termination_notes,
    });
    
    setShowTerminationModal(false);
    setPendingPersonalData(null);
  };

  const onSubmitContact = (data: ContactFormData) => {
    updateContact(data);
  };

  const onSubmitContract = (data: ContractFormData) => {
    if (!id) return;
    
    const contractData = {
      user_id: id,
      contract_type: data.contract_type,
      hire_date: formatDateForDB(data.hire_date) as string,
      probation_days: data.probation_days,
      contract_start_date: formatDateForDB(data.contract_start_date),
      contract_duration_days: data.contract_duration_days,
      contract_end_date: formatDateForDB(data.contract_end_date),
      base_salary: data.base_salary,
      health_insurance: data.health_insurance,
      dental_insurance: data.dental_insurance,
      transportation_voucher: data.transportation_voucher,
      meal_voucher: data.meal_voucher,
      other_benefits: data.other_benefits,
      is_active: data.is_active,
    };

    if (contracts && contracts.length > 0) {
      const activeContract = contracts.find((c) => c.is_active) || contracts[0];
      updateContract({ ...contractData, id: activeContract.id });
    } else {
      createContract(contractData);
    }
  };

  if (isLoadingEmployee) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <Card>
          <CardContent className="pt-6">
            <p>Colaborador não encontrado.</p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <AvatarUpload
              userId={employee.id}
              currentPhotoUrl={employee.photo_url}
              fullName={employee.full_name}
              size="lg"
              editable={true}
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{employee.full_name}</h1>
              <p className="text-muted-foreground text-sm sm:text-base">{employee.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-14 sm:pl-0">
            <Button variant="outline" onClick={() => setShowProfilerModal(true)}>
              <Fingerprint className="mr-2 h-4 w-4" />
              Profiler
            </Button>
            {canAny(["employees.edit", "employees.delete"]) && employee.status !== "terminated" && (
              <Button variant="destructive" onClick={() => setShowTerminationModal(true)}>
                <UserMinus className="mr-2 h-4 w-4" />
                Desligamento
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
                <TabsTrigger value="personal">Pessoal</TabsTrigger>
                <TabsTrigger value="contact">Contato</TabsTrigger>
                <TabsTrigger value="contract">Contrato</TabsTrigger>
                <TabsTrigger value="pdi">PDI</TabsTrigger>
                <TabsTrigger value="trainings">Treinamentos</TabsTrigger>
                <TabsTrigger value="documents">Arquivos</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 pt-6">
                <PersonalInfoForm
                  employee={employee}
                  demographics={demographics}
                  legalDocs={legalDocs}
                  departments={departments || []}
                  positions={positions || []}
                  units={units || []}
                  employees={employees || []}
                  positionLevels={positionLevels}
                  isUpdating={isUpdatingEmployee || isTerminating || isUpdatingDemographics || isUpdatingLegalDocs}
                  isLegalDocsView={isLegalDocsView}
                  canEditLegalDocs={canEditLegalDocs}
                  onSubmit={onSubmitPersonal}
                />
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 pt-6">
                <ContactInfoForm
                  contact={contact}
                  isUpdating={isUpdatingContact}
                  onSubmit={onSubmitContact}
                />
              </TabsContent>

              <TabsContent value="contract" className="space-y-4 pt-6">
                <ContractInfoForm
                  contracts={contracts || []}
                  isCreating={isCreating}
                  isUpdating={isUpdatingContract}
                  onSubmit={onSubmitContract}
                />
              </TabsContent>

              <TabsContent value="pdi" className="space-y-4 pt-6">
                {id && <PdiTab employeeId={id} />}
              </TabsContent>

              <TabsContent value="trainings" className="space-y-4 pt-6">
                {id && <EmployeeTrainingsTab employeeId={id} />}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 pt-6">
                {id && <EmployeeDocumentsTab employeeId={id} />}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <TerminationModal
        open={showTerminationModal}
        onClose={() => {
          setShowTerminationModal(false);
          setPendingPersonalData(null);
        }}
        onConfirm={onConfirmTermination}
        employeeName={employee?.full_name || employee?.email || ""}
      />

      <ProfilerDetailModal
        open={showProfilerModal}
        onOpenChange={setShowProfilerModal}
        employeeId={id}
        employeeName={employee?.full_name}
        currentProfileCode={employee?.profiler_result_code}
        currentProfileDetail={employee?.profiler_result_detail}
        currentCompletedAt={employee?.profiler_completed_at}
      />

      {id && <EmployeeChangesHistory employeeId={id} />}
    </Layout>
  );
}
