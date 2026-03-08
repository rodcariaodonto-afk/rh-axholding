import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronDown, Search, Check, Heart, Shuffle, Trash2 } from 'lucide-react';
import {
  BUILT_IN_PRESETS,
  getSavedThemes,
  saveTheme,
  deleteSavedTheme,
  type ThemePreset,
  type SavedTheme,
} from '@/constants/themePresets';

interface ThemePresetSelectorProps {
  currentLightColors: Record<string, string>;
  currentDarkColors: Record<string, string>;
  editingMode: 'light' | 'dark';
  onApplyPreset: (light: Record<string, string>, dark: Record<string, string>) => void;
  disabled?: boolean;
}

function ColorDots({ preset, mode }: { preset: ThemePreset; mode: 'light' | 'dark' }) {
  const colors = mode === 'light' ? preset.light : preset.dark;
  const dots = [
    colors['primary'],
    colors['accent'],
    colors['secondary'],
    colors['background'],
  ];
  return (
    <div className="flex gap-1">
      {dots.map((hsl, i) => (
        <div
          key={i}
          className="size-4 rounded-sm border border-border/50"
          style={{ backgroundColor: `hsl(${hsl})` }}
        />
      ))}
    </div>
  );
}

function findMatchingPreset(
  lightColors: Record<string, string>,
  darkColors: Record<string, string>,
  presets: ThemePreset[]
): ThemePreset | null {
  for (const preset of presets) {
    const lightMatch = preset.light['primary'] === lightColors['primary'] &&
      preset.light['background'] === lightColors['background'] &&
      preset.light['accent'] === lightColors['accent'];
    const darkMatch = preset.dark['primary'] === darkColors['primary'] &&
      preset.dark['background'] === darkColors['background'] &&
      preset.dark['accent'] === darkColors['accent'];
    if (lightMatch && darkMatch) return preset;
  }
  return null;
}

export function ThemePresetSelector({
  currentLightColors,
  currentDarkColors,
  editingMode,
  onApplyPreset,
  disabled,
}: ThemePresetSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>(getSavedThemes);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  const allPresets = useMemo(() => [...BUILT_IN_PRESETS], []);

  const activePreset = useMemo(() => {
    // Check saved themes first
    const savedMatch = findMatchingPreset(currentLightColors, currentDarkColors, savedThemes);
    if (savedMatch) return savedMatch;
    // Then built-in
    return findMatchingPreset(currentLightColors, currentDarkColors, allPresets);
  }, [currentLightColors, currentDarkColors, allPresets, savedThemes]);

  const filteredBuiltIn = useMemo(() => {
    if (!search.trim()) return BUILT_IN_PRESETS;
    const q = search.toLowerCase();
    return BUILT_IN_PRESETS.filter(p => p.name.toLowerCase().includes(q));
  }, [search]);

  const filteredSaved = useMemo(() => {
    if (!search.trim()) return savedThemes;
    const q = search.toLowerCase();
    return savedThemes.filter(p => p.name.toLowerCase().includes(q));
  }, [search, savedThemes]);

  const handleSelect = useCallback((preset: ThemePreset) => {
    onApplyPreset(preset.light, preset.dark);
    setOpen(false);
  }, [onApplyPreset]);

  const handleSaveTheme = useCallback(() => {
    if (!saveName.trim()) return;
    const newTheme: SavedTheme = {
      id: `custom-${Date.now()}`,
      name: saveName.trim(),
      light: { ...currentLightColors },
      dark: { ...currentDarkColors },
      savedAt: Date.now(),
      isCustom: true,
    };
    saveTheme(newTheme);
    setSavedThemes(getSavedThemes());
    setSaveDialogOpen(false);
    setSaveName('');
  }, [saveName, currentLightColors, currentDarkColors]);

  const handleDeleteSaved = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSavedTheme(id);
    setSavedThemes(getSavedThemes());
  }, []);

  const handleRandomize = useCallback(() => {
    const random = BUILT_IN_PRESETS[Math.floor(Math.random() * BUILT_IN_PRESETS.length)];
    onApplyPreset(random.light, random.dark);
  }, [onApplyPreset]);

  const totalThemes = BUILT_IN_PRESETS.length + savedThemes.length;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 h-9 px-3 min-w-[200px] justify-between"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              {activePreset ? (
                <>
                  <ColorDots preset={activePreset} mode={editingMode} />
                  <span className="text-sm truncate max-w-[120px]">{activePreset.name}</span>
                </>
              ) : (
                <>
                  <div className="flex gap-1">
                    {['primary', 'accent', 'secondary', 'background'].map((key) => (
                      <div
                        key={key}
                        className="size-4 rounded-sm border border-border/50"
                        style={{
                          backgroundColor: `hsl(${
                            editingMode === 'light' ? currentLightColors[key] : currentDarkColors[key]
                          })`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm">Custom (Unsaved)</span>
                </>
              )}
            </div>
            <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="p-3 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search themes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            {/* Count & actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{totalThemes} themes</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={handleRandomize}
                  title="Random theme"
                >
                  <Shuffle className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Save current */}
            <button
              onClick={() => {
                setSaveDialogOpen(true);
                setOpen(false);
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
              disabled={disabled}
            >
              <Heart className="size-3.5" />
              <span>Save</span>
              <span className="text-xs">a theme to find it here.</span>
            </button>
          </div>

          <Separator />

          <div className="max-h-[340px] overflow-y-auto">
            {/* Saved Themes */}
            {filteredSaved.length > 0 && (
              <div className="p-2">
                <p className="text-xs text-muted-foreground px-2 py-1.5 font-medium">Saved Themes</p>
                {filteredSaved.map((preset) => (
                  <button
                    key={preset.id}
                    className="flex items-center gap-3 w-full px-2 py-2.5 rounded-md hover:bg-accent transition-colors group"
                    onClick={() => handleSelect(preset)}
                  >
                    <ColorDots preset={preset} mode={editingMode} />
                    <span className="text-sm flex-1 text-left">{preset.name}</span>
                    <div className="flex items-center gap-1">
                      {activePreset?.id === preset.id && (
                        <Check className="size-4 text-primary" />
                      )}
                      <button
                        onClick={(e) => handleDeleteSaved(e, preset.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                        title="Delete theme"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </button>
                ))}
                <Separator className="my-1" />
              </div>
            )}

            {/* Built-in */}
            <div className="p-2">
              <p className="text-xs text-muted-foreground px-2 py-1.5 font-medium">Built-in Themes</p>
              {filteredBuiltIn.map((preset) => (
                <button
                  key={preset.id}
                  className="flex items-center gap-3 w-full px-2 py-2.5 rounded-md hover:bg-accent transition-colors"
                  onClick={() => handleSelect(preset)}
                >
                  <ColorDots preset={preset} mode={editingMode} />
                  <span className="text-sm flex-1 text-left">{preset.name}</span>
                  {activePreset?.id === preset.id && (
                    <Check className="size-4 text-primary" />
                  )}
                </button>
              ))}
              {filteredBuiltIn.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No themes found.</p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Theme</DialogTitle>
            <DialogDescription>
              Give your current theme a name to save it for later.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="My custom theme"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTheme()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTheme} disabled={!saveName.trim()}>
              <Heart className="size-4 mr-1.5" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
