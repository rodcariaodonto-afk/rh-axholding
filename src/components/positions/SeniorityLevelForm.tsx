import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { seniorityLevelLabels, type SeniorityLevel } from "@/hooks/usePositionSeniorityLevels";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface SeniorityLevelFormData {
  enabled: boolean;
  description: string;
  salary_min?: number;
  salary_max?: number;
  required_skills: Array<{ name: string; level: string }>;
  required_soft_skills: Array<{ name: string; level: string }>;
  notes: string;
}

interface SeniorityLevelFormProps {
  seniority: SeniorityLevel;
  data?: SeniorityLevelFormData;
  onChange: (data: SeniorityLevelFormData) => void;
}

export function SeniorityLevelForm({ seniority, data, onChange }: SeniorityLevelFormProps) {
  const [isOpen, setIsOpen] = useState(data?.enabled ?? false);
  
  const formData: SeniorityLevelFormData = data || {
    enabled: false,
    description: "",
    salary_min: undefined,
    salary_max: undefined,
    required_skills: [],
    required_soft_skills: [],
    notes: "",
  };

  const handleEnabledChange = (enabled: boolean) => {
    setIsOpen(enabled);
    onChange({ ...formData, enabled });
  };

  const handleFieldChange = <K extends keyof SeniorityLevelFormData>(
    field: K,
    value: SeniorityLevelFormData[K]
  ) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <Card className={!formData.enabled ? "opacity-60" : ""}>
      <Collapsible open={isOpen && formData.enabled} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 rounded-t-lg">
            <div className="flex items-center gap-4">
              <Switch
                checked={formData.enabled}
                onCheckedChange={handleEnabledChange}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="font-medium">{seniorityLevelLabels[seniority]}</span>
            </div>
            {formData.enabled && (
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${seniority}-salary-min`}>Salário Mínimo (R$)</Label>
                <Input
                  id={`${seniority}-salary-min`}
                  type="number"
                  placeholder="0,00"
                  value={formData.salary_min || ""}
                  onChange={(e) => handleFieldChange("salary_min", e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${seniority}-salary-max`}>Salário Máximo (R$)</Label>
                <Input
                  id={`${seniority}-salary-max`}
                  type="number"
                  placeholder="0,00"
                  value={formData.salary_max || ""}
                  onChange={(e) => handleFieldChange("salary_max", e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${seniority}-description`}>Descrição do Nível</Label>
              <Textarea
                id={`${seniority}-description`}
                placeholder={`Descrição específica para o nível ${seniorityLevelLabels[seniority]}...`}
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${seniority}-notes`}>Observações</Label>
              <Textarea
                id={`${seniority}-notes`}
                placeholder="Observações adicionais..."
                value={formData.notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
