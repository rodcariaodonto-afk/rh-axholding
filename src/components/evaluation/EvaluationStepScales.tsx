import { UseFormReturn } from "react-hook-form";
import { EvaluationFormData, ScaleLabelType } from "@/types/evaluation";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SCALE_LABEL_OPTIONS } from "@/constants/evaluationOptions";
import { ScalePreview } from "./ScalePreview";

interface EvaluationStepScalesProps {
  form: UseFormReturn<EvaluationFormData>;
}

export function EvaluationStepScales({ form }: EvaluationStepScalesProps) {
  const scaleLevels = form.watch("scale_levels");
  const scaleLabelType = form.watch("scale_label_type");
  const customLabels = form.watch("custom_labels");

  const selectedOption = SCALE_LABEL_OPTIONS.find(opt => opt.id === scaleLabelType);
  const currentLabels = scaleLabelType === 'custom'
    ? customLabels
    : (scaleLevels === 5 ? selectedOption?.labels5 : selectedOption?.labels4) || [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scale Configuration */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Níveis de Escala</h3>
            <p className="text-sm text-muted-foreground">Escolha quantos níveis terá a escala de avaliação</p>
          </div>

          <div className="space-y-6">
            <FormField control={form.control} name="scale_levels" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup value={String(field.value)} onValueChange={(val) => field.onChange(Number(val) as 4 | 5)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5" id="scale-5" />
                      <Label htmlFor="scale-5" className="cursor-pointer">5 estrelas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="4" id="scale-4" />
                      <Label htmlFor="scale-4" className="cursor-pointer">4 estrelas</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="scale_label_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Opções de Rótulos</FormLabel>
                <Select value={field.value} onValueChange={(val) => field.onChange(val as ScaleLabelType)}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo de rótulo" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SCALE_LABEL_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Os rótulos serão exibidos para cada nível da escala</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            {scaleLabelType === 'custom' && (
              <div className="space-y-3">
                <Label>Rótulos Personalizados</Label>
                {Array.from({ length: scaleLevels }, (_, i) => (
                  <FormField key={i} control={form.control} name={`custom_labels.${i}`} render={({ field }) => (
                    <FormItem>
                      <FormControl><Input placeholder={`Nível ${i + 1}`} {...field} /></FormControl>
                    </FormItem>
                  )} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Preview</h3>
            <p className="text-sm text-muted-foreground">Visualize como a escala será exibida</p>
          </div>
          <div className="rounded-lg border p-6">
            <ScalePreview levels={scaleLevels} labels={currentLabels as string[]} />
          </div>
        </div>
      </div>

      {/* Comments Configuration */}
      <div className="border-t pt-8 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Configuração de Comentários</h3>
          <p className="text-sm text-muted-foreground">Defina se os avaliadores podem/devem adicionar comentários</p>
        </div>

        <FormField control={form.control} name="require_competency_comments" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Comentários por competência</FormLabel>
              <FormDescription>Permitir comentários para cada competência avaliada</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )} />

        {form.watch("require_competency_comments") && (
          <FormField control={form.control} name="competency_comments_required" render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 ml-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Tornar comentários obrigatórios</FormLabel>
                <FormDescription>Avaliadores devem preencher comentários em cada competência</FormDescription>
              </div>
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="require_general_comments" render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Comentários gerais obrigatórios</FormLabel>
              <FormDescription>Exigir um comentário geral ao final da avaliação</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )} />
      </div>
    </div>
  );
}
