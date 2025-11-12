# Reiniciar Next.js na VPS após Build

## Comandos para Reiniciar

Após fazer o build, você precisa reiniciar o Next.js para que ele use os novos arquivos estáticos:

```bash
# Reiniciar o processo do Next.js
pm2 restart maktubia-dashboard

# Verificar se está rodando corretamente
pm2 status

# Ver logs para confirmar que iniciou corretamente
pm2 logs maktubia-dashboard --lines 50
```

## Verificação

1. Verificar se o processo está online:
   ```bash
   pm2 status
   ```
   Deve mostrar `maktubia-dashboard` com status `online`

2. Testar se está respondendo:
   ```bash
   curl http://localhost:3001
   ```

3. Verificar se os arquivos estáticos estão sendo servidos:
   ```bash
   curl http://localhost:3001/_next/static/chunks/pages/_app-7d5de41eb1858d50.js
   ```
   Deve retornar o conteúdo do arquivo JavaScript (não HTML)

4. Recarregar Nginx (se necessário):
   ```bash
   sudo systemctl reload nginx
   ```

## Se o processo não reiniciar corretamente

Se o `pm2 restart` não funcionar, pare e inicie novamente:

```bash
# Parar o processo
pm2 stop maktubia-dashboard

# Iniciar novamente
pm2 start npm --name "maktubia-dashboard" -- start:3001

# Salvar configuração
pm2 save
```

## Comandos Completos (Copy & Paste)

```bash
# Reiniciar Next.js
pm2 restart maktubia-dashboard

# Verificar status
pm2 status

# Ver logs
pm2 logs maktubia-dashboard --lines 20

# Recarregar Nginx
sudo systemctl reload nginx
```

