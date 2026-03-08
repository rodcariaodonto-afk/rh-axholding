import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { OrgChartNode } from "./OrgChartNode";
import type { Employee } from "@/hooks/useEmployees";

export interface OrgTreeNode {
  employee: Employee;
  children: OrgTreeNode[];
}

interface OrgChartTreeProps {
  nodes: OrgTreeNode[];
  expandedNodes: Set<string>;
  onToggleNode: (id: string) => void;
  selectedId: string | null;
  onSelectNode: (id: string) => void;
  depth?: number;
  isFirst?: boolean;
  isLast?: boolean;
}

interface OrgChartBranchProps {
  node: OrgTreeNode;
  expandedNodes: Set<string>;
  onToggleNode: (id: string) => void;
  selectedId: string | null;
  onSelectNode: (id: string) => void;
  depth: number;
  isFirst: boolean;
  isLast: boolean;
  siblingCount: number;
}

function OrgChartBranch({
  node,
  expandedNodes,
  onToggleNode,
  selectedId,
  onSelectNode,
  depth,
  isFirst,
  isLast,
  siblingCount,
}: OrgChartBranchProps) {
  const isExpanded = expandedNodes.has(node.employee.id);
  const hasChildren = node.children.length > 0;

  return (
    <li className="org-tree-node">
      {/* Connector from parent - vertical line down */}
      {depth > 0 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-border" />
      )}

      {/* Horizontal connector between siblings */}
      {depth > 0 && siblingCount > 1 && (
        <div
          className="absolute top-0 h-px bg-border"
          style={{
            left: isFirst ? "50%" : "0",
            right: isLast ? "50%" : "0",
          }}
        />
      )}

      {/* Node card */}
      <div className="relative flex flex-col items-center">
        <OrgChartNode
          employee={node.employee}
          childCount={node.children.length}
          depth={depth}
          isSelected={selectedId === node.employee.id}
          onClick={() => onSelectNode(node.employee.id)}
        />

        {/* Expand/collapse button */}
        {hasChildren && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 text-xs gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onToggleNode(node.employee.id);
            }}
          >
            {isExpanded ? (
              <>
                <ChevronDown className="h-3 w-3" />
                Recolher
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3" />
                {node.children.length}
              </>
            )}
          </Button>
        )}

        {/* Vertical connector to children */}
        {hasChildren && isExpanded && (
          <div className="w-px h-6 bg-border" />
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <ul className="org-tree-children">
          {node.children.map((child, index) => (
            <OrgChartBranch
              key={child.employee.id}
              node={child}
              expandedNodes={expandedNodes}
              onToggleNode={onToggleNode}
              selectedId={selectedId}
              onSelectNode={onSelectNode}
              depth={depth + 1}
              isFirst={index === 0}
              isLast={index === node.children.length - 1}
              siblingCount={node.children.length}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrgChartTree({
  nodes,
  expandedNodes,
  onToggleNode,
  selectedId,
  onSelectNode,
  depth = 0,
}: OrgChartTreeProps) {
  if (nodes.length === 0) return null;

  return (
    <ul className="org-tree-root">
      {nodes.map((node, index) => (
        <OrgChartBranch
          key={node.employee.id}
          node={node}
          expandedNodes={expandedNodes}
          onToggleNode={onToggleNode}
          selectedId={selectedId}
          onSelectNode={onSelectNode}
          depth={depth}
          isFirst={index === 0}
          isLast={index === nodes.length - 1}
          siblingCount={nodes.length}
        />
      ))}
    </ul>
  );
}
