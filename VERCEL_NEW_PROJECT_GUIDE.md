# 🔄 Guia: Criar Novo Projeto no Vercel

Se o cache persistir, criar um novo projeto pode resolver.

## Passo a Passo

### 1. Criar Novo Projeto no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Add New Project"**
3. Selecione o mesmo repositório: `marcohama32/maktubia-dashboard`
4. Configure:
   - **Framework Preset**: Next.js (deve detectar automaticamente)
   - **Root Directory**: `./` (raiz)
   - **Build Command**: Deixe vazio (usará o `vercel.json`)
   - **Output Directory**: Deixe vazio (Next.js usa `.next` automaticamente)
   - **Install Command**: `npm install`

### 2. Configurar Variáveis de Ambiente

Copie todas as variáveis de ambiente do projeto antigo:

1. No projeto antigo: **Settings** → **Environment Variables**
2. Anote todas as variáveis
3. No novo projeto: **Settings** → **Environment Variables**
4. Adicione todas as variáveis novamente

### 3. Configurar Domínio (se aplicável)

1. No novo projeto: **Settings** → **Domains**
2. Adicione o domínio (ex: `marcohama.com`)
3. Configure o DNS se necessário

### 4. Fazer Deploy

1. Clique em **Deploy**
2. O Vercel fará o build com o código mais recente (commit `7153838` ou mais recente)
3. Aguarde o build completar

### 5. Apagar Projeto Antigo (Opcional)

Depois que o novo projeto estiver funcionando:

1. No projeto antigo: **Settings** → **General**
2. Role até o final
3. Clique em **Delete Project**
4. Confirme a exclusão

## ⚠️ Importante

- **Não apague o projeto antigo** até confirmar que o novo está funcionando
- Mantenha ambos por alguns dias para garantir que tudo está OK
- O novo projeto terá um novo URL (ex: `projeto-novo.vercel.app`)
- Se tiver domínio customizado, você precisará atualizar o DNS

## ✅ Vantagens de Criar Novo Projeto

- ✅ Cache completamente limpo
- ✅ Build fresh do zero
- ✅ Garantia de usar o código mais recente
- ✅ Sem problemas de cache persistente

## 📝 Checklist

- [ ] Novo projeto criado no Vercel
- [ ] Variáveis de ambiente copiadas
- [ ] Domínio configurado (se aplicável)
- [ ] Build bem-sucedido
- [ ] Aplicação funcionando corretamente
- [ ] Projeto antigo deletado (após confirmação)

