import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
  AVAILABLE_BENEFITS,
} from "@/hooks/useOrganizationSettings";

interface SetupBenefitsFormProps {
  onComplete: () => void;
}

export function SetupBenefitsForm({ onComplete }: SetupBenefitsFormProps) {
  const { data: org } = useOrganizationSettings();
  const { mutateAsync: updateOrg, isPending } = useUpdateOrganizationSettings();

  const [benefits, setBenefits] = useState<string[]>(org?.benefits || []);

  const isValid = benefits.length >= 1;

  const toggleBenefit = (benefit: string) => {
    setBenefits((prev) =>
      prev.includes(benefit)
        ? prev.filter((b) => b !== benefit)
        : [...prev, benefit]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    await updateOrg({ benefits });
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label>Benefícios Oferecidos *</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Selecione pelo menos 1 benefício que sua empresa oferece.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AVAILABLE_BENEFITS.map((benefit) => (
            <div key={benefit} className="flex items-center space-x-2">
              <Checkbox
                id={`benefit-${benefit}`}
                checked={benefits.includes(benefit)}
                onCheckedChange={() => toggleBenefit(benefit)}
              />
              <label
                htmlFor={`benefit-${benefit}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {benefit}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onComplete}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid || isPending}>
          {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
          Salvar ({benefits.length} selecionados)
        </Button>
      </div>
    </form>
  );
}
