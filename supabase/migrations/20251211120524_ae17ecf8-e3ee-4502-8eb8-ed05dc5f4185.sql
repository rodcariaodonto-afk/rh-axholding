-- Create enums for termination fields
CREATE TYPE public.termination_reason AS ENUM (
  'pedido_demissao',
  'sem_justa_causa',
  'justa_causa',
  'antecipada_termo_empregador',
  'fim_contrato',
  'acordo_mutuo',
  'outros'
);

CREATE TYPE public.termination_decision AS ENUM (
  'pediu_pra_sair',
  'foi_demitido'
);

CREATE TYPE public.termination_cause AS ENUM (
  'recebimento_proposta',
  'baixo_desempenho',
  'corte_custos',
  'relocacao',
  'insatisfacao',
  'problemas_pessoais',
  'outros'
);

-- Add termination fields to employees table
ALTER TABLE public.employees
ADD COLUMN termination_reason public.termination_reason,
ADD COLUMN termination_decision public.termination_decision,
ADD COLUMN termination_cause public.termination_cause,
ADD COLUMN termination_cost numeric DEFAULT 0;