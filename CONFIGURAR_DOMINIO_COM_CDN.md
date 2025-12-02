# 🌐 Configurar Domínio com CDN (Cloudflare ou similar)

## ⚠️ Problema

Quando o CDN está habilitado, você não pode adicionar registros A diretamente. O CDN atua como proxy.

## ✅ Solução 1: Desabilitar CDN Temporariamente (Mais Simples)

### Passo 1: Desabilitar Proxy/CDN

No painel do seu provedor de DNS (Cloudflare, etc.):

1. Vá em **DNS** > **Records**
2. Encontre o registro A para `marcohama.com`
3. Clique no ícone de **nuvem laranja** (proxy ativo) para desabilitar
4. Deve ficar **cinza** (DNS only)
5. Altere o IP para: `72.60.20.31`

### Passo 2: Aguardar Propagação

Aguarde alguns minutos para o DNS propagar.

### Passo 3: Verificar

```bash
nslookup marcohama.com
```

Deve retornar: `72.60.20.31`

### Passo 4: Obter Certificado SSL

```bash
sudo certbot --nginx -d marcohama.com -d www.marcohama.com
```

### Passo 5: Reativar CDN (Opcional)

Depois que o SSL estiver funcionando, você pode reativar o CDN se quiser.

---

## ✅ Solução 2: Usar Validação DNS (Sem Desabilitar CDN)

### Passo 1: Obter Certificado com Validação DNS

```bash
sudo certbot certonly --manual --preferred-challenges dns -d marcohama.com -d www.marcohama.com
```

O Certbot vai pedir para você adicionar um registro TXT no DNS.

### Passo 2: Adicionar Registro TXT

No painel DNS, adicione o registro TXT que o Certbot mostrará.

### Passo 3: Continuar no Certbot

Depois de adicionar o TXT, pressione Enter no Certbot.

### Passo 4: Configurar Nginx Manualmente

Depois que o certificado for obtido, configure o Nginx manualmente (veja Solução 3).

---

## ✅ Solução 3: Configurar Nginx com Certificado Existente

Se você já tem o certificado, configure o Nginx:

```bash
sudo nano /etc/nginx/sites-available/maktubia
```

Substitua por:

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name marcohama.com www.marcohama.com;
    return 301 https://$server_name$request_uri;
}

# Configuração HTTPS
server {
    listen 443 ssl http2;
    server_name marcohama.com www.marcohama.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/marcohama.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/marcohama.com/privkey.pem;
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # API Backend - rotas /api
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket para API
    location /socket.io/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend Next.js
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache de arquivos estáticos
    location /_next/static {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

Depois:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Solução 4: Usar CDN com SSL (Cloudflare)

Se você quer manter o CDN ativado:

### Passo 1: Configurar no Cloudflare

1. Vá em **SSL/TLS** > **Overview**
2. Selecione **Full (strict)** ou **Full**
3. O Cloudflare vai gerenciar o SSL

### Passo 2: Configurar Nginx para Aceitar Cloudflare

O Nginx precisa aceitar conexões do Cloudflare. Configure os IPs do Cloudflare.

---

## 🎯 Recomendação

**Para começar rapidamente:**
1. Desabilite o CDN temporariamente
2. Configure o registro A para `72.60.20.31`
3. Obtenha o certificado SSL com Certbot
4. Depois, se quiser, reative o CDN

**Para manter CDN:**
- Use validação DNS do Certbot
- Ou configure SSL no próprio CDN (Cloudflare)






