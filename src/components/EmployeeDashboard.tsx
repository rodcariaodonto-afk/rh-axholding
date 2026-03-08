import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Cake, Award, Palmtree } from "lucide-react";
import type { Employee } from "@/hooks/useEmployees";
import BirthdayModal from "./BirthdayModal";
import WorkAnniversaryModal from "./WorkAnniversaryModal";
import { isWithinInterval, parseISO } from "date-fns";

interface EmployeeDashboardProps {
  employees: Employee[];
}

export default function EmployeeDashboard({ employees }: EmployeeDashboardProps) {
  const navigate = useNavigate();
  const [birthdayModalOpen, setBirthdayModalOpen] = useState(false);
  const [anniversaryModalOpen, setAnniversaryModalOpen] = useState(false);

  // Fetch vacation requests to count employees currently on vacation
  const { data: vacationRequests } = useQuery({
    queryKey: ["time-off-requests-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .select("employee_id, start_date, end_date, status")
        .eq("status", "approved");

      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();

    const activeEmployees = employees.filter(emp => emp.status === "active");
    
    // Birthday celebrants this month (active employees only)
    const birthdayCelebrants = activeEmployees.filter(emp => {
      if (!emp.birth_date) return false;
      const birthDate = new Date(emp.birth_date + "T00:00:00");
      return birthDate.getMonth() === currentMonth;
    }).map(emp => {
      const birthDate = new Date(emp.birth_date + "T00:00:00");
      const age = now.getFullYear() - birthDate.getFullYear();
      return {
        ...emp,
        age,
        day: birthDate.getDate(),
      };
    }).sort((a, b) => a.day - b.day);

    // Work anniversaries this month (active employees only)
    const workAnniversaries = activeEmployees.filter(emp => {
      if (!emp.hire_date) return false;
      const hireDate = new Date(emp.hire_date + "T00:00:00");
      return hireDate.getMonth() === currentMonth;
    }).map(emp => {
      const hireDate = new Date(emp.hire_date + "T00:00:00");
      const years = now.getFullYear() - hireDate.getFullYear();
      return {
        ...emp,
        years,
        day: hireDate.getDate(),
      };
    }).sort((a, b) => a.day - b.day);

    // Count employees currently on vacation
    const onVacation = vacationRequests?.filter((req) => {
      try {
        const start = parseISO(req.start_date);
        const end = parseISO(req.end_date);
        return isWithinInterval(now, { start, end });
      } catch {
        return false;
      }
    }).length || 0;

    return {
      activeCount: activeEmployees.length,
      birthdayCelebrants,
      workAnniversaries,
      onVacation,
    };
  }, [employees, vacationRequests]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
          </CardContent>
        </Card>

        <Card 
          interactive
          onClick={() => setBirthdayModalOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aniversariantes do Mês</CardTitle>
            <Cake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.birthdayCelebrants.length}</div>
            <p className="text-xs text-muted-foreground">Clique para ver detalhes</p>
          </CardContent>
        </Card>

        <Card 
          interactive
          onClick={() => setAnniversaryModalOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Casa</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.workAnniversaries.length}</div>
            <p className="text-xs text-muted-foreground">Aniversários de empresa</p>
          </CardContent>
        </Card>

        <Card 
          interactive
          onClick={() => navigate("/time-off")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Férias</CardTitle>
            <Palmtree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onVacation}</div>
            <p className="text-xs text-muted-foreground">Clique para gerenciar</p>
          </CardContent>
        </Card>
      </div>

      <BirthdayModal
        open={birthdayModalOpen}
        onOpenChange={setBirthdayModalOpen}
        employees={stats.birthdayCelebrants}
      />

      <WorkAnniversaryModal
        open={anniversaryModalOpen}
        onOpenChange={setAnniversaryModalOpen}
        employees={stats.workAnniversaries}
      />
    </>
  );
}
