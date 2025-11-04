// Service Worker para Firebase Cloud Messaging
// Este arquivo deve estar na pasta public/ para ser acessível

// Importar scripts do Firebase
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuração do Firebase
// IMPORTANTE: O Firebase SDK injeta automaticamente a configuração quando inicializado no app principal
// O Service Worker recebe a configuração através do Firebase inicializado no app principal
// Não é possível usar process.env aqui (Service Worker não tem acesso)

// Configuração padrão (será sobrescrita pelo Firebase SDK automaticamente)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Escutar mensagens do app principal com configuração Firebase
let finalConfig = { ...firebaseConfig };

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    console.log('📥 Configuração Firebase recebida via postMessage');
    finalConfig = { ...event.data.config };
    
    // Reinicializar Firebase se ainda não foi inicializado
    if (firebase.apps.length === 0) {
      try {
        firebase.initializeApp(finalConfig);
        console.log('✅ Firebase inicializado no Service Worker via postMessage');
      } catch (error) {
        console.error('❌ Erro ao inicializar Firebase no Service Worker:', error);
      }
    }
  }
});

// Tentar obter da variável global (fallback)
if (typeof self !== 'undefined' && self.__FIREBASE_CONFIG__) {
  finalConfig = { ...self.__FIREBASE_CONFIG__ };
}

// Inicializar Firebase
// NOTA: Se o app principal já inicializou Firebase, o Service Worker deve usar a mesma instância
// O Firebase SDK gerencia isso automaticamente
try {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(finalConfig);
    console.log('✅ Firebase inicializado no Service Worker');
  } else {
    console.log('✅ Firebase já inicializado no Service Worker');
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase no Service Worker:', error);
  // Tentar continuar mesmo se houver erro na inicialização
  // O Firebase SDK pode injetar a configuração depois
}

// Obter instância do Messaging
const messaging = firebase.messaging();

// Escutar mensagens em background
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Mensagem FCM recebida em background:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Notificação';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || '',
    icon: '/images/logo2.png', // Logo da Maktubia
    badge: '/images/logo2.png', // Badge também com logo
    image: '/images/logo2.png', // Imagem grande (se suportado)
    tag: payload.data?.id || `notif_${Date.now()}`,
    data: {
      ...payload.data,
      // URL de destino para redirecionar ao clicar
      url: payload.data?.purchase_id 
        ? '/admin/purchases' 
        : '/admin/purchases',
    },
    requireInteraction: false,
    silent: false,
    // Aumentar tempo de exibição
    timestamp: Date.now(),
  };

  // Exibir notificação
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Escutar cliques na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificação clicada:', event);
  event.notification.close();
  
  // URL de destino (página de compras ou login se não autenticado)
  const targetUrl = event.notification.data?.url || '/admin/purchases';
  
  // Verificar se precisa autenticar (verificar token no localStorage via message)
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Tentar focar em janela existente
      for (const client of clientList) {
        const url = new URL(client.url);
        if (url.origin === self.location.origin) {
          // Enviar mensagem para verificar autenticação e redirecionar
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: targetUrl,
            data: event.notification.data,
          });
          
          if ('focus' in client) {
            return client.focus();
          }
        }
      }
      
      // Se não houver janela aberta, abrir nova
      if (clients.openWindow) {
        // Abrir na URL de destino
        // O app principal vai verificar autenticação e redirecionar se necessário
        return clients.openWindow(targetUrl).then((client) => {
          if (client) {
            // Enviar mensagem para verificar autenticação
            setTimeout(() => {
              client.postMessage({
                type: 'NOTIFICATION_CLICK',
                url: targetUrl,
                data: event.notification.data,
              });
            }, 1000);
          }
          return client;
        });
      }
    })
  );
});
