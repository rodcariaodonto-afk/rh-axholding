

# Plano: Sistema de Registro de Ponto com QR Code + GPS

## Contexto

O projeto já possui um módulo de ponto (`TimeTracking`) com:
- Tabela `time_entries` no banco
- Tabela `organization_locations` para locais autorizados
- Componentes de clock-in/out, geolocalização e Haversine já implementados
- Aba "Locais" funcional com AddLocationDialog

O documento pede um sistema de QR Code onde funcionários escaneiam um código que abre uma URL com coordenadas do local, valida GPS e registra o ponto. Vou implementar isso reutilizando a infraestrutura existente.

---

## Fase 1 — Essencial (o que será implementado agora)

### 1. Migração de banco de dados

Criar tabela `ponto_registros` para registros via QR Code (separada da `time_entries` existente para manter auditoria com hash):

```sql
CREATE TABLE public.ponto_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  location_id UUID NOT NULL REFERENCES organization_locations(id),
  gps_latitude DECIMAL(10,8) NOT NULL,
  gps_longitude DECIMAL(11,8) NOT NULL,
  gps_accuracy NUMERIC,
  distance_meters NUMERIC NOT NULL,
  hash_sha256 VARCHAR(64) UNIQUE NOT NULL,
  metodo_registro VARCHAR(50) DEFAULT 'qrcode_gps',
  status VARCHAR(50) DEFAULT 'registrado',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Criar tabela `auditoria_ponto`:
```sql
CREATE TABLE public.auditoria_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES employees(id),
  acao VARCHAR(100) NOT NULL,
  detalhes JSONB,
  hash_atual VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Adicionar coluna `address` na `organization_locations` (se não existir). Adicionar RLS policies para ambas as tabelas. Criar indices de performance.

### 2. QR Code — Geração e exibição

- Instalar pacote `qrcode` (npm) para gerar QR Codes no frontend
- Na aba "Locais" (`LocationSettings`), adicionar botão "Ver QR Code" por local
- Modal que mostra QR Code gerado com URL:
  `https://ax-rh.lovable.app/registrar-ponto?local={id}&lat={lat}&lng={lng}&raio={raio}`
- Botão para download do QR Code como PNG

### 3. Página `/registrar-ponto` — Registro via QR Code

Nova página pública (protegida por auth) que:
1. Lê parâmetros da URL (`local`, `lat`, `lng`, `raio`)
2. Busca dados do local no banco para validar
3. Solicita GPS do celular via `getCurrentPosition()`
4. Calcula distância com Haversine (já existe em `geolocation.ts`)
5. Valida: dentro do raio? Rate limit (5 min entre registros)?
6. Gera hash SHA-256 do registro (Web Crypto API)
7. Insere em `ponto_registros` + `auditoria_ponto`
8. Exibe feedback visual de sucesso/erro

Rota adicionada em `App.tsx` como rota protegida sem layout pesado.

### 4. Novas abas na Gestão de Ponto (admin)

Adicionar na página `TimeTracking.tsx`:
- Aba **"QR Code"**: botão de registrar ponto (para funcionários) + link para escanear
- Aba **"Histórico QR"**: tabela de registros da `ponto_registros` com filtros (data, funcionário, local, status)
- Aba **"Auditoria"**: log de auditoria com filtros (data, usuário, ação)

### 5. Componentes novos

| Componente | Descrição |
|---|---|
| `QRCodeModal.tsx` | Modal que gera e exibe QR Code de um local |
| `RegistrarPontoPage.tsx` | Página `/registrar-ponto` |
| `HistoricoQRPonto.tsx` | Tabela de histórico de registros QR |
| `AuditoriaPonto.tsx` | Tabela de log de auditoria |

### 6. Utilitários

- `src/lib/hashSHA256.ts` — função para gerar hash SHA-256 via Web Crypto API
- Hooks: `useRegistrarPonto.ts`, `useHistoricoPonto.ts`, `useAuditoriaPonto.ts`

---

## Fase 2 — Não incluída agora (melhorias futuras)

- 2FA por email
- Google Maps integrado (usaremos OpenStreetMap/Nominatim existente)
- Detecção de fraude / padrões impossíveis
- Relatórios avançados e exportação

---

## Detalhes Técnicos

- QR Code será gerado client-side com a lib `qrcode`
- Hash SHA-256 usa Web Crypto API nativa do browser (sem dependências)
- Rate limiting: query no banco verificando último registro < 5 minutos
- Segurança: RLS por `organization_id`, autenticação obrigatória
- Interface mobile-first na página de registro (botões grandes, textos claros)
- Reutiliza `geolocation.ts` (Haversine, getCurrentPosition) já existente

