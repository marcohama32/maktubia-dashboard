import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { notificationService, Notification as NotificationServiceType } from "@/services/notification.service";

// Import dinâmico do websocket service para evitar problemas SSR
let websocketServiceModule: any = null;

export interface Notification {
  id: string | number;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string | number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string | number) => void;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  removeNotification: () => {},
  loading: false,
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const websocketServiceRef = useRef<any>(null);

  // Converter notificação do serviço para o formato interno
  const convertNotification = useCallback((notification: NotificationServiceType): Notification => {
    const createdAt = notification.timestamp 
      ? new Date(notification.timestamp)
      : notification.created_at 
      ? new Date(notification.created_at)
      : new Date();

    return {
      id: notification.id,
      type: notification.type || "info",
      title: notification.title || "Notificação",
      message: notification.message || "",
      data: notification.data,
      read: notification.read || false,
      createdAt,
    };
  }, []);

  // Carregar notificações do servidor
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      
      if (response.success && response.data) {
        // Garantir que response.data é um array antes de chamar .map()
        const notificationsArray = Array.isArray(response.data) ? response.data : [];
        const convertedNotifications = notificationsArray.map(convertNotification);
        setNotifications(convertedNotifications);
      } else if (response.data && !Array.isArray(response.data)) {
        // Se response.data existe mas não é array, pode ser um objeto ou outro formato
        console.warn("⚠️ Formato de resposta de notificações inesperado:", response.data);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      // Não é crítico se falhar, as notificações podem vir apenas via WebSocket
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, convertNotification]);

  // Adicionar notificação recebida via WebSocket
  const addNotification = useCallback((notificationData: NotificationServiceType) => {
    const notification = convertNotification(notificationData);
    
    setNotifications(prev => {
      // Verificar se já existe (evitar duplicatas)
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        return prev;
      }
      
      // Adicionar no início da lista
      return [notification, ...prev];
    });
  }, [convertNotification]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (id: string | number) => {
    // Atualizar estado local imediatamente
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    );

    // Tentar marcar no servidor
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      // Se falhar, manter o estado local (já foi atualizado)
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    // Atualizar estado local imediatamente
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );

    // Tentar marcar no servidor
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error);
      // Se falhar, manter o estado local (já foi atualizado)
    }
  }, []);

  // Remover notificação
  const removeNotification = useCallback((id: string | number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Calcular contagem de não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Conectar WebSocket e carregar notificações quando autenticado
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    // Lazy load websocket service if not already loaded
    const initWebSocket = async () => {
      if (!websocketServiceRef.current) {
        try {
          if (!websocketServiceModule) {
            websocketServiceModule = await import("@/services/websocket.service");
          }
          websocketServiceRef.current = websocketServiceModule.websocketService;
        } catch (error) {
          console.warn("⚠️ Erro ao carregar WebSocket service:", error);
          return;
        }
      }

      const wsService = websocketServiceRef.current;

      if (!isAuthenticated || !user?.id) {
        // Limpar notificações se não estiver autenticado
        setNotifications([]);
        if (wsService) {
          wsService.disconnect();
        }
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        return;
      }

      // Obter token do localStorage
      const token = localStorage.getItem("auth_token");

      // Conectar ao WebSocket
      if (wsService) {
        wsService.connect(user.id, token || undefined);

        // Registrar handler para notificações em tempo real
        unsubscribeRef.current = wsService.onNotification((notificationData: any) => {
          // Converter formato do WebSocket para o formato interno
          const notification: NotificationServiceType = {
            id: notificationData.data?.id || Date.now() + Math.random(), // Gerar ID se não vier
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data,
            read: false,
            timestamp: notificationData.timestamp || new Date().toISOString(),
          };
          
          addNotification(notification);
        });

        // Carregar notificações existentes
        loadNotifications();
      }
    };

    initWebSocket();

    // Cleanup ao desmontar ou quando user mudar
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      // Não desconectar WebSocket aqui, pois pode ser usado por outros componentes
      // O WebSocket será desconectado quando o usuário fizer logout
    };
  }, [isAuthenticated, user?.id, addNotification, loadNotifications]);

  // Desconectar WebSocket quando sair
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const disconnectWebSocket = async () => {
      if (!isAuthenticated) {
        if (!websocketServiceRef.current && websocketServiceModule) {
          websocketServiceRef.current = websocketServiceModule.websocketService;
        }
        if (websocketServiceRef.current) {
          websocketServiceRef.current.disconnect();
        }
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      }
    };

    disconnectWebSocket();
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  // Don't throw error during SSR - return default values instead
  if (!context) {
    if (typeof window === "undefined") {
      // SSR: return default values
      return {
        notifications: [],
        unreadCount: 0,
        markAsRead: async () => {},
        markAllAsRead: async () => {},
        removeNotification: () => {},
        loading: false,
      };
    }
    // Client side: throw error if not in provider
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

