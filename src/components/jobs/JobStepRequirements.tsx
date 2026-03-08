import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { TagsInput } from "@/components/ui/tags-input";
import {
  EDUCATION_LEVEL_LABELS,
  LANGUAGE_OPTIONS,
  LANGUAGE_LEVEL_OPTIONS,
} from "@/constants/jobOptions";
import { useHardSkills } from "@/hooks/useHardSkills";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";
import type { JobFormData, EducationLevel, JobLanguage } from "@/types/job";

interface JobStepRequirementsProps {
  form: UseFormReturn<JobFormData>;
}

export function JobStepRequirements({ form }: JobStepRequirementsProps) {
  const languages = form.watch("languages") || [];
  const { organization } = useRequireOrganization();
  const { data: hardSkills = [] } = useHardSkills(organization?.id);

  // Extract skill names from database for suggestions
  const skillSuggestions = useMemo(() => {
    return hardSkills.map((skill) => skill.name);
  }, [hardSkills]);

  const addLanguage = () => {
    const current = form.getValues("languages") || [];
    form.setValue("languages", [...current, { language: "", level: "intermediate" }]);
  };

  const removeLanguage = (index: number) => {
    const current = form.getValues("languages") || [];
    form.setValue(
      "languages",
      current.filter((_, i) => i !== index)
    );
  };

  const updateLanguage = (index: number, field: keyof JobLanguage, value: string) => {
    const current = form.getValues("languages") || [];
    const updated = [...current];
    updated[index] = { ...updated[index], [field]: value };
    form.setValue("languages", updated);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Requisitos da Vaga</h2>
        <p className="text-muted-foreground">
          Defina as habilidades e qualificações necessárias
        </p>
      </div>

      <div className="grid gap-6">
        {/* Required Skills */}
        <FormField
          control={form.control}
          name="required_skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Habilidades Obrigatórias *</FormLabel>
              <FormControl>
                <TagsInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Digite e pressione Enter..."
                  suggestions={skillSuggestions}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Desired Skills */}
        <FormField
          control={form.control}
          name="desired_skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Habilidades Desejáveis</FormLabel>
              <FormControl>
                <TagsInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="Digite e pressione Enter..."
                  suggestions={skillSuggestions}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Experience and Education */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="experience_years"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anos de Experiência</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Ex: 3"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? null : parseInt(val));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="education_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Escolaridade Mínima</FormLabel>
                <Select
                  value={field.value || "_none"}
                  onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">Não especificado</SelectItem>
                    {(Object.entries(EDUCATION_LEVEL_LABELS) as [EducationLevel, string][]).map(
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

        {/* Languages */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>Idiomas</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={addLanguage}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Idioma
            </Button>
          </div>

          {languages.length > 0 && (
            <div className="space-y-2">
              {languages.map((lang, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={lang.language || "_none"}
                    onValueChange={(v) => updateLanguage(index, "language", v === "_none" ? "" : v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Selecione</SelectItem>
                      {LANGUAGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={lang.level || "intermediate"}
                    onValueChange={(v) => updateLanguage(index, "level", v)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_LEVEL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLanguage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Requirements */}
        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requisitos Adicionais</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Outros requisitos não listados acima..."
                  className="min-h-[150px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
