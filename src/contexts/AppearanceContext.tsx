import React, { createContext, useContext, useLayoutEffect, useState, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import type { AppearanceSettings, FontFamily, RadiusSize, ColorMode } from '@/types/appearance';
import { FONT_FAMILIES, RADIUS_VALUES } from '@/constants/appearanceOptions';
import { useOrganizationAppearance, useUpdateOrganizationAppearance } from '@/hooks/useOrganizationAppearance';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';

const THEME_CACHE_KEY = 'orb-theme-cache';

const getCachedTheme = (orgId: string | null): Partial<AppearanceSettings> | null => {
  if (!orgId) return null;
  try {
    const cached = localStorage.getItem(`${THEME_CACHE_KEY}-${orgId}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setCachedTheme = (orgId: string, settings: Partial<AppearanceSettings>) => {
  try {
    localStorage.setItem(`${THEME_CACHE_KEY}-${orgId}`, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
};

const DEFAULT_SETTINGS: AppearanceSettings = {
  radius: 'md',
  colorMode: 'light',
  fontFamily: 'inter',
  customCSS: '',
};

interface SaveToOrgParams {
  customCSS: string;
  colorMode: ColorMode;
  fontFamily: FontFamily;
  borderRadius: RadiusSize;
}

interface AppearanceContextValue {
  settings: AppearanceSettings;
  updateSetting: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
  resetToDefaults: () => void;
  importCustomCSS: (css: string) => void;
  clearCustomCSS: () => void;
  saveToOrganization: (params: SaveToOrgParams) => Promise<void>;
  canEditTheme: boolean;
  isLoadingOrgTheme: boolean;
  isSaving: boolean;
}

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined);

const stripLayerWrapper = (css: string): string => {
  const layerMatch = css.match(/@layer\s+base\s*\{([\s\S]*)\}\s*$/);
  if (layerMatch) {
    return layerMatch[1].trim();
  }
  return css;
};

const boostCSSSpecificity = (css: string): string => {
  let processed = css;
  // html:root has specificity (0,1,1) > :root (0,1,0) → overrides base light styles
  processed = processed.replace(/:root\s*\{/g, 'html:root {');
  // html.dark has specificity (0,1,1) > .dark (0,1,0) → overrides base dark styles
  processed = processed.replace(/\.dark\s*\{/g, 'html.dark {');
  return processed;
};

const injectCustomCSS = (css: string) => {
  const existingStyle = document.getElementById('custom-appearance-css');
  if (existingStyle) {
    existingStyle.remove();
  }

  if (!css.trim()) return;

  let processedCSS = stripLayerWrapper(css);
  processedCSS = boostCSSSpecificity(processedCSS);

  const styleTag = document.createElement('style');
  styleTag.id = 'custom-appearance-css';
  styleTag.textContent = processedCSS;
  document.head.appendChild(styleTag);
};

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const { organizationId } = useCurrentOrganization();
  const { setTheme } = useTheme();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);
  
  // Initialize with cached theme to prevent flash
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    const cached = getCachedTheme(organizationId);
    if (cached) {
      return {
        ...DEFAULT_SETTINGS,
        ...cached,
      };
    }
    return DEFAULT_SETTINGS;
  });

  const { data: orgAppearance, isLoading: isLoadingOrgTheme } = useOrganizationAppearance();
  const updateOrgAppearance = useUpdateOrganizationAppearance();

  const canEditTheme = isAdmin;

  // When org changes, try to load cached theme immediately
  useEffect(() => {
    if (organizationId) {
      const cached = getCachedTheme(organizationId);
      if (cached) {
        setSettings(prev => ({
          ...prev,
          ...cached,
        }));
      }
    }
  }, [organizationId]);

  // When DB data loads, update settings and cache
  useEffect(() => {
    if (orgAppearance && organizationId) {
      const newSettings = {
        customCSS: orgAppearance.custom_css || '',
        colorMode: orgAppearance.color_mode as ColorMode,
        fontFamily: (orgAppearance.font_family as FontFamily) || 'inter',
        radius: (orgAppearance.border_radius as RadiusSize) || 'md',
      };
      
      setSettings(prev => ({
        ...prev,
        ...newSettings,
      }));
      
      // Cache for next page load
      setCachedTheme(organizationId, newSettings);
    }
  }, [orgAppearance, organizationId]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const hasCustomCSS = settings.customCSS.trim().length > 0;

    // Always apply radius and font, regardless of custom CSS
    root.style.setProperty('--radius', RADIUS_VALUES[settings.radius]);
    root.style.setProperty('--font-sans', FONT_FAMILIES[settings.fontFamily]);

    injectCustomCSS(settings.customCSS);
  }, [settings]);

  useLayoutEffect(() => {
    setTheme(settings.colorMode);
  }, [settings.colorMode, setTheme]);

  const updateSetting = useCallback(<K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const importCustomCSS = useCallback((css: string) => {
    setSettings(prev => ({ ...prev, customCSS: css }));
  }, []);

  const clearCustomCSS = useCallback(() => {
    setSettings(prev => ({ ...prev, customCSS: '' }));
  }, []);

  const saveToOrganization = useCallback(async ({ customCSS, colorMode, fontFamily, borderRadius }: SaveToOrgParams) => {
    if (!canEditTheme) {
      throw new Error('Apenas administradores podem alterar o tema da organização');
    }
    
    await updateOrgAppearance.mutateAsync({ 
      customCSS, 
      colorMode, 
      fontFamily, 
      borderRadius 
    });
  }, [canEditTheme, updateOrgAppearance]);

  return (
    <AppearanceContext.Provider
      value={{
        settings,
        updateSetting,
        resetToDefaults,
        importCustomCSS,
        clearCustomCSS,
        saveToOrganization,
        canEditTheme,
        isLoadingOrgTheme,
        isSaving: updateOrgAppearance.isPending,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}
