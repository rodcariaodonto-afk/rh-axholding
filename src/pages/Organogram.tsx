import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useEmployees, Employee } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users, ZoomIn, ZoomOut } from "lucide-react";
import { OrgChartTree, OrgTreeNode } from "@/components/organogram/OrgChartTree";

const buildOrgTree = (employees: Employee[]): OrgTreeNode[] => {
  const activeEmployees = employees.filter((e) => e.status === "active");
  const employeeMap = new Map(activeEmployees.map((e) => [e.id, e]));
  const childrenMap = new Map<string | null, Employee[]>();

  // Group employees by manager_id
  activeEmployees.forEach((emp) => {
    const managerId = emp.manager_id || null;
    if (!childrenMap.has(managerId)) {
      childrenMap.set(managerId, []);
    }
    childrenMap.get(managerId)!.push(emp);
  });

  // Build tree recursively
  const buildNode = (employee: Employee): OrgTreeNode => {
    const children = childrenMap.get(employee.id) || [];
    return {
      employee,
      children: children
        .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""))
        .map(buildNode),
    };
  };

  // Get root nodes (employees without manager or with manager not in active list)
  const roots = activeEmployees.filter(
    (e) => !e.manager_id || !employeeMap.has(e.manager_id)
  );

  return roots
    .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""))
    .map(buildNode);
};

// Get all node IDs for expand all functionality
const getAllNodeIds = (nodes: OrgTreeNode[]): string[] => {
  return nodes.flatMap((node) => [
    node.employee.id,
    ...getAllNodeIds(node.children),
  ]);
};

// Get first two levels for auto-expansion
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

const Organogram = () => {
  const { data: employees = [], isLoading } = useEmployees();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const orgTree = useMemo(() => buildOrgTree(employees), [employees]);

  // Auto-expand first two levels on initial load
  useEffect(() => {
    if (orgTree.length > 0 && !hasInitialized) {
      setExpandedNodes(getInitialExpandedNodes(orgTree));
      setHasInitialized(true);
    }
  }, [orgTree, hasInitialized]);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = getAllNodeIds(orgTree);
    setExpandedNodes(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handleSelectNode = (employeeId: string) => {
    setSelectedId(employeeId);
  };

  const totalEmployees = employees.filter((e) => e.status === "active").length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
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
              {totalEmployees} colaboradores ativos
            </Badge>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ZoomIn className="h-4 w-4 mr-1" />
            Expandir tudo
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ZoomOut className="h-4 w-4 mr-1" />
            Recolher tudo
          </Button>
          {selectedId && (
            <Button variant="default" size="sm" asChild>
              <Link to={`/employees/${selectedId}`}>Ver perfil</Link>
            </Button>
          )}
        </div>

        {/* Tree */}
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
        ) : orgTree.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum colaborador encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Adicione colaboradores e defina seus gestores para visualizar o
              organograma.
            </p>
          </Card>
        ) : (
          <ScrollArea className="w-full">
            <div className="p-4 min-w-max">
              <OrgChartTree
                nodes={orgTree}
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
