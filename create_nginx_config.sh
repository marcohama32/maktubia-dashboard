#!/bin/bash

# Script para criar configuração do Nginx
# Execute: bash create_nginx_config.sh

cat > /tmp/maktubia-nginx.conf << 'EOF'
server {
    listen 80;
    server_name 72.60.20.31;

    # API Backend - rotas /api
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (se necessário)
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket para API
    location /socket.io/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend Next.js (todas as outras rotas)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts para evitar desconexões
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache de arquivos estáticos do Next.js
    location /_next/static {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
EOF

echo "✅ Arquivo criado em /tmp/maktubia-nginx.conf"
echo "📝 Agora execute:"
echo "   sudo cp /tmp/maktubia-nginx.conf /etc/nginx/sites-available/maktubia"
echo "   sudo rm /etc/nginx/sites-enabled/maktubia-backend"
echo "   sudo ln -s /etc/nginx/sites-available/maktubia /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"


