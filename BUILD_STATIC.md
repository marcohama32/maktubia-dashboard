# 🚀 Build Estático - Instruções Rápidas

## Para fazer upload simples dos arquivos:

### 1. Ativar Export Estático

**Opção A: Substituir next.config.js**

```bash
# Fazer backup do config atual
cp next.config.js next.config.server.js

# Usar config para export estático
cp next.config.static.js next.config.js
```

**Opção B: Editar next.config.js manualmente**

Edite `next.config.js` e adicione:
```javascript
output: 'export',
images: {
  unoptimized: true,
},
```

### 2. Configurar Variáveis de Ambiente

Crie `.env.production`:
```env
NEXT_PUBLIC_API_BASE_URL=https://seu-backend.com/api
NEXT_PUBLIC_WS_URL=wss://seu-backend.com
# ... outras variáveis
```

### 3. Build

```bash
npm run build
```

Isso criará a pasta **`out`** com todos os arquivos.

### 4. Upload

1. Acesse File Manager da Hostinger
2. Vá em `public_html`
3. Upload de **TODO o conteúdo** da pasta `out`
4. Upload também o arquivo `.htaccess`

### 5. Testar

Acesse: `https://marcohama.com`

---

## ⚠️ IMPORTANTE

- **Antes de fazer upload:** Teste localmente com `npm run build` e verifique se funciona
- **Pasta `out`:** Upload do **conteúdo** da pasta, não a pasta em si
- **`.htaccess`:** Coloque na raiz do `public_html`
- **API:** Todas as chamadas devem usar URLs completas (https://)

---

## 🔄 Para voltar ao modo servidor:

```bash
# Restaurar config original
cp next.config.server.js next.config.js

# Ou remover as linhas de export estático
```

