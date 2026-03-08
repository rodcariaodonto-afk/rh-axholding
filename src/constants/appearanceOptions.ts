import type { RadiusSize, FontFamily, ColorCategory } from '@/types/appearance';

export const DEFAULT_LIGHT_COLORS: Record<string, string> = {
  'background': '0 0% 100%',
  'foreground': '0 0% 20%',
  'card': '0 0% 100%',
  'card-foreground': '0 0% 20%',
  'popover': '0 0% 100%',
  'popover-foreground': '0 0% 20%',
  'primary': '217.2193 91.2195% 59.8039%',
  'primary-foreground': '0 0% 100%',
  'secondary': '220 14.2857% 95.8824%',
  'secondary-foreground': '215 13.7931% 34.1176%',
  'muted': '210 20% 98.0392%',
  'muted-foreground': '220 8.9362% 46.0784%',
  'accent': '204 93.75% 93.7255%',
  'accent-foreground': '224.4444 64.2857% 32.9412%',
  'destructive': '0 84.2365% 60.1961%',
  'destructive-foreground': '0 0% 100%',
  'border': '220 13.0435% 90.9804%',
  'input': '220 13.0435% 90.9804%',
  'ring': '217.2193 91.2195% 59.8039%',
  'chart-1': '217.2193 91.2195% 59.8039%',
  'chart-2': '221.2121 83.1933% 53.3333%',
  'chart-3': '224.2781 76.3265% 48.0392%',
  'chart-4': '225.931 70.7317% 40.1961%',
  'chart-5': '224.4444 64.2857% 32.9412%',
  'chart-6': '142 76% 36%',
  'chart-7': '38 92% 50%',
  'chart-8': '330 81% 60%',
  'sidebar-background': '210 20% 98.0392%',
  'sidebar-foreground': '0 0% 20%',
  'sidebar-primary': '217.2193 91.2195% 59.8039%',
  'sidebar-primary-foreground': '0 0% 100%',
  'sidebar-accent': '204 93.75% 93.7255%',
  'sidebar-accent-foreground': '224.4444 64.2857% 32.9412%',
  'sidebar-border': '220 13.0435% 90.9804%',
  'sidebar-ring': '217.2193 91.2195% 59.8039%',
};

export const DEFAULT_DARK_COLORS: Record<string, string> = {
  'background': '0 0% 9.0196%',
  'foreground': '0 0% 89.8039%',
  'card': '0 0% 14.902%',
  'card-foreground': '0 0% 89.8039%',
  'popover': '0 0% 14.902%',
  'popover-foreground': '0 0% 89.8039%',
  'primary': '217.2193 91.2195% 59.8039%',
  'primary-foreground': '0 0% 100%',
  'secondary': '0 0% 14.902%',
  'secondary-foreground': '0 0% 89.8039%',
  'muted': '0 0% 12.1569%',
  'muted-foreground': '0 0% 63.9216%',
  'accent': '224.4444 64.2857% 32.9412%',
  'accent-foreground': '213.3333 96.9231% 87.2549%',
  'destructive': '0 84.2365% 60.1961%',
  'destructive-foreground': '0 0% 100%',
  'border': '0 0% 25.098%',
  'input': '0 0% 25.098%',
  'ring': '217.2193 91.2195% 59.8039%',
  'chart-1': '213.1169 93.9024% 67.8431%',
  'chart-2': '217.2193 91.2195% 59.8039%',
  'chart-3': '221.2121 83.1933% 53.3333%',
  'chart-4': '224.2781 76.3265% 48.0392%',
  'chart-5': '225.931 70.7317% 40.1961%',
  'chart-6': '142 76% 36%',
  'chart-7': '38 92% 50%',
  'chart-8': '330 81% 60%',
  'sidebar-background': '0 0% 9.0196%',
  'sidebar-foreground': '0 0% 89.8039%',
  'sidebar-primary': '217.2193 91.2195% 59.8039%',
  'sidebar-primary-foreground': '0 0% 100%',
  'sidebar-accent': '224.4444 64.2857% 32.9412%',
  'sidebar-accent-foreground': '213.3333 96.9231% 87.2549%',
  'sidebar-border': '0 0% 25.098%',
  'sidebar-ring': '217.2193 91.2195% 59.8039%',
};

export const RADIUS_VALUES: Record<RadiusSize, string> = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.625rem',
  xl: '1rem',
};

export const RADIUS_OPTIONS: { value: RadiusSize; label: string }[] = [
  { value: 'none', label: '⊘' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'MD' },
  { value: 'lg', label: 'LG' },
  { value: 'xl', label: 'XL' },
];

export const FONT_FAMILIES: Record<FontFamily, string> = {
  inter: "'Inter', system-ui, sans-serif",
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  roboto: "'Roboto', system-ui, sans-serif",
  poppins: "'Poppins', system-ui, sans-serif",
};

export const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: 'inter', label: 'Inter' },
  { value: 'system', label: 'Sistema' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'poppins', label: 'Poppins' },
];

export const COLOR_CATEGORIES: ColorCategory[] = [
  {
    title: 'Cores Primárias',
    defaultOpen: true,
    variables: [
      { key: 'primary', label: 'Primary' },
      { key: 'primary-foreground', label: 'Primary Foreground' },
    ],
  },
  {
    title: 'Cores Secundárias',
    variables: [
      { key: 'secondary', label: 'Secondary' },
      { key: 'secondary-foreground', label: 'Secondary Foreground' },
    ],
  },
  {
    title: 'Cores de Destaque',
    variables: [
      { key: 'accent', label: 'Accent' },
      { key: 'accent-foreground', label: 'Accent Foreground' },
    ],
  },
  {
    title: 'Cores Base',
    variables: [
      { key: 'background', label: 'Background' },
      { key: 'foreground', label: 'Foreground' },
    ],
  },
  {
    title: 'Card',
    variables: [
      { key: 'card', label: 'Card' },
      { key: 'card-foreground', label: 'Card Foreground' },
    ],
  },
  {
    title: 'Popover',
    variables: [
      { key: 'popover', label: 'Popover' },
      { key: 'popover-foreground', label: 'Popover Foreground' },
    ],
  },
  {
    title: 'Muted',
    variables: [
      { key: 'muted', label: 'Muted' },
      { key: 'muted-foreground', label: 'Muted Foreground' },
    ],
  },
  {
    title: 'Destructive',
    variables: [
      { key: 'destructive', label: 'Destructive' },
      { key: 'destructive-foreground', label: 'Destructive Foreground' },
    ],
  },
  {
    title: 'Bordas e Input',
    variables: [
      { key: 'border', label: 'Border' },
      { key: 'input', label: 'Input' },
      { key: 'ring', label: 'Ring' },
    ],
  },
  {
    title: 'Gráficos',
    variables: [
      { key: 'chart-1', label: 'Chart 1' },
      { key: 'chart-2', label: 'Chart 2' },
      { key: 'chart-3', label: 'Chart 3' },
      { key: 'chart-4', label: 'Chart 4' },
      { key: 'chart-5', label: 'Chart 5' },
      { key: 'chart-6', label: 'Chart 6' },
      { key: 'chart-7', label: 'Chart 7' },
      { key: 'chart-8', label: 'Chart 8' },
    ],
  },
  {
    title: 'Sidebar',
    variables: [
      { key: 'sidebar-background', label: 'Background' },
      { key: 'sidebar-foreground', label: 'Foreground' },
      { key: 'sidebar-primary', label: 'Primary' },
      { key: 'sidebar-primary-foreground', label: 'Primary Foreground' },
      { key: 'sidebar-accent', label: 'Accent' },
      { key: 'sidebar-accent-foreground', label: 'Accent Foreground' },
      { key: 'sidebar-border', label: 'Border' },
      { key: 'sidebar-ring', label: 'Ring' },
    ],
  },
];

export const ALL_COLOR_KEYS = Object.keys(DEFAULT_LIGHT_COLORS);
