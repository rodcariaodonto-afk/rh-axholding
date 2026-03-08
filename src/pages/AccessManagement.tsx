import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { MemberList } from "@/components/access/MemberList";
import { RoleList } from "@/components/access/RoleList";
import { PermissionAuditLog } from "@/components/access/PermissionAuditLog";
import { Shield, Users, Key, History } from "lucide-react";

export default function AccessManagement() {
  const { organization, isLoading } = useCurrentOrganization();
  const [activeTab, setActiveTab] = useState("members");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestão de Acessos</h1>
            <p className="text-muted-foreground">
              Gerencie os níveis de permissão dos membros de {organization?.name || "sua organização"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Membros</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Membros da Organização</CardTitle>
                <CardDescription>
                  Visualize e gerencie os perfis de acesso dos membros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MemberList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Roles e Permissões</CardTitle>
                <CardDescription>
                  Roles de sistema e customizadas disponíveis para sua organização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RoleList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Alterações</CardTitle>
                <CardDescription>
                  Registro de todas as alterações de permissões realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PermissionAuditLog />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
