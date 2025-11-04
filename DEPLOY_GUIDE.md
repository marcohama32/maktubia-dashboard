# Guia de Deploy - marcohama.com

Este guia explica como fazer deploy da aplicação Next.js no domínio **marcohama.com**.

## 📋 Pré-requisitos

1. Conta em um serviço de hospedagem (Vercel, Netlify, ou servidor próprio)
2. Domínio **marcohama.com** configurado
3. Acesso ao DNS do domínio
4. Node.js instalado (para build local)

## 🚀 Opção 1: Deploy na Vercel (Recomendado)

### Passo 1: Preparar o projeto

1. Certifique-se de que o código está commitado no Git:
```bash
git add .
git commit -m "Preparar para deploy"
git push origin main
```

### Passo 2: Criar conta na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub/GitLab/Bitbucket
3. Clique em "Add New Project"
4. Importe seu repositório

### Passo 3: Configurar variáveis de ambiente

Na Vercel, adicione as seguintes variáveis de ambiente:

```
NEXT_PUBLIC_API_BASE_URL=https://seu-backend.com/api
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

### Passo 4: Configurar domínio personalizado

1. Na Vercel, vá em **Settings** > **Domains**
2. Adicione **marcohama.com**
3. Siga as instruções para configurar DNS:
   - Adicione um registro **CNAME** apontando para `cname.vercel-dns.com`
   - Ou adicione um registro **A** com o IP fornecido pela Vercel

### Passo 5: Deploy

1. A Vercel fará deploy automaticamente ao fazer push
2. Ou clique em **Deploy** manualmente

## 🌐 Opção 2: Deploy no Netlify

### Passo 1: Criar conta no Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Faça login e clique em "Add new site" > "Import an existing project"

### Passo 2: Configurar build

**Build command:**
```bash
npm run build
```

**Publish directory:**
```
.next
```

**Ou criar arquivo `netlify.toml`:**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Passo 3: Configurar variáveis de ambiente

Adicione as mesmas variáveis de ambiente listadas na Opção 1.

### Passo 4: Configurar domínio

1. Vá em **Site settings** > **Domain management**
2. Clique em **Add custom domain**
3. Digite **marcohama.com**
4. Configure DNS conforme instruções do Netlify

## 🖥️ Opção 3: Deploy em Servidor Próprio (VPS/Cloud)

### Passo 1: Preparar servidor

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Instalar Nginx
sudo apt-get install -y nginx
```

### Passo 2: Clonar e buildar projeto

```bash
cd /var/www
git clone https://github.com/seu-usuario/seu-repositorio.git marcohama
cd marcohama
npm install
npm run build
```

### Passo 3: Configurar variáveis de ambiente

```bash
nano .env.production
```

Adicione:
```
NEXT_PUBLIC_API_BASE_URL=http://72.60.20.31:8000/api
# ... outras variáveis
```

### Passo 4: Iniciar aplicação com PM2

```bash
pm2 start npm --name "marcohama" -- start
pm2 save
pm2 startup
```

### Passo 5: Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/marcohama.com
```

Adicione:
```nginx
server {
    listen 80;
    server_name marcohama.com www.marcohama.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar configuração:
```bash
sudo ln -s /etc/nginx/sites-available/marcohama.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Passo 6: Configurar SSL (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d marcohama.com -d www.marcohama.com
```

## ⚙️ Configurações Importantes

### 1. Atualizar URL da API em produção

Certifique-se de que a URL da API está configurada corretamente para produção. Se o backend estiver em um servidor diferente, atualize:

```typescript
// src/services/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://seu-backend.com/api';
```

### 2. Configurar WebSocket

Se usar WebSocket, certifique-se de que a URL do WebSocket também está configurada:

```typescript
// src/services/websocket.service.ts
const baseUrl = process.env.NEXT_PUBLIC_WS_URL || API_BASE_URL.replace(/\/api\/?$/, '');
```

### 3. Variáveis de Ambiente

Crie um arquivo `.env.production` com todas as variáveis necessárias:

```env
NEXT_PUBLIC_API_BASE_URL=https://seu-backend.com/api
NEXT_PUBLIC_WS_URL=wss://seu-backend.com
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... outras variáveis
```

## 📝 Checklist de Deploy

- [ ] Código commitado no Git
- [ ] Build funciona localmente (`npm run build`)
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio configurado (DNS)
- [ ] SSL/HTTPS configurado
- [ ] API backend acessível
- [ ] WebSocket funcionando (se aplicável)
- [ ] Firebase configurado (se aplicável)
- [ ] Testar login e funcionalidades principais

## 🔧 Troubleshooting

### Erro 404 em produção

Verifique se o `next.config.js` está configurado corretamente e se está usando `output: 'standalone'` se necessário.

### Erro de CORS

Configure o backend para aceitar requisições do domínio marcohama.com.

### WebSocket não conecta

Verifique se o servidor WebSocket está acessível e se as portas estão abertas.

## 📞 Suporte

Para problemas específicos, verifique:
- Logs do servidor (Vercel, Netlify, ou PM2)
- Console do navegador
- Network tab para verificar requisições

