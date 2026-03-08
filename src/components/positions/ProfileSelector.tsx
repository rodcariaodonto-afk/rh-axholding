import { profiles, type Profile } from "@/lib/profiler/profiles";
import { FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileSelectorProps {
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function ProfileSelector({ value, onChange }: ProfileSelectorProps) {
  const selectedProfile = value ? profiles[value] : null;
  const profileOptions = Object.values(profiles);

  return (
    <FormItem>
      <FormLabel>Perfil Comportamental Esperado (DISC)</FormLabel>
      <Select
        onValueChange={(val) => onChange(val === "none" ? undefined : val)}
        value={value || "none"}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione o perfil esperado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Nenhum perfil definido</SelectItem>
          {profileOptions.map((profile) => (
            <SelectItem key={profile.code} value={profile.code}>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: profile.color }}
                />
                <span>{profile.name}</span>
                <span className="text-muted-foreground text-xs">({profile.code})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription>
        Defina o perfil comportamental ideal para este cargo
      </FormDescription>

      {selectedProfile && (
        <Card className="mt-4">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedProfile.color }}
              />
              <div>
                <h4 className="font-semibold">{selectedProfile.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedProfile.subcategory}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Habilidades Básicas</p>
              <div className="flex flex-wrap gap-1">
                {selectedProfile.basicSkills.split(", ").map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Resumo</p>
              <p className="text-sm text-muted-foreground">{selectedProfile.summary}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Principais Vantagens</p>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {selectedProfile.mainAdvantages.substring(0, 300)}...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </FormItem>
  );
}
