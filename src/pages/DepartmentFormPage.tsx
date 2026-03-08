import { useParams, Link } from "react-router-dom";
import { DepartmentForm } from "@/components/DepartmentForm";
import { useDepartmentById } from "@/hooks/useDepartmentById";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function DepartmentFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const { data: department, isLoading } = useDepartmentById(id);

  return (
    <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/departments">Departamentos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isEditing ? "Editar Departamento" : "Novo Departamento"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <DepartmentForm 
          department={department} 
          isLoading={isEditing && isLoading} 
        />
    </div>
  );
}
