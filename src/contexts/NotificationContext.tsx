import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { notificationService, Notification as NotificationServiceType } from "@/services/notification.service";
import { browserNotificationService } from "@/services/browserNotification.service";

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
    console.log('🔔 [NotificationContext] addNotification() CHAMADO!');
    console.log('🔔 [NotificationContext] notificationData recebido:', notificationData);
    
    const notification = convertNotification(notificationData);
    console.log('🔔 [NotificationContext] notification convertido:', notification);
    
    setNotifications(prev => {
      // Verificar se já existe (evitar duplicatas)
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        console.log('⚠️ [NotificationContext] Notificação já existe, ignorando duplicata');
        return prev;
      }
      
      console.log('✅ [NotificationContext] Adicionando notificação ao estado');
      // Adicionar no início da lista
      return [notification, ...prev];
    });

    // Mostrar notificação do navegador
    console.log('🔔 [NotificationContext] Verificando se deve mostrar notificação do navegador...');
    console.log('🔔 [NotificationContext] typeof window:', typeof window);
    console.log('🔔 [NotificationContext] isNotificationSupported:', browserNotificationService.isNotificationSupported());
    if (typeof window !== 'undefined' && browserNotificationService.isNotificationSupported()) {
      // Verificar se a página está em foco
      const isPageVisible = !document.hidden;
      console.log('🔍 [NotificationContext] Página está visível?', isPageVisible);
      console.log('🔍 [NotificationContext] document.hidden:', document.hidden);
      
      // Mostrar notificação do navegador sempre (tanto quando está em foco quanto quando não está)
      // Isso garante que o usuário sempre veja a notificação do Windows
      // O toast também será mostrado quando a página está em foco
      console.log('🚀 [NotificationContext] Mostrando notificação do navegador (sempre)');
        // Extrair ID da campanha de diferentes formatos possíveis
        let campaignId = null;
        if (notification.data?.campaign?.id) {
          campaignId = notification.data.campaign.id;
        } else if (notification.data?.id) {
          campaignId = notification.data.id;
        } else if (notification.data?.campaign_id) {
          campaignId = notification.data.campaign_id;
        }

        console.log('🚀 [NotificationContext] Chamando showNotification com:', {
          title: notification.title,
          body: notification.message,
          campaignId
        });
        
        browserNotificationService.showNotification({
          title: notification.title,
          body: notification.message,
          icon: browserNotificationService.getNotificationIcon(notification.type),
          badge: browserNotificationService.getNotificationIcon(notification.type),
          tag: `notification-${notification.id}`,
          data: {
            notificationId: notification.id,
            type: notification.type,
            campaign: notification.data?.campaign || notification.data,
            campaign_id: campaignId,
            url: notification.data?.url,
          },
          requireInteraction: false, // Não requer interação para fechar automaticamente
          silent: false, // Tocar som de notificação
        })
        .then(result => {
          if (result) {
            console.log('✅ [NotificationContext] ✅✅✅ Notificação do navegador exibida com sucesso! ✅✅✅');
          } else {
            console.warn('⚠️ [NotificationContext] showNotification retornou null');
          }
        })
        .catch(error => {
          console.error('❌ [NotificationContext] Erro ao mostrar notificação do navegador:', error);
          console.error('❌ [NotificationContext] Stack:', error?.stack);
        });
    } else {
      console.warn('⚠️ [NotificationContext] Não pode mostrar notificação do navegador (window ou suporte não disponível)');
    }
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

  // Solicitar permissão de notificações do navegador automaticamente quando autenticado
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (isAuthenticated && user?.id) {
      // Solicitar permissão automaticamente assim que possível
      const requestPermissionAutomatically = () => {
        console.log('🔔 [NotificationContext] Verificando permissão de notificações...');
        
        if (browserNotificationService.isNotificationSupported()) {
          // Atualizar permissão atual
          const currentPermission = Notification.permission;
          console.log('🔔 [NotificationContext] Permissão atual:', currentPermission);
          
          if (currentPermission === 'default') {
            console.log('🔔 [NotificationContext] Solicitando permissão de notificações automaticamente...');
            // Solicitar permissão automaticamente
            browserNotificationService.requestPermission()
              .then(permission => {
                console.log('🔔 [NotificationContext] Resultado da permissão:', permission);
                if (permission === 'granted') {
                  console.log('✅ [NotificationContext] Permissão concedida! Notificações do navegador ativadas.');
                } else if (permission === 'denied') {
                  console.warn('⚠️ [NotificationContext] Permissão negada. O usuário precisará permitir manualmente nas configurações do navegador.');
                }
              })
              .catch(error => {
                console.error('❌ [NotificationContext] Erro ao solicitar permissão de notificações:', error);
              });
          } else if (currentPermission === 'granted') {
            console.log('✅ [NotificationContext] Permissão de notificações já concedida');
          } else if (currentPermission === 'denied') {
            console.warn('⚠️ [NotificationContext] Permissão de notificações negada pelo usuário');
            console.warn('💡 [NotificationContext] Para ativar, o usuário precisa permitir nas configurações do navegador');
            console.warn('💡 [NotificationContext] Instruções: Clique no ícone de cadeado na barra de endereço → Permitir notificações');
            console.warn('💡 [NotificationContext] Um banner será exibido para orientar o usuário');
            // Não tentar solicitar novamente quando está denied - o banner cuidará disso
          }
        } else {
          console.warn('⚠️ [NotificationContext] Notificações do navegador não são suportadas');
        }
      };

      // Tentar solicitar imediatamente (se o usuário já interagiu com a página)
      // E também após um pequeno delay para garantir que a página está carregada
      console.log('🚀 [NotificationContext] Primeira tentativa de solicitar permissão...');
      requestPermissionAutomatically();
      
      const timer = setTimeout(() => {
        console.log('🚀 [NotificationContext] Segunda tentativa de solicitar permissão (após 1 segundo)...');
        const currentPermission = Notification.permission;
        console.log('🔍 [NotificationContext] Permissão atual na segunda tentativa:', currentPermission);
        if (currentPermission === 'default') {
          console.log('🔍 [NotificationContext] Permissão ainda é "default", tentando novamente...');
          requestPermissionAutomatically();
        } else {
          console.log('🔍 [NotificationContext] Permissão já mudou para:', currentPermission);
        }
      }, 1000);

      // Tentar solicitar quando o usuário interagir com a página (clique, movimento do mouse, etc.)
      const handleUserInteraction = (eventType: string) => {
        console.log(`🚀 [NotificationContext] Interação do usuário detectada: ${eventType}`);
        const currentPermission = Notification.permission;
        console.log('🔍 [NotificationContext] Permissão atual na interação:', currentPermission);
        if (currentPermission === 'default') {
          console.log('🔍 [NotificationContext] Permissão ainda é "default", solicitando após interação...');
          requestPermissionAutomatically();
          // Remover listeners após solicitar
          document.removeEventListener('click', () => handleUserInteraction('click'));
          document.removeEventListener('mousemove', () => handleUserInteraction('mousemove'));
          document.removeEventListener('keydown', () => handleUserInteraction('keydown'));
        } else {
          console.log('🔍 [NotificationContext] Permissão já mudou para:', currentPermission);
        }
      };

      // Adicionar listeners para interação do usuário
      console.log('🚀 [NotificationContext] Adicionando listeners para interação do usuário...');
      document.addEventListener('click', () => handleUserInteraction('click'), { once: true });
      document.addEventListener('mousemove', () => handleUserInteraction('mousemove'), { once: true });
      document.addEventListener('keydown', () => handleUserInteraction('keydown'), { once: true });

      return () => {
        console.log('🧹 [NotificationContext] Limpando listeners e timers...');
        clearTimeout(timer);
        document.removeEventListener('click', () => handleUserInteraction('click'));
        document.removeEventListener('mousemove', () => handleUserInteraction('mousemove'));
        document.removeEventListener('keydown', () => handleUserInteraction('keydown'));
      };
    }
  }, [isAuthenticated, user?.id]);

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
          console.log('🔔 [NotificationContext] Recebendo notificação:', notificationData);
          
          // Converter formato do WebSocket para o formato interno
          const notification: NotificationServiceType = {
            id: notificationData.data?.id || notificationData.campaign?.id || Date.now() + Math.random(), // Gerar ID se não vier
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data || notificationData.campaign, // Incluir dados da campanha se disponível
            read: false,
            timestamp: notificationData.timestamp || new Date().toISOString(),
          };
          
          console.log('🔔 [NotificationContext] Adicionando notificação ao contexto:', notification);
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

