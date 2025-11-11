# 🔧 Corrigir Porta 3000 em Uso

## 1. Encontrar qual processo está usando a porta 3000
```bash
lsof -i :3000
# ou
netstat -tulpn | grep 3000
# ou
ss -tulpn | grep 3000
```

## 2. Parar o processo que está usando a porta 3000
```bash
# Se for um processo PM2 antigo:
pm2 delete all
pm2 kill

# Se for outro processo Node:
kill -9 $(lsof -t -i:3000)
```

## 3. Verificar se a porta está livre
```bash
netstat -tulpn | grep 3000
# Não deve retornar nada
```

## 4. Reiniciar o PM2 corretamente
```bash
cd /var/www/maktubia-dashboard
pm2 start npm --name "maktubia-dashboard" -- start
pm2 save
```

## 5. Verificar logs
```bash
pm2 logs maktubia-dashboard --lines 20
```


