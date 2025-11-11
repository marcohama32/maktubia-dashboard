#!/bin/bash

# Script para criar arquivo .env.production no servidor
# Execute: bash CREATE_ENV_PRODUCTION.sh

cat > .env.production << 'EOF'
# Configuração de Produção - Next.js Dashboard

# Ambiente
NODE_ENV=production

# API Backend
# Se sua API está no mesmo servidor (porta 8000), use o domínio:
# NEXT_PUBLIC_API_BASE_URL=https://seu-dominio.com/api
# Ou se não tiver HTTPS ainda, use o IP:
NEXT_PUBLIC_API_BASE_URL=http://72.60.20.31:8000/api

# WebSocket
# Se sua API está no mesmo servidor, use o domínio:
# NEXT_PUBLIC_WS_URL=wss://seu-dominio.com
# Ou se não tiver HTTPS ainda, use o IP:
NEXT_PUBLIC_WS_URL=ws://72.60.20.31:8000

# Firebase Configuration (preencha com seus valores reais)
# Se não estiver usando Firebase, pode deixar vazio ou comentar
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
EOF

echo "✅ Arquivo .env.production criado!"
echo "📝 Edite o arquivo se precisar ajustar valores:"
echo "   nano .env.production"

