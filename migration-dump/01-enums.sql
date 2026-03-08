-- ============================================
-- PoPeople Database Migration
-- 01 - ENUMS
-- ============================================
-- Execute este script primeiro no SQL Editor do Supabase
-- ============================================

-- Roles do sistema
CREATE TYPE app_role AS ENUM ('admin', 'people', 'user');

-- Tipos de contrato
CREATE TYPE contract_type AS ENUM ('clt', 'pj', 'internship', 'temporary', 'other');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contractor', 'intern');

-- Status de funcionário
CREATE TYPE employee_status AS ENUM ('active', 'on_leave', 'terminated');

-- Dispositivos
CREATE TYPE device_type AS ENUM (
  'computer', 'monitor', 'mouse', 'keyboard', 'headset', 
  'webcam', 'phone', 'tablet', 'apple_tv', 'chromecast', 
  'cable', 'charger', 'other'
);
CREATE TYPE device_status AS ENUM (
  'borrowed', 'available', 'office', 'defective', 'returned', 
  'not_found', 'maintenance', 'pending_format', 'pending_return', 
  'sold', 'donated'
);

-- Vagas
CREATE TYPE job_status AS ENUM ('active', 'closed', 'draft', 'on_hold');
CREATE TYPE candidate_stage AS ENUM (
  'selecao', 'fit_cultural', 'fit_tecnico', 'pre_admissao', 
  'banco_talentos', 'rejeitado', 'contratado'
);

-- Férias/Ausências
CREATE TYPE time_off_status AS ENUM ('pending_people', 'approved', 'rejected', 'cancelled');

-- PDI (Plano de Desenvolvimento Individual)
CREATE TYPE pdi_status AS ENUM ('rascunho', 'em_andamento', 'entregue', 'concluido', 'cancelado');
CREATE TYPE pdi_goal_status AS ENUM ('pendente', 'em_andamento', 'concluida');
CREATE TYPE pdi_goal_type AS ENUM ('tecnico', 'comportamental', 'lideranca', 'carreira');

-- Dados pessoais
CREATE TYPE gender AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
CREATE TYPE ethnicity AS ENUM ('white', 'black', 'brown', 'asian', 'indigenous', 'not_declared');
CREATE TYPE marital_status AS ENUM ('single', 'married', 'divorced', 'widowed', 'domestic_partnership', 'prefer_not_to_say');
CREATE TYPE education_level AS ENUM (
  'elementary', 'high_school', 'technical', 'undergraduate', 
  'postgraduate', 'masters', 'doctorate', 'postdoc'
);

-- Níveis de cargo
CREATE TYPE position_level AS ENUM ('junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive');
CREATE TYPE position_level_detail AS ENUM (
  'junior_i', 'junior_ii', 'junior_iii', 
  'pleno_i', 'pleno_ii', 'pleno_iii', 
  'senior_i', 'senior_ii', 'senior_iii'
);

-- Desligamento
CREATE TYPE termination_reason AS ENUM (
  'pedido_demissao', 'sem_justa_causa', 'justa_causa', 
  'antecipada_termo_empregador', 'fim_contrato', 'acordo_mutuo', 'outros'
);
CREATE TYPE termination_decision AS ENUM ('pediu_pra_sair', 'foi_demitido');
CREATE TYPE termination_cause AS ENUM (
  'recebimento_proposta', 'baixo_desempenho', 'corte_custos', 
  'relocacao', 'insatisfacao', 'problemas_pessoais', 'outros'
);

-- Feedback
CREATE TYPE feedback_type AS ENUM ('positive', 'neutral', 'negative');

-- Permissões (para uso futuro)
CREATE TYPE permission_module AS ENUM ('employees', 'time_off', 'devices', 'reports');
CREATE TYPE permission_scope AS ENUM ('read', 'create', 'update', 'delete', 'approve');

-- ============================================
-- FIM DOS ENUMS
-- ============================================
