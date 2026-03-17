

# Justificativas de Ponto — Plano de Implementação

## Resumo
Criar sistema completo de Justificativas de Ponto: tabela no banco, seção no Perfil do funcionário, modal de justificativa com anexo, fluxo de aprovação pelo RH na página de Absenteísmo, e integração com banco de horas.

---

## 1. Migração SQL — Tabela `justificativas_ponto`

```sql
CREATE TABLE justificativas_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  tipo_registro VARCHAR(50) NOT NULL, -- falta, atraso, atestado, licenca_inss
  data_evento DATE NOT NULL,
  descricao_evento TEXT,
  horario_evento TIME,
  duracao_minutos INT,
  motivo VARCHAR(100),
  descricao_justificativa TEXT,
  arquivo_url TEXT,
  tipo_documento VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pendente_justificativa',
  data_envio TIMESTAMPTZ,
  data_aprovacao TIMESTAMPTZ,
  data_rejeicao TIMESTAMPTZ,
  motivo_rejeicao TEXT,
  aprovado_por UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS policies for org members + employee own records
-- Storage bucket for attachments
```

## 2. Hook `useJustificativasPonto.ts`
- CRUD completo: listar (por employee ou por org), criar, atualizar, aprovar, rejeitar
- Upload de arquivo via Storage
- Filtros por tipo, status, período

## 3. Seção "Justificativas" no Perfil (`Profile.tsx`)
- Novo componente `MyJustificativasSection.tsx` adicionado abaixo de "Meus Dispositivos"
- **Resumo no topo**: cards com Pendentes, Aprovadas, Rejeitadas, % Conformidade
- **Filtros**: Tipo, Status, Período, Limpar Filtros
- **Tabela**: Data | Tipo | Descrição | Status | Justificativa | Ações
  - Pendente de justificativa → fundo amarelo → botão "Justificar"
  - Justificativa pendente (enviada) → fundo laranja → "Editar" / "Cancelar"
  - Aprovada → fundo verde → "Ver Detalhes" / "Baixar Comprovante"
  - Rejeitada → fundo vermelho → "Justificar Novamente" / "Ver Motivo"

## 4. Modal de Justificativa (`JustificativaModal.tsx`)
- Cabeçalho: "Justificar [Tipo] - [Data]"
- Seção 1: Info do evento (read-only)
- Seção 2: Motivo (dropdown dinâmico por tipo) + Descrição detalhada (10-500 chars)
- Seção 3: Anexo (PDF/JPG/PNG/DOC/DOCX, max 5MB) via Storage
- Seção 4: Enviar / Cancelar
- Após envio: toast sucesso, fecha modal, atualiza tabela

## 5. Modal de Detalhes (`JustificativaDetalhesModal.tsx`)
- Info completa do evento + justificativa + anexos (download) + status + aprovador + motivo rejeição

## 6. Fluxo de Aprovação RH — Nova aba em Absenteísmo
- Adicionar aba "Justificativas Pendentes" em `Absenteeism.tsx`
- Tabela: Colaborador | Data | Tipo | Motivo | Data Envio | Dias Pendente | Ações
- Ações: Aprovar (verde), Rejeitar (vermelho), Ver Detalhes
- Modal de aprovação/rejeição com campo de motivo obrigatório para rejeição
- Após ação: atualiza status, registra aprovador

## 7. Integração com Banco de Horas
- Quando justificativa aprovada para falta → marcar no `banco_horas_registros` como "justificado" → não descontar do saldo

---

## Arquivos Criados/Alterados
- `supabase/migrations/` — 1 migração (tabela + RLS + storage bucket)
- `src/hooks/useJustificativasPonto.ts` — hook CRUD
- `src/components/MyJustificativasSection.tsx` — seção no perfil
- `src/components/JustificativaModal.tsx` — modal de envio
- `src/components/JustificativaDetalhesModal.tsx` — modal detalhes
- `src/components/JustificativasAprovacaoTab.tsx` — aba RH no Absenteísmo
- `src/pages/Profile.tsx` — adicionar seção
- `src/pages/Absenteeism.tsx` — adicionar aba de aprovação

