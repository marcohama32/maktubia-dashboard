# 🚀 Guia Completo: Deploy Next.js na Hostinger

Este guia explica como fazer deploy da aplicação Next.js **diretamente na Hostinger VPS**.

## 📋 Pré-requisitos

- [ ] Plano VPS ou Cloud Hosting na Hostinger
- [ ] Acesso SSH ao servidor
- [ ] Domínio configurado (opcional, mas recomendado)
- [ ] Código no Git (GitHub/GitLab/Bitbucket)

---

## 🎯 Passo 1: Acessar o Servidor VPS

### 1.1. Obter Credenciais

1. Acesse [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Faça login
3. Vá em **VPS** ou **Cloud Hosting**
4. Anote:
   - **IP do servidor**
   - **Usuário** (geralmente `root`)
   - **Senha** (ou configure chave SSH)

### 1.2. Conectar via SSH

**Windows (PowerShell ou Git Bash):**
```bash
ssh root@SEU_IP_VPS
```

**Mac/Linux:**
```bash
ssh root@SEU_IP_VPS
```

Digite a senha quando solicitado.

---

## 🛠️ Passo 2: Instalar Dependências do Sistema

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v18.x.x
npm --version   # Deve mostrar 9.x.x ou superior

# Instalar PM2 (gerenciador de processos Node.js)
npm install -g pm2

# Instalar Nginx (servidor web reverso proxy)
apt-get install -y nginx

# Instalar Git
apt-get install -y git

# Instalar build-essential (para compilar pacotes nativos)
apt-get install -y build-essential

# Instalar certificado SSL (Let's Encrypt)
apt-get install -y certbot python3-certbot-nginx
```

---

## 📦 Passo 3: Clonar e Configurar o Projeto

### 3.1. Criar Diretório e Clonar

```bash
# Criar diretório para o projeto
mkdir -p /var/www
cd /var/www

# Clonar seu repositório Git
git clone https://github.com/marcohama32/maktubia-dashboard.git maktubia-dashboard

# Entrar no diretório
cd maktubia-dashboard

# Instalar dependências
npm install
```

### 3.2. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env.production
nano .env.production
```

Adicione as seguintes variáveis (ajuste conforme necessário):

```env
# API Backend
NEXT_PUBLIC_API_BASE_URL=https://seu-backend.com/api
# ou se não tiver HTTPS:
# NEXT_PUBLIC_API_BASE_URL=http://72.60.20.31:8000/api

# WebSocket
NEXT_PUBLIC_WS_URL=wss://seu-backend.com
# ou se não tiver HTTPS:
# NEXT_PUBLIC_WS_URL=ws://72.60.20.31:8000

# Firebase (se estiver usando)
NEXT_PUBLIC_FIREBASE_API_KEY=sua-chave-aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-dominio.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=sua-vapid-key

# Node Environment
NODE_ENV=production
```

Salve com `Ctrl+O`, Enter, `Ctrl+X`.

---

## 🔨 Passo 4: Fazer Build da Aplicação

```bash
# Fazer build de produção
npm run build

# Verificar se o build foi bem-sucedido
# Deve criar a pasta .next sem erros
```

Se houver erros, corrija antes de continuar.

---

## 🚀 Passo 5: Configurar PM2

### 5.1. Criar Arquivo de Configuração do PM2

```bash
# Criar arquivo ecosystem.config.js
nano ecosystem.config.js
```

Adicione:

```javascript
module.exports = {
  apps: [{
    name: 'maktubia-dashboard',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/maktubia-dashboard',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/maktubia-dashboard-error.log',
    out_file: '/var/log/pm2/maktubia-dashboard-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

Salve e saia.

### 5.2. Criar Diretório de Logs

```bash
mkdir -p /var/log/pm2
```

### 5.3. Iniciar Aplicação com PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs
pm2 logs maktubia-dashboard

# Salvar configuração para iniciar automaticamente no boot
pm2 save
pm2 startup
```

Execute o comando que o `pm2 startup` mostrará (algo como `sudo env PATH=...`).

---

## 🌐 Passo 6: Configurar Nginx

### 6.1. Criar Configuração do Nginx

```bash
# Criar arquivo de configuração
nano /etc/nginx/sites-available/maktubia-dashboard
```

Adicione:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redirecionar HTTP para HTTPS (após configurar SSL)
    # return 301 https://$server_name$request_uri;

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
        
        # Timeouts para evitar desconexões
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache de arquivos estáticos
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

**Substitua `seu-dominio.com` pelo seu domínio real.**

### 6.2. Ativar Site

```bash
# Criar link simbólico
ln -s /etc/nginx/sites-available/maktubia-dashboard /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Se tudo estiver OK, reiniciar Nginx
systemctl restart nginx

# Verificar status
systemctl status nginx
```

---

## 🔒 Passo 7: Configurar SSL (HTTPS)

### 7.1. Obter Certificado SSL Gratuito

```bash
# Obter certificado SSL do Let's Encrypt
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Seguir as instruções:
# - Digite seu email
# - Aceite os termos
# - Escolha redirecionar HTTP para HTTPS
```

### 7.2. Renovação Automática

O certificado expira a cada 90 dias. Configure renovação automática:

```bash
# Testar renovação
certbot renew --dry-run

# O certbot já configura renovação automática via cron
# Verificar com:
systemctl status certbot.timer
```

---

## 🔄 Passo 8: Configurar Deploy Automático (Opcional)

### 8.1. Criar Script de Deploy

```bash
# Criar script de deploy
nano /var/www/maktubia-dashboard/deploy.sh
```

Adicione:

```bash
#!/bin/bash

cd /var/www/maktubia-dashboard

# Atualizar código
git pull origin main

# Instalar dependências (se houver novas)
npm install

# Fazer build
npm run build

# Reiniciar aplicação
pm2 restart maktubia-dashboard

echo "Deploy concluído!"
```

Tornar executável:

```bash
chmod +x /var/www/maktubia-dashboard/deploy.sh
```

### 8.2. Usar o Script

```bash
# Executar deploy manualmente
/var/www/maktubia-dashboard/deploy.sh
```

---

## 📊 Passo 9: Monitoramento e Manutenção

### 9.1. Comandos Úteis do PM2

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs maktubia-dashboard

# Ver logs das últimas 100 linhas
pm2 logs maktubia-dashboard --lines 100

# Reiniciar aplicação
pm2 restart maktubia-dashboard

# Parar aplicação
pm2 stop maktubia-dashboard

# Ver uso de recursos
pm2 monit
```

### 9.2. Verificar Logs do Nginx

```bash
# Ver logs de acesso
tail -f /var/log/nginx/access.log

# Ver logs de erro
tail -f /var/log/nginx/error.log
```

### 9.3. Verificar Portas

```bash
# Verificar se a aplicação está rodando na porta 3000
netstat -tulpn | grep 3000

# Verificar se o Nginx está rodando na porta 80/443
netstat -tulpn | grep nginx
```

---

## 🔧 Troubleshooting

### Problema: Aplicação não inicia

```bash
# Verificar logs do PM2
pm2 logs maktubia-dashboard --err

# Verificar se a porta 3000 está livre
lsof -i :3000

# Verificar variáveis de ambiente
pm2 env 0
```

### Problema: Nginx retorna 502 Bad Gateway

```bash
# Verificar se a aplicação está rodando
pm2 status

# Verificar logs do Nginx
tail -f /var/log/nginx/error.log

# Verificar se o proxy_pass está correto
cat /etc/nginx/sites-available/maktubia-dashboard
```

### Problema: Build falha

```bash
# Limpar cache e node_modules
rm -rf .next node_modules
npm install
npm run build
```

### Problema: Certificado SSL não renova

```bash
# Renovar manualmente
certbot renew --force-renewal

# Verificar status
certbot certificates
```

---

## 📝 Checklist Final

- [ ] Node.js 18.x instalado
- [ ] PM2 instalado e configurado
- [ ] Nginx instalado e configurado
- [ ] Aplicação buildada com sucesso
- [ ] PM2 rodando a aplicação
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/HTTPS configurado
- [ ] Domínio apontando para o servidor
- [ ] Aplicação acessível via navegador
- [ ] Logs sendo monitorados

---

## 🎉 Pronto!

Sua aplicação Next.js está rodando na Hostinger!

**URL de acesso:**
- HTTP: `http://seu-dominio.com`
- HTTPS: `https://seu-dominio.com` (após configurar SSL)

**Para atualizar a aplicação:**
```bash
cd /var/www/maktubia-dashboard
git pull
npm install
npm run build
pm2 restart maktubia-dashboard
```

---

## 📚 Recursos Adicionais

- [Documentação Next.js Deployment](https://nextjs.org/docs/deployment)
- [Documentação PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Documentação Nginx](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

