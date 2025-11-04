# 📤 Upload Simples - marcohama.com

## 🎯 Como Fazer Upload dos Arquivos para Hostinger

### Passo 1: Build do Projeto

```bash
# Instalar dependências (se necessário)
npm install

# Build do projeto (cria pasta 'out')
npm run build
```

Isso criará a pasta **`out`** com todos os arquivos estáticos.

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

### Passo 3: Upload via File Manager da Hostinger

1. **Acesse o painel da Hostinger:**
   - Acesse [hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Faça login
   - Vá em **Files** > **File Manager**

2. **Navegue até public_html:**
   - Clique em **public_html** (ou **htdocs** ou pasta do seu domínio)
   - Se for subdomínio: `public_html/subdominio`

3. **Limpar pasta (opcional):**
   - Delete todos os arquivos antigos (se houver)
   - Ou faça backup antes

4. **Upload dos arquivos:**
   - **Selecione TODOS os arquivos** dentro da pasta `out` (não a pasta `out` em si)
   - Faça upload para `public_html`
   - **IMPORTANTE:** Upload do **conteúdo** da pasta `out`, não a pasta `out`

5. **Upload do .htaccess:**
   - Faça upload do arquivo `.htaccess` que está na raiz do projeto
   - Coloque na raiz de `public_html`

### Passo 4: Verificar Estrutura Final

Após upload, a estrutura deve ser:
```
public_html/
├── index.html          ← deve estar aqui
├── login.html
├── admin/
│   ├── users/
│   └── ...
├── _next/
│   └── static/
├── .htaccess          ← deve estar aqui
└── ...
```

### Passo 5: Testar

1. Acesse: `http://marcohama.com`
2. Verifique se o site carrega
3. Teste login e funcionalidades

---

## ⚠️ IMPORTANTE

### Antes do Build:

1. **Configurar variáveis de ambiente:**
   - Crie `.env.production` com URLs de produção
   - Use `https://` para todas as URLs

2. **Configurar next.config.js:**
   - Já está configurado com `output: 'export'`
   - Não precisa mudar nada

### Durante Upload:

1. **Upload do CONTEÚDO da pasta `out`**, não a pasta em si
2. **Arquivo `.htaccess`** deve estar na raiz de `public_html`
3. **index.html** deve estar na raiz de `public_html`

### Após Upload:

1. Verificar se `index.html` está na raiz
2. Verificar se `.htaccess` está na raiz
3. Testar rotas (ex: `/admin/users`)

---

## 🔄 Para Atualizar o Site

1. **Fazer mudanças no código**
2. **Build novamente:**
   ```bash
   npm run build
   ```
3. **Upload novamente:**
   - Delete arquivos antigos em `public_html`
   - Upload do novo conteúdo da pasta `out`
   - Upload do `.htaccess` novamente

---

## 🆘 Problemas Comuns

### Site não carrega (página branca)

- Verificar se `index.html` está na raiz de `public_html`
- Verificar se `.htaccess` está configurado
- Verificar console do navegador para erros

### Rotas não funcionam (404)

- Verificar se `.htaccess` está na raiz
- Verificar se todas as páginas foram geradas em `out`
- Verificar se o servidor suporta rewrite rules

### Imagens não carregam

- Verificar se `images: { unoptimized: true }` está no `next.config.js`
- Verificar URLs das imagens no código

### API não funciona

- Verificar se `NEXT_PUBLIC_API_BASE_URL` está configurado
- Verificar se a URL usa `https://` em produção
- Verificar CORS no backend

---

## 📝 Checklist Rápido

- [ ] Build executado: `npm run build`
- [ ] Pasta `out` criada
- [ ] Arquivos da pasta `out` selecionados
- [ ] Upload feito para `public_html`
- [ ] `.htaccess` uploadado
- [ ] `index.html` na raiz de `public_html`
- [ ] Site testado em marcohama.com

---

## 🎯 Pronto!

Após seguir esses passos, seu site estará no ar em marcohama.com!

Para mais detalhes, veja: [DEPLOY_STATIC_UPLOAD.md](./DEPLOY_STATIC_UPLOAD.md)

