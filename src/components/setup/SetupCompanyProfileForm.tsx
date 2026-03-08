import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
} from "@/hooks/useOrganizationSettings";

interface SetupCompanyProfileFormProps {
  onComplete: () => void;
}

export function SetupCompanyProfileForm({ onComplete }: SetupCompanyProfileFormProps) {
  const { data: org } = useOrganizationSettings();
  const { mutateAsync: updateOrg, isPending } = useUpdateOrganizationSettings();

  const [description, setDescription] = useState(org?.description || "");

  const isValid = description.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    await updateOrg({ description });
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="company-description">Descrição *</Label>
        <Textarea
          id="company-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva brevemente o que sua empresa faz..."
          rows={3}
        />
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
