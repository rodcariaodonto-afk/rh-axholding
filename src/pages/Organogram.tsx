import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useEmployees, Employee } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ZoomIn, ZoomOut, ImageDown } from "lucide-react";
import { OrgChartTree, OrgTreeNode } from "@/components/organogram/OrgChartTree";
import { toast } from "sonner";

const buildOrgTree = (employees: Employee[]): OrgTreeNode[] => {
  const activeEmployees = employees.filter((e) => e.status === "active");
  const employeeMap = new Map(activeEmployees.map((e) => [e.id, e]));
  const childrenMap = new Map<string | null, Employee[]>();

  activeEmployees.forEach((emp) => {
    const managerId = emp.manager_id || null;
    if (!childrenMap.has(managerId)) {
      childrenMap.set(managerId, []);
    }
    childrenMap.get(managerId)!.push(emp);
  });

  const buildNode = (employee: Employee): OrgTreeNode => {
    const children = childrenMap.get(employee.id) || [];
    return {
      employee,
      children: children
        .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""))
        .map(buildNode),
    };
  };

  const roots = activeEmployees.filter(
    (e) => !e.manager_id || !employeeMap.has(e.manager_id)
  );

  return roots
    .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""))
    .map(buildNode);
};

const getAllNodeIds = (nodes: OrgTreeNode[]): string[] => {
  return nodes.flatMap((node) => [
    node.employee.id,
    ...getAllNodeIds(node.children),
  ]);
};

const getInitialExpandedNodes = (nodes: OrgTreeNode[]): Set<string> => {
  const expanded = new Set<string>();
  nodes.forEach((root) => {
    expanded.add(root.employee.id);
    root.children.forEach((child) => {
      expanded.add(child.employee.id);
    });
  });
  return expanded;
};

const countAllDescendants = (node: OrgTreeNode): number => {
  return node.children.length + node.children.reduce((acc, child) => acc + countAllDescendants(child), 0);
};

const filterTreeByDepartment = (nodes: OrgTreeNode[], departmentId: string): OrgTreeNode[] => {
  const filterNode = (node: OrgTreeNode): OrgTreeNode | null => {
    const matchesDept = node.employee.department_id === departmentId;
    const filteredChildren = node.children
      .map(filterNode)
      .filter((n): n is OrgTreeNode => n !== null);

    if (matchesDept || filteredChildren.length > 0) {
      return { employee: node.employee, children: filteredChildren };
    }
    return null;
  };

  return nodes.map(filterNode).filter((n): n is OrgTreeNode => n !== null);
};

const Organogram = () => {
  const { data: employees = [], isLoading } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const treeRef = useRef<HTMLDivElement>(null);

  const orgTree = useMemo(() => buildOrgTree(employees), [employees]);

  const displayTree = useMemo(() => {
    if (departmentFilter === "all") return orgTree;
    return filterTreeByDepartment(orgTree, departmentFilter);
  }, [orgTree, departmentFilter]);

  useEffect(() => {
    if (orgTree.length > 0 && !hasInitialized) {
      setExpandedNodes(getInitialExpandedNodes(orgTree));
      setHasInitialized(true);
    }
  }, [orgTree, hasInitialized]);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedNodes(new Set(getAllNodeIds(displayTree)));
  const collapseAll = () => setExpandedNodes(new Set());
  const handleSelectNode = (employeeId: string) => setSelectedId(employeeId);

  const totalEmployees = employees.filter((e) => e.status === "active").length;
  const totalInTree = displayTree.reduce((acc, node) => acc + 1 + countAllDescendants(node), 0);

  const handleExportPng = useCallback(async () => {
    if (!treeRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas" as any).catch(() => ({ default: null }));
      if (!html2canvas) {
        toast.error("Exportação PNG não disponível");
        return;
      }
      const canvas = await html2canvas(treeRef.current, { backgroundColor: null, scale: 2 });
      const link = document.createElement("a");
      link.download = "organograma.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Organograma exportado!");
    } catch {
      toast.error("Erro ao exportar organograma");
    }
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Organograma</h1>
            <p className="text-muted-foreground">
              Visualize a estrutura hierárquica da empresa
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {departmentFilter === "all" ? `${totalEmployees} colaboradores ativos` : `${totalInTree} exibidos`}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os departamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ZoomIn className="h-4 w-4 mr-1" />
            Expandir tudo
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ZoomOut className="h-4 w-4 mr-1" />
            Recolher tudo
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPng}>
            <ImageDown className="h-4 w-4 mr-1" />
            Exportar PNG
          </Button>
          {selectedId && (
            <Button variant="default" size="sm" asChild>
              <Link to={`/employees/${selectedId}`}>Ver perfil</Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center gap-8 pt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-4">
                <Skeleton className="h-24 w-52 rounded-lg" />
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-44 rounded-lg" />
                  <Skeleton className="h-20 w-44 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : displayTree.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum colaborador encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {departmentFilter !== "all"
                ? "Nenhum colaborador neste departamento. Tente outro filtro."
                : "Adicione colaboradores e defina seus gestores para visualizar o organograma."}
            </p>
          </Card>
        ) : (
          <ScrollArea className="w-full">
            <div className="p-4 min-w-max" ref={treeRef}>
              <OrgChartTree
                nodes={displayTree}
                expandedNodes={expandedNodes}
                onToggleNode={toggleNode}
                selectedId={selectedId}
                onSelectNode={handleSelectNode}
              />
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>
    </Layout>
  );
};

export default Organogram;
