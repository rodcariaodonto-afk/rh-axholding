export type RadiusSize = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type ColorMode = 'light' | 'dark' | 'system';
export type FontFamily = 'inter' | 'system' | 'roboto' | 'poppins';

export interface AppearanceSettings {
  radius: RadiusSize;
  colorMode: ColorMode;
  fontFamily: FontFamily;
  customCSS: string;
}

export interface OrganizationAppearance {
  id: string;
  organization_id: string;
  custom_css: string;
  color_mode: ColorMode;
  font_family: FontFamily;
  border_radius: RadiusSize;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ColorVariable {
  key: string;
  label: string;
}

export interface ColorCategory {
  title: string;
  variables: ColorVariable[];
  defaultOpen?: boolean;
}
