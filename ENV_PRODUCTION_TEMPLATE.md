# 📝 Template de Variáveis de Ambiente para Produção

Copie o conteúdo abaixo e cole no arquivo `.env.production` no servidor.

## Conteúdo do arquivo .env.production

```env
# Configuração de Produção - Next.js Dashboard

# Ambiente
NODE_ENV=production

# API Backend
# Se sua API está no mesmo servidor (porta 8000), use o domínio:
NEXT_PUBLIC_API_BASE_URL=https://seu-dominio.com/api
# Ou se não tiver HTTPS ainda, use o IP:
# NEXT_PUBLIC_API_BASE_URL=http://72.60.20.31:8000/api

# WebSocket
# Se sua API está no mesmo servidor, use o domínio:
NEXT_PUBLIC_WS_URL=wss://seu-dominio.com
# Ou se não tiver HTTPS ainda, use o IP:
# NEXT_PUBLIC_WS_URL=ws://72.60.20.31:8000

# Firebase Configuration (se estiver usando Firebase)
# Preencha com seus valores reais do Firebase Console
NEXT_PUBLIC_FIREBASE_API_KEY=sua-chave-api-aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=sua-vapid-key
```

## Como usar no servidor:

1. No servidor VPS, execute:
```bash
cd /var/www/maktubia-dashboard
nano .env.production
```

2. Cole o conteúdo acima (ajustando os valores conforme necessário)

3. Salve: `Ctrl+O`, Enter, `Ctrl+X`

## Valores mínimos necessários:

Se você **não está usando Firebase**, pode usar apenas:

```env
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=http://72.60.20.31:8000/api
NEXT_PUBLIC_WS_URL=ws://72.60.20.31:8000
```

Se você **tem um domínio configurado**, use:

```env
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://seu-dominio.com/api
NEXT_PUBLIC_WS_URL=wss://seu-dominio.com
```

