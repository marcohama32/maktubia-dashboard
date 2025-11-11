# 🔧 Comandos para Corrigir PM2

## 1. Parar todos os processos duplicados
```bash
pm2 delete maktubia-dashboard
```

## 2. Verificar se há arquivo .env.production
```bash
cd /var/www/maktubia-dashboard
ls -la .env.production
```

## 3. Criar o processo corretamente (após verificar .env.production)
```bash
cd /var/www/maktubia-dashboard
pm2 start npm --name "maktubia-dashboard" -- start
pm2 save
```

## 4. Verificar logs
```bash
pm2 logs maktubia-dashboard --lines 50
```

## 5. Verificar se está rodando na porta 3000
```bash
netstat -tulpn | grep 3000
# ou
ss -tulpn | grep 3000
```

## 6. Testar localmente
```bash
curl http://localhost:3000
```

## 7. Verificar status
```bash
pm2 status
pm2 info maktubia-dashboard
```


