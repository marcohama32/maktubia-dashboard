# Corrigir Erro 404 em Arquivos Estáticos do Next.js

## Problema
Os arquivos estáticos do Next.js (`/_next/static/...`) estão retornando 404, causando erros como:
- `GET http://72.60.20.31/_next/static/chunks/pages/_app-xxx.js net::ERR_ABORTED 404`
- MIME type 'text/html' em vez de 'application/javascript'

## Solução Passo a Passo

### 1. Acessar a VPS via SSH
```bash
ssh seu_usuario@72.60.20.31
```

### 2. Navegar até o diretório do projeto
```bash
cd /caminho/para/dashboard-v3
# Exemplo: cd ~/dashboard-v3 ou cd /var/www/dashboard-v3
```

### 3. Fazer pull das mudanças mais recentes
```bash
git pull origin main
```

### 4. Verificar se o Next.js está rodando
```bash
# Verificar processos Node.js
ps aux | grep node

# Verificar se está rodando na porta 3001
netstat -tulpn | grep 3001
# ou
ss -tulpn | grep 3001
```

### 5. Parar o processo atual (se estiver rodando)
```bash
# Se estiver usando PM2
pm2 stop dashboard-v3
# ou
pm2 stop all

# Se estiver usando outro método
pkill -f "next start"
```

### 6. Limpar build anterior
```bash
# Remover pasta .next antiga
rm -rf .next

# Limpar cache do npm (opcional)
rm -rf node_modules/.cache
```

### 7. Instalar dependências (se necessário)
```bash
npm install
```

### 8. Fazer novo build
```bash
npm run build
```

Aguarde o build completar. Isso pode levar alguns minutos.

### 9. Verificar se o build foi criado
```bash
# Verificar se a pasta .next foi criada
ls -la .next

# Verificar se os arquivos estáticos foram gerados
ls -la .next/static
```

### 10. Iniciar o Next.js em produção
```bash
# Opção 1: Usando PM2 (recomendado)
pm2 start npm --name "dashboard-v3" -- start:3001
# ou
pm2 restart dashboard-v3

# Opção 2: Diretamente (não recomendado para produção)
PORT=3001 npm start
```

### 11. Verificar se está rodando corretamente
```bash
# Verificar logs do PM2
pm2 logs dashboard-v3

# Verificar se está respondendo
curl http://localhost:3001
```

### 12. Verificar configuração do Nginx
```bash
# Verificar configuração do nginx
sudo nginx -t

# Verificar se está servindo arquivos estáticos corretamente
sudo cat /etc/nginx/sites-available/maktubia | grep "_next/static"
```

A configuração deve ter algo como:
```nginx
location /_next/static {
    proxy_pass http://localhost:3001;
    proxy_cache_valid 200 60m;
    add_header Cache-Control "public, immutable";
}
```

### 13. Recarregar Nginx
```bash
sudo systemctl reload nginx
# ou
sudo service nginx reload
```

### 14. Verificar logs do Nginx (se ainda houver problemas)
```bash
# Ver logs de erro do nginx
sudo tail -f /var/log/nginx/error.log

# Ver logs de acesso
sudo tail -f /var/log/nginx/access.log
```

## Verificação Final

1. Acesse `http://72.60.20.31` no navegador
2. Abra o Console do Desenvolvedor (F12)
3. Verifique se não há mais erros 404 para arquivos `/_next/static/...`
4. Verifique se a aplicação carrega corretamente

## Comandos Rápidos (Copy & Paste)

```bash
# Sequência completa de comandos
cd /caminho/para/dashboard-v3
git pull origin main
pm2 stop dashboard-v3
rm -rf .next
npm install
npm run build
pm2 start npm --name "dashboard-v3" -- start:3001
pm2 save
sudo systemctl reload nginx
```

## Problemas Comuns

### Build falha
- Verifique se há erros no terminal
- Verifique se todas as dependências estão instaladas: `npm install`
- Verifique espaço em disco: `df -h`

### PM2 não inicia
- Verifique se o PM2 está instalado: `pm2 --version`
- Instale se necessário: `npm install -g pm2`
- Verifique logs: `pm2 logs dashboard-v3`

### Nginx retorna 502 Bad Gateway
- Verifique se o Next.js está rodando: `curl http://localhost:3001`
- Verifique se a porta 3001 está correta na configuração do nginx
- Verifique logs do nginx: `sudo tail -f /var/log/nginx/error.log`

### Arquivos ainda retornam 404
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Verifique se o build foi feito corretamente: `ls -la .next/static`
- Verifique se o Next.js está servindo os arquivos: `curl http://localhost:3001/_next/static/chunks/pages/_app-xxx.js`

## Notas Importantes

- **Sempre faça backup antes de fazer mudanças**: `cp -r .next .next.backup`
- **O build pode levar vários minutos** dependendo do tamanho do projeto
- **Certifique-se de ter espaço em disco suficiente** antes de fazer o build
- **Mantenha o PM2 rodando** para que a aplicação reinicie automaticamente em caso de crash

