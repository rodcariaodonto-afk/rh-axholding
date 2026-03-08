---
type: "business-logic"
project: "PoPeople"
domain: "Inventory Management"
version: "1.0"
---

# Lógica de Negócio: PoPeople

Documentação das regras de negócio, entidades do domínio e workflows do sistema.

---

## 🎯 Domínio: Gestão de Inventário de Dispositivos

**Contexto de negócio**: Popcode precisa controlar dispositivos (computadores, monitores, periféricos) emprestados a colaboradores para:
- Rastreabilidade de ativos
- Controle de garantias
- Compliance (LGPD/auditoria)
- Facilitar remanejamento de equipamentos

---

## 🧩 Entidades do Domínio

### Device (Dispositivo)

**Conceito**: Qualquer equipamento físico de propriedade da Popcode que pode ser emprestado a colaboradores.

**Atributos**:

| Campo | Tipo | Obrigatório | Regras de Negócio |
|-------|------|-------------|-------------------|
| `id` | UUID | Sim | Auto-gerado (PK) |
| `user_name` | Text | Sim | Nome do responsável (pode ser "Popcode" para devices sem dono) |
| `model` | Text | Sim | Modelo do device (ex: "MacBook Pro 16"") |
| `year` | Integer | Sim | Ano de fabricação/compra |
| `device_type` | Enum | Sim | Tipo do equipamento (13 valores possíveis) |
| `status` | Enum | Sim | Situação atual (11 valores possíveis) |
| `processor` | Text | Não | CPU (apenas para computers) |
| `ram` | Integer | Não | RAM em GB (apenas para computers) |
| `disk` | Integer | Não | Armazenamento em GB (apenas para computers) |
| `screen_size` | Numeric | Não | Tamanho da tela em polegadas (computers/monitors) |
| `serial` | Text | Não | Número de série (único se presente) |
| `warranty_date` | Date | Não | Data de expiração da garantia |
| `hexnode_registered` | Boolean | Não | Se está cadastrado no Hexnode MDM (apenas computers) |
| `notes` | Text | Não | Observações livres |
| `user_id` | UUID | Não | FK para profiles (pode ser NULL se user_name não mapeado) |
| `created_at` | Timestamp | Sim | Auto-gerado |
| `updated_at` | Timestamp | Sim | Auto-atualizado por trigger |

**Evidência**: `src/types/device.ts:29-59`, `src/integrations/supabase/types.ts:18-75`

**Invariantes**:
1. Se `device_type = 'computer'`, então `processor`, `ram`, `disk` devem estar preenchidos (regra não enforçada no DB, apenas UX)
2. Se `serial` não NULL, deve ser único (sem constraint DB atualmente, **gap**)
3. `warranty_date` deve ser posterior a `created_at` (não validado, **gap**)

### Profile (Perfil de Usuário)

**Conceito**: Colaborador da Popcode com conta no sistema.

**Atributos**:

| Campo | Tipo | Obrigatório | Regras de Negócio |
|-------|------|-------------|-------------------|
| `id` | UUID | Sim | FK para auth.users (PK) |
| `email` | Text | Sim | Email @popcode.com.br (UNIQUE) |
| `full_name` | Text | Não | Nome completo extraído do OAuth |
| `created_at` | Timestamp | Sim | Auto-gerado |
| `updated_at` | Timestamp | Sim | Auto-atualizado |

**Evidência**: `src/integrations/supabase/types.ts:85-107`

**Invariantes**:
1. `email` MUST end com `@popcode.com.br` (enforçado por trigger `handle_new_user`)
2. `id` MUST existir em `auth.users` (FK constraint)
3. Profile é criado automaticamente no signup (trigger)

### UserRole (Papel do Usuário)

**Conceito**: Atribuição de permissões a usuários.

**Atributos**:

| Campo | Tipo | Obrigatório | Regras de Negócio |
|-------|------|-------------|-------------------|
| `id` | UUID | Sim | Auto-gerado (PK) |
| `user_id` | UUID | Sim | FK para auth.users |
| `role` | Enum | Sim | admin, people ou user |

**Evidência**: `src/integrations/supabase/types.ts:109-126`

**Invariantes**:
1. (user_id, role) deve ser UNIQUE (não pode ter role duplicada)
2. Roles são atribuídas apenas no signup (trigger) ou via SQL manual
3. Usuários **não podem** modificar próprias roles (RLS read-only)

---

## 📋 Enums do Domínio

### DeviceType (Tipo de Dispositivo)

| Valor | Label PT-BR | Quando Usar | Campos Específicos |
|-------|------------|-------------|-------------------|
| `computer` | Computador | Laptops, desktops, Mac Minis | processor, ram, disk, screen_size, hexnode_registered |
| `monitor` | Monitor | Monitores externos | screen_size |
| `mouse` | Mouse | Mouses | - |
| `keyboard` | Teclado | Teclados | - |
| `headset` | Headset | Fones/headsets | - |
| `webcam` | Webcam | Webcams | - |
| `phone` | Celular | iPhones, Androids | - |
| `tablet` | Tablet | iPads, tablets Android | - |
| `apple_tv` | Apple TV | Apple TVs | - |
| `chromecast` | Chromecast | Chromecasts | - |
| `cable` | Cabo | Cabos USB, HDMI, etc. | - |
| `charger` | Carregador | Carregadores | - |
| `other` | Outro | Outros dispositivos não categorizados | - |

**Evidência**: `src/types/device.ts:1-14`, `src/constants/device.ts:18-32`

**Regra de negócio**: Ao criar device, tipo define quais campos são relevantes. UI condicional mostra/esconde campos.

### DeviceStatus (Status do Dispositivo)

| Valor | Label PT-BR | Significado | Quem Pode Usar |
|-------|------------|-------------|---------------|
| `borrowed` | Emprestado | Device está com colaborador | Admin, People (padrão para novos devices) |
| `available` | Disponível | Device livre para empréstimo | Admin, People |
| `office` | Escritório | Device fixo no escritório | Admin, People |
| `defective` | Defeito | Device com problema técnico | Admin, People |
| `returned` | Devolvido | Device foi devolvido ao estoque | Admin, People |
| `not_found` | Não Encontrado | Device desaparecido | Admin, People |
| `maintenance` | Em Manutenção | Device em reparo | Admin, People |
| `pending_format` | Pendente de Formatação | Device aguardando wipe | Admin, People |
| `pending_return` | Pendente de Devolução | Device a ser devolvido | Admin, People |
| `sold` | Vendido | Device foi vendido | Admin, People |
| `donated` | Doado | Device foi doado | Admin, People |

**Evidência**: `src/types/device.ts:16-27`, `src/constants/device.ts:50-61`

**Regras de negócio**:
1. Devices com status `not_found` são **automaticamente ignorados** no import CSV
2. Status `borrowed` indica que device tem responsável ativo
3. Status `available` permite reatribuição sem processo

### AppRole (Papel de Aplicação)

| Valor | Label | Permissões | Atribuição |
|-------|-------|-----------|-----------|
| `admin` | Admin | Tudo (CRUD devices, profiles, delete devices) | hugo@popcode.com.br (hardcoded) |
| `people` | People | Criar/editar devices, ver todos profiles | brenda.mendes@, dayse.quirino@, people@ (hardcoded) |
| `user` | Usuário | Ver devices, editar próprios devices | Todos outros @popcode.com.br (default) |

**Evidência**: `src/integrations/supabase/types.ts:141`, `supabase/migrations/*142104*.sql:79-86`

---

## 🔄 Workflows de Negócio

### 1. Onboarding de Novo Colaborador

```
People Team precisa emprestar device a novo colaborador
    ↓
1. Verificar devices disponíveis (status = 'available')
2. Selecionar device adequado
3. Clicar "Editar Device"
4. Alterar:
   - status: "available" → "borrowed"
   - user_name: "Popcode" → "Nome do Colaborador"
   - user_id: NULL → UUID do profile (se já criado)
5. Salvar
    ↓
Device agora vinculado ao colaborador
    ↓
[Opcional] Registrar no Hexnode (marcar hexnode_registered = true)
```

**Evidência**: `src/components/DeviceDialog.tsx`, `src/hooks/useDevices.ts:56-83`

**Casos extremos**:
- **Colaborador ainda não tem conta**: Deixar `user_id = NULL`, usar apenas `user_name`
- **Device sem serial**: OK, serial é opcional
- **Multiple devices por user**: Permitido (sem restrição)

### 2. Retorno de Colaborador (Offboarding)

```
Colaborador desliga da empresa
    ↓
1. People localiza devices do colaborador (filtro "Meus dispositivos" se logado como user)
2. Para cada device:
   a) Verificar se device foi devolvido fisicamente
   b) Se sim:
      - status: "borrowed" → "returned"
      - Opcional: mudar user_name para "Popcode" (libera device)
   c) Se não:
      - status: "borrowed" → "pending_return"
   d) Se device sumiu:
      - status: "borrowed" → "not_found"
3. Salvar
    ↓
Device liberado para reatribuição (se status = "returned" ou "available")
```

**Evidência**: Workflow implícito em `src/components/DeviceTable.tsx` (filtros), `src/pages/Index.tsx:36-38`

**Casos extremos**:
- **Device com defeito**: Status "defective" em vez de "returned"
- **Device precisa formatação**: Status "pending_format" antes de "available"

### 3. Import em Massa de Inventário

```
People recebe planilha CSV de inventário existente
    ↓
1. Acessa /import-csv
2. Seleciona arquivo CSV
3. Sistema parse e mostra preview (primeiros 10 registros)
4. Valida dados:
   - Tipo de device mapeado (ex: "Computador" → "computer")
   - Status mapeado (ex: "Emprestado" → "borrowed")
   - Responsável mapeado para user_id (busca em profiles por nome/email)
5. Skips automáticos:
   - Status = "Não encontrado" (devices perdidos)
6. User confirma import
    ↓
Bulk insert no Supabase
    ↓
Resultado mostra:
   - Importados: X devices
   - Pulados: Y devices (com lista de motivos)
```

**Evidência**: `src/pages/ImportCSV.tsx:75-108`, `src/scripts/importDevices.ts:114-213`

**Casos extremos**:
- **User name não encontrado**: Cria device com `user_id = NULL`, mantém user_name como texto
- **Duplicate serial**: Atualmente insere duplicado (**gap**, sem constraint UNIQUE)
- **CSV com formato errado**: Parse falha, user recebe erro genérico

### 4. Controle de Garantia

```
Device tem warranty_date preenchida
    ↓
[Workflow futuro - não implementado ainda]
Sistema checa diariamente devices com garantia expirando em 30 dias
    ↓
Notifica People Team via email
    ↓
People decide: renovar garantia, vender device, ou doar
```

**Evidência**: Campo existe (`src/types/device.ts:48`), workflow **não implementado** (ver `docs/architecture.md` melhorias futuras)

---

## ⚖️ Regras de Negócio Críticas

### RN-001: Restrição de Domínio

**Regra**: Apenas emails `@popcode.com.br` podem criar contas.

**Implementação**: Trigger `handle_new_user` valida email no signup:
```sql
IF NEW.email NOT LIKE '%@popcode.com.br' THEN
  RAISE EXCEPTION 'Apenas emails do domínio @popcode.com.br são permitidos';
END IF;
```

**Evidência**: `supabase/migrations/*142104*.sql:67-69`

**Razão**: Segurança; evitar acesso de terceiros.

### RN-002: Atribuição Automática de Roles

**Regra**: Role é atribuída automaticamente no signup baseado em email:
- `hugo@popcode.com.br` → admin
- `brenda.mendes@`, `dayse.quirino@`, `people@` → people
- Todos outros → user

**Implementação**: Trigger `handle_new_user`:
```sql
IF NEW.email = 'hugo@popcode.com.br' THEN
  INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'admin');
ELSIF NEW.email IN (...) THEN
  INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'people');
ELSE
  INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'user');
END IF;
```

**Evidência**: `supabase/migrations/*142104*.sql:80-86`

**Razão**: Zero-config onboarding; roles são conhecidas a priori.

### RN-003: Transparência de Inventário

**Regra**: Todos usuários autenticados podem visualizar **todos** devices (não há privacidade de inventário).

**Implementação**: RLS policy:
```sql
CREATE POLICY "Usuários autenticados podem visualizar dispositivos"
ON devices FOR SELECT TO authenticated
USING (true); -- Sem filtro
```

**Evidência**: `supabase/migrations/*142104*.sql:109-112`

**Razão**: Transparência interna; facilita colaboração e remanejamento.

**Controvérsia**: Expõe devices de todos colaboradores; pode violar expectativa de privacidade (ver `docs/architecture.md` suposições).

### RN-004: Self-Service de Edição

**Regra**: Users podem editar devices onde são responsáveis (`user_id = auth.uid()`), mesmo sem role admin/people.

**Implementação**: RLS policy:
```sql
CREATE POLICY "Admin, People e donos podem atualizar dispositivos"
ON devices FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'people') OR
  auth.uid() = user_id -- Self-service
);
```

**Evidência**: `supabase/migrations/*144602*.sql:16-23`

**Razão**: Empoderar users a corrigir próprias informações (ex: adicionar notes, atualizar serial).

### RN-005: Apenas Admin Deleta

**Regra**: Somente admins podem deletar devices (operação irreversível).

**Implementação**: RLS policy:
```sql
CREATE POLICY "Apenas Admin pode excluir dispositivos"
ON devices FOR DELETE
USING (has_role(auth.uid(), 'admin'));
```

**Evidência**: `supabase/migrations/*142104*.sql:130-133`

**Razão**: Prevenir perda acidental de dados históricos.

**Gap**: Não há soft delete; uma vez deletado, device é permanentemente perdido.

### RN-006: Import Ignora "Não Encontrado"

**Regra**: Devices com status "Não encontrado" são automaticamente pulados no import CSV.

**Implementação**:
```typescript
if (!situacao || situacao === 'Não encontrado') {
  skipped.push(`${tipoRaw} - ${modelo} (${situacao || 'Sem status'})`);
  continue;
}
```

**Evidência**: `src/scripts/importDevices.ts:131-134`

**Razão**: Devices perdidos não devem poluir inventário ativo; import é para devices rastreáveis.

---

## 🚨 Casos Extremos & Edge Cases

### 1. Device Sem Responsável ("Popcode")

**Cenário**: Device no estoque, ainda não emprestado.

**Solução**: `user_name = "Popcode"`, `user_id = NULL`, `status = "available"`

**Evidência**: `src/scripts/importDevices.ts:77-79` (caso especial no import)

### 2. Múltiplos Devices para Mesmo User

**Cenário**: Colaborador tem laptop + monitor + mouse.

**Solução**: Permitido; sem constraint UNIQUE em `user_id`.

**UX**: Filtro "Meus dispositivos" mostra todos devices do user.

**Evidência**: `src/components/DeviceTable.tsx:40,68-70`

### 3. Email Muda (Casamento, Nome Social)

**Cenário**: Colaborador muda email (ex: maria.silva@ → maria.santos@).

**Problema**: Role não reavalia; profile fica com email antigo.

**Solução atual**: Manual SQL update em `profiles.email` + `auth.users.email`.

**Gap**: Sem processo automatizado (ver `docs/architecture.md` suposições).

### 4. Serial Duplicado

**Cenário**: Import CSV tem 2 devices com mesmo serial.

**Problema**: Sem constraint UNIQUE; ambos inseridos.

**Solução futura**: Adicionar unique constraint + upsert logic.

**Evidência**: Gap documentado em `docs/architecture.md` (melhorias futuras #3).

### 5. Device Transferido Entre Users

**Cenário**: Device vai de User A para User B.

**Solução**: Admin/People edita device:
- `user_name`: "User A" → "User B"
- `user_id`: UUID_A → UUID_B

**Gap**: Sem histórico de transferências (futuro: tabela `device_history`).

---

## 📊 Métricas de Negócio

### KPIs Rastreáveis (Manualmente)

| Métrica | Query | Objetivo |
|---------|-------|----------|
| **Devices por status** | `SELECT status, COUNT(*) FROM devices GROUP BY status` | Ver quantos devices estão emprestados vs disponíveis |
| **Devices por tipo** | `SELECT device_type, COUNT(*) FROM devices GROUP BY device_type` | Planejar compras futuras |
| **Devices sem serial** | `SELECT COUNT(*) FROM devices WHERE serial IS NULL` | Melhorar rastreabilidade |
| **Devices com garantia expirando** | `SELECT * FROM devices WHERE warranty_date < NOW() + INTERVAL '30 days'` | Planejar renovações |
| **Devices por user** | `SELECT user_name, COUNT(*) FROM devices GROUP BY user_name ORDER BY COUNT(*) DESC` | Identificar users com muitos devices |

**Evidência**: Queries testadas em Supabase SQL Editor (não salvas no repo).

**Gap**: Sem dashboard para essas métricas (apenas charts básicos em `DeviceCharts.tsx`).

---

## 🔮 Evolução do Domínio

### Próximas Features (Roadmap)

1. **Device History** (histórico de mudanças)
   - Quem editou o quê e quando
   - Rastreamento de transferências
   
2. **Approval Workflow** (workflow de aprovação)
   - User solicita device → People aprova

3. **Notification System** (notificações)
   - Garantia expirando → email para People
   - Device pendente de devolução → email para user

4. **QR Codes** (etiquetas físicas)
   - Scan QR code → ver info do device
   - Validação de posse (user scan confirma que tem device)

**Evidência**: `docs/architecture.md` (seção "Melhorias Futuras")

---

## 📚 Referências

- [architecture.md](architecture.md) - Stack e segurança
- [permissions.md](permissions.md) - Regras de autorização (RLS)
- [api_specification.md](api_specification.md) - Schema detalhado
- [codebase_guide.md](codebase_guide.md) - Onde encontrar cada código

