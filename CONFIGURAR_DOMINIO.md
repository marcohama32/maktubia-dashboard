# 🌐 Configurar Domínio marcohama.com

## Passo 1: Configurar DNS no Provedor do Domínio

Você precisa configurar os registros DNS no painel onde comprou o domínio (Registro.br, GoDaddy, Namecheap, etc.).

### 1.1. Acessar Painel DNS

1. Acesse o painel do seu provedor de domínio
2. Vá em **DNS** ou **Gerenciar DNS**
3. Procure por **Registros DNS** ou **Zona DNS**

### 1.2. Adicionar Registro A

Adicione um registro **A** apontando para o IP do servidor:

```
Tipo: A
Nome/Host: @ (ou deixe em branco)
Valor/Conteúdo: 72.60.20.31
TTL: 3600 (ou padrão)
```

### 1.3. Adicionar Registro A para www (opcional)

Se quiser que `www.marcohama.com` também funcione:

```
Tipo: A
Nome/Host: www
Valor/Conteúdo: 72.60.20.31
TTL: 3600 (ou padrão)
```

### 1.4. Aguardar Propagação DNS

- Pode levar de alguns minutos a 48 horas
- Verifique com: `nslookup marcohama.com` ou `dig marcohama.com`

---

## Passo 2: Atualizar Nginx no Servidor

### 2.1. Editar Configuração do Nginx

```bash
sudo nano /etc/nginx/sites-available/maktubia
```

### 2.2. Atualizar server_name

Mude de:
```nginx
server_name 72.60.20.31;
```

Para:
```nginx
server_name marcohama.com www.marcohama.com;
```

Ou se quiser manter ambos:
```nginx
server_name marcohama.com www.marcohama.com 72.60.20.31;
```

### 2.3. Verificar e Recarregar

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Passo 3: Configurar SSL/HTTPS (Recomendado)

### 3.1. Instalar Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 3.2. Obter Certificado SSL

```bash
sudo certbot --nginx -d marcohama.com -d www.marcohama.com
```

O Certbot vai:
- Verificar o domínio
- Obter certificado SSL gratuito (Let's Encrypt)
- Configurar Nginx automaticamente para HTTPS
- Configurar renovação automática

### 3.3. Testar Renovação Automática

```bash
sudo certbot renew --dry-run
```

---

## Passo 4: Atualizar Variáveis de Ambiente

### 4.1. Editar .env.production

```bash
cd /var/www/maktubia-dashboard
nano .env.production
```

### 4.2. Atualizar URLs

Mude de:
```env
NEXT_PUBLIC_API_BASE_URL=http://72.60.20.31:8000/api
NEXT_PUBLIC_WS_URL=ws://72.60.20.31:8000
```

Para (com HTTPS):
```env
NEXT_PUBLIC_API_BASE_URL=https://marcohama.com/api
NEXT_PUBLIC_WS_URL=wss://marcohama.com
```

Ou (sem HTTPS ainda):
```env
NEXT_PUBLIC_API_BASE_URL=http://marcohama.com/api
NEXT_PUBLIC_WS_URL=ws://marcohama.com
```

### 4.3. Reiniciar Aplicação

```bash
pm2 restart maktubia-dashboard
```

---

## Passo 5: Verificar se Está Funcionando

### 5.1. Verificar DNS

```bash
nslookup marcohama.com
# ou
dig marcohama.com
```

Deve retornar: `72.60.20.31`

### 5.2. Testar Acesso

```bash
curl http://marcohama.com
# ou
curl https://marcohama.com
```

### 5.3. Testar no Navegador

Acesse:
- `http://marcohama.com` (ou `https://marcohama.com` se configurou SSL)
- `http://www.marcohama.com` (se configurou www)

---

## 📝 Configuração Completa do Nginx (com SSL)

Após configurar SSL, seu arquivo `/etc/nginx/sites-available/maktubia` deve ficar assim:

```nginx
server {
    listen 80;
    server_name marcohama.com www.marcohama.com;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name marcohama.com www.marcohama.com;

    # Certificados SSL (gerados pelo Certbot)
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

---

## 🔍 Troubleshooting

### DNS não está propagando?

1. Verifique se o registro A está correto
2. Aguarde até 48 horas
3. Use `nslookup marcohama.com` para verificar

### Certificado SSL não funciona?

1. Verifique se o DNS está propagado: `nslookup marcohama.com`
2. Verifique se a porta 80 está aberta: `sudo ufw allow 80`
3. Verifique se a porta 443 está aberta: `sudo ufw allow 443`
4. Veja logs: `sudo tail -f /var/log/nginx/error.log`

### Aplicação não carrega?

1. Verifique PM2: `pm2 status`
2. Verifique logs: `pm2 logs maktubia-dashboard`
3. Verifique Nginx: `sudo nginx -t`
4. Verifique firewall: `sudo ufw status`

---

## ✅ Checklist Final

- [ ] Registro A configurado no DNS
- [ ] DNS propagado (verificado com nslookup)
- [ ] Nginx atualizado com domínio
- [ ] SSL configurado (opcional mas recomendado)
- [ ] .env.production atualizado com novo domínio
- [ ] Aplicação reiniciada
- [ ] Testado no navegador


