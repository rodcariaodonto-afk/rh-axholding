# PoPeople - Database Migration Dump

## Visão Geral

Este dump contém toda a estrutura e dados do banco de dados PoPeople para migração para um Supabase próprio.

**Data do Dump:** 2026-01-08  
**Projeto Origem:** Lovable Cloud (kejiscdouigoohujycuu)  
**Total de Tabelas:** 26  
**Total de Registros:** ~350+

---

## Estrutura dos Arquivos

```
migration-dump/
├── README.md                    # Este arquivo
├── 01-enums.sql                 # Todos os ENUMs (18 tipos)
├── 02-tables.sql                # Estrutura das tabelas (26 tabelas)
├── 03-functions.sql             # Funções PostgreSQL (14 funções)
├── 04-triggers.sql              # Triggers do banco
├── 05-rls-policies.sql          # Políticas de Row Level Security
├── 06-storage.sql               # Buckets de storage
├── data/                        # Dados para INSERT
│   ├── 01-organizations.sql
│   ├── 02-units.sql
│   ├── 03-positions.sql
│   ├── 04-employees.sql
│   ├── 05-departments.sql
│   ├── 06-employees_contact.sql
│   ├── 07-employees_contracts.sql
│   ├── 08-organization_members.sql
│   ├── 09-user_roles.sql
│   ├── 10-devices.sql
│   ├── 11-jobs.sql
│   ├── 12-job_applications.sql
│   ├── 13-job_descriptions.sql
│   ├── 14-pdis.sql
│   ├── 15-pdi_goals.sql
│   ├── 16-pdi_comments.sql
│   ├── 17-pdi_logs.sql
│   ├── 18-time_off_policies.sql
│   ├── 19-time_off_balances.sql
│   ├── 20-time_off_requests.sql
│   ├── 21-feedbacks.sql
│   ├── 22-profiler_history.sql
│   ├── 23-company_culture.sql
│   └── 24-company_cost_settings.sql
└── edge-functions/              # Edge Functions
    ├── analyze-candidate/
    ├── github-repos/
    ├── github-tags/
    ├── github-releases/
    └── invite-employee/
```

---

## Pré-requisitos

1. **Supabase Project** criado em [supabase.com](https://supabase.com)
2. **Supabase CLI** instalado: `npm install -g supabase`
3. **Acesso ao SQL Editor** no Dashboard do Supabase
4. **Google OAuth** configurado (opcional, mas recomendado)

---

## Ordem de Execução

### Fase 1: Estrutura do Banco

Execute os scripts na seguinte ordem no **SQL Editor** do Supabase Dashboard:

```bash
# 1. Criar ENUMs
01-enums.sql

# 2. Criar Tabelas
02-tables.sql

# 3. Criar Funções
03-functions.sql

# 4. Criar Triggers
04-triggers.sql

# 5. Criar Políticas RLS
05-rls-policies.sql

# 6. Criar Storage Buckets
06-storage.sql
```

### Fase 2: Configurar Autenticação

Antes de importar os dados, configure a autenticação:

#### Google OAuth (Recomendado)

1. **Google Cloud Console**:
   - Acesse [console.cloud.google.com](https://console.cloud.google.com)
   - Crie um novo projeto ou selecione existente
   - Ative a API "Google+ API" ou "Google Identity"
   - Em "Credentials", crie um "OAuth 2.0 Client ID" (Web application)
   - Adicione o redirect URI: `https://[SEU_PROJECT_REF].supabase.co/auth/v1/callback`

2. **Supabase Dashboard**:
   - Acesse Authentication > Providers > Google
   - Ative o provider
   - Cole o Client ID e Client Secret
   - Em URL Configuration:
     - Site URL: `https://seu-dominio.com` ou `http://localhost:5173`
     - Redirect URLs: Adicione as URLs permitidas

#### Email/Password (Alternativa)

1. Authentication > Providers > Email
2. Ative "Enable Email Signup"
3. Configure "Confirm Email" conforme necessário

### Fase 3: Criar Usuários

**IMPORTANTE**: Os UUIDs dos usuários no `auth.users` serão diferentes no novo Supabase.

**Opção A - Re-login (Recomendado)**:
- Usuários fazem login via Google OAuth
- O trigger `handle_new_user` cria automaticamente `employees` e `user_roles`
- Depois, atualize os dados adicionais via SQL

**Opção B - Convite por Email**:
- Supabase Dashboard > Authentication > Users > Invite user
- Envie convite para cada email

**Opção C - Admin API** (se tiver os hashes de senha):
```bash
supabase auth admin create-user --email user@popcode.com.br
```

### Fase 4: Importar Dados

Execute os scripts de dados na ordem numérica:

```bash
# Na pasta data/
01-organizations.sql
02-units.sql
03-positions.sql
# ... etc
```

**ATENÇÃO**: Se os UUIDs dos usuários forem diferentes, você precisará:
1. Executar os INSERTs de `employees` primeiro (sem os user_ids originais)
2. Depois que os usuários fizerem login, atualizar as referências

### Fase 5: Deploy Edge Functions

```bash
# Navegue até a pasta do projeto
cd edge-functions

# Login no Supabase
supabase login

# Link ao projeto
supabase link --project-ref [SEU_PROJECT_REF]

# Deploy cada função
supabase functions deploy analyze-candidate
supabase functions deploy github-repos
supabase functions deploy github-tags
supabase functions deploy github-releases
supabase functions deploy invite-employee
```

### Fase 6: Configurar Secrets

No Supabase Dashboard > Edge Functions > Secrets:

| Secret | Descrição |
|--------|-----------|
| `GITHUB_TOKEN` | Token do GitHub para acessar repos |
| `LOVABLE_API_KEY` | API Key do Lovable para AI |

---

## Mapeamento de Usuários

Para referência, aqui estão os user_ids originais:

| Email | Role | Original UUID |
|-------|------|---------------|
| hugo@popcode.com.br | admin | 30cd17fc-e20c-4945-98c0-a29cd1573244 |
| brenda.mendes@popcode.com.br | people | 4275f744-c442-4805-a7a9-05c7df646869 |
| dayse.quirino@popcode.com.br | people | 9131c6b1-fabf-44e6-959f-5f8e7dd0761b |

**Nota**: Os demais usuários têm role `user`.

---

## Variáveis de Ambiente

Atualize o `.env` do seu projeto frontend:

```env
VITE_SUPABASE_URL=https://[SEU_PROJECT_REF].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[SUA_ANON_KEY]
VITE_SUPABASE_PROJECT_ID=[SEU_PROJECT_REF]
```

---

## Validação

Após a migração, verifique:

1. **Estrutura**: Todas as tabelas existem com colunas corretas
2. **Dados**: Contagem de registros bate com o original
3. **RLS**: Políticas estão ativas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
4. **Auth**: Login funciona corretamente
5. **Edge Functions**: Funções respondem corretamente

```sql
-- Verificar tabelas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Contar registros
SELECT 'employees' as table_name, COUNT(*) FROM employees
UNION ALL SELECT 'devices', COUNT(*) FROM devices
-- ... etc
```

---

## Suporte

Em caso de dúvidas, consulte:
- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- Documentação do projeto em `docs/`

---

**Última atualização:** 2026-01-08
