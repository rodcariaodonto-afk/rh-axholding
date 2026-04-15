

# Correção de Segurança — Headers HTTP

## Contexto

O scan de segurança (score 71/100) encontrou 5 problemas, todos relacionados a headers HTTP ausentes:

| Severidade | Header | Status |
|------------|--------|--------|
| HIGH | Content-Security-Policy | Ausente |
| MEDIUM | X-Frame-Options | Ausente |
| LOW | X-XSS-Protection | Ausente |
| LOW | Permissions-Policy | Ausente |
| INFO | Server: cloudflare | Informacional |

## Limitacao importante

Este projeto e hospedado na Lovable (Cloudflare). **Nao temos controle sobre headers do servidor HTTP** — eles sao definidos pela infraestrutura de hospedagem, nao pelo codigo do app.

## O que podemos fazer

Adicionar **meta tags equivalentes** no `index.html` para os headers que possuem equivalencia via `<meta http-equiv>`:

1. **Content-Security-Policy** — Adicionar `<meta http-equiv="Content-Security-Policy">` com politica adequada (permitindo fontes Google, Supabase, imagens externas)
2. **X-Frame-Options** — Adicionar `<meta http-equiv="X-Frame-Options" content="DENY">`
3. **X-XSS-Protection** — Adicionar `<meta http-equiv="X-XSS-Protection" content="1; mode=block">`

## O que NAO podemos corrigir

- **Permissions-Policy**: nao tem equivalente em meta tag, requer header HTTP real (configuracao do servidor)
- **Server header (cloudflare)**: controlado pela Cloudflare, nao pelo app — e apenas informacional

## Alteracao

- **Arquivo**: `index.html` — adicionar 3 meta tags no `<head>`

## Nota

Meta tags `http-equiv` oferecem protecao parcial (funcionam no navegador ao carregar a pagina), mas o ideal seria configurar os headers no servidor. Para protecao completa, seria necessario um dominio proprio com Cloudflare Workers ou outro proxy reverso.

