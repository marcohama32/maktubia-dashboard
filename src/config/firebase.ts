import { initializeApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

// ============================================================================
// CONFIGURAÇÃO DO FIREBASE - ONDE OBTER OS DADOS:
// ============================================================================
// 
// 1. ACESSAR FIREBASE CONSOLE:
//    https://console.firebase.google.com/
//
// 2. OBTER FIREBASE CONFIG:
//    - Vá em ⚙️ Project Settings (ícone de engrenagem no topo)
//    - Role até "Your apps"
//    - Se já tiver app web: clique nele
//    - Se não tiver: clique em "</> Add app" → Web
//    - Copie os valores do objeto firebaseConfig que aparece
//
// 3. OBTER VAPID KEY:
//    - No mesmo Project Settings, vá na aba "Cloud Messaging"
//    - Role até "Web Push certificates"
//    - Se não existir: clique em "Generate key pair"
//    - Copie a chave gerada
//
// 4. CRIAR ARQUIVO .env.local NA RAIZ DO PROJETO:
//    - Copie o arquivo .env.local.example
//    - Renomeie para .env.local
//    - Cole os valores obtidos do Firebase Console
//    - Reinicie o servidor (npm run dev)
//
// ============================================================================

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// VAPID key para web push (obrigatório para push notifications)
// Obter do Firebase Console: Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Inicializar Firebase App
 */
export function initializeFirebase(): FirebaseApp | null {
  if (typeof window === "undefined") {
    return null; // SSR não suporta Firebase
  }

  if (app) {
    return app; // Já inicializado
  }

  try {
    app = initializeApp(firebaseConfig);
    
    // Injeter configuração para Service Worker (se disponível)
    // O Firebase SDK faz isso automaticamente, mas vamos garantir
    if (typeof window !== "undefined") {
      (window as any).__FIREBASE_CONFIG__ = firebaseConfig;
    }
    
    // Passar configuração para Service Worker via postMessage quando registrado
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Aguardar Service Worker estar pronto
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: "FIREBASE_CONFIG",
            config: firebaseConfig,
          });
          console.log("📤 Configuração Firebase enviada para Service Worker");
        } else {
          // Se ainda não estiver ativo, aguardar instalação
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "activated") {
                  // Após ativação, usar registration.active que é garantido existir
                  const activeWorker = registration.active;
                  if (activeWorker) {
                    activeWorker.postMessage({
                      type: "FIREBASE_CONFIG",
                      config: firebaseConfig,
                    });
                    console.log("📤 Configuração Firebase enviada para Service Worker (após ativação)");
                  }
                }
              });
            }
          });
        }
      }).catch((error) => {
        console.warn("⚠️ Erro ao enviar configuração para Service Worker:", error);
      });
    }
    
    console.log("✅ Firebase App inicializado");
    return app;
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase App:", error);
    return null;
  }
}

/**
 * Obter instância do Messaging
 */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined") {
    return null; // SSR não suporta
  }

  if (messaging) {
    return messaging;
  }

  try {
    const firebaseApp = initializeFirebase();
    if (!firebaseApp) {
      return null;
    }

    messaging = getMessaging(firebaseApp);
    
    // Configurar Service Worker para receber mensagens
    // O Service Worker já está registrado em /firebase-messaging-sw.js
    // e receberá mensagens automaticamente quando app está fechado
    
    console.log("✅ Firebase Messaging inicializado");
    return messaging;
  } catch (error: any) {
    console.error("❌ Erro ao inicializar Firebase Messaging:", error);
    
      // Erro comum: Service Worker não registrado ou Firebase não configurado
      if (error.code === "messaging/unsupported-browser") {
        console.error("❌ Navegador não suporta Firebase Messaging");
      } else if (error.code === "messaging/registration-token-not-created") {
        console.error("❌ Service Worker não registrado. Verifique se o arquivo public/firebase-messaging-sw.js existe.");
      } else {
        console.error("❌ Erro ao inicializar Firebase Messaging. Verifique se as configurações do Firebase estão corretas no .env.local");
      }
    
    return null;
  }
}

/**
 * Solicitar permissão e obter token FCM
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("⚠️ Notificações não suportadas neste ambiente");
    return null;
  }

  try {
    // Solicitar permissão
    const permission = await Notification.requestPermission();
    
    if (permission !== "granted") {
      console.warn("⚠️ Permissão de notificação não concedida:", permission);
      return null;
    }

    // Obter token FCM
    const messagingInstance = getFirebaseMessaging();
    if (!messagingInstance) {
      console.error("❌ Firebase Messaging não está disponível");
      return null;
    }

    if (!VAPID_KEY || VAPID_KEY === "" || VAPID_KEY === "YOUR_VAPID_KEY") {
      console.error("❌ VAPID_KEY não configurada. Configure NEXT_PUBLIC_FIREBASE_VAPID_KEY no arquivo .env.local");
      console.error("💡 Como obter:");
      console.error("   1. Acesse https://console.firebase.google.com/");
      console.error("   2. Vá em Project Settings > Cloud Messaging");
      console.error("   3. Role até \"Web Push certificates\"");
      console.error("   4. Clique em \"Generate key pair\" (se não existir)");
      console.error("   5. Copie a chave gerada e cole em .env.local como NEXT_PUBLIC_FIREBASE_VAPID_KEY");
      return null;
    }

    const token = await getToken(messagingInstance, {
      vapidKey: VAPID_KEY,
    });

    if (token) {
      console.log("✅ Token FCM obtido:", token.substring(0, 20) + "...");
      return token;
    } else {
      console.warn("⚠️ Não foi possível obter token FCM. Verifique se Service Worker está registrado.");
      return null;
    }
  } catch (error: any) {
    console.error("❌ Erro ao obter token FCM:", error);
    
    // Erro comum: Service Worker não registrado
    if (error.code === "messaging/registration-token-not-created") {
      console.error("❌ Service Worker não registrado. Configure o Service Worker para FCM.");
    }
    
    return null;
  }
}

/**
 * Escutar mensagens FCM quando app está aberto
 */
export function onMessageListener(
  callback: (payload: any) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {}; // SSR não suporta
  }

  try {
    const messagingInstance = getFirebaseMessaging();
    if (!messagingInstance) {
      console.error("❌ Firebase Messaging não está disponível");
      return () => {};
    }

    const unsubscribe = onMessage(messagingInstance, (payload) => {
      console.log("🔔 Mensagem FCM recebida quando app está aberto:", payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error("❌ Erro ao escutar mensagens FCM:", error);
    return () => {};
  }
}

/**
 * Verificar se Firebase está configurado
 */
export function isFirebaseConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || VAPID_KEY;
  
  return (
    apiKey !== "YOUR_API_KEY" &&
    apiKey !== "" &&
    projectId !== "YOUR_PROJECT_ID" &&
    projectId !== "" &&
    vapidKey !== "YOUR_VAPID_KEY" &&
    vapidKey !== ""
  );
}

