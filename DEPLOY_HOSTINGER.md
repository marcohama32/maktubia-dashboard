# 🚀 Deploy com Domínio na Hostinger - marcohama.com

Este guia explica como fazer deploy da aplicação Next.js quando o domínio está na **Hostinger**.

> 💡 **Quer usar apenas a Hostinger?** Veja o guia completo: [DEPLOY_HOSTINGER_ONLY.md](./DEPLOY_HOSTINGER_ONLY.md)

## 📋 Opções de Deploy

### Opção 1: Apenas Hostinger VPS (Recomendado - Sem Dependências Externas)

Se você tem um plano **VPS** ou **Cloud Hosting** na Hostinger, pode fazer deploy direto no servidor sem precisar de Vercel ou Netlify.

**Veja o guia completo:** [DEPLOY_HOSTINGER_ONLY.md](./DEPLOY_HOSTINGER_ONLY.md)

### Opção 2: Vercel + Hostinger DNS (Mais Fácil - Gratuito)

A Vercel é gratuita e ideal para Next.js. Você só precisa configurar o DNS na Hostinger.

### Opção 3: Netlify + Hostinger DNS

Similar à Vercel, também gratuita e fácil de configurar.

---

## 🎯 Opção 1: Vercel + Hostinger DNS (Recomendado)

### Passo 1: Deploy na Vercel

1. **Preparar o código:**
```bash
npm run build  # Testar build localmente
git add .
git commit -m "Preparar para deploy"
git push
```

2. **Criar conta na Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com GitHub/GitLab/Bitbucket
   - Clique em **"Add New Project"**
   - Importe seu repositório

3. **Configurar Build na Vercel:**
   - Framework Preset: **Next.js** (detectado automaticamente)
   - Build Command: `npm run build` (automático)
   - Output Directory: `.next` (automático)
   - Install Command: `npm install` (automático)

4. **Configurar Variáveis de Ambiente:**
   Na Vercel, vá em **Settings** > **Environment Variables** e adicione:
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

5. **Fazer Deploy:**
   - Clique em **Deploy**
   - Aguarde o build completar
   - Você terá uma URL temporária: `seu-projeto.vercel.app`

### Passo 2: Configurar Domínio na Vercel

1. Na Vercel, vá em **Settings** > **Domains**
2. Clique em **Add Domain**
3. Digite: `marcohama.com`
4. A Vercel mostrará instruções de DNS

### Passo 3: Configurar DNS na Hostinger

1. **Acesse o painel da Hostinger:**
   - Acesse [hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Faça login
   - Vá em **Domains** > Selecione `marcohama.com` > **DNS / Nameservers**

2. **Adicionar registro CNAME:**
   - Tipo: **CNAME**
   - Nome: `@` (ou deixe em branco para o domínio raiz)
   - Valor: `cname.vercel-dns.com`
   - TTL: `3600` (ou padrão)
   - Clique em **Adicionar**

3. **Adicionar www (opcional):**
   - Tipo: **CNAME**
   - Nome: `www`
   - Valor: `cname.vercel-dns.com`
   - TTL: `3600`
   - Clique em **Adicionar**

4. **OU usar registro A (alternativa):**
   Se a Vercel fornecer um IP, você pode usar:
   - Tipo: **A**
   - Nome: `@`
   - Valor: `IP fornecido pela Vercel`
   - TTL: `3600`

### Passo 4: Verificar na Vercel

1. Após configurar DNS, volte para a Vercel
2. Na seção **Domains**, clique em **Refresh**
3. Aguarde a verificação (pode levar alguns minutos)
4. Quando mostrar **"Valid"**, o domínio está configurado!

### Passo 5: Configurar SSL (Automático)

- A Vercel configura SSL automaticamente via Let's Encrypt
- Aguarde alguns minutos após a verificação do DNS
- O HTTPS será ativado automaticamente

---

## 🌐 Opção 2: Netlify + Hostinger DNS

### Passo 1: Deploy na Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Faça login e clique em **"Add new site"** > **"Import an existing project"**
3. Conecte seu repositório Git
4. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next` (ou deixe vazio, o plugin Next.js cuida disso)
5. Adicione as mesmas variáveis de ambiente da Vercel
6. Clique em **Deploy**

### Passo 2: Configurar Domínio na Netlify

1. Vá em **Site settings** > **Domain management**
2. Clique em **Add custom domain**
3. Digite: `marcohama.com`
4. A Netlify mostrará instruções de DNS

### Passo 3: Configurar DNS na Hostinger

1. Acesse o painel da Hostinger
2. Vá em **DNS / Nameservers**
3. Adicione:

   **Para domínio raiz:**
   - Tipo: **A**
   - Nome: `@`
   - Valor: `IP fornecido pela Netlify` (geralmente 75.2.60.5)
   - TTL: `3600`

   **Para www:**
   - Tipo: **CNAME**
   - Nome: `www`
   - Valor: `marcohama.com` (ou o valor fornecido pela Netlify)
   - TTL: `3600`

4. Ou use **DNS da Netlify** (recomendado):
   - Na Hostinger, vá em **Nameservers**
   - Altere para os nameservers da Netlify:
     - `dns1.p01.nsone.net`
     - `dns2.p01.nsone.net`
     - `dns3.p01.nsone.net`
     - `dns4.p01.nsone.net`

---

## 🖥️ Opção 3: Servidor VPS da Hostinger

Se você tem um plano VPS da Hostinger, pode fazer deploy direto no servidor.

### Passo 1: Acessar o Servidor VPS

1. Acesse o painel da Hostinger VPS
2. Obtenha o IP do servidor
3. Acesse via SSH:
```bash
ssh root@seu-ip-vps
```

### Passo 2: Instalar Dependências

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Instalar Nginx
apt-get install -y nginx

# Instalar Git
apt-get install -y git
```

### Passo 3: Clonar e Configurar Projeto

```bash
# Criar diretório
mkdir -p /var/www
cd /var/www

# Clonar repositório
git clone https://github.com/seu-usuario/seu-repositorio.git marcohama
cd marcohama

# Instalar dependências
npm install

# Criar arquivo .env.production
nano .env.production
```

Adicione no `.env.production`:
```env
NEXT_PUBLIC_API_BASE_URL=https://seu-backend.com/api
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... outras variáveis
```

### Passo 4: Build e Iniciar

```bash
# Build da aplicação
npm run build

# Iniciar com PM2
pm2 start npm --name "marcohama" -- start
pm2 save
pm2 startup  # Seguir instruções para iniciar automaticamente
```

### Passo 5: Configurar Nginx

```bash
nano /etc/nginx/sites-available/marcohama.com
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

Ativar:
```bash
ln -s /etc/nginx/sites-available/marcohama.com /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Passo 6: Configurar SSL (Let's Encrypt)

```bash
apt-get install certbot python3-certbot-nginx
certbot --nginx -d marcohama.com -d www.marcohama.com
```

### Passo 7: Configurar DNS na Hostinger

1. Acesse **DNS / Nameservers** na Hostinger
2. Adicione:
   - Tipo: **A**
   - Nome: `@`
   - Valor: `IP_DO_SEU_VPS`
   - TTL: `3600`

---

## 🔧 Configuração DNS na Hostinger - Resumo

### Para Vercel (Recomendado):

**Opção 1 - CNAME (mais fácil):**
```
Tipo: CNAME
Nome: @
Valor: cname.vercel-dns.com
TTL: 3600
```

**Opção 2 - A Record:**
```
Tipo: A
Nome: @
Valor: IP fornecido pela Vercel
TTL: 3600
```

### Para Netlify:

```
Tipo: A
Nome: @
Valor: 75.2.60.5 (ou IP fornecido)
TTL: 3600

Tipo: CNAME
Nome: www
Valor: marcohama.com
TTL: 3600
```

### Para VPS próprio:

```
Tipo: A
Nome: @
Valor: IP_DO_SEU_VPS
TTL: 3600
```

---

## ⏱️ Tempo de Propagação DNS

- **Normal:** 5 minutos a 1 hora
- **Máximo:** Até 24-48 horas
- **Teste:** Use [whatsmydns.net](https://www.whatsmydns.net) para verificar

---

## ✅ Checklist de Deploy

### Antes do Deploy:
- [ ] Build funciona localmente (`npm run build`)
- [ ] Código commitado no Git
- [ ] Variáveis de ambiente listadas

### Durante o Deploy:
- [ ] Deploy feito na Vercel/Netlify/VPS
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio adicionado na plataforma

### Configuração DNS:
- [ ] DNS configurado na Hostinger
- [ ] Aguardado propagação DNS (verificar com whatsmydns.net)
- [ ] Domínio verificado na plataforma

### Pós-Deploy:
- [ ] SSL/HTTPS ativo
- [ ] Site acessível em marcohama.com
- [ ] Login funcionando
- [ ] API conectando corretamente
- [ ] WebSocket funcionando (se aplicável)

---

## 🆘 Troubleshooting

### DNS não funciona após 24h
- Verifique se os registros DNS estão corretos
- Verifique se não há conflito com outros registros
- Tente limpar cache DNS: `ipconfig /flushdns` (Windows) ou `sudo dscacheutil -flushcache` (Mac)

### Site não carrega
- Verifique se o build foi bem-sucedido
- Verifique logs na Vercel/Netlify
- Verifique se a porta 3000 está aberta (VPS)

### Erro de CORS
- Configure o backend para aceitar requisições de `marcohama.com`
- Adicione o domínio na lista de origens permitidas

### SSL não funciona
- Aguarde alguns minutos após verificação DNS
- Na Vercel/Netlify, SSL é automático
- No VPS, execute novamente: `certbot --nginx -d marcohama.com`

---

## 📞 Suporte

- **Hostinger:** [support.hostinger.com](https://support.hostinger.com)
- **Vercel:** [vercel.com/support](https://vercel.com/support)
- **Netlify:** [netlify.com/support](https://netlify.com/support)

---

## 🎯 Recomendação Final

**Para facilitar:** Use **Vercel + Hostinger DNS** (Opção 1)
- Gratuito
- Automático
- SSL automático
- Fácil de configurar
- Ideal para Next.js

