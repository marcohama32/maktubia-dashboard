import { api } from "./api";
import { 
  requestNotificationPermission, 
  onMessageListener,
  isFirebaseConfigured 
} from "@/config/firebase";

/**
 * Serviço Firebase Cloud Messaging (FCM)
 * Gerencia notificações push web via Firebase
 */

export interface FCMTokenResponse {
  success: boolean;
  message?: string;
  token?: string;
  data?: {
    token_id?: number;
    user_id?: number;
    device_id?: string | null;
    platform?: string;
    is_active?: boolean;
    created_at?: string;
  };
}

export interface FCMConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey?: string; // VAPID key para web push
}

class FCMService {
  private token: string | null = null;
  private isInitialized: boolean = false;
  private messageUnsubscribe: (() => void) | null = null;

  /**
   * Verificar se FCM está disponível
   */
  isAvailable(): boolean {
    return typeof window !== "undefined" && 
           "serviceWorker" in navigator && 
           "Notification" in window &&
           isFirebaseConfigured();
  }

  /**
   * Registrar Service Worker para FCM
   */
  private async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return null;
    }

    try {
      // Verificar se já está registrado
      const existingRegistration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
      if (existingRegistration) {
        console.log("✅ Service Worker já registrado");
        return existingRegistration;
      }

      // Registrar Service Worker
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/",
      });

      console.log("✅ Service Worker registrado para FCM:", registration.scope);
      return registration;
    } catch (error) {
      console.error("❌ Erro ao registrar Service Worker:", error);
      return null;
    }
  }

  /**
   * Inicializar FCM
   */
  async initialize(): Promise<boolean> {
    if (!this.isAvailable()) {
      if (!isFirebaseConfigured()) {
        console.warn("⚠️ Firebase não está configurado. Configure as variáveis de ambiente NEXT_PUBLIC_FIREBASE_*");
      } else {
        console.warn("⚠️ FCM não disponível: Service Worker ou Notification API não suportado");
      }
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    try {
      // 1. Registrar Service Worker
      const registration = await this.registerServiceWorker();
      if (!registration) {
        console.error("❌ Não foi possível registrar Service Worker");
        return false;
      }

      // 2. Solicitar permissão e obter token FCM
      const token = await requestNotificationPermission();
      if (!token) {
        console.warn("⚠️ Não foi possível obter token FCM");
        return false;
      }

      this.token = token;
      this.isInitialized = true;
      
      // 3. Escutar mensagens quando app está aberto
      this.messageUnsubscribe = onMessageListener((payload) => {
        console.log("🔔 Mensagem FCM recebida (app aberto):", payload);
        // Disparar evento customizado para NotificationContext processar
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("fcm-message", {
            detail: payload,
          }));
        }
      });

      console.log("✅ FCM inicializado com sucesso");
      return true;
    } catch (error) {
      console.error("❌ Erro ao inicializar FCM:", error);
      return false;
    }
  }

  /**
   * Registrar token FCM no backend
   */
  async registerToken(fcmToken: string, deviceInfo?: {
    deviceId?: string;
    platform?: string;
    appVersion?: string;
  }): Promise<FCMTokenResponse> {
    try {
      // Detectar plataforma automaticamente se não fornecida
      const platform = deviceInfo?.platform || "web";
      
      // Gerar deviceId único se não fornecido
      let deviceId: string | undefined = deviceInfo?.deviceId;
      if (!deviceId && typeof window !== "undefined") {
        // Tentar obter de localStorage ou gerar novo
        const storedDeviceId = localStorage.getItem("device_id");
        deviceId = storedDeviceId || undefined;
        if (!deviceId) {
          deviceId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem("device_id", deviceId);
        }
      }

      const response = await api.post("/fcm/register", {
        fcmToken: fcmToken,
        deviceId: deviceId || null,
        platform: platform,
        appVersion: deviceInfo?.appVersion || "1.0.0",
      });

      if (response.data?.success) {
        this.token = fcmToken;
        console.log("✅ Token FCM registrado no backend:", {
          token_id: response.data.data?.token_id,
          platform: platform,
          device_id: deviceId,
        });
        return {
          success: true,
          message: response.data.message || "Token FCM registrado com sucesso",
          token: fcmToken,
          data: response.data.data,
        };
      } else {
        throw new Error("Resposta do servidor não indica sucesso");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao registrar token FCM";
      
      if (_status === 401) {
        message = "Não autenticado. Faça login novamente.";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Token FCM inválido";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      console.error("❌ Erro ao registrar token FCM:", message);
      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Obter token FCM atual
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Verificar se FCM está inicializado
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Verificar se FCM está inicializado (método público)
   */
  checkInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Remover token FCM do backend
   */
  async removeToken(token?: string): Promise<boolean> {
    try {
      const tokenToRemove = token || this.token;
      if (!tokenToRemove) {
        console.warn("⚠️ Nenhum token FCM para remover");
        return false;
      }

      // URL-encode o token para evitar problemas com caracteres especiais
      const encodedToken = encodeURIComponent(tokenToRemove);
      await api.delete(`/fcm/tokens/${encodedToken}`);
      
      if (tokenToRemove === this.token) {
        this.token = null;
        this.isInitialized = false;
      }
      return true;
    } catch (err: any) {
      console.error("❌ Erro ao remover token FCM:", err);
      return false;
    }
  }

  /**
   * Desconectar FCM
   */
  disconnect(): void {
    if (this.messageUnsubscribe) {
      this.messageUnsubscribe();
      this.messageUnsubscribe = null;
    }
    this.token = null;
    this.isInitialized = false;
  }

  /**
   * Testar envio de notificação
   */
  async testNotification(): Promise<boolean> {
    try {
      const response = await api.post("/fcm/test");
      return response.data?.success || false;
    } catch (err: any) {
      console.error("❌ Erro ao testar notificação FCM:", err);
      return false;
    }
  }
}

// Singleton
export const fcmService = new FCMService();

