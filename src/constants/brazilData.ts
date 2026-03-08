// Brazilian states (UF)
export const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
] as const;

// Race options (IBGE classification)
export const RACE_OPTIONS = [
  { value: "branco", label: "Branco" },
  { value: "preto", label: "Preto" },
  { value: "pardo", label: "Pardo" },
  { value: "amarelo", label: "Amarelo" },
  { value: "indigena", label: "Indígena" },
] as const;

// Gender options
export const GENDER_OPTIONS = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "nao_binarie", label: "Não-binárie" },
  { value: "fluido", label: "Fluido" },
  { value: "prefiro_nao_informar", label: "Prefiro não informar" },
] as const;

// Sexual orientation options
export const SEXUAL_ORIENTATION_OPTIONS = [
  { value: "heterossexual", label: "Heterossexual" },
  { value: "homossexual", label: "Homossexual" },
  { value: "bissexual", label: "Bissexual" },
  { value: "assexual", label: "Assexual" },
  { value: "pansexual", label: "Pansexual" },
  { value: "prefiro_nao_responder", label: "Prefiro não responder" },
] as const;

// PCD type options
export const PCD_TYPE_OPTIONS = [
  { value: "fisica", label: "Física" },
  { value: "auditiva", label: "Auditiva" },
  { value: "visual", label: "Visual" },
  { value: "intelectual", label: "Intelectual" },
  { value: "psicossocial", label: "Psicossocial" },
  { value: "multipla", label: "Múltipla" },
] as const;

// Get label by value helper
export const getLabelByValue = (
  options: readonly { value: string; label: string }[],
  value: string | null | undefined
): string => {
  if (!value) return "-";
  const option = options.find((opt) => opt.value === value);
  return option?.label || value;
};
