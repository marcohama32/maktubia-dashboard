# 🔧 Mudar Next.js para Porta 3001

## No servidor, execute:

### 1. Parar o processo atual (se estiver rodando)
```bash
pm2 delete maktubia-dashboard
```

### 2. Adicionar PORT ao .env.production
```bash
cd /var/www/maktubia-dashboard
echo "PORT=3001" >> .env.production
```

Ou edite o arquivo:
```bash
nano .env.production
```

E adicione a linha:
```
PORT=3001
```

### 3. Iniciar o PM2 com a porta 3001
```bash
cd /var/www/maktubia-dashboard
PORT=3001 pm2 start npm --name "maktubia-dashboard" -- start
pm2 save
```

**OU** usar o script customizado:
```bash
pm2 start npm --name "maktubia-dashboard" -- run start:3001
pm2 save
```

### 4. Verificar se está rodando na porta 3001
```bash
netstat -tulpn | grep 3001
```

### 5. Verificar logs
```bash
pm2 logs maktubia-dashboard --lines 20
```

Você deve ver:
```
- ready started server on 0.0.0.0:3001, url: http://localhost:3001
```

### 6. Atualizar Nginx (se necessário)

Se você tem Nginx configurado, atualize para apontar para a porta 3001:

```bash
sudo nano /etc/nginx/sites-available/maktubia-dashboard
```

Mude de:
```nginx
proxy_pass http://localhost:3000;
```

Para:
```nginx
proxy_pass http://localhost:3001;
```

Depois recarregue:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

