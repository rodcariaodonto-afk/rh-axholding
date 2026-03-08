import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCompanyCostSettings } from "@/hooks/useCompanyCostSettings";

export const CompanyCostSettingsPanel = () => {
  const { settings, updateSettings, isUpdating } = useCompanyCostSettings();
  const [open, setOpen] = useState(false);

  const [localSettings, setLocalSettings] = useState({
    rat_rate: settings?.rat_rate || 1.00,
    system_s_rate: settings?.system_s_rate || 5.80,
    inss_employer_rate: settings?.inss_employer_rate || 20.00,
    fgts_rate: settings?.fgts_rate || 8.00,
    enable_severance_provision: settings?.enable_severance_provision || false,
  });

  // Atualizar localSettings quando settings mudar
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        rat_rate: settings.rat_rate,
        system_s_rate: settings.system_s_rate,
        inss_employer_rate: settings.inss_employer_rate,
        fgts_rate: settings.fgts_rate,
        enable_severance_provision: settings.enable_severance_provision,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Configurar Parâmetros
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Parâmetros de Custo</SheetTitle>
          <SheetDescription>
            Configure os percentuais de encargos e provisões utilizados nos cálculos.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* RAT% */}
          <div className="space-y-2">
            <Label htmlFor="rat_rate">RAT (Risco Ambiental do Trabalho) %</Label>
            <Input
              id="rat_rate"
              type="number"
              step="0.01"
              value={localSettings.rat_rate}
              onChange={(e) => setLocalSettings({ ...localSettings, rat_rate: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Padrão: 1% para CNAE 62.01-5-01
            </p>
          </div>

          {/* Sistema S% */}
          <div className="space-y-2">
            <Label htmlFor="system_s_rate">Sistema S %</Label>
            <Input
              id="system_s_rate"
              type="number"
              step="0.01"
              value={localSettings.system_s_rate}
              onChange={(e) => setLocalSettings({ ...localSettings, system_s_rate: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Padrão: 5,8%
            </p>
          </div>

          {/* INSS Patronal% */}
          <div className="space-y-2">
            <Label htmlFor="inss_employer_rate">INSS Patronal %</Label>
            <Input
              id="inss_employer_rate"
              type="number"
              step="0.01"
              value={localSettings.inss_employer_rate}
              onChange={(e) => setLocalSettings({ ...localSettings, inss_employer_rate: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Padrão: 20%
            </p>
          </div>

          {/* FGTS% */}
          <div className="space-y-2">
            <Label htmlFor="fgts_rate">FGTS %</Label>
            <Input
              id="fgts_rate"
              type="number"
              step="0.01"
              value={localSettings.fgts_rate}
              onChange={(e) => setLocalSettings({ ...localSettings, fgts_rate: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Padrão: 8%
            </p>
          </div>

          {/* Multa Rescisória */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="severance">Provisão de Multa Rescisória</Label>
              <p className="text-xs text-muted-foreground">
                Incluir 40% do FGTS ÷ 12 nas provisões
              </p>
            </div>
            <Switch
              id="severance"
              checked={localSettings.enable_severance_provision}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, enable_severance_provision: checked })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isUpdating}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
