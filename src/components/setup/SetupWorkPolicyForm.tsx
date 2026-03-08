import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  WORK_POLICIES,
} from "@/hooks/useOrganizationSettings";

interface SetupWorkPolicyFormProps {
  onComplete: () => void;
}

export function SetupWorkPolicyForm({ onComplete }: SetupWorkPolicyFormProps) {
  const { data: org } = useOrganizationSettings();
  const { mutateAsync: updateOrg, isPending } = useUpdateOrganizationSettings();

  const [workPolicy, setWorkPolicy] = useState(org?.work_policy || "");

  const isValid = !!workPolicy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    await updateOrg({ work_policy: workPolicy });
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="work-policy">Política de Trabalho *</Label>
        <Select value={workPolicy} onValueChange={setWorkPolicy}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a política" />
          </SelectTrigger>
          <SelectContent>
            {WORK_POLICIES.map((policy) => (
              <SelectItem key={policy.value} value={policy.value}>
                {policy.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Isso define como sua equipe trabalha: totalmente remoto, híbrido ou presencial.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onComplete}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid || isPending}>
          {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
          Salvar
        </Button>
      </div>
    </form>
  );
}
