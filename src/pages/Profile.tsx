import { useAuth } from "@/hooks/useAuth";
import { useEmployeeById } from "@/hooks/useEmployeeById";
import { useDevices } from "@/hooks/useDevices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useMemo } from "react";
import { EmployeeDialog } from "@/components/EmployeeDialog";
import { MyFeedbacksSection } from "@/components/MyFeedbacksSection";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Edit, Mail, Calendar, Briefcase, Package, Fingerprint } from "lucide-react";
import ProfilerDetailModal from "@/components/ProfilerDetailModal";
import Layout from "@/components/Layout";
import { DEVICE_TYPE_LABELS, DEVICE_STATUS_LABELS, DEVICE_STATUS_VARIANTS, DEVICE_TYPE_ICONS } from "@/constants/device";
import { parseDateFromDB } from "@/lib/dateUtils";

const POSITION_LEVEL_LABELS: Record<string, string> = {
  junior_i: "Júnior I",
  junior_ii: "Júnior II",
  junior_iii: "Júnior III",
  pleno_i: "Pleno I",
  pleno_ii: "Pleno II",
  pleno_iii: "Pleno III",
  senior_i: "Sênior I",
  senior_ii: "Sênior II",
  senior_iii: "Sênior III",
};

export default function Profile() {
  const { user } = useAuth();
  const { data: employee, isLoading } = useEmployeeById(user?.id);
  const { devices, isLoading: isLoadingDevices } = useDevices();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showProfilerModal, setShowProfilerModal] = useState(false);

  const userDevices = useMemo(() => {
    if (!user?.id || !devices) return [];
    return devices.filter(device => device.user_id === user.id);
  }, [devices, user?.id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Perfil não encontrado.</p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const positionDisplay = employee.positions?.title
    ? `${employee.positions.title}${
        employee.position_level_detail
          ? ` - ${POSITION_LEVEL_LABELS[employee.position_level_detail] || employee.position_level_detail}`
          : ""
      }`
    : null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header com Avatar */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <AvatarUpload
                userId={employee.id}
                currentPhotoUrl={employee.photo_url}
                fullName={employee.full_name}
                size="lg"
                editable={true}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold truncate">
                      {employee.full_name || "Sem nome"}
                    </h1>
                    <p className="text-muted-foreground">{employee.email}</p>
                    {positionDisplay && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {positionDisplay}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowProfilerModal(true)}>
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Profiler
                    </Button>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Perfil
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email Corporativo</p>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Data de Nascimento</p>
                <p className="text-sm text-muted-foreground">
                  {employee.birth_date
                    ? parseDateFromDB(employee.birth_date)?.toLocaleDateString("pt-BR")
                    : "Não informado"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Nacionalidade</p>
                <p className="text-sm text-muted-foreground">
                  {employee.nationality || "Não informado"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Cargo</p>
                <p className="text-sm text-muted-foreground">
                  {positionDisplay || "Não informado"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Departamento</p>
                <p className="text-sm text-muted-foreground">
                  {employee.departments?.name || "Não informado"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Data de Admissão</p>
                <p className="text-sm text-muted-foreground">
                  {(employee as any).hire_date
                    ? parseDateFromDB((employee as any).hire_date)?.toLocaleDateString("pt-BR")
                    : "Não informado"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <MyFeedbacksSection userId={user?.id || ""} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Meus Dispositivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDevices ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : userDevices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dispositivo associado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDevices.map((device) => {
                  const Icon = DEVICE_TYPE_ICONS[device.device_type];
                  return (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{DEVICE_TYPE_LABELS[device.device_type]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{device.model}</TableCell>
                      <TableCell>{device.year}</TableCell>
                      <TableCell>
                        <Badge variant={DEVICE_STATUS_VARIANTS[device.status]}>
                          {DEVICE_STATUS_LABELS[device.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EmployeeDialog
        employeeId={employee.id}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <ProfilerDetailModal
        open={showProfilerModal}
        onOpenChange={setShowProfilerModal}
        employeeId={employee.id}
        employeeName={employee.full_name}
        currentProfileCode={employee.profiler_result_code}
        currentProfileDetail={employee.profiler_result_detail}
        currentCompletedAt={employee.profiler_completed_at}
      />
      </div>
    </Layout>
  );
}
