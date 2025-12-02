# 🔧 Desabilitar CDN na Hostinger

## Passo 1: Acessar Configurações do Domínio

1. No painel da Hostinger, vá em **Domains** ou **Domain portfolio**
2. Clique no domínio `marcohama.com`
3. Procure por **CDN** ou **Cloudflare** ou **Performance**

## Passo 2: Desabilitar CDN

Procure por uma das seguintes opções:

### Opção A: Se houver aba "CDN" ou "Performance"
1. Vá na aba **CDN** ou **Performance**
2. Desative o CDN/Cloudflare
3. Salve as alterações

### Opção B: Se houver configuração de Nameservers
1. Vá em **DNS / Nameservers**
2. Procure por opção de **CDN** ou **Proxy**
3. Desative se houver

### Opção C: Verificar se está usando Cloudflare
Se o domínio estiver usando Cloudflare através da Hostinger:
1. Vá em **Advanced** ou **Settings**
2. Procure por **CDN** ou **Cloudflare**
3. Desative

## Passo 3: Aguardar alguns minutos

Após desabilitar, aguarde 5-10 minutos para as mudanças propagarem.

## Passo 4: Tentar adicionar registro A novamente

Depois de desabilitar o CDN, tente adicionar o registro A novamente:
- Type: A
- Name: @
- Points to: 72.60.20.31
- TTL: 14400

## Passo 5: Se ainda não funcionar

Se ainda der erro, tente:
1. Mudar os Nameservers para os da Hostinger (se não estiver usando)
2. Ou usar Nameservers customizados apontando diretamente para o servidor

---

## Alternativa: Usar Subdomínio

Se não conseguir desabilitar o CDN, você pode:
1. Criar um subdomínio (ex: `app.marcohama.com` ou `dashboard.marcohama.com`)
2. Adicionar registro A para o subdomínio (geralmente funciona mesmo com CDN)
3. Usar o subdomínio para acessar a aplicação

---

## Verificar Status do CDN

Para verificar se o CDN está ativo:
1. Acesse: https://www.whatsmydns.net/#A/marcohama.com
2. Se mostrar IPs diferentes de `72.60.20.31`, o CDN ainda está ativo






