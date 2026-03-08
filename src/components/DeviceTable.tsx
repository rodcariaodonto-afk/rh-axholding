import { useState, useMemo } from "react";
import { Pencil, Trash2, ArrowUpDown, Search, Check, X, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Device, DeviceType, DeviceStatus } from "@/types/device";
import { DEVICE_TYPE_LABELS, DEVICE_TYPE_ICONS, DEVICE_STATUS_LABELS, DEVICE_STATUS_VARIANTS } from "@/constants/device";

interface DeviceTableProps {
  devices: Device[];
  onEdit?: (device: Device) => void;
  onDelete?: (id: string) => void;
  currentUserId?: string;
  canEditDevice?: (device: Device) => boolean;
}

type SortField = keyof Device | null;
type SortDirection = "asc" | "desc";

const DeviceTable = ({ devices, onEdit, onDelete, currentUserId, canEditDevice }: DeviceTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<DeviceType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "all">("all");
  const [showOnlyMyDevices, setShowOnlyMyDevices] = useState(false);
  const [sortField, setSortField] = useState<SortField>("user_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: keyof Device) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedDevices = useMemo(() => {
    let filtered = devices.filter((device) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        device.user_name.toLowerCase().includes(searchLower) ||
        device.model.toLowerCase().includes(searchLower) ||
        device.year.toString().includes(searchLower) ||
        (device.processor && device.processor.toLowerCase().includes(searchLower)) ||
        (device.serial && device.serial.toLowerCase().includes(searchLower)) ||
        (device.notes && device.notes.toLowerCase().includes(searchLower)) ||
        DEVICE_TYPE_LABELS[device.device_type].toLowerCase().includes(searchLower) ||
        DEVICE_STATUS_LABELS[device.status].toLowerCase().includes(searchLower);
      
      const matchesType = typeFilter === "all" || device.device_type === typeFilter;
      const matchesStatus = statusFilter === "all" || device.status === statusFilter;
      const matchesOwner = !showOnlyMyDevices || device.user_id === currentUserId;
      
      return matchesSearch && matchesType && matchesStatus && matchesOwner;
    });

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    return filtered;
  }, [devices, searchTerm, typeFilter, statusFilter, showOnlyMyDevices, currentUserId, sortField, sortDirection]);

  const SortableHeader = ({
    field,
    children,
  }: {
    field: keyof Device;
    children: React.ReactNode;
  }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(field)}
        className="h-8 px-2 hover:bg-accent"
      >
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar dispositivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchTerm("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                title="Limpar busca"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as DeviceType | "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(DEVICE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DeviceStatus | "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(DEVICE_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={showOnlyMyDevices ? "my" : "all"} onValueChange={(value) => setShowOnlyMyDevices(value === "my")}>
            <SelectTrigger>
              <SelectValue placeholder="Meus dispositivos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os dispositivos</SelectItem>
              <SelectItem value="my">Meus dispositivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <SortableHeader field="user_name">Responsável</SortableHeader>
              <SortableHeader field="model">Modelo</SortableHeader>
              <SortableHeader field="year">Ano</SortableHeader>
              <TableHead>Especificações</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Garantia</TableHead>
              <SortableHeader field="notes">Observações</SortableHeader>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Nenhum dispositivo encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedDevices.map((device) => {
                const Icon = DEVICE_TYPE_ICONS[device.device_type];
                
                const renderSpecs = () => {
                  if (device.device_type === 'computer') {
                    return (
                      <div className="space-y-1 text-sm">
                        {device.processor && <div>CPU: {device.processor}</div>}
                        {device.ram && <div>RAM: {device.ram}GB</div>}
                        {device.disk && <div>Disco: {device.disk}GB</div>}
                        {device.screen_size && <div>Tela: {device.screen_size}"</div>}
                        {device.hexnode_registered && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="h-3 w-3" /> Hexnode
                          </div>
                        )}
                      </div>
                    );
                  } else if (device.device_type === 'monitor' && device.screen_size) {
                    return <div className="text-sm">Tela: {device.screen_size}"</div>;
                  }
                  return <span className="text-muted-foreground">-</span>;
                };
                
                return (
                  <TableRow key={device.id}>
                  <TableCell>
                      <Icon className="h-5 w-5 text-muted-foreground" title={DEVICE_TYPE_LABELS[device.device_type]} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={DEVICE_STATUS_VARIANTS[device.status]}>
                        {DEVICE_STATUS_LABELS[device.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{device.user_name}</TableCell>
                    <TableCell>{device.model}</TableCell>
                    <TableCell>{device.year}</TableCell>
                    <TableCell>{renderSpecs()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {device.serial || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {device.warranty_date ? (() => {
                        const [year, month, day] = device.warranty_date.split('-');
                        return `${day}/${month}/${year}`;
                      })() : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {device.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {(onEdit || onDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEdit && (canEditDevice ? canEditDevice(device) : true) && (
                              <DropdownMenuItem onClick={() => onEdit(device)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem
                                onClick={() => onDelete(device.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={10} className="text-center font-medium">
                Total: {filteredAndSortedDevices.length} {filteredAndSortedDevices.length === 1 ? 'dispositivo' : 'dispositivos'}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </Card>
  );
};

export default DeviceTable;
