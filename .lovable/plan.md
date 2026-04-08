
# Landing Page Corporativa "RH Smart IA"

## Resumo
Criar uma landing page one-page enterprise em `/landing` (rota publica, sem layout do app) com captacao B2B via Supabase, design azul marinho corporativo, e todas as secoes solicitadas.

---

## 1. Migracao — Tabela `b2b_leads`

```sql
CREATE TABLE public.b2b_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  empresa TEXT NOT NULL,
  num_funcionarios TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  mensagem TEXT,
  origem TEXT DEFAULT 'landing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: insert aberto (anon), select apenas admin
ALTER TABLE public.b2b_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert leads" ON public.b2b_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read leads" ON public.b2b_leads FOR SELECT USING (false);
```

Nao criarei as tabelas `companies`, `employees`, `payroll_records`, `analytics_events` pois o projeto ja possui uma estrutura multi-tenant completa (organizations, employees, etc). A Edge Function de turnover tambem ja existe no contexto do app.

## 2. Landing Page — `src/pages/LandingPage.tsx`

Pagina unica com ~600 linhas, sem dependencia do layout do app. Componentes inline para simplicidade.

### Secoes:
1. **Header fixo** — Logo "RH Smart IA", menu anchor links (Modulos, Vantagens, Precos, Contato), botoes "Entrar" (link `/auth`) e "Agendar Demo Gratuita" (scroll para formulario)
2. **Hero** — Headline, subheadline, CTA, mockup de dashboard com graficos preditivos (SVG/ilustracao CSS)
3. **Modulos (Tabs)** — 5 abas: AX People, AX Talent, AX Analytics, AX Pay, AX Pulse (IA). Cada aba com icone, descricao e lista de features
4. **Resultados (O Poder da IA)** — 3 metricas animadas (34%, 60h, ROI Imediato) com animacao de contagem
5. **Precos** — 4 cards (Starter R$197, Growth R$19/colab, Pro R$29/colab destacado, Enterprise sob consulta)
6. **Formulario B2B** — Nome, Cargo, Empresa, Num Funcionarios (select), Email. Submit para `b2b_leads` via Supabase client
7. **Footer** — Logo AX Holding, links corporativos, LGPD, contato

### Design:
- Paleta: `#0a1628` (azul marinho escuro), `#1e40af` (azul corporativo), `#ffffff`, `#f8fafc`
- Tipografia: font-sans do Tailwind (Inter, similar a Helvetica Neue/Lato)
- Gradientes sutis, cards com sombras, secoes alternando fundo claro/escuro
- Responsivo (mobile-first)

## 3. Rota

Adicionar em `App.tsx` como rota publica:
```tsx
<Route path="/landing" element={<LandingPage />} />
```

## 4. Arquivos criados/alterados
- `supabase/migrations/` — 1 migracao (tabela b2b_leads)
- `src/pages/LandingPage.tsx` — pagina completa
- `src/App.tsx` — adicionar rota `/landing`
