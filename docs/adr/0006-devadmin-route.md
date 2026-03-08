# ADR-0006: DevAdmin Route (TEMPORARY)

## Status

**TEMPORARY** - Remover quando não for mais necessário

## Data

2025-01-XX (atualizar com data real)

## Contexto

Durante o desenvolvimento, é necessário permitir login sem Google OAuth para testes e desenvolvimento por pessoas fora do domínio `@popcode.com.br`. Isso permite que desenvolvedores externos possam acessar a plataforma com privilégios de admin para fins de desenvolvimento e teste.

## Decisão

Criar rota `/devadmin` que permite login via email/senha para emails específicos que estão em uma whitelist no banco de dados.

### Implementação

1. **Trigger `handle_new_user()`** - Modificada para incluir array `devadmin_emails` que:
   - Bypass a validação de domínio `@popcode.com.br`
   - Atribui automaticamente role `admin` para esses emails

2. **Rota `/devadmin`** - Página separada do login normal com:
   - Formulário de login (email + senha)
   - Formulário de registro (email + senha + confirmação)
   - Aviso visual de que é uma rota temporária

3. **Hook `useAuth`** - Adicionadas funções:
   - `signInWithEmail(email, password)`
   - `signUpWithEmail(email, password)`

## Emails Autorizados

| Email | Role | Motivo |
|-------|------|--------|
| vitoranfrizio@proton.me | admin | Desenvolvimento |

## Como Desabilitar

Quando esta funcionalidade não for mais necessária, siga os passos abaixo:

### Passos Obrigatórios

1. **Remover rota `/devadmin` de `src/App.tsx`**
   ```tsx
   // Remover esta linha:
   <Route path="/devadmin" element={<DevAdmin />} />
   
   // Remover também o import:
   import DevAdmin from "./pages/DevAdmin";
   ```

2. **Deletar arquivo `src/pages/DevAdmin.tsx`**
   ```bash
   rm src/pages/DevAdmin.tsx
   ```

### Passos Opcionais (Recomendados)

3. **Remover funções de `src/hooks/useAuth.ts`**
   - Remover `signInWithEmail`
   - Remover `signUpWithEmail`

4. **Limpar array `devadmin_emails` na trigger**
   ```sql
   -- Executar migration para limpar a whitelist
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   ...
   DECLARE
     devadmin_emails text[] := ARRAY[]::text[];  -- Array vazio
   ...
   ```

5. **Deletar usuários devadmin no Supabase Auth**
   - Acessar o backend via Lovable Cloud
   - Ir em Auth > Users
   - Deletar usuários que não são `@popcode.com.br`

6. **Deletar este ADR ou marcar como DEPRECATED**

## Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/DevAdmin.tsx` | Página de login/registro devadmin |
| `src/hooks/useAuth.ts` | Hook com funções de auth por email |
| `src/App.tsx` | Rota `/devadmin` |
| `supabase/migrations/` | Migration da trigger `handle_new_user()` |

## Considerações de Segurança

- A rota `/devadmin` é pública mas **apenas emails na whitelist** podem se registrar com sucesso
- Emails fora da whitelist receberão erro da trigger: "Apenas emails do domínio @popcode.com.br são permitidos"
- A whitelist é controlada **no banco de dados** (não no frontend) - seguro contra manipulação client-side
- Usuários devadmin recebem role `admin` - **cuidado com quem adiciona na whitelist**

## Consequências

### Positivas

- Desenvolvedores externos podem testar a plataforma
- Não requer conta Google do domínio popcode.com.br
- Fácil de desabilitar no futuro

### Negativas

- Rota adicional que precisa ser mantida/removida
- Potencial vetor de ataque se whitelist não for bem gerenciada
- Bypass da validação de domínio (intencional, mas requer atenção)

## Referências

- [Supabase Auth - Email/Password](https://supabase.com/docs/guides/auth/auth-email)
- ADR-0003: Hardcoded Roles (padrão similar para whitelist por email)
