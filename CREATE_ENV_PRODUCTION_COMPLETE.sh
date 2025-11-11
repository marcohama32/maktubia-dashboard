#!/bin/bash

# Script completo para criar .env.production no servidor
# Execute: cd /var/www/maktubia-dashboard && bash CREATE_ENV_PRODUCTION_COMPLETE.sh

cat > .env.production << 'EOF'
# Configuração de Produção - Next.js Dashboard

# Ambiente
NODE_ENV=production

# API Backend
NEXT_PUBLIC_API_BASE_URL=http://72.60.20.31:8000/api

# WebSocket
NEXT_PUBLIC_WS_URL=ws://72.60.20.31:8000

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyArUW9mGkHHCvpBVqZC5OemDdVehjAzQwo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=572350716093
NEXT_PUBLIC_FIREBASE_APP_ID=1:572350716093:web:27f1c6be5dad7cf0ff7fd4
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
EOF

echo "✅ Arquivo .env.production criado!"
echo "📝 Ajuste os campos vazios (AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, VAPID_KEY) se necessário:"
echo "   nano .env.production"

