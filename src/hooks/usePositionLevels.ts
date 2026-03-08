export const POSITION_LEVELS = [
  { value: 'junior_i', label: 'Júnior I' },
  { value: 'junior_ii', label: 'Júnior II' },
  { value: 'junior_iii', label: 'Júnior III' },
  { value: 'pleno_i', label: 'Pleno I' },
  { value: 'pleno_ii', label: 'Pleno II' },
  { value: 'pleno_iii', label: 'Pleno III' },
  { value: 'senior_i', label: 'Sênior I' },
  { value: 'senior_ii', label: 'Sênior II' },
  { value: 'senior_iii', label: 'Sênior III' },
] as const;

export const usePositionLevels = () => {
  return POSITION_LEVELS;
};

export const getPositionLevelLabel = (level: string | null | undefined): string => {
  if (!level) return '';
  const found = POSITION_LEVELS.find(l => l.value === level);
  return found?.label || level;
};
