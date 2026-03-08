import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";
import { useSkillAreas, useDeleteSkillArea, useReorderSkillAreas, type SkillArea } from "@/hooks/useSkillAreas";
import { useHardSkills, useDeleteHardSkill, useReorderHardSkills, type HardSkillWithArea } from "@/hooks/useHardSkills";
import { useSoftSkills, useDeleteSoftSkill, useReorderSoftSkills, type SoftSkill } from "@/hooks/useSoftSkills";
import { SkillAreaDialog } from "@/components/skills/SkillAreaDialog";
import { HardSkillDialog } from "@/components/skills/HardSkillDialog";
import { SoftSkillDialog } from "@/components/skills/SoftSkillDialog";
import { SortableSkillRow } from "@/components/skills/SortableSkillRow";
import { toast } from "sonner";
import {
  Plus,
  Search,
  FolderOpen,
  Wrench,
  Heart,
  Pencil,
  Trash2,
} from "lucide-react";

const SkillsManagement = () => {
  const navigate = useNavigate();
  const { organization, isLoading: orgLoading } = useRequireOrganization();
  const organizationId = organization?.id;

  // Data queries
  const { data: skillAreas = [], isLoading: areasLoading } = useSkillAreas(organizationId);
  const { data: hardSkills = [], isLoading: hardLoading } = useHardSkills(organizationId);
  const { data: softSkills = [], isLoading: softLoading } = useSoftSkills(organizationId);

  // Delete mutations
  const deleteAreaMutation = useDeleteSkillArea();
  const deleteHardMutation = useDeleteHardSkill();
  const deleteSoftMutation = useDeleteSoftSkill();

  // Reorder mutations
  const reorderAreasMutation = useReorderSkillAreas();
  const reorderHardMutation = useReorderHardSkills();
  const reorderSoftMutation = useReorderSoftSkills();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Dialog states
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [hardDialogOpen, setHardDialogOpen] = useState(false);
  const [softDialogOpen, setSoftDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<SkillArea | null>(null);
  const [editingHard, setEditingHard] = useState<HardSkillWithArea | null>(null);
  const [editingSoft, setEditingSoft] = useState<SoftSkill | null>(null);

  // Delete confirmation states
  const [deleteAreaId, setDeleteAreaId] = useState<string | null>(null);
  const [deleteHardId, setDeleteHardId] = useState<string | null>(null);
  const [deleteSoftId, setDeleteSoftId] = useState<string | null>(null);

  // Filter states
  const [areaSearch, setAreaSearch] = useState("");
  const [hardSearch, setHardSearch] = useState("");
  const [hardAreaFilter, setHardAreaFilter] = useState<string>("all");
  const [softSearch, setSoftSearch] = useState("");

  // Filtered data
  const filteredAreas = skillAreas.filter((area) =>
    area.name.toLowerCase().includes(areaSearch.toLowerCase())
  );

  const filteredHardSkills = hardSkills.filter((skill) => {
    const matchesSearch = skill.name.toLowerCase().includes(hardSearch.toLowerCase());
    const matchesArea =
      hardAreaFilter === "all" ||
      (hardAreaFilter === "none" && !skill.area_id) ||
      skill.area_id === hardAreaFilter;
    return matchesSearch && matchesArea;
  });

  const filteredSoftSkills = softSkills.filter((skill) =>
    skill.name.toLowerCase().includes(softSearch.toLowerCase())
  );

  // Drag handlers
  const handleAreaDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !organizationId) return;

    const oldIndex = filteredAreas.findIndex((a) => a.id === active.id);
    const newIndex = filteredAreas.findIndex((a) => a.id === over.id);
    const reordered = arrayMove(filteredAreas, oldIndex, newIndex);

    const items = reordered.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));

    reorderAreasMutation.mutate({ items, organizationId });
  };

  const handleHardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !organizationId) return;

    const oldIndex = filteredHardSkills.findIndex((s) => s.id === active.id);
    const newIndex = filteredHardSkills.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(filteredHardSkills, oldIndex, newIndex);

    const items = reordered.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));

    reorderHardMutation.mutate({ items, organizationId });
  };

  const handleSoftDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !organizationId) return;

    const oldIndex = filteredSoftSkills.findIndex((s) => s.id === active.id);
    const newIndex = filteredSoftSkills.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(filteredSoftSkills, oldIndex, newIndex);

    const items = reordered.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));

    reorderSoftMutation.mutate({ items, organizationId });
  };

  // Handlers
  const handleEditArea = (area: SkillArea) => {
    setEditingArea(area);
    setAreaDialogOpen(true);
  };

  const handleEditHard = (skill: HardSkillWithArea) => {
    setEditingHard(skill);
    setHardDialogOpen(true);
  };

  const handleEditSoft = (skill: SoftSkill) => {
    setEditingSoft(skill);
    setSoftDialogOpen(true);
  };

  const handleDeleteArea = async () => {
    if (!deleteAreaId || !organizationId) return;
    try {
      await deleteAreaMutation.mutateAsync({ id: deleteAreaId, organizationId });
      toast.success("Área excluída com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir área");
    }
    setDeleteAreaId(null);
  };

  const handleDeleteHard = async () => {
    if (!deleteHardId || !organizationId) return;
    try {
      await deleteHardMutation.mutateAsync({ id: deleteHardId, organizationId });
      toast.success("Hard skill excluída com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir hard skill");
    }
    setDeleteHardId(null);
  };

  const handleDeleteSoft = async () => {
    if (!deleteSoftId || !organizationId) return;
    try {
      await deleteSoftMutation.mutateAsync({ id: deleteSoftId, organizationId });
      toast.success("Soft skill excluída com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir soft skill");
    }
    setDeleteSoftId(null);
  };

  const getHardSkillCount = (areaId: string) =>
    hardSkills.filter((s) => s.area_id === areaId).length;

  if (orgLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/performance-evaluation">Avaliação de Desempenho</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Gestão de Competências</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Gestão de Competências</h1>
          <p className="text-muted-foreground">
            Gerencie as hard skills e soft skills utilizadas nas avaliações de desempenho
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="areas" className="space-y-6">
          <TabsList>
            <TabsTrigger value="areas" className="gap-2">
              Áreas ({skillAreas.length})
            </TabsTrigger>
            <TabsTrigger value="hard" className="gap-2">
              Hard Skills ({hardSkills.length})
            </TabsTrigger>
            <TabsTrigger value="soft" className="gap-2">
              Soft Skills ({softSkills.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Áreas */}
          <TabsContent value="areas" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-medium">Áreas de Atuação</h3>
                  <Button
                    onClick={() => {
                      setEditingArea(null);
                      setAreaDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Área
                  </Button>
                </div>

                {areasLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredAreas.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {areaSearch
                      ? "Nenhuma área encontrada com esse termo"
                      : "Nenhuma área cadastrada. Crie a primeira!"}
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleAreaDragEnd}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>NOME</TableHead>
                          <TableHead>SLUG</TableHead>
                          <TableHead>DESCRIÇÃO</TableHead>
                          <TableHead>STATUS</TableHead>
                          <TableHead className="text-right">AÇÕES</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext
                          items={filteredAreas.map((a) => a.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {filteredAreas.map((area) => (
                            <SortableSkillRow key={area.id} id={area.id}>
                              <TableCell className="font-medium">{area.name}</TableCell>
                              <TableCell>
                                <code className="text-sm bg-muted px-2 py-0.5 rounded">{area.slug}</code>
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-[300px] truncate">
                                {area.description || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={area.is_active ? "default" : "outline"}>
                                  {area.is_active ? "Ativa" : "Inativa"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditArea(area)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteAreaId(area.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </SortableSkillRow>
                          ))}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Hard Skills */}
          <TabsContent value="hard" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-medium">Hard Skills</h3>
                  <div className="flex items-center gap-3">
                    <Select value={hardAreaFilter} onValueChange={setHardAreaFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por área" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as áreas</SelectItem>
                        <SelectItem value="none">Sem área</SelectItem>
                        {skillAreas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        setEditingHard(null);
                        setHardDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Skill
                    </Button>
                  </div>
                </div>

                {hardLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredHardSkills.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {hardSearch || hardAreaFilter !== "all"
                      ? "Nenhuma skill encontrada com esses filtros"
                      : "Nenhuma hard skill cadastrada. Crie a primeira!"}
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleHardDragEnd}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>NOME</TableHead>
                          <TableHead>ÁREA</TableHead>
                          <TableHead className="text-center">JR</TableHead>
                          <TableHead className="text-center">PL</TableHead>
                          <TableHead className="text-center">SR</TableHead>
                          <TableHead>STATUS</TableHead>
                          <TableHead className="text-right">AÇÕES</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext
                          items={filteredHardSkills.map((s) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {filteredHardSkills.map((skill) => (
                            <SortableSkillRow key={skill.id} id={skill.id}>
                              <TableCell className="font-medium">{skill.name}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {skill.skill_areas?.name || "—"}
                              </TableCell>
                              <TableCell className="text-center">{skill.level_junior}</TableCell>
                              <TableCell className="text-center">{skill.level_pleno}</TableCell>
                              <TableCell className="text-center">{skill.level_senior}</TableCell>
                              <TableCell>
                                <Badge variant={skill.is_active ? "default" : "outline"}>
                                  {skill.is_active ? "Ativa" : "Inativa"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditHard(skill)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteHardId(skill.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </SortableSkillRow>
                          ))}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Soft Skills */}
          <TabsContent value="soft" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-medium">Soft Skills</h3>
                  <Button
                    onClick={() => {
                      setEditingSoft(null);
                      setSoftDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Skill
                  </Button>
                </div>

                {softLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredSoftSkills.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {softSearch
                      ? "Nenhuma skill encontrada com esse termo"
                      : "Nenhuma soft skill cadastrada. Crie a primeira!"}
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSoftDragEnd}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>NOME</TableHead>
                          <TableHead className="text-center">JR</TableHead>
                          <TableHead className="text-center">PL</TableHead>
                          <TableHead className="text-center">SR</TableHead>
                          <TableHead>STATUS</TableHead>
                          <TableHead className="text-right">AÇÕES</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext
                          items={filteredSoftSkills.map((s) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {filteredSoftSkills.map((skill) => (
                            <SortableSkillRow key={skill.id} id={skill.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{skill.name}</p>
                                  {skill.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {skill.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{skill.level_junior}</TableCell>
                              <TableCell className="text-center">{skill.level_pleno}</TableCell>
                              <TableCell className="text-center">{skill.level_senior}</TableCell>
                              <TableCell>
                                <Badge variant={skill.is_active ? "default" : "outline"}>
                                  {skill.is_active ? "Ativa" : "Inativa"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditSoft(skill)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteSoftId(skill.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </SortableSkillRow>
                          ))}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {organizationId && (
        <>
          <SkillAreaDialog
            open={areaDialogOpen}
            onOpenChange={setAreaDialogOpen}
            organizationId={organizationId}
            skillArea={editingArea}
          />
          <HardSkillDialog
            open={hardDialogOpen}
            onOpenChange={setHardDialogOpen}
            organizationId={organizationId}
            skillAreas={skillAreas}
            hardSkill={editingHard}
          />
          <SoftSkillDialog
            open={softDialogOpen}
            onOpenChange={setSoftDialogOpen}
            organizationId={organizationId}
            softSkill={editingSoft}
          />
        </>
      )}

      {/* Delete Confirmations */}
      <AlertDialog open={!!deleteAreaId} onOpenChange={() => setDeleteAreaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir área?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as hard skills vinculadas a esta área também
              serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArea}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteHardId} onOpenChange={() => setDeleteHardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir hard skill?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteSoftId} onOpenChange={() => setDeleteSoftId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir soft skill?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSoft}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default SkillsManagement;
