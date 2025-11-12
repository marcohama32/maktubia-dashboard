# Corrigir Erro "MissingStaticPage" no Next.js

## Problema
O Next.js está tentando carregar páginas estáticas HTML que não existem:
```
MissingStaticPage [Error]: Failed to load static file for page: / 
ENOENT: no such file or directory, open '/var/www/maktubia-dashboard/.next/server/pages/index.html'
```

## Solução Passo a Passo

### 1. Verificar se a pasta `.next/server/pages/` existe

```bash
# Verificar estrutura do .next
ls -la .next/server/

# Verificar se existe a pasta pages
ls -la .next/server/pages/
```

### 2. Se a pasta não existir ou estiver vazia, fazer rebuild limpo

```bash
# Parar o Next.js
pm2 stop maktubia-dashboard

# Remover completamente a pasta .next
rm -rf .next

# Limpar cache do npm
rm -rf node_modules/.cache

# Fazer novo build
npm run build

# Verificar se a pasta foi criada
ls -la .next/server/pages/
```

### 3. Verificar se os arquivos foram gerados corretamente

```bash
# Verificar estrutura completa
tree .next/server/pages/ -L 2

# Ou usar ls recursivo
find .next/server/pages/ -type f | head -20
```

### 4. Se ainda não funcionar, verificar configuração do Next.js

O problema pode ser que o Next.js está configurado incorretamente. Verifique o `next.config.js`:

```bash
cat next.config.js | grep -A 5 "output"
```

**NÃO deve ter `output: 'export'`** se você está usando `next start` (modo servidor).

### 5. Reconstruir e reiniciar

```bash
# Rebuild completo
rm -rf .next node_modules/.cache
npm run build

# Verificar se build foi bem-sucedido
ls -la .next/server/pages/

# Iniciar novamente
pm2 restart maktubia-dashboard

# Ver logs
pm2 logs maktubia-dashboard --lines 30
```

## Comandos Completos (Copy & Paste)

```bash
# Sequência completa de correção
cd /var/www/maktubia-dashboard
pm2 stop maktubia-dashboard
rm -rf .next node_modules/.cache
npm run build
ls -la .next/server/pages/
pm2 start npm --name "maktubia-dashboard" -- start:3001
pm2 save
pm2 logs maktubia-dashboard --lines 20
```

## Verificação

Após o rebuild, verifique:

1. **A pasta existe:**
   ```bash
   ls -la .next/server/pages/
   ```
   Deve mostrar arquivos `.js` e `.json`

2. **O Next.js inicia sem erros:**
   ```bash
   pm2 logs maktubia-dashboard --lines 20
   ```
   Não deve mostrar erros de "MissingStaticPage"

3. **A aplicação responde:**
   ```bash
   curl http://localhost:3001
   ```
   Deve retornar HTML (não erro)

## Problemas Comuns

### Build falha
- Verifique espaço em disco: `df -h`
- Verifique permissões: `ls -la .next`
- Verifique logs do build: `npm run build 2>&1 | tail -50`

### Pasta .next/server/pages/ não é criada
- Verifique se o build completou sem erros
- Verifique se há erros no terminal durante o build
- Tente fazer build localmente primeiro para comparar

### Ainda mostra erro após rebuild
- Verifique se o `next.config.js` não tem `output: 'export'`
- Verifique se está usando `next start` e não `next export`
- Verifique variáveis de ambiente: `cat .env.production`

## Notas Importantes

- **NÃO use `output: 'export'`** se você está rodando com `next start` (modo servidor)
- **Use `output: 'export'`** apenas se você quer fazer upload estático (sem servidor Node.js)
- **O modo servidor** (`next start`) precisa da pasta `.next/server/pages/` com arquivos `.js`
- **O modo estático** (`next export`) cria uma pasta `out/` com arquivos `.html`

