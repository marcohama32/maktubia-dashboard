import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

export interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp?: string;
}

export type NotificationHandler = (notification: NotificationData) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private notificationHandlers: Set<NotificationHandler> = new Set();
  private isConnecting: boolean = false;

  /**
   * Conectar ao WebSocket
   */
  connect(userId: string | number, token?: string): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Em produção HTTPS, não usar WebSocket se não for WSS (Mixed Content)
      if (
        typeof window !== "undefined" &&
        window.location.protocol === "https:" &&
        !process.env.NEXT_PUBLIC_WS_URL?.startsWith("wss://")
      ) {
        console.warn("⚠️ WebSocket desabilitado em produção HTTPS. Backend não suporta WSS.");
        this.isConnecting = false;
        return;
      }

      // Extrair URL base da API (remover /api)
      // Se a URL termina com /api, remove; caso contrário, usa como está
      // Socket.io precisa da URL base sem o /api
      // Usar variável de ambiente se disponível, senão extrair da API_BASE_URL
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      let baseUrl = wsUrl || API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "") || "http://72.60.20.31:8000";
      
      // Se estiver usando proxy da API, não podemos usar WebSocket direto
      // (WebSocket não funciona através de proxy HTTP simples)
      if (baseUrl.startsWith("/")) {
        console.warn("⚠️ WebSocket não disponível via proxy. Desabilitando WebSocket.");
        this.isConnecting = false;
        return;
      }
      
      this.socket = io(baseUrl, {
        transports: ["websocket", "polling"], // Suportar polling como fallback
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity, // Tentar reconectar indefinidamente
        timeout: 20000,
        forceNew: false,
        auth: token ? { 
          token: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
          userId: String(userId)
        } : { userId: String(userId) },
      });

      // Quando conectar
      this.socket.on("connect", () => {
        console.log("✅ Conectado ao servidor WebSocket");
        this.isConnecting = false;
        
        // Registrar usuário online - IMPORTANTE: deve ser string
        const userIdString = String(userId);
        console.log("📤 Emitindo user-online com userId:", userIdString);
        this.socket?.emit("user-online", userIdString);
      });

      // Receber confirmação de conexão
      this.socket.on("connected", (data: any) => {
        console.log("✅", data.message || "Conectado ao sistema de notificações");
      });

      // Escutar notificações
      this.socket.on("notification", (notification: NotificationData) => {
        console.log("🔔 Notificação recebida via Socket.io:", {
          type: notification.type,
          title: notification.title,
          message: notification.message?.substring(0, 100) || "",
          hasData: !!notification.data,
          timestamp: notification.timestamp,
        });
        console.log("🔔 Notificação completa:", notification);
        
        // Notificar todos os handlers
        this.notificationHandlers.forEach(handler => {
          try {
            handler(notification);
          } catch (error) {
            console.error("❌ Erro ao processar notificação no handler:", error);
          }
        });
      });
      
      // Escutar todos os eventos para debug (remover em produção se necessário)
      if (process.env.NODE_ENV === "development") {
        this.socket.onAny((eventName, ...args) => {
          if (eventName !== "notification") {
            console.log("📡 Evento Socket.io recebido:", eventName, args);
          }
        });
      }

      // Gerenciar desconexão
      this.socket.on("disconnect", (reason: string) => {
        console.log("❌ Desconectado do servidor:", reason);
        this.isConnecting = false;
        
        // Reconectar automaticamente se foi desconexão inesperada
        if (reason === "io server disconnect") {
          // Servidor desconectou, reconectar manualmente
          this.socket?.connect();
        }
      });

      // Gerenciar erros
      this.socket.on("connect_error", (error: Error) => {
        console.error("❌ Erro ao conectar ao WebSocket:", error.message || error);
        console.error("❌ Detalhes:", {
          message: error.message,
          type: error.name,
          stack: error.stack
        });
        this.isConnecting = false;
      });
      
      // Log de eventos do Socket.io para debug
      this.socket.on("error", (error: any) => {
        console.error("❌ Erro do Socket.io:", error);
      });
      
      this.socket.on("reconnect", (attemptNumber: number) => {
        console.log("🔄 Reconectado ao WebSocket após", attemptNumber, "tentativas");
        // Re-enviar user-online após reconexão
        if (userId) {
          this.socket?.emit("user-online", String(userId));
        }
      });
      
      this.socket.on("reconnect_attempt", (attemptNumber: number) => {
        console.log("🔄 Tentando reconectar... tentativa", attemptNumber);
      });
      
      this.socket.on("reconnect_failed", () => {
        console.error("❌ Falha ao reconectar ao WebSocket após várias tentativas");
      });

    } catch (error) {
      console.error("Erro ao inicializar WebSocket:", error);
      this.isConnecting = false;
    }
  }

  /**
   * Desconectar do WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.notificationHandlers.clear();
    }
  }

  /**
   * Adicionar handler de notificações
   */
  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.add(handler);
    
    // Retornar função para remover handler
    return () => {
      this.notificationHandlers.delete(handler);
    };
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obter instância do socket
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton
export const websocketService = new WebSocketService();

