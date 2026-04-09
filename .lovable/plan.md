

# Paginas Legais: Privacidade, Termos de Uso e Portal LGPD

## Resumo
Criar 3 paginas publicas (`/privacidade`, `/termos`, `/lgpd`) com design dark mode consistente com a landing page, e uma migracao para a tabela `lgpd_requests`.

---

## 1. Migracao — Tabela `lgpd_requests`

```sql
CREATE TABLE public.lgpd_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.lgpd_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert lgpd requests" ON public.lgpd_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "No public read" ON public.lgpd_requests FOR SELECT USING (false);
```

## 2. Componente compartilhado — `LegalPageLayout.tsx`

Componente wrapper que inclui:
- Header identico ao da landing (logo RH Smart IA, menu, botoes Entrar/WhatsApp)
- Footer identico ao da landing
- Container centralizado `max-w-4xl` com fundo escuro
- Botao "Voltar para a pagina inicial" no topo
- Menu lateral sticky opcional (visivel em `lg+`) com links anchor para as secoes

## 3. Pagina Politica de Privacidade — `PrivacyPolicy.tsx`

Rota: `/privacidade`

Secoes com texto juridico completo:
1. Introducao (RHAxis / AX Holding)
2. Dados Coletados (Nome, Email, Telefone)
3. Finalidade (comunicacao e vendas)
4. Compartilhamento (APIs/integracoes de parceiros)
5. Retencao (1 ano)
6. Cookies e Rastreamento (Google Analytics etc.)
7. Seguranca (SOC 2 Type II, LGPD Compliant)
8. Contato (privacidade@rhaxis.com.br)

## 4. Pagina Termos de Uso — `TermsOfUse.tsx`

Rota: `/termos`

Clausulas numeradas:
1. Aceitacao dos Termos
2. Descricao do Servico (SaaS de RH com IA)
3. Uso Aceitavel
4. Propriedade Intelectual (AX Holding)
5. Limitacao de Responsabilidade
6. Integracoes de Terceiros
7. Modificacoes dos Termos
8. Foro (sede AX Holding)

## 5. Pagina Portal LGPD — `LgpdPortal.tsx`

Rota: `/lgpd`

- Badges SOC 2 Type II e LGPD Compliant no topo
- **Secao 1**: Cards com os 6 direitos do titular (acesso, correcao, eliminacao, anonimizacao, portabilidade, revogacao)
- **Secao 2**: Formulario funcional conectado a `lgpd_requests`:
  - Nome Completo, Email, Tipo de Solicitacao (dropdown), Mensagem (textarea)
  - Checkbox de confirmacao de titularidade
  - Botao "Enviar Solicitacao"

## 6. Rotas e Links

- Adicionar 3 rotas publicas em `App.tsx`: `/privacidade`, `/termos`, `/lgpd`
- Atualizar footer da `LandingPage.tsx` para usar `<Link>` nas 3 paginas legais

## Arquivos criados/alterados
- `supabase/migrations/` — 1 migracao (lgpd_requests)
- `src/components/LegalPageLayout.tsx` — layout compartilhado
- `src/pages/PrivacyPolicy.tsx`
- `src/pages/TermsOfUse.tsx`
- `src/pages/LgpdPortal.tsx`
- `src/pages/LandingPage.tsx` — links no footer
- `src/App.tsx` — 3 rotas novas

