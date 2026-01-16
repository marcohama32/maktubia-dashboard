import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

export interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp?: string;
}

export type NotificationHandler = (_notification: NotificationData) => void;

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
      // Em desenvolvimento, usar localhost por padrão
      const defaultUrl = process.env.NODE_ENV === "development" 
        ? "http://localhost:8000" 
        : "http://72.60.20.31:8000";
      let baseUrl = wsUrl || API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "") || defaultUrl;
      
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

      // Escutar eventos de campanha criada
      this.socket.on("campaign_created", (notification: NotificationData | any) => {
        console.log("🎉 Campanha criada recebida via Socket.io:", {
          type: notification.type,
          title: notification.title,
          message: notification.message?.substring(0, 100) || "",
          campaignId: notification.campaign?.id,
          timestamp: notification.timestamp,
        });
        console.log("🎉 Notificação completa de campanha:", notification);
        
        // Converter para formato de notificação padrão
        const notificationData: NotificationData = {
          type: notification.type || 'campaign_created',
          title: notification.title || 'Nova Campanha',
          message: notification.message || '',
          data: notification.campaign || notification.data,
          timestamp: notification.timestamp || new Date().toISOString(),
        };
        
        // Notificar todos os handlers (tratar como notificação normal)
        this.notificationHandlers.forEach(handler => {
          try {
            handler(notificationData);
          } catch (error) {
            console.error("❌ Erro ao processar notificação de campanha no handler:", error);
          }
        });
      });

      // Escutar eventos de compra confirmada
      this.socket.on("purchase_confirmed", (notification: NotificationData | any) => {
        console.log("✅ Compra confirmada recebida via Socket.io:", notification);
        
        const notificationData: NotificationData = {
          type: notification.type || 'purchase_confirmed',
          title: notification.title || 'Compra Confirmada',
          message: notification.message || '',
          data: notification.purchase || notification.data,
          timestamp: notification.timestamp || new Date().toISOString(),
        };
        
        this.notificationHandlers.forEach(handler => {
          try {
            handler(notificationData);
          } catch (error) {
            console.error("❌ Erro ao processar notificação de compra confirmada:", error);
          }
        });
      });

      // Escutar eventos de compra rejeitada
      this.socket.on("purchase_rejected", (notification: NotificationData | any) => {
        console.log("❌ Compra rejeitada recebida via Socket.io:", notification);
        
        const notificationData: NotificationData = {
          type: notification.type || 'purchase_rejected',
          title: notification.title || 'Compra Rejeitada',
          message: notification.message || '',
          data: notification.purchase || notification.data,
          timestamp: notification.timestamp || new Date().toISOString(),
        };
        
        this.notificationHandlers.forEach(handler => {
          try {
            handler(notificationData);
          } catch (error) {
            console.error("❌ Erro ao processar notificação de compra rejeitada:", error);
          }
        });
      });

      // Escutar eventos de compra de campanha validada
      this.socket.on("campaign_purchase_validated", (notification: NotificationData | any) => {
        console.log("✅ Compra de campanha validada recebida via Socket.io:", notification);
        
        const notificationData: NotificationData = {
          type: notification.type || 'campaign_purchase_validated',
          title: notification.title || 'Pagamento Aprovado!',
          message: notification.message || '',
          data: notification.purchase || notification.data || {
            campaign_id: notification.campaign_id,
            purchase_id: notification.purchase_id,
            points_earned: notification.points_earned
          },
          timestamp: notification.timestamp || new Date().toISOString(),
        };
        
        this.notificationHandlers.forEach(handler => {
          try {
            handler(notificationData);
          } catch (error) {
            console.error("❌ Erro ao processar notificação de compra de campanha validada:", error);
          }
        });
      });

      // Escutar eventos de compra de campanha rejeitada
      this.socket.on("campaign_purchase_rejected", (notification: NotificationData | any) => {
        console.log("❌ Compra de campanha rejeitada recebida via Socket.io:", notification);
        
        const notificationData: NotificationData = {
          type: notification.type || 'campaign_purchase_rejected',
          title: notification.title || 'Pagamento Rejeitado',
          message: notification.message || '',
          data: notification.purchase || notification.data || {
            campaign_id: notification.campaign_id,
            purchase_id: notification.purchase_id,
            rejection_reason: notification.rejection_reason
          },
          timestamp: notification.timestamp || new Date().toISOString(),
        };
        
        this.notificationHandlers.forEach(handler => {
          try {
            handler(notificationData);
          } catch (error) {
            console.error("❌ Erro ao processar notificação de compra de campanha rejeitada:", error);
          }
        });
      });

      // Escutar eventos de compra de campanha submetida
      this.socket.on("campaign_purchase_submitted", (notification: NotificationData | any) => {
        console.log("📤 Compra de campanha submetida recebida via Socket.io:", notification);
        
        const notificationData: NotificationData = {
          type: notification.type || 'campaign_purchase_submitted',
          title: notification.title || 'Pagamento Enviado',
          message: notification.message || '',
          data: notification.purchase || notification.data || {
            campaign_id: notification.campaign_id,
            purchase_id: notification.purchase_id
          },
          timestamp: notification.timestamp || new Date().toISOString(),
        };
        
        this.notificationHandlers.forEach(handler => {
          try {
            handler(notificationData);
          } catch (error) {
            console.error("❌ Erro ao processar notificação de compra de campanha submetida:", error);
          }
        });
      });

      // Escutar eventos de compra de sorteio validada
      this.socket.on("draw_purchase_validated", (notification: NotificationData | any) => {
        console.log("✅ Compra de sorteio validada recebida via Socket.io:", notification);
        
        const notificationData: NotificationData = {
          type: notification.type || 'draw_purchase_validated',
          title: notification.title || 'Compra Aprovada!',
          message: notification.message || '',
          data: notification.purchase || notification.data || {
            campaign_id: notification.campaign_id,
            purchase_id: notification.purchase_id
          },
          timestamp: notification.timestamp || new Date().toISOString(),
        };
        
        this.notificationHandlers.forEach(handler => {
          try {
            handler(notificationData);
          } catch (error) {
            console.error("❌ Erro ao processar notificação de compra de sorteio validada:", error);
          }
        });
      });

      // Escutar eventos de compra de sorteio rejeitada
      this.socket.on("draw_purchase_rejected", (notification: NotificationData | any) => {
        console.log("❌ Compra de sorteio rejeitada recebida via Socket.io:", notification);
        
        const notificationData: NotificationData = {
          type: notification.type || 'draw_purchase_rejected',
          title: notification.title || 'Compra Rejeitada',
          message: notification.message || '',
          data: notification.purchase || notification.data || {
            campaign_id: notification.campaign_id,
            purchase_id: notification.purchase_id,
            rejection_reason: notification.rejection_reason
          },
          timestamp: notification.timestamp || new Date().toISOString(),
        };
        
        this.notificationHandlers.forEach(handler => {
          try {
            handler(notificationData);
          } catch (error) {
            console.error("❌ Erro ao processar notificação de compra de sorteio rejeitada:", error);
          }
        });
      });

      // Escutar eventos de compra de sorteio submetida
      this.socket.on("draw_purchase_submitted", (notification: NotificationData | any) => {
        console.log("📤 Compra de sorteio submetida recebida via Socket.io:", notification);
        
        const notificationData: NotificationData = {
          type: notification.type || 'draw_purchase_submitted',
          title: notification.title || 'Compra Enviada',
          message: notification.message || '',
          data: notification.purchase || notification.data || {
            campaign_id: notification.campaign_id,
            purchase_id: notification.purchase_id
          },
          timestamp: notification.timestamp || new Date().toISOString(),
        };
        
        this.notificationHandlers.forEach(handler => {
          try {
            handler(notificationData);
          } catch (error) {
            console.error("❌ Erro ao processar notificação de compra de sorteio submetida:", error);
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

