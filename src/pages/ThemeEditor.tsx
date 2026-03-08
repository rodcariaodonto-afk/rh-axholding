import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ThemeEditorSidebar } from '@/components/theme-editor/ThemeEditorSidebar';
import { ComponentsPreview } from '@/components/theme-editor/ComponentsPreview';
import { ThemePresetSelector } from '@/components/theme-editor/ThemePresetSelector';
import { useAppearance } from '@/contexts/AppearanceContext';
import { ArrowLeft, Code, Download, RotateCcw, Upload, Moon, Sun, Save, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DEFAULT_LIGHT_COLORS,
  DEFAULT_DARK_COLORS,
  RADIUS_OPTIONS,
  RADIUS_VALUES,
  FONT_OPTIONS,
  ALL_COLOR_KEYS,
} from '@/constants/appearanceOptions';
import type { FontFamily, RadiusSize } from '@/types/appearance';

// Reverse lookup: CSS value -> RadiusSize key (closest match)
function radiusValueToKey(value: string): RadiusSize | null {
  // Try exact match first
  const exact = Object.entries(RADIUS_VALUES).find(([, v]) => v === value);
  if (exact) return exact[0] as RadiusSize;

  // Parse numeric value in rem and find closest preset
  const numMatch = value.match(/^([\d.]+)rem$/);
  if (!numMatch) {
    // Handle "0" without unit
    if (value.trim() === '0') return 'none';
    return null;
  }

  const target = parseFloat(numMatch[1]);
  let closest: RadiusSize = 'none';
  let closestDiff = Infinity;

  for (const [key, preset] of Object.entries(RADIUS_VALUES)) {
    const presetNum = preset === '0' ? 0 : parseFloat(preset);
    const diff = Math.abs(presetNum - target);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = key as RadiusSize;
    }
  }

  return closest;
}

// Convert HEX color (#rrggbb or #rgb) to HSL space-separated format (e.g., "221.2 83.2% 53.3%")
function hexToHSL(hex: string): string | null {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{3,8}$/.test(h)) return null;

  let r: number, g: number, b: number;
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16) / 255;
    g = parseInt(h[1] + h[1], 16) / 255;
    b = parseInt(h[2] + h[2], 16) / 255;
  } else if (h.length >= 6) {
    r = parseInt(h.substring(0, 2), 16) / 255;
    g = parseInt(h.substring(2, 4), 16) / 255;
    b = parseInt(h.substring(4, 6), 16) / 255;
  } else {
    return null;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return `0 0% ${Math.round(l * 100)}%`;
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let hue: number;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / d + 2) / 6;
  else hue = ((r - g) / d + 4) / 6;

  const hDeg = Math.round(hue * 3600) / 10;
  const sPct = Math.round(s * 1000) / 10;
  const lPct = Math.round(l * 1000) / 10;

  return `${hDeg} ${sPct}% ${lPct}%`;
}

// Variable name mapping: tweakcn name -> our project name
const VARIABLE_ALIASES: Record<string, string> = {
  'sidebar': 'sidebar-background',
};

// Parse existing custom CSS to extract color values and radius
// Supports both HSL space-separated format AND HEX (#rrggbb) format (auto-converts)
function parseCustomCSS(css: string): { light: Record<string, string>; dark: Record<string, string>; radius?: string } | null {
  try {
    const light: Record<string, string> = {};
    const dark: Record<string, string> = {};
    let radius: string | undefined;

    // Extract block content more robustly (handles nested parens in shadow values)
    const extractBlock = (cssText: string, selector: RegExp): string | null => {
      const selectorMatch = cssText.match(selector);
      if (!selectorMatch) return null;
      const startIdx = selectorMatch.index! + selectorMatch[0].length;
      // Find the opening brace after the selector
      const braceIdx = cssText.indexOf('{', startIdx - 1);
      if (braceIdx === -1) return null;
      // Count braces to find the matching closing brace
      let depth = 1;
      let i = braceIdx + 1;
      while (i < cssText.length && depth > 0) {
        if (cssText[i] === '{') depth++;
        else if (cssText[i] === '}') depth--;
        i++;
      }
      return cssText.substring(braceIdx + 1, i - 1);
    };

    const rootContent = extractBlock(css, /:root\s*\{/) ?? extractBlock(css, /html\s*\{/);
    const darkContent = extractBlock(css, /\.dark\s*\{/) ?? extractBlock(css, /html\.dark\s*\{/);

    const parseVars = (block: string) => {
      const vars: Record<string, string> = {};
      const regex = /--([a-z0-9-]+):\s*([^;]+);/gi;
      let match;
      while ((match = regex.exec(block)) !== null) {
        let key = match[1];
        const rawValue = match[2].trim();

        // Apply variable name aliases (e.g., --sidebar -> --sidebar-background)
        if (VARIABLE_ALIASES[key]) {
          key = VARIABLE_ALIASES[key];
        }

        // Only process color keys we know about
        if (!ALL_COLOR_KEYS.includes(key)) continue;

        // Auto-detect and convert HEX to HSL
        if (rawValue.startsWith('#')) {
          const hsl = hexToHSL(rawValue);
          if (hsl) vars[key] = hsl;
        } else {
          vars[key] = rawValue;
        }
      }
      return vars;
    };

    if (rootContent) {
      const parsedLight = parseVars(rootContent);
      Object.assign(light, parsedLight);

      // Extract --radius from :root block
      const radiusMatch = rootContent.match(/--radius:\s*([^;]+);/);
      if (radiusMatch) {
        radius = radiusMatch[1].trim();
      }
    }
    if (darkContent) {
      const parsedDark = parseVars(darkContent);
      Object.assign(dark, parsedDark);
    }

    return { light, dark, radius };
  } catch {
    return null;
  }
}

// Generate CSS from color values
function generateCSS(lightColors: Record<string, string>, darkColors: Record<string, string>, radiusValue?: string): string {
  const formatVars = (colors: Record<string, string>) => {
    return Object.entries(colors)
      .map(([key, value]) => `    --${key}: ${value};`)
      .join('\n');
  };

  const radiusLine = radiusValue ? `\n    --radius: ${radiusValue};` : '';

  return `@layer base {
  :root {
${formatVars(lightColors)}${radiusLine}
  }

  .dark {
${formatVars(darkColors)}
  }
}`;
}

export default function ThemeEditor() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { settings, importCustomCSS, clearCustomCSS, updateSetting, saveToOrganization, canEditTheme, isLoadingOrgTheme, isSaving } = useAppearance();
  
  const [lightColors, setLightColors] = useState<Record<string, string>>(DEFAULT_LIGHT_COLORS);
  const [darkColors, setDarkColors] = useState<Record<string, string>>(DEFAULT_DARK_COLORS);
  const [editingMode, setEditingMode] = useState<'light' | 'dark'>(
    (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'light'
  );
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importValue, setImportValue] = useState('');
  
  // Track if we should auto-apply changes (false after reset)
  const shouldApplyRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  // Load existing custom CSS on mount
  useEffect(() => {
    if (settings.customCSS) {
      const parsed = parseCustomCSS(settings.customCSS);
      if (parsed) {
        if (Object.keys(parsed.light).length > 0) {
          setLightColors({ ...DEFAULT_LIGHT_COLORS, ...parsed.light });
        }
        if (Object.keys(parsed.dark).length > 0) {
          setDarkColors({ ...DEFAULT_DARK_COLORS, ...parsed.dark });
        }
        // Apply radius if present in the saved CSS
        if (parsed.radius) {
          const radiusKey = radiusValueToKey(parsed.radius);
          if (radiusKey) {
            updateSetting('radius', radiusKey);
          }
        }
      }
      // If there's existing custom CSS, enable auto-apply
      shouldApplyRef.current = true;
    }
    initialLoadDoneRef.current = true;
  }, []);

  // Apply colors in real-time (only when user makes changes, not on reset)
  useEffect(() => {
    if (!initialLoadDoneRef.current) return;
    if (!shouldApplyRef.current) return;
    
    const css = generateCSS(lightColors, darkColors, RADIUS_VALUES[settings.radius]);
    importCustomCSS(css);
  }, [lightColors, darkColors, importCustomCSS, settings.radius]);

  const currentColors = editingMode === 'light' ? lightColors : darkColors;
  const setCurrentColors = editingMode === 'light' ? setLightColors : setDarkColors;

  const handleColorChange = useCallback((key: string, value: string) => {
    // Enable auto-apply when user makes a change
    shouldApplyRef.current = true;
    setCurrentColors(prev => ({ ...prev, [key]: value }));
  }, [setCurrentColors]);

  const handleReset = () => {
    // Disable auto-apply to prevent the useEffect from re-applying
    shouldApplyRef.current = false;
    setLightColors(DEFAULT_LIGHT_COLORS);
    setDarkColors(DEFAULT_DARK_COLORS);
    clearCustomCSS();
    toast.success('Tema restaurado para o padrão');
  };

  const handleExportCode = () => {
    setCodeModalOpen(true);
  };

  const handleImport = () => {
    if (!importValue.trim()) return;
    
    const parsed = parseCustomCSS(importValue);
    if (parsed) {
      // Enable auto-apply when importing
      shouldApplyRef.current = true;

      if (Object.keys(parsed.light).length > 0) {
        setLightColors({ ...DEFAULT_LIGHT_COLORS, ...parsed.light });
      }
      if (Object.keys(parsed.dark).length > 0) {
        setDarkColors({ ...DEFAULT_DARK_COLORS, ...parsed.dark });
      }

      // Apply radius if present in the imported CSS
      if (parsed.radius) {
        const radiusKey = radiusValueToKey(parsed.radius);
        if (radiusKey) {
          updateSetting('radius', radiusKey);
        }
      }
      
      setImportModalOpen(false);
      setImportValue('');
      toast.success('Tema importado com sucesso');
    } else {
      toast.error('Formato de CSS inválido');
    }
  };

  const handleCopyCode = () => {
    const css = generateCSS(lightColors, darkColors, RADIUS_VALUES[settings.radius]);
    navigator.clipboard.writeText(css);
    toast.success('CSS copiado para a área de transferência');
  };

  const toggleThemePreview = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    updateSetting('colorMode', newTheme);
    setEditingMode(newTheme as 'light' | 'dark');
  };

  const handleSaveToOrganization = async () => {
    if (!canEditTheme) {
      toast.error('Apenas administradores podem salvar o tema da organização');
      return;
    }

    try {
      const css = generateCSS(lightColors, darkColors, RADIUS_VALUES[settings.radius]);
      await saveToOrganization({
        customCSS: css,
        colorMode: editingMode,
        fontFamily: settings.fontFamily,
        borderRadius: settings.radius,
      });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleApplyPreset = useCallback((light: Record<string, string>, dark: Record<string, string>) => {
    shouldApplyRef.current = true;
    setLightColors(light);
    setDarkColors(dark);
    toast.success('Tema aplicado');
  }, []);

  // Show loading state while fetching org theme
  if (isLoadingOrgTheme) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando tema...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Admin Warning */}
      {!canEditTheme && (
        <Alert variant="destructive" className="m-4 mb-0">
          <ShieldAlert className="size-4" />
          <AlertTitle>Acesso somente leitura</AlertTitle>
          <AlertDescription>
            Apenas administradores podem alterar o tema da organização. Você está visualizando o tema atual.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <header className="border-b border-border shrink-0">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/company-settings')}>
              <ArrowLeft className="size-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="font-semibold">Theme Editor</h1>
            <Separator orientation="vertical" className="h-6" />
            <ThemePresetSelector
              currentLightColors={lightColors}
              currentDarkColors={darkColors}
              editingMode={editingMode}
              onApplyPreset={handleApplyPreset}
              disabled={!canEditTheme}
            />
          </div>

          <div className="flex items-center gap-2">
            <Tabs 
              value={editingMode} 
              onValueChange={(v) => {
                const mode = v as 'light' | 'dark';
                setEditingMode(mode);
                updateSetting('colorMode', mode);
              }}
            >
              <TabsList className="h-8">
                <TabsTrigger value="light" className="text-xs px-3">
                  <Sun className="size-3.5 mr-1.5" />
                  Light
                </TabsTrigger>
                <TabsTrigger value="dark" className="text-xs px-3">
                  <Moon className="size-3.5 mr-1.5" />
                  Dark
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="ghost" size="sm" onClick={toggleThemePreview}>
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset}
              disabled={!canEditTheme}
            >
              <RotateCcw className="size-4 mr-1.5" />
              Reset
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setImportModalOpen(true)}
              disabled={!canEditTheme}
            >
              <Upload className="size-4 mr-1.5" />
              Import
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportCode}>
              <Code className="size-4 mr-1.5" />
              Code
            </Button>

            {canEditTheme && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Button 
                  size="sm" 
                  onClick={handleSaveToOrganization}
                  disabled={isSaving}
                >
                  <Save className="size-4 mr-1.5" />
                  {isSaving ? 'Salvando...' : 'Salvar para Organização'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Second row: Font and Radius selectors */}
        <div className="h-12 flex items-center gap-6 px-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Fonte:</span>
            <Select
              value={settings.fontFamily}
              onValueChange={(value) => canEditTheme && updateSetting('fontFamily', value as FontFamily)}
              disabled={!canEditTheme}
            >
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Raio:</span>
            <ToggleGroup
              type="single"
              value={settings.radius}
              onValueChange={(value) => value && canEditTheme && updateSetting('radius', value as RadiusSize)}
              className="h-8"
              disabled={!canEditTheme}
            >
              {RADIUS_OPTIONS.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  aria-label={`Raio ${option.label}`}
                  className="px-2.5 text-xs h-8"
                  disabled={!canEditTheme}
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <ThemeEditorSidebar
          colorValues={currentColors}
          onColorChange={canEditTheme ? handleColorChange : undefined}
        />
        <ComponentsPreview />
      </div>

      {/* Code Export Modal */}
      <Dialog open={codeModalOpen} onOpenChange={setCodeModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generated CSS</DialogTitle>
            <DialogDescription>
              Copy this CSS to your index.css or use it with the Import function
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={generateCSS(lightColors, darkColors, RADIUS_VALUES[settings.radius])}
            readOnly
            className="font-mono text-xs min-h-[400px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCodeModalOpen(false)}>
              Close
            </Button>
            <Button onClick={handleCopyCode}>
              <Download className="size-4 mr-2" />
              Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import CSS Theme</DialogTitle>
            <DialogDescription>
              Paste your CSS theme code below. Supports tweakcn, shadcn/ui themes.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={importValue}
            onChange={(e) => setImportValue(e.target.value)}
            placeholder="Paste your CSS here..."
            className="font-mono text-xs min-h-[300px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>
              Import Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
