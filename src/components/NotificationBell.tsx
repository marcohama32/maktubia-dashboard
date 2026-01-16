import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { NotificationIcon } from "@/dashboard/sidebar/icons/NotificationIcon";
import { browserNotificationService } from "@/services/browserNotification.service";

export function NotificationBell() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // Always call hook at top level - context should provide defaults for SSR
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();

  // Verificar permissão de notificações
  useEffect(() => {
    if (mounted && typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // Escutar mudanças na permissão (se o usuário mudar nas configurações)
      const checkPermission = () => {
        setNotificationPermission(Notification.permission);
      };
      
      // Verificar periodicamente (a cada 2 segundos quando o dropdown estiver aberto)
      const interval = isOpen ? setInterval(checkPermission, 2000) : null;
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [mounted, isOpen]);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Marcar como lida quando abrir
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      // Não marca automaticamente, apenas visualiza
    }
  }, [isOpen, unreadCount]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Agora";
    if (minutes < 60) return `${minutes} min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString("pt-MZ", { day: "numeric", month: "short" });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "purchase_approved":
        return "✅";
      case "purchase_rejected":
        return "❌";
      case "friend_request":
        return "👋";
      case "friend_request_accepted":
        return "🎉";
      case "points_transfer_received":
        return "💰";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "purchase_approved":
        return "bg-green-50 border-green-200";
      case "purchase_rejected":
        return "bg-red-50 border-red-200";
      case "friend_request":
        return "bg-blue-50 border-blue-200";
      case "friend_request_accepted":
        return "bg-purple-50 border-purple-200";
      case "points_transfer_received":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  // Don't render anything during SSR
  if (!mounted) {
    return (
      <div className="relative">
        <button
          type="button"
          className="relative rounded-lg p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <NotificationIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <NotificationIcon />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 flex max-h-96 w-80 flex-col overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Marcar todas como lidas
                </button>
              )}
              {browserNotificationService.isNotificationSupported() && (() => {
                const permission = notificationPermission || browserNotificationService.getPermission();
                
                if (permission === 'denied') {
                  return (
                    <button
                      onClick={() => {
                        const message = `⚠️ Notificações bloqueadas!\n\nPara ativar notificações do navegador:\n\n1. Clique no ícone de cadeado 🔒 na barra de endereço (à esquerda da URL)\n2. Encontre "Notificações" na lista\n3. Selecione "Permitir"\n4. Recarregue esta página (F5)\n\nOu vá em:\nConfigurações do navegador → Privacidade e segurança → Notificações do site → Permitir para este site`;
                        alert(message);
                      }}
                      className="text-xs font-medium text-orange-600 hover:text-orange-800 px-2 py-1 border border-orange-300 rounded bg-orange-50"
                      title="Notificações bloqueadas - Clique para ver instruções"
                    >
                      🔒 Bloqueado
                    </button>
                  );
                } else if (permission !== 'granted') {
                  return (
                    <button
                      onClick={async () => {
                        try {
                          const newPermission = await browserNotificationService.requestPermission();
                          setNotificationPermission(newPermission);
                          
                          if (newPermission === 'granted') {
                            alert('✅ Permissão de notificações concedida! Você receberá notificações mesmo quando a página não estiver em foco.');
                            // Não precisa recarregar, apenas atualizar o estado
                          } else if (newPermission === 'denied') {
                            alert('⚠️ Permissão negada. Para receber notificações, permita no navegador nas configurações do site.');
                          }
                        } catch (error) {
                          console.error('Erro ao solicitar permissão:', error);
                          alert('❌ Erro ao solicitar permissão. Tente permitir manualmente nas configurações do navegador.');
                        }
                      }}
                      className="text-xs font-medium text-green-600 hover:text-green-800 px-2 py-1 border border-green-300 rounded bg-green-50"
                      title="Ativar notificações do navegador"
                    >
                      🔔 Ativar
                    </button>
                  );
                } else {
                  return (
                    <span 
                      className="text-xs font-medium text-green-600 px-2 py-1"
                      title="Notificações do navegador ativadas"
                    >
                      ✅ Ativo
                    </span>
                  );
                }
              })()}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`cursor-pointer border-l-4 p-4 transition-colors hover:bg-gray-50 ${
                      notification.read ? "opacity-60" : ""
                    } ${getNotificationColor(notification.type)}`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${notification.read ? "text-gray-600" : "text-gray-900"}`}>
                          {notification.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="shrink-0">
                          <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="shrink-0 text-gray-400 hover:text-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


