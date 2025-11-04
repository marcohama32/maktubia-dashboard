# 🚀 Deploy na Vercel + DNS na Hostinger - Passo a Passo Completo

Este guia explica **passo a passo** como fazer deploy na Vercel e configurar o DNS na Hostinger para o domínio **marcohama.com**.

---

## 📋 Pré-requisitos

- [ ] Conta no GitHub/GitLab/Bitbucket (ou código pronto para subir)
- [ ] Conta na Vercel (pode criar gratuitamente)
- [ ] Domínio **marcohama.com** na Hostinger
- [ ] Acesso ao painel da Hostinger

---

## 🎯 Passo 1: Preparar o Código

### 1.1. Testar build localmente

```bash
# No terminal, na pasta do projeto
npm run build
```

Se funcionar sem erros, está pronto!

### 1.2. Configurar variáveis de ambiente (opcional - pode fazer depois)

Crie um arquivo `.env.production` na raiz do projeto:

```env
NEXT_PUBLIC_API_BASE_URL=https://72.60.20.31:8000/api
NEXT_PUBLIC_WS_URL=ws://72.60.20.31:8000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

**⚠️ IMPORTANTE:** Se seu backend não tem HTTPS, use `http://` mas pode ter problemas de CORS. O ideal é usar HTTPS.

### 1.3. Commit e Push para Git

```bash
# Verificar se está no Git
git status

# Se não estiver inicializado
git init
git add .
git commit -m "Preparar para deploy na Vercel"

# Criar repositório no GitHub (se não tiver)
# 1. Acesse github.com
# 2. Clique em "New repository"
# 3. Crie um repositório (ex: maktubia-dashboard)
# 4. Copie a URL do repositório

# Adicionar remote e push
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

**Se já tiver Git configurado:**
```bash
git add .
git commit -m "Preparar para deploy"
git push
```

---

## 🚀 Passo 2: Deploy na Vercel

### 2.1. Criar conta na Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"** (ou GitLab/Bitbucket)
4. Autorize a Vercel a acessar seus repositórios
5. Faça login

### 2.2. Criar novo projeto

1. Na página inicial da Vercel, clique em **"Add New..."** > **"Project"**
2. Você verá seus repositórios do GitHub
3. **Encontre seu repositório** e clique em **"Import"**

### 2.3. Configurar projeto

Na tela de configuração:

1. **Project Name:** (pode deixar o padrão ou mudar para `marcohama`)
2. **Framework Preset:** Deve detectar automaticamente **Next.js** ✅
3. **Root Directory:** Deixe em branco (se o projeto está na raiz)
4. **Build Command:** Deixe padrão (`npm run build`) ✅
5. **Output Directory:** Deixe padrão (`.next`) ✅
6. **Install Command:** Deixe padrão (`npm install`) ✅

### 2.4. Configurar Variáveis de Ambiente

**ANTES de clicar em Deploy**, configure as variáveis:

1. **Role para Environment Variables:**
   - Clique em **"Environment Variables"**
   - Expanda a seção

2. **Adicionar cada variável:**
   - Clique em **"Add New"**
   - **Name:** `NEXT_PUBLIC_API_BASE_URL`
   - **Value:** `http://72.60.20.31:8000/api` (ou `https://` se tiver SSL)
   - **Environment:** Selecione **Production, Preview, Development**
   - Clique em **"Save"**

3. **Repetir para todas as variáveis:**
   ```
   NEXT_PUBLIC_API_BASE_URL
   NEXT_PUBLIC_WS_URL (opcional)
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   NEXT_PUBLIC_FIREBASE_VAPID_KEY
   ```

4. **Verificar:**
   - Todas as variáveis devem aparecer na lista
   - Environment deve estar em **Production, Preview, Development**

### 2.5. Fazer Deploy

1. Clique em **"Deploy"** (botão no final da página)
2. Aguarde o build (pode levar 2-5 minutos)
3. Você verá o progresso do build em tempo real
4. Quando terminar, verá **"Ready"** ou **"Success"**

### 2.6. Verificar Deploy

1. Após o deploy, você terá uma URL temporária:
   - Exemplo: `seu-projeto-abc123.vercel.app`
2. Clique na URL para testar o site
3. Verifique se carrega corretamente

**✅ Se funcionar, está pronto para o próximo passo!**

---

## 🌐 Passo 3: Adicionar Domínio na Vercel

### 3.1. Acessar configurações de domínio

1. No projeto da Vercel, clique em **"Settings"** (no topo)
2. No menu lateral, clique em **"Domains"**

### 3.2. Adicionar domínio

1. No campo **"Add Domain"**, digite: `marcohama.com`
2. Clique em **"Add"**
3. A Vercel mostrará instruções de DNS

### 3.3. Copiar instruções de DNS

A Vercel mostrará algo como:

**Opção 1 - CNAME (Recomendado):**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

**Opção 2 - A Record (Alternativa):**
```
Type: A
Name: @
Value: 76.76.21.21 (IP fornecido pela Vercel)
```

**⚠️ IMPORTANTE:** Anote essas informações! Você precisará delas no próximo passo.

---

## 🎯 Passo 4: Configurar DNS na Hostinger

### 4.1. Acessar painel da Hostinger

1. Acesse [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Faça login com suas credenciais
3. Na página inicial, encontre o domínio **marcohama.com**

### 4.2. Acessar configurações DNS

1. Clique no domínio **marcohama.com**
2. Ou vá em **Domains** > **marcohama.com**
3. No menu lateral, clique em **"DNS / Nameservers"**
4. Ou clique em **"Gerenciar"** > **"DNS / Nameservers"**

### 4.3. Adicionar registro CNAME (Recomendado)

1. **Role até a seção "Registros DNS"** ou **"DNS Records"**
2. Clique em **"Adicionar Registro"** ou botão **"+"**
3. Preencha:
   - **Tipo:** Selecione `CNAME`
   - **Nome:** Digite `@` (ou deixe vazio - representa o domínio raiz)
   - **Valor:** `cname.vercel-dns.com` (valor fornecido pela Vercel)
   - **TTL:** `3600` (ou padrão)
4. Clique em **"Salvar"** ou **"Adicionar"**

### 4.4. Adicionar www (opcional)

Se quiser que `www.marcohama.com` também funcione:

1. Clique em **"Adicionar Registro"**
2. Preencha:
   - **Tipo:** `CNAME`
   - **Nome:** `www`
   - **Valor:** `cname.vercel-dns.com`
   - **TTL:** `3600`
3. Clique em **"Salvar"**

### 4.5. Verificar registros

Após adicionar, você deve ver algo como:

```
Tipo | Nome | Valor                    | TTL
-----|------|--------------------------|-----
CNAME| @    | cname.vercel-dns.com     | 3600
CNAME| www  | cname.vercel-dns.com     | 3600
```

**✅ DNS configurado!**

### 4.6. Alternativa: Usar Registro A (se Vercel fornecer IP)

Se a Vercel fornecer um IP específico ao invés de CNAME:

1. Clique em **"Adicionar Registro"**
2. Preencha:
   - **Tipo:** `A`
   - **Nome:** `@` (ou deixe vazio)
   - **Valor:** `IP_FORNECIDO_PELA_VERCEL` (ex: 76.76.21.21)
   - **TTL:** `3600`
3. Clique em **"Salvar"**

---

## ⏱️ Passo 5: Aguardar Propagação DNS

### 5.1. Tempo de propagação

- **Normal:** 5 minutos a 1 hora
- **Máximo:** Até 24-48 horas
- **Em média:** 15-30 minutos

### 5.2. Verificar propagação DNS

1. Acesse [whatsmydns.net](https://www.whatsmydns.net/#CNAME/marcohama.com)
2. Digite: `marcohama.com`
3. Selecione tipo: **CNAME**
4. Clique em **"Search"**
5. Verifique se aparece `cname.vercel-dns.com` em vários servidores

**Ou verificar A record:**
- Acesse [whatsmydns.net](https://www.whatsmydns.net/#A/marcohama.com)
- Digite: `marcohama.com`
- Tipo: **A**
- Verifique se aparece o IP da Vercel

### 5.3. Verificar na Vercel

1. Volte para a Vercel
2. Vá em **Settings** > **Domains**
3. Ao lado de `marcohama.com`, você verá o status:
   - **"Validating"** - Aguardando verificação
   - **"Valid"** ✅ - Funcionando!
   - **"Invalid"** - Verificar DNS novamente

4. Se estiver **"Validating"**, aguarde alguns minutos e clique em **"Refresh"**

---

## ✅ Passo 6: Verificar e Testar

### 6.1. Testar site

1. Abra o navegador
2. Acesse: `https://marcohama.com`
3. Verifique se o site carrega
4. Teste login e funcionalidades

### 6.2. Verificar HTTPS

- A Vercel configura SSL automaticamente via Let's Encrypt
- Aguarde alguns minutos após verificação DNS
- O HTTPS será ativado automaticamente

### 6.3. Verificar redirecionamento

- `http://marcohama.com` deve redirecionar para `https://marcohama.com`
- `www.marcohama.com` deve redirecionar para `marcohama.com` (se configurado)

---

## 🔄 Passo 7: Atualizar Código (Futuro)

### 7.1. Fazer mudanças

Quando fizer mudanças no código:

```bash
# Fazer mudanças no código
git add .
git commit -m "Descrição das mudanças"
git push
```

### 7.2. Deploy automático

- A Vercel detecta automaticamente o push
- Faz build automaticamente
- Deploy automático em produção
- **Sem necessidade de fazer nada!**

### 7.3. Verificar deploy

1. Na Vercel, você verá o novo deploy na aba **"Deployments"**
2. Aguarde o build completar
3. Quando mostrar **"Ready"**, está no ar!

---

## 📝 Checklist Completo

### Antes do Deploy:
- [ ] Código commitado no Git
- [ ] Build funciona localmente (`npm run build`)
- [ ] Conta na Vercel criada
- [ ] Variáveis de ambiente listadas

### Deploy na Vercel:
- [ ] Projeto criado na Vercel
- [ ] Repositório conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy executado com sucesso
- [ ] Site acessível na URL temporária (.vercel.app)

### Configuração DNS:
- [ ] Domínio adicionado na Vercel
- [ ] Instruções de DNS copiadas
- [ ] DNS configurado na Hostinger
- [ ] Registros CNAME ou A adicionados
- [ ] Registros salvos corretamente

### Verificação:
- [ ] DNS propagado (verificado em whatsmydns.net)
- [ ] Domínio verificado na Vercel (status: "Valid")
- [ ] Site acessível em marcohama.com
- [ ] HTTPS funcionando
- [ ] Login e funcionalidades testadas

---

## 🆘 Troubleshooting

### Build falha na Vercel

**Problema:** Build falha com erro

**Soluções:**
1. Verificar logs na Vercel (aba "Deployments" > clicar no deploy > "Build Logs")
2. Verificar se todas as dependências estão no `package.json`
3. Verificar se há erros de TypeScript: `npm run lint`
4. Verificar se build funciona localmente: `npm run build`

### DNS não verifica na Vercel

**Problema:** Status permanece "Validating" ou "Invalid"

**Soluções:**
1. Verificar se DNS está configurado corretamente na Hostinger
2. Verificar propagação DNS: [whatsmydns.net](https://www.whatsmydns.net)
3. Aguardar até 24h (pode levar tempo)
4. Verificar se não há outros registros conflitantes
5. Remover registros antigos que possam estar conflitando

### Site não carrega após DNS

**Problema:** DNS verificado mas site não carrega

**Soluções:**
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Testar em modo anônimo/privado
3. Verificar se HTTPS está ativo (aguarde alguns minutos)
4. Verificar logs na Vercel (aba "Functions" ou "Deployments")

### Erro de CORS

**Problema:** Erro de CORS ao chamar API

**Soluções:**
1. Verificar se `NEXT_PUBLIC_API_BASE_URL` está configurada corretamente
2. Configurar CORS no backend para aceitar requisições de `marcohama.com`
3. Verificar se backend aceita requisições de `https://marcohama.com`

### WebSocket não funciona

**Problema:** WebSocket não conecta

**Soluções:**
1. Verificar se `NEXT_PUBLIC_WS_URL` está configurada
2. Verificar se backend aceita conexões WebSocket de `marcohama.com`
3. Verificar se WebSocket está acessível publicamente

---

## 💡 Dicas Importantes

### 1. Variáveis de Ambiente

- **Sempre use `NEXT_PUBLIC_`** no início para variáveis que o navegador precisa
- Variáveis sem `NEXT_PUBLIC_` só funcionam no servidor
- Configure em **Production, Preview, Development** para funcionar em todos os ambientes

### 2. URLs de API

- **Use HTTPS** em produção: `https://seu-backend.com/api`
- Se não tiver SSL no backend, pode usar `http://` mas pode ter problemas de CORS
- Configure CORS no backend para aceitar requisições de `marcohama.com`

### 3. Deploy Automático

- A Vercel faz deploy automaticamente a cada push no Git
- Não precisa fazer nada manualmente após o primeiro deploy
- Cada push gera um novo deploy

### 4. Preview Deployments

- A Vercel cria previews para cada branch/PR
- Você pode testar mudanças antes de fazer merge
- URLs temporárias: `seu-projeto-git-branch.vercel.app`

---

## 📞 Suporte

### Vercel
- **Documentação:** [vercel.com/docs](https://vercel.com/docs)
- **Suporte:** [vercel.com/support](https://vercel.com/support)
- **Status:** [vercel-status.com](https://vercel-status.com)

### Hostinger
- **Suporte:** [support.hostinger.com](https://support.hostinger.com)
- **Chat ao vivo:** Disponível no painel
- **Email:** support@hostinger.com

---

## 🎯 Próximos Passos Após Deploy

1. **Configurar monitoramento** (opcional)
   - Vercel Analytics
   - Google Analytics

2. **Configurar backup** (opcional)
   - Backup do código no Git
   - Backup do banco de dados

3. **Otimizar performance**
   - Verificar Core Web Vitals
   - Otimizar imagens
   - Configurar CDN (já incluído na Vercel)

4. **Configurar domínios adicionais** (se necessário)
   - Subdomínios
   - Domínios alternativos

---

## ✅ Resumo Rápido

1. **Git:** Commit e push do código
2. **Vercel:** Criar projeto e fazer deploy
3. **Variáveis:** Configurar variáveis de ambiente
4. **Domínio:** Adicionar marcohama.com na Vercel
5. **DNS:** Configurar CNAME na Hostinger
6. **Aguardar:** Propagação DNS (5 min - 1h)
7. **Testar:** Acessar marcohama.com

**Pronto! 🎉**

Se precisar de ajuda em algum passo específico, me avise!

