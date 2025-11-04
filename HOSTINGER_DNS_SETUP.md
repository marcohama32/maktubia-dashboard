# 📝 Configuração DNS na Hostinger - Guia Visual

## Passo a Passo para Configurar DNS na Hostinger

### 1. Acessar o Painel da Hostinger

1. Acesse [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Faça login com suas credenciais
3. Na página inicial, encontre seu domínio **marcohama.com**
4. Clique no domínio ou vá em **Domains** > **marcohama.com**

### 2. Acessar Configurações DNS

1. No menu lateral, clique em **DNS / Nameservers**
2. Ou clique em **Gerenciar** > **DNS / Nameservers**

### 3. Configurar para Vercel (Recomendado)

#### Opção A: Usando CNAME (Mais Simples)

1. Role até a seção **Registros DNS** ou **DNS Records**
2. Clique em **Adicionar Registro** ou **+**
3. Preencha:
   - **Tipo:** Selecione `CNAME`
   - **Nome:** Deixe vazio ou digite `@` (representa o domínio raiz)
   - **Valor:** `cname.vercel-dns.com`
   - **TTL:** `3600` (ou padrão)
4. Clique em **Salvar** ou **Adicionar**

5. Para **www** (opcional):
   - **Tipo:** `CNAME`
   - **Nome:** `www`
   - **Valor:** `cname.vercel-dns.com`
   - **TTL:** `3600`
   - Clique em **Salvar**

#### Opção B: Usando Registro A (Alternativa)

Se a Vercel fornecer um IP específico:

1. Clique em **Adicionar Registro**
2. Preencha:
   - **Tipo:** `A`
   - **Nome:** `@` ou deixe vazio
   - **Valor:** `IP_FORNECIDO_PELA_VERCEL` (ex: 76.76.21.21)
   - **TTL:** `3600`
3. Clique em **Salvar**

### 4. Configurar para Netlify

1. Clique em **Adicionar Registro**
2. Para domínio raiz:
   - **Tipo:** `A`
   - **Nome:** `@`
   - **Valor:** `75.2.60.5` (ou IP fornecido pela Netlify)
   - **TTL:** `3600`
   - Clique em **Salvar**

3. Para www:
   - **Tipo:** `CNAME`
   - **Nome:** `www`
   - **Valor:** `marcohama.com` (ou valor fornecido pela Netlify)
   - **TTL:** `3600`
   - Clique em **Salvar**

### 5. Configurar para VPS Próprio

1. Clique em **Adicionar Registro**
2. Preencha:
   - **Tipo:** `A`
   - **Nome:** `@`
   - **Valor:** `IP_DO_SEU_VPS` (ex: 185.123.45.67)
   - **TTL:** `3600`
3. Clique em **Salvar**

### 6. Verificar Configuração

Após adicionar os registros, você verá algo assim:

```
Tipo | Nome | Valor                    | TTL
-----|------|--------------------------|-----
A    | @    | IP_DO_SERVIDOR           | 3600
CNAME| www  | marcohama.com            | 3600
```

Ou para Vercel:
```
Tipo | Nome | Valor                    | TTL
-----|------|--------------------------|-----
CNAME| @    | cname.vercel-dns.com     | 3600
CNAME| www  | cname.vercel-dns.com     | 3600
```

### 7. Aguardar Propagação

- **Tempo esperado:** 5 minutos a 1 hora
- **Máximo:** Até 24-48 horas
- **Verificar:** [whatsmydns.net](https://www.whatsmydns.net/#A/marcohama.com)

### 8. Verificar na Plataforma (Vercel/Netlify)

1. Volte para a Vercel/Netlify
2. Na seção de domínios, clique em **Refresh** ou **Verify**
3. Aguarde a verificação (pode levar alguns minutos)
4. Quando mostrar **"Valid"** ou **"Verified"**, está pronto!

---

## ⚠️ Pontos Importantes

### Remover Registros Antigos

Se houver registros A ou CNAME antigos apontando para outros lugares:
1. Encontre-os na lista
2. Clique em **Editar** ou **Lixeira**
3. Remova ou atualize para os novos valores

### Não Remover Registros Essenciais

**Mantenha estes registros:**
- Registros MX (para email, se usar)
- Registros TXT (para verificação, SPF, DKIM, etc)
- Nameservers padrão (se não estiver usando DNS externo)

### TTL (Time To Live)

- **3600** = 1 hora (recomendado)
- **1800** = 30 minutos (mais rápido, mas mais requisições)
- **86400** = 24 horas (mais lento para mudanças)

---

## 🔍 Como Verificar se Funcionou

### 1. Verificar DNS Global
- Acesse [whatsmydns.net](https://www.whatsmydns.net/#A/marcohama.com)
- Digite: `marcohama.com`
- Selecione tipo: `A` ou `CNAME`
- Verifique se aparece o IP/valor correto em vários servidores

### 2. Verificar no Terminal

**Windows (PowerShell):**
```powershell
nslookup marcohama.com
```

**Mac/Linux:**
```bash
dig marcohama.com
# ou
nslookup marcohama.com
```

### 3. Verificar na Plataforma

- Vercel: Settings > Domains > Status deve mostrar "Valid"
- Netlify: Site settings > Domain management > Status deve mostrar "Verified"

---

## 🆘 Problemas Comuns

### DNS não atualiza após 24h
- Verifique se salvou corretamente
- Verifique se não há conflito com outros registros
- Limpe cache DNS local: `ipconfig /flushdns` (Windows) ou `sudo dscacheutil -flushcache` (Mac)

### Domínio não verifica na plataforma
- Aguarde até 48h
- Verifique se o DNS está correto no whatsmydns.net
- Entre em contato com suporte da plataforma

### Site não carrega
- Verifique se o build foi bem-sucedido
- Verifique logs na plataforma
- Verifique se o DNS está propagado corretamente

---

## 📞 Suporte Hostinger

Se tiver problemas:
- **Chat ao vivo:** Disponível no painel
- **Email:** support@hostinger.com
- **Base de conhecimento:** [support.hostinger.com](https://support.hostinger.com)

