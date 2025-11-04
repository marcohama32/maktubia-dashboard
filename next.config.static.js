/** @type {import('next').NextConfig} */
// Configuração para EXPORT ESTÁTICO (upload de arquivos)
// Use este arquivo se quiser fazer upload simples dos arquivos

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // ⚠️ IMPORTANTE: Ativar export estático
  output: 'export',
  
  // Desabilitar otimizações de imagem que precisam de servidor
  images: {
    unoptimized: true, // Necessário para export estático
  },
  
  // Configuração para Service Worker do Firebase
  async headers() {
    return [
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

