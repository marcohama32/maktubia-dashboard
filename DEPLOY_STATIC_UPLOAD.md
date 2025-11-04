# 📤 Deploy por Upload de Arquivos - marcohama.com

Este guia explica como fazer **export estático** do Next.js e fazer upload dos arquivos para o domínio na Hostinger via FTP/File Manager.

## ⚠️ Limitações do Export Estático

O Next.js pode ser exportado como site estático, mas **NÃO suporta**:
- ❌ API Routes (`/api/*`)
- ❌ Server-Side Rendering (SSR)
- ❌ Incremental Static Regeneration (ISR)
- ❌ WebSocket (precisa de servidor Node.js)
- ❌ Algumas funcionalidades dinâmicas

**✅ Funciona:**
- ✅ Páginas estáticas
- ✅ Client-Side Rendering
- ✅ Navegação entre páginas
- ✅ Chamadas para API externa (seu backend)

---

## 📋 Passo a Passo

### Passo 1: Configurar Export Estático

1. **Atualizar `next.config.js`:**

O arquivo será atualizado para gerar export estático.

2. **Build do projeto:**

```bash
npm run build
```

Isso criará uma pasta `out` com todos os arquivos estáticos.

### Passo 2: Verificar Arquivos Gerados

Após o build, você terá:
```
out/
├── index.html
├── login.html
├── admin/
│   ├── users/
│   │   └── index.html
│   └── ...
├── _next/
│   ├── static/
│   └── ...
└── ...
```

### Passo 3: Upload para Hostinger

#### Opção A: Via File Manager da Hostinger

1. **Acesse o painel da Hostinger:**
   - Vá em [hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Faça login
   - Vá em **Files** > **File Manager**

2. **Acesse a pasta do domínio:**
   - Navegue até `public_html` (ou `htdocs` ou pasta do seu domínio)
   - Se for subdomínio: `public_html/subdominio` ou pasta específica

3. **Upload dos arquivos:**
   - **Selecione TODOS os arquivos** dentro da pasta `out`
   - Faça upload para `public_html`
   - **IMPORTANTE:** Faça upload do **conteúdo** da pasta `out`, não a pasta `out` em si

4. **Estrutura final deve ser:**
   ```
   public_html/
   ├── index.html
   ├── login.html
   ├── admin/
   ├── _next/
   └── ...
   ```

#### Opção B: Via FTP

1. **Obter credenciais FTP da Hostinger:**
   - No painel: **Files** > **FTP Accounts**
   - Anote: Host, Usuário, Senha, Porta

2. **Conectar via FTP:**
   - Use FileZilla, WinSCP ou outro cliente FTP
   - Conecte com as credenciais

3. **Upload dos arquivos:**
   - Navegue até `public_html`
   - Faça upload do **conteúdo** da pasta `out`

---

## ⚙️ Configuração Detalhada

### 1. Atualizar next.config.js para Export Estático

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // ⚠️ IMPORTANTE: Ativar export estático
  output: 'export',
  
  // Desabilitar otimizações que precisam de servidor
  images: {
    unoptimized: true, // Necessário para export estático
  },
  
  // Configuração para Service Worker do Firebase
  async headers() {
    return [
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
```

### 2. Adicionar Script de Build Estático

Adicione no `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:static": "next build && next export",
    "start": "next start",
    "export": "next build"
  }
}
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.production` com:

```env
NEXT_PUBLIC_API_BASE_URL=https://seu-backend.com/api
NEXT_PUBLIC_WS_URL=wss://seu-backend.com
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

**⚠️ IMPORTANTE:** Use URLs completas (com https://) para produção!

### 4. Build do Projeto

```bash
# Instalar dependências (se necessário)
npm install

# Build para produção com export estático
npm run build
```

Isso criará a pasta `out` com todos os arquivos.

### 5. Verificar Arquivos Gerados

```bash
# Verificar se a pasta out foi criada
ls -la out

# Ou no Windows
dir out
```

---

## 🔧 Ajustes Necessários

### 1. Remover ou Ajustar API Routes

Se você tem API routes (`src/pages/api/*`), elas **NÃO funcionarão** no export estático.

**Solução:** Todas as chamadas de API já estão configuradas para usar seu backend externo, então não há problema.

### 2. Ajustar WebSocket

O WebSocket precisa de um servidor. Se você usar export estático, o WebSocket pode não funcionar completamente.

**Solução:** Configure o WebSocket para apontar diretamente para seu backend.

### 3. Configurar .htaccess (Apache)

Se a Hostinger usar Apache, crie um arquivo `.htaccess` na raiz (`public_html/.htaccess`):

```apache
# Habilitar rewrite engine
RewriteEngine On

# Redirecionar todas as requisições para index.html (para rotas do Next.js)
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache para arquivos estáticos
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>

# Compressão GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Headers de segurança
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

### 4. Configurar web.config (IIS - se usar Windows Server)

Se a Hostinger usar IIS, crie `web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

---

## 📝 Checklist de Upload

- [ ] Configurar `next.config.js` com `output: 'export'`
- [ ] Configurar `images: { unoptimized: true }`
- [ ] Criar `.env.production` com URLs de produção
- [ ] Executar `npm run build`
- [ ] Verificar se pasta `out` foi criada
- [ ] Acessar File Manager ou FTP da Hostinger
- [ ] Navegar até `public_html`
- [ ] Upload de **TODO o conteúdo** da pasta `out`
- [ ] Criar `.htaccess` (se Apache) ou `web.config` (se IIS)
- [ ] Verificar se `index.html` está na raiz
- [ ] Testar site em marcohama.com

---

## 🆘 Troubleshooting

### Página branca após upload

1. Verificar se `index.html` está na raiz de `public_html`
2. Verificar se `.htaccess` está configurado corretamente
3. Verificar console do navegador para erros
4. Verificar se as URLs dos recursos estão corretas

### Rotas não funcionam (404)

- Verificar `.htaccess` ou `web.config`
- Verificar se todas as páginas foram geradas em `out`
- Verificar se o servidor suporta rewrite rules

### Imagens não carregam

- Verificar se `images: { unoptimized: true }` está configurado
- Verificar se as URLs das imagens estão corretas
- Verificar se as imagens foram uploadadas corretamente

### API não funciona

- Verificar se `NEXT_PUBLIC_API_BASE_URL` está configurado corretamente
- Verificar se a URL do backend está acessível
- Verificar CORS no backend

### WebSocket não funciona

- WebSocket pode não funcionar completamente em export estático
- Configure o WebSocket para apontar diretamente para o backend
- Verificar se o backend aceita conexões WebSocket

---

## 🎯 Vantagens do Upload Simples

✅ **Simples:** Apenas upload de arquivos
✅ **Rápido:** Não precisa configurar servidor
✅ **Econômico:** Funciona com Shared Hosting
✅ **Sem dependências:** Não precisa de Node.js no servidor

## ⚠️ Desvantagens

❌ **Limitações:** Não funciona SSR, API Routes
❌ **WebSocket:** Pode não funcionar completamente
❌ **Manutenção:** Precisa rebuild e re-upload a cada mudança
❌ **Sem deploy automático:** Mudanças são manuais

---

## 📞 Próximos Passos

1. Siga os passos acima para configurar export estático
2. Faça build: `npm run build`
3. Upload dos arquivos da pasta `out`
4. Teste o site

Se precisar de ajuda com algum passo, me avise!

