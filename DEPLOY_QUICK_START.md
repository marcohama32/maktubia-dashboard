# 🚀 Deploy Rápido - marcohama.com

> 💡 **Seu domínio está na Hostinger?** Veja o guia completo: [DEPLOY_HOSTINGER.md](./DEPLOY_HOSTINGER.md)

## Opção Mais Rápida: Vercel (Recomendado)

### 1. Preparar o código
```bash
git add .
git commit -m "Preparar para deploy"
git push
```

### 2. Deploy na Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em **"Add New Project"**
4. Importe seu repositório
5. Configure variáveis de ambiente (veja abaixo)
6. Clique em **Deploy**

### 3. Configurar Domínio
1. Na Vercel: **Settings** > **Domains**
2. Adicione: `marcohama.com`
3. Configure DNS no seu provedor de domínio:
   - Tipo: **CNAME**
   - Nome: `@` (ou deixe em branco)
   - Valor: `cname.vercel-dns.com`

### 4. Variáveis de Ambiente na Vercel
```
NEXT_PUBLIC_API_BASE_URL=https://seu-backend.com/api
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

## ⚡ Build Local (Teste antes do deploy)

```bash
# Instalar dependências
npm install

# Criar build de produção
npm run build

# Testar build localmente
npm start
```

Acesse: http://localhost:3000

## 🔧 Configuração da API

Certifique-se de atualizar a URL da API para produção:

1. Na Vercel/Netlify, adicione a variável:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://seu-backend.com/api
   ```

2. Ou edite `src/services/api.ts`:
   ```typescript
   export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://72.60.20.31:8000/api';
   ```

## 📝 Checklist Rápido

- [ ] Build funciona localmente (`npm run build`)
- [ ] Código commitado no Git
- [ ] Deploy na Vercel/Netlify
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio adicionado na plataforma
- [ ] DNS configurado no provedor do domínio
- [ ] SSL/HTTPS ativado (automático na Vercel)
- [ ] Testar login e funcionalidades

## 🆘 Problemas Comuns

### Build falha
- Verifique se todas as dependências estão instaladas
- Verifique se não há erros de TypeScript
- Execute `npm run lint` para verificar erros

### Domínio não funciona
- Aguarde até 24h para propagação DNS
- Verifique se o DNS está configurado corretamente
- Na Vercel, verifique se o domínio está "Valid"

### API não funciona
- Verifique se a URL da API está correta
- Verifique se o backend aceita requisições do domínio marcohama.com
- Configure CORS no backend

## 📞 Próximos Passos

1. **Teste completo**: Após deploy, teste todas as funcionalidades
2. **Monitoramento**: Configure monitoramento (Vercel Analytics)
3. **Backup**: Configure backups automáticos
4. **Performance**: Configure CDN (já incluído na Vercel)

---

Para instruções detalhadas, veja [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)

