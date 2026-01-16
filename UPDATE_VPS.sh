#!/bin/bash

# Script para atualizar o VPS após push no Git
# Execute este script no servidor VPS via SSH

echo "🔄 Atualizando código do repositório..."

# Navegar para o diretório do projeto
# Ajuste o caminho conforme necessário
cd /var/www/marcohama || cd ~/marcohama || cd /home/$(whoami)/marcohama

# Fazer pull das mudanças
echo "📥 Fazendo pull do repositório..."
git pull origin main

# Instalar novas dependências (se houver)
echo "📦 Verificando dependências..."
npm install

# Fazer build (se necessário)
echo "🔨 Fazendo build da aplicação..."
npm run build

# Reiniciar o processo PM2
echo "🔄 Reiniciando aplicação..."
pm2 restart maktubia-dashboard || pm2 restart all

# Verificar status
echo "✅ Verificando status..."
pm2 status

# Mostrar logs recentes
echo "📋 Logs recentes:"
pm2 logs maktubia-dashboard --lines 20 --nostream

echo "✨ Atualização concluída!"


