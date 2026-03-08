import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Device } from "@/types/device";

interface DeviceChartsProps {
  devices: Device[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const DeviceCharts = ({ devices }: DeviceChartsProps) => {
  // Filtrar apenas computadores
  const computers = devices.filter(device => device.device_type === 'computer');

  // RAM distribution
  const ramData = computers
    .filter(device => device.ram) // Apenas dispositivos com RAM definida
    .reduce((acc, device) => {
      const existing = acc.find((item) => item.ram === device.ram);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ ram: device.ram!, count: 1 });
      }
      return acc;
    }, [] as { ram: number; count: number }[])
    .sort((a, b) => a.ram - b.ram);

  // Disk distribution
  const diskData = computers
    .filter(device => device.disk) // Apenas dispositivos com disco definido
    .reduce((acc, device) => {
      const existing = acc.find((item) => item.disk === device.disk);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ disk: device.disk!, count: 1 });
      }
      return acc;
    }, [] as { disk: number; count: number }[])
    .sort((a, b) => a.disk - b.disk);

  // Screen size distribution
  const screenData = computers.reduce((acc, device) => {
    let size = "Mini";
    if (device.model.includes('13"')) size = '13"';
    else if (device.model.includes('16"')) size = '16"';
    
    const existing = acc.find((item) => item.size === size);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ size, count: 1 });
    }
    return acc;
  }, [] as { size: string; count: number }[]);

  // Processor distribution
  const processorData = computers
    .filter(device => device.processor) // Apenas dispositivos com processador definido
    .reduce((acc, device) => {
      const existing = acc.find((item) => item.processor === device.processor);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ processor: device.processor!, count: 1 });
      }
      return acc;
    }, [] as { processor: string; count: number }[]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de RAM</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="ram"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `${value} GB`}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelFormatter={(value) => `${value} GB`}
              />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Disco</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={diskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="disk"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => `${value} GB`}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelFormatter={(value) => `${value} GB`}
              />
              <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Tamanho de Tela</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={screenData}
                dataKey="count"
                nameKey="size"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {screenData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Geração do Processador</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={processorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="processor" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceCharts;
