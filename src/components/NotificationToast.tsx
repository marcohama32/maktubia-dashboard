import { useEffect, useState, useRef } from "react";
import { useNotifications } from "@/contexts/NotificationContext";

export function NotificationToast() {
  const { notifications } = useNotifications();
  const [visibleNotification, setVisibleNotification] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const shownIdsRef = useRef<Set<string | number>>(new Set());

  useEffect(() => {
    // Quando uma nova notificação não lida chega, mostrar toast
    const latestUnread = notifications.find(n => !n.read && !shownIdsRef.current.has(n.id));
    
    if (latestUnread) {
      // Marcar como mostrada
      shownIdsRef.current.add(latestUnread.id);
      
      setVisibleNotification(latestUnread);
      setIsVisible(true);
      
      // Auto-ocultar após 5 segundos
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Limpar após animação
        setTimeout(() => {
          setVisibleNotification(null);
        }, 300);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  if (!visibleNotification || !isVisible) {
    return null;
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "campaign_created":
        return "🎉";
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
      case "campaign_created":
        return "bg-blue-50 border-blue-500";
      case "purchase_approved":
        return "bg-green-50 border-green-500";
      case "purchase_rejected":
        return "bg-red-50 border-red-500";
      case "friend_request":
        return "bg-blue-50 border-blue-500";
      case "friend_request_accepted":
        return "bg-purple-50 border-purple-500";
      case "points_transfer_received":
        return "bg-yellow-50 border-yellow-500";
      default:
        return "bg-gray-50 border-gray-500";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 min-w-[320px] max-w-md transform transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`${getNotificationColor(visibleNotification.type)} rounded-lg border-l-4 p-4 shadow-lg`}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 text-2xl">
            {getNotificationIcon(visibleNotification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {visibleNotification.title}
            </p>
            <p className="mt-1 text-sm text-gray-700 line-clamp-2">
              {visibleNotification.message}
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                setVisibleNotification(null);
              }, 300);
            }}
            className="shrink-0 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

