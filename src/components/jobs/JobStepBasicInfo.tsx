import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useDepartments } from "@/hooks/useDepartments";
import { useUnits } from "@/hooks/useUnits";
import { usePositions } from "@/hooks/usePositions";
import { useCreateUnit } from "@/hooks/useCreateUnit";
import { useBrazilianCities } from "@/hooks/useBrazilianCities";
import {
  WORK_MODEL_LABELS,
  CONTRACT_TYPE_LABELS,
  JOB_SENIORITY_LABELS,
} from "@/constants/jobOptions";
import { BRAZILIAN_STATES } from "@/constants/brazilData";
import type { JobFormData, WorkModel, JobContractType, JobSeniority } from "@/types/job";

interface JobStepBasicInfoProps {
  form: UseFormReturn<JobFormData>;
}

export function JobStepBasicInfo({ form }: JobStepBasicInfoProps) {
  const { data: departments } = useDepartments();
  const { data: units } = useUnits();
  const { data: positions } = usePositions();
  const createUnit = useCreateUnit();

  const [showNewUnit, setShowNewUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitCity, setNewUnitCity] = useState("");
  const [newUnitState, setNewUnitState] = useState("");
  const { cities, isLoading: citiesLoading } = useBrazilianCities(newUnitState || undefined);

  const handleCreateUnit = async () => {
    if (!newUnitName.trim() || !newUnitCity.trim() || !newUnitState.trim()) return;
    const result = await createUnit.mutateAsync({
      name: newUnitName,
      city: newUnitCity,
      state: newUnitState,
    });
    form.setValue("unit_id", result.id);
    setShowNewUnit(false);
    setNewUnitName("");
    setNewUnitCity("");
    setNewUnitState("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Informações Básicas</h2>
        <p className="text-muted-foreground">
          Preencha os dados principais da vaga
        </p>
      </div>

      <div className="grid gap-6">
        {/* Title and Openings Count */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título da Vaga *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Desenvolvedor Frontend Pleno"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="openings_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Vagas *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Position and Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="position_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <Select
                  value={field.value || "_none"}
                  onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">Nenhum</SelectItem>
                    {positions?.map((position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento *</FormLabel>
                <Select
                  value={field.value || "_none"}
                  onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um departamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">Nenhum</SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Unit and Work Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localização/Unidade</FormLabel>
                <div className="flex gap-2">
                  <Select
                    value={field.value || "_none"}
                    onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma unidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_none">Não especificado</SelectItem>
                      {units?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} {unit.city && `(${unit.city})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setShowNewUnit(true)}
                    title="Criar nova unidade"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="work_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo de Trabalho *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.entries(WORK_MODEL_LABELS) as [WorkModel, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contract Type and Seniority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contract_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Contrato *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.entries(CONTRACT_TYPE_LABELS) as [JobContractType, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seniority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senioridade *</FormLabel>
                <Select
                  value={field.value || "_none"}
                  onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a senioridade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">Não especificado</SelectItem>
                    {(Object.entries(JOB_SENIORITY_LABELS) as [JobSeniority, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Dialog de criação de unidade */}
      <Dialog open={showNewUnit} onOpenChange={setShowNewUnit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Unidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit-name">Nome *</Label>
              <Input
                id="unit-name"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="Ex: Escritório São Paulo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit-state">Estado *</Label>
                <Select value={newUnitState} onValueChange={(v) => { setNewUnitState(v); setNewUnitCity(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-city">Cidade *</Label>
                <Select
                  value={newUnitCity}
                  onValueChange={setNewUnitCity}
                  disabled={!newUnitState || citiesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={citiesLoading ? "Carregando..." : !newUnitState ? "Selecione o estado primeiro" : "Selecione a cidade"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewUnit(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUnit}
              disabled={createUnit.isPending || !newUnitName.trim() || !newUnitCity.trim() || !newUnitState.trim()}
            >
              {createUnit.isPending ? "Criando..." : "Criar Unidade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
