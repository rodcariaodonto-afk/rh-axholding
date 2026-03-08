// MUST be imported first to capture URL hash before Supabase clears it
import "@/lib/inviteDetection";

import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { AppearanceProvider } from "@/contexts/AppearanceContext";
import { ViewAsProvider } from "@/contexts/ViewAsContext";
import ErrorBoundary from "@/components/ErrorBoundary";

// Static imports (critical path)
import Auth from "./pages/Auth";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import PeopleRoute from "./components/PeopleRoute";
import SetupEnforcementWrapper from "./components/SetupEnforcementWrapper";
import LayoutRoute from "./components/LayoutRoute";

// Lazy loaded pages
const Index = lazy(() => import("./pages/Index"));
const ImportCSV = lazy(() => import("./pages/ImportCSV"));
const Employees = lazy(() => import("./pages/Employees"));
const Departments = lazy(() => import("./pages/Departments"));
const DepartmentFormPage = lazy(() => import("./pages/DepartmentFormPage"));
const Positions = lazy(() => import("./pages/Positions"));
const PositionFormPage = lazy(() => import("./pages/PositionFormPage"));
const Profile = lazy(() => import("./pages/Profile"));
const EmployeeProfile = lazy(() => import("./pages/EmployeeProfile"));
const PdiDetailPage = lazy(() => import("./pages/PdiDetailPage"));
const CompanyCosts = lazy(() => import("./pages/CompanyCosts"));
const CompanySettings = lazy(() => import("./pages/CompanySettings"));
const Culture = lazy(() => import("./pages/Culture"));
const Terminations = lazy(() => import("./pages/Terminations"));
const TimeOff = lazy(() => import("./pages/TimeOff"));
const TalentBank = lazy(() => import("./pages/TalentBank"));
const TalentBankApplication = lazy(() => import("./pages/TalentBankApplication"));
const Vagas = lazy(() => import("./pages/Vagas"));
const JobDetailPage = lazy(() => import("./pages/JobDetailPage"));
const JobFormPage = lazy(() => import("./pages/JobFormPage"));
const JobApplicationPage = lazy(() => import("./pages/JobApplicationPage"));
const CareersPage = lazy(() => import("./pages/CareersPage"));
const Feedbacks = lazy(() => import("./pages/Feedbacks"));
const PerformanceEvaluation = lazy(() => import("./pages/PerformanceEvaluation"));
const EvaluationFormPage = lazy(() => import("./pages/EvaluationFormPage"));
const MyEvaluations = lazy(() => import("./pages/MyEvaluations"));
const ProfilerIntro = lazy(() => import("./pages/ProfilerIntro"));
const ProfilerEtapa1 = lazy(() => import("./pages/ProfilerEtapa1"));
const ProfilerEtapa2 = lazy(() => import("./pages/ProfilerEtapa2"));
const ProfilerResultado = lazy(() => import("./pages/ProfilerResultado"));
const PeopleAnalytics = lazy(() => import("./pages/PeopleAnalytics"));
const Organogram = lazy(() => import("./pages/Organogram"));
const ImportEmployees = lazy(() => import("./pages/ImportEmployees"));
const IntegrationsSettings = lazy(() => import("./pages/IntegrationsSettings"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const SkillsManagement = lazy(() => import("./pages/SkillsManagement"));
const PendingInvites = lazy(() => import("./pages/PendingInvites"));
const AccessManagement = lazy(() => import("./pages/AccessManagement"));
const ThemeEditor = lazy(() => import("./pages/ThemeEditor"));
const MyPdis = lazy(() => import("./pages/MyPdis"));
const TimeTracking = lazy(() => import("./pages/TimeTracking"));
const EvaluationAnswerPage = lazy(() => import("./pages/EvaluationAnswerPage"));
const EvaluationResultPage = lazy(() => import("./pages/EvaluationResultPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
      <BrowserRouter>
        <OrganizationProvider>
        <ViewAsProvider>
        <AppearanceProvider>
        <ErrorBoundary>
        <Routes>
          {/* Public routes (no layout) */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/vagas/00000000-0000-0000-0000-000000000001/aplicar" element={
            <Suspense fallback={<div className="container mx-auto px-4 py-8 space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-64 w-full" /></div>}>
              <TalentBankApplication />
            </Suspense>
          } />
          <Route path="/vagas/:id/aplicar" element={
            <Suspense fallback={<div className="container mx-auto px-4 py-8 space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-64 w-full" /></div>}>
              <JobApplicationPage />
            </Suspense>
          } />
          <Route path="/carreiras/:slug" element={
            <Suspense fallback={<div className="container mx-auto px-4 py-8 space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-64 w-full" /></div>}>
              <CareersPage />
            </Suspense>
          } />

          {/* Onboarding (protected, no layout) */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Suspense fallback={<div className="container mx-auto px-4 py-8 space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-64 w-full" /></div>}>
                <Onboarding />
              </Suspense>
            </ProtectedRoute>
          } />

          {/* Profiler routes (public, with layout) */}
          <Route element={<LayoutRoute />}>
            <Route path="/profiler-intro" element={
              <Suspense fallback={<div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>}>
                <ProfilerIntro />
              </Suspense>
            } />
            <Route path="/profiler-etapa-1" element={
              <Suspense fallback={<div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>}>
                <ProfilerEtapa1 />
              </Suspense>
            } />
            <Route path="/profiler-etapa-2" element={
              <Suspense fallback={<div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>}>
                <ProfilerEtapa2 />
              </Suspense>
            } />
            <Route path="/profiler-resultado" element={
              <Suspense fallback={<div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>}>
                <ProfilerResultado />
              </Suspense>
            } />
          </Route>

          {/* Protected routes with persistent Layout */}
          <Route element={<ProtectedRoute><SetupEnforcementWrapper><LayoutRoute /></SetupEnforcementWrapper></ProtectedRoute>}>
            <Route path="/" element={<Index />} />
            <Route path="/my-pdis" element={<MyPdis />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/:id" element={<EmployeeProfile />} />
            <Route path="/employees/:id/pdi/:pdiId" element={<PdiDetailPage />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/departments/new" element={<DepartmentFormPage />} />
            <Route path="/departments/:id/edit" element={<DepartmentFormPage />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/positions/new" element={<PositionFormPage />} />
            <Route path="/positions/:id/edit" element={<PositionFormPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/import-csv" element={<ImportCSV />} />
            <Route path="/culture" element={<Culture />} />
            <Route path="/terminations" element={<Terminations />} />
            <Route path="/time-off" element={<TimeOff />} />
            <Route path="/talent-bank" element={<TalentBank />} />
            <Route path="/vagas" element={<Vagas />} />
            <Route path="/vagas/:id" element={<JobDetailPage />} />
            <Route path="/feedbacks" element={<PeopleRoute><Feedbacks /></PeopleRoute>} />
            <Route path="/my-evaluations" element={<MyEvaluations />} />
            <Route path="/my-evaluations/:cycleId/:participantId" element={<EvaluationAnswerPage />} />
            <Route path="/my-evaluations/received/:cycleId" element={<EvaluationResultPage />} />
            <Route path="/theme-editor" element={<ThemeEditor />} />
            <Route path="/time-tracking" element={<TimeTracking />} />

            {/* People-only routes */}
            <Route path="/people-analytics" element={<PeopleRoute><PeopleAnalytics /></PeopleRoute>} />
            <Route path="/organogram" element={<PeopleRoute><Organogram /></PeopleRoute>} />
            <Route path="/import-employees" element={<PeopleRoute><ImportEmployees /></PeopleRoute>} />
            <Route path="/company-costs" element={<PeopleRoute><CompanyCosts /></PeopleRoute>} />
            <Route path="/company-settings" element={<PeopleRoute><CompanySettings /></PeopleRoute>} />
            <Route path="/company-settings/integrations" element={<PeopleRoute><IntegrationsSettings /></PeopleRoute>} />
            <Route path="/skills-management" element={<PeopleRoute><SkillsManagement /></PeopleRoute>} />
            <Route path="/invites" element={<PeopleRoute><PendingInvites /></PeopleRoute>} />
            <Route path="/vagas/new" element={<PeopleRoute><JobFormPage /></PeopleRoute>} />
            <Route path="/vagas/:id/edit" element={<PeopleRoute><JobFormPage /></PeopleRoute>} />
            <Route path="/performance-evaluation" element={<PeopleRoute><PerformanceEvaluation /></PeopleRoute>} />
            <Route path="/performance-evaluation/new" element={<PeopleRoute><EvaluationFormPage /></PeopleRoute>} />
            <Route path="/performance-evaluation/:id/edit" element={<PeopleRoute><EvaluationFormPage /></PeopleRoute>} />

            {/* Admin-only routes */}
            <Route path="/access-management" element={<AdminRoute><AccessManagement /></AdminRoute>} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
        </AppearanceProvider>
        </ViewAsProvider>
        </OrganizationProvider>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
