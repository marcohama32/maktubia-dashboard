# 🚀 Deploy Direto na Hostinger - marcohama.com

Este guia explica como fazer deploy da aplicação Next.js **diretamente na Hostinger**, sem precisar de Vercel ou outras plataformas.

## 📋 Opções de Hospedagem na Hostinger

### Opção 1: Hostinger VPS (Recomendado para Next.js)
- **Plano necessário:** VPS ou Cloud Hosting
- **Controle total:** Servidor dedicado
- **Ideal para:** Aplicações Next.js que precisam de Node.js

### Opção 2: Hostinger Shared Hosting
- **Plano necessário:** Shared Hosting
- **Limitações:** Pode não suportar Next.js completamente
- **Ideal para:** Sites estáticos simples

---

## 🎯 Opção 1: Deploy em VPS da Hostinger (Recomendado)

Se você tem um plano **VPS** ou **Cloud Hosting** na Hostinger, pode fazer deploy direto no servidor.

### Passo 1: Acessar o Servidor VPS

1. **Acesse o painel da Hostinger:**
   - Acesse [hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Faça login
   - Vá em **VPS** ou **Cloud Hosting**

2. **Obtenha as credenciais de acesso:**
   - IP do servidor
   - Usuário (geralmente `root`)
   - Senha (ou chave SSH)

3. **Acesse via SSH:**
   
   **Windows (PowerShell ou Git Bash):**
   ```bash
   ssh root@SEU_IP_VPS
   ```
   
   **Mac/Linux:**
   ```bash
   ssh root@SEU_IP_VPS
   ```

### Passo 2: Instalar Node.js e Dependências

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar instalação
node --version
npm --version

# Instalar PM2 (gerenciador de processos Node.js)
npm install -g pm2

# Instalar Nginx (servidor web)
apt-get install -y nginx

# Instalar Git
apt-get install -y git

# Instalar build-essential (para compilar pacotes nativos)
apt-get install -y build-essential
```

### Passo 3: Clonar e Configurar o Projeto

```bash
# Criar diretório para o projeto
mkdir -p /var/www
cd /var/www

# Clonar seu repositório Git
# Se seu código está no GitHub/GitLab:
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git marcohama

# Ou faça upload do código via FTP/SFTP
# Se não usar Git, você pode fazer upload via File Manager da Hostinger

cd marcohama

# Instalar dependências
npm install
```

### Passo 4: Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env.production
nano .env.production
```

Adicione as variáveis de ambiente:
```env
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=http://72.60.20.31:8000/api
NEXT_PUBLIC_WS_URL=ws://72.60.20.31:8000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

Salve: `Ctrl + X`, depois `Y`, depois `Enter`

### Passo 5: Build da Aplicação

```bash
# Build da aplicação Next.js
npm run build

# Verificar se o build foi bem-sucedido
ls -la .next
```

### Passo 6: Iniciar Aplicação com PM2

```bash
# Iniciar aplicação
pm2 start npm --name "marcohama" -- start

# Verificar status
pm2 status

# Ver logs
pm2 logs marcohama

# Salvar configuração para iniciar automaticamente
pm2 save
pm2 startup
# Seguir as instruções que aparecerem (copiar e colar o comando sugerido)
```

### Passo 7: Configurar Nginx como Proxy Reverso

```bash
# Criar configuração do Nginx
nano /etc/nginx/sites-available/marcohama.com
```

Adicione a seguinte configuração:
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
        
        # Timeouts para aplicações Next.js
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Salve e ative:
```bash
# Criar link simbólico
ln -s /etc/nginx/sites-available/marcohama.com /etc/nginx/sites-enabled/

# Remover configuração padrão (opcional)
rm /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx
```

### Passo 8: Configurar SSL (HTTPS) com Let's Encrypt

```bash
# Instalar Certbot
apt-get install -y certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d marcohama.com -d www.marcohama.com

# Seguir as instruções:
# - Email para notificações (opcional)
# - Aceitar termos
# - Escolher se quer redirecionar HTTP para HTTPS (recomendado: 2)

# Verificar renovação automática
certbot renew --dry-run
```

### Passo 9: Configurar DNS na Hostinger

1. **Acesse o painel da Hostinger:**
   - Vá em **Domains** > **marcohama.com** > **DNS / Nameservers**

2. **Adicionar registro A:**
   - **Tipo:** `A`
   - **Nome:** `@` (ou deixe vazio)
   - **Valor:** `IP_DO_SEU_VPS` (o IP do servidor)
   - **TTL:** `3600`
   - Clique em **Adicionar**

3. **Adicionar www (opcional):**
   - **Tipo:** `A`
   - **Nome:** `www`
   - **Valor:** `IP_DO_SEU_VPS`
   - **TTL:** `3600`
   - Clique em **Adicionar**

4. **Aguardar propagação DNS:**
   - 5 minutos a 1 hora
   - Verificar: [whatsmydns.net](https://www.whatsmydns.net/#A/marcohama.com)

### Passo 10: Verificar e Testar

```bash
# Verificar status da aplicação
pm2 status

# Ver logs em tempo real
pm2 logs marcohama

# Verificar Nginx
systemctl status nginx

# Verificar se a porta 3000 está sendo usada
netstat -tulpn | grep 3000
```

Teste o site:
- HTTP: `http://marcohama.com`
- HTTPS: `https://marcohama.com` (após SSL)

---

## 🌐 Opção 2: Deploy em Shared Hosting da Hostinger

**⚠️ ATENÇÃO:** Shared Hosting pode ter limitações para Next.js. Esta opção é mais complexa.

### Limitações do Shared Hosting:
- Pode não ter Node.js instalado
- Pode não permitir processos Node.js de longa duração
- Pode não permitir configuração de Nginx
- Limites de recursos (CPU, RAM)

### Alternativa: Export Estático

Se o Shared Hosting não suportar Node.js, você pode exportar o Next.js como site estático:

```bash
# No seu computador local
npm run build

# Adicionar no next.config.js:
# output: 'export'

# Build estático
npm run build

# Upload da pasta 'out' para o servidor via FTP
```

**⚠️ Limitações do export estático:**
- Não funciona API Routes do Next.js
- Não funciona Server-Side Rendering
- Não funciona WebSocket nativamente
- Algumas funcionalidades dinâmicas podem não funcionar

---

## 🔄 Atualizar Aplicação (Após Deploy)

### Atualizar Código

```bash
# Acessar servidor
ssh root@SEU_IP_VPS
cd /var/www/marcohama

# Se usar Git:
git pull origin main

# Se não usar Git, fazer upload via FTP/SFTP

# Instalar novas dependências (se houver)
npm install

# Rebuild
npm run build

# Reiniciar aplicação
pm2 restart marcohama

# Verificar logs
pm2 logs marcohama
```

---

## 🛠️ Comandos Úteis

### Gerenciar Aplicação PM2

```bash
# Ver status
pm2 status

# Parar aplicação
pm2 stop marcohama

# Iniciar aplicação
pm2 start marcohama

# Reiniciar aplicação
pm2 restart marcohama

# Ver logs
pm2 logs marcohama

# Ver logs em tempo real
pm2 logs marcohama --lines 50

# Reiniciar após mudanças
pm2 restart marcohama
```

### Gerenciar Nginx

```bash
# Testar configuração
nginx -t

# Reiniciar
systemctl restart nginx

# Ver status
systemctl status nginx

# Ver logs
tail -f /var/log/nginx/error.log
```

### Gerenciar SSL

```bash
# Renovar certificado manualmente
certbot renew

# Ver certificados
certbot certificates
```

---

## 📊 Monitoramento

### Verificar Uso de Recursos

```bash
# Ver uso de CPU e RAM
htop
# ou
top

# Ver uso de espaço em disco
df -h

# Ver processos Node.js
ps aux | grep node
```

### Logs

```bash
# Logs da aplicação
pm2 logs marcohama

# Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs do sistema
journalctl -u nginx
```

---

## 🔧 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs marcohama --err

# Verificar se porta 3000 está livre
netstat -tulpn | grep 3000

# Verificar variáveis de ambiente
cat .env.production

# Testar build localmente
npm run build
npm start
```

### Nginx não funciona

```bash
# Verificar configuração
nginx -t

# Ver logs de erro
tail -f /var/log/nginx/error.log

# Verificar se Nginx está rodando
systemctl status nginx
```

### SSL não funciona

```bash
# Verificar certificado
certbot certificates

# Renovar certificado
certbot renew --force-renewal

# Verificar logs
journalctl -u certbot
```

### Site não carrega

1. Verificar se aplicação está rodando: `pm2 status`
2. Verificar se Nginx está rodando: `systemctl status nginx`
3. Verificar DNS: [whatsmydns.net](https://www.whatsmydns.net/#A/marcohama.com)
4. Verificar firewall: `ufw status`
5. Ver logs: `pm2 logs marcohama`

---

## 🔒 Segurança

### Configurar Firewall

```bash
# Instalar UFW (firewall)
apt-get install -y ufw

# Permitir SSH
ufw allow ssh
ufw allow 22/tcp

# Permitir HTTP e HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Ativar firewall
ufw enable

# Ver status
ufw status
```

### Atualizar Sistema Regularmente

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Reiniciar se necessário
reboot
```

---

## 💰 Custos

### VPS Hostinger
- **Plano básico:** ~$3.99/mês
- **Recursos:** Adequados para Next.js
- **Recomendado:** Para aplicações em produção

### Shared Hosting
- **Plano básico:** ~$1.99/mês
- **Limitações:** Pode não suportar Next.js
- **Recomendado:** Apenas para sites estáticos

---

## ✅ Checklist de Deploy na Hostinger

- [ ] VPS ou Cloud Hosting ativado
- [ ] Acesso SSH configurado
- [ ] Node.js instalado
- [ ] PM2 instalado
- [ ] Nginx instalado e configurado
- [ ] Código clonado/enviado para servidor
- [ ] Variáveis de ambiente configuradas
- [ ] Build executado com sucesso
- [ ] PM2 iniciado e configurado para auto-start
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/HTTPS configurado
- [ ] DNS configurado na Hostinger
- [ ] Firewall configurado
- [ ] Site testado e funcionando

---

## 📞 Suporte Hostinger

Se tiver problemas:
- **Chat ao vivo:** Disponível no painel
- **Email:** support@hostinger.com
- **Base de conhecimento:** [support.hostinger.com](https://support.hostinger.com)

---

## 🎯 Vantagens de Usar Apenas Hostinger

✅ **Controle total** sobre o servidor
✅ **Sem dependência** de serviços externos
✅ **Custo único** (apenas hospedagem)
✅ **Personalização** completa
✅ **Sem limites** de build/deploy

## ⚠️ Desvantagens

❌ **Configuração manual** necessária
❌ **Manutenção** do servidor é sua responsabilidade
❌ **Backup** precisa ser configurado manualmente
❌ **Monitoramento** precisa ser configurado

---

## 🚀 Próximos Passos

1. Verificar se tem VPS/Cloud Hosting na Hostinger
2. Acessar servidor via SSH
3. Seguir os passos acima
4. Configurar DNS
5. Testar site

Se precisar de ajuda com algum passo específico, me avise!

