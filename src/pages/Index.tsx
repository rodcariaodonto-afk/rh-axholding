import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DeviceTable from "@/components/DeviceTable";

import DeviceDialog from "@/components/DeviceDialog";
import { Device } from "@/types/device";
import { useDevices } from "@/hooks/useDevices";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { user } = useAuth();
  const { canEdit, canDelete } = useUserRole(user?.id);
  const { organization } = useRequireOrganization();
  const { devices, isLoading, createDevice, updateDevice, deleteDevice } = useDevices();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const handleAdd = () => {
    setEditingDevice(null);
    setDialogOpen(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteDevice(id);
  };

  const canEditDevice = (device: Device) => {
    return canEdit || device.user_id === user?.id;
  };

  const handleSave = (device: Device) => {
    if (editingDevice) {
      updateDevice(device);
    } else {
      const { id, created_at, updated_at, ...newDevice } = device;
      createDevice(newDevice);
    }
    setDialogOpen(false);
    setEditingDevice(null);
  };

  const hasDevices = devices.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Inventário
          </h1>
          <p className="text-muted-foreground">
            Gerencie o inventário da {organization?.name || "sua empresa"}
          </p>
        </div>
        {canEdit && hasDevices && (
          <Button onClick={handleAdd} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Dispositivo
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : hasDevices ? (
        <>
          
          <DeviceTable
            devices={devices}
            currentUserId={user?.id}
            canEditDevice={canEditDevice}
            onEdit={handleEdit}
            onDelete={canDelete ? handleDelete : undefined}
          />
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum item cadastrado
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Comece adicionando o primeiro item ao inventário da sua empresa
            </p>
            {canEdit && (
              <Button onClick={handleAdd} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Adicionar Dispositivo
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <DeviceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        device={editingDevice}
        onSave={handleSave}
      />
    </div>
  );
};

export default Index;
