/**
 * Feature Flags - Controle de features em desenvolvimento
 * 
 * GRANULAR_PERMISSIONS: Habilita o novo sistema de permissões granulares
 * - true: Usa has_org_permission() para verificar permissões específicas
 * - false: Fallback para has_org_role() (role-based)
 */
export const FEATURE_FLAGS = {
  GRANULAR_PERMISSIONS: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
