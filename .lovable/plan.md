

# Correção: QR Code Não Abre Página de Registro

## Problemas Identificados

1. **ProtectedRoute redireciona para `/auth` sem preservar a URL de retorno** — quando o funcionário escaneia o QR Code sem estar logado, ele é redirecionado para `/auth` e perde os parâmetros (`?local=...&lat=...&lng=...&raio=...`).

2. **QR Code usa `window.location.origin`** — no ambiente de preview, isso gera uma URL do tipo `lovableproject.com`, que não funciona no celular. A URL deveria usar o domínio publicado `https://ax-rh.lovable.app`.

## Correções

### 1. ProtectedRoute: preservar URL de retorno

Alterar `src/components/ProtectedRoute.tsx` para passar a URL atual como query param ao redirecionar para `/auth`:

```ts
// Antes:
navigate("/auth");

// Depois:
navigate(`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`);
```

### 2. Auth: redirecionar de volta após login

Alterar `src/pages/Auth.tsx` para, após login bem-sucedido, verificar se há um `?redirect=` param e navegar para lá em vez de `/`.

### 3. QRCodeModal: usar domínio publicado

Alterar `src/components/time-tracking/QRCodeModal.tsx` para usar a URL publicada:

```ts
// Antes:
const url = `${window.location.origin}/registrar-ponto?...`;

// Depois:
const publishedUrl = "https://ax-rh.lovable.app";
const url = `${publishedUrl}/registrar-ponto?local=${location.id}&lat=${location.latitude}&lng=${location.longitude}&raio=${location.radius_meters}`;
```

Isso garante que o QR Code sempre gere uma URL acessível de qualquer celular.

### 4. Página RegistrarPonto: verificação de auth inline

A página já existe e funciona corretamente. O problema era apenas que o usuário não chegava nela por causa dos itens 1-3 acima.

## Resumo de arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/components/ProtectedRoute.tsx` | Preservar URL de retorno no redirect para `/auth` |
| `src/pages/Auth.tsx` | Usar `?redirect=` param após login |
| `src/components/time-tracking/QRCodeModal.tsx` | Usar domínio publicado na URL do QR Code |

