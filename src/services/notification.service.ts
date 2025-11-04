import { api } from "./api";

export interface Notification {
  id: string | number;
  type: string;
  title: string;
  message: string;
  data?: any;
  read?: boolean;
  timestamp?: string;
  created_at?: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  count?: number;
  unreadCount?: number;
}

/**
 * Serviço para gerenciar notificações
 * Por enquanto, o backend não tem endpoint REST de notificações
 * As notificações são enviadas via WebSocket em tempo real
 * Este serviço pode ser usado no futuro se o backend implementar endpoints REST
 */
export const notificationService = {
  /**
   * Buscar notificações do usuário (via REST API)
   * TODO: Implementar quando o backend tiver endpoint /api/notifications
   */
  async getNotifications(page?: number, limit?: number): Promise<NotificationsResponse> {
    try {
      const params: any = {};
      if (page !== undefined) params.page = page;
      if (limit !== undefined) params.limit = limit;
      
      const response = await api.get("/notifications", { params });
      
      if (response.data?.success && response.data?.data) {
        return {
          success: response.data.success,
          data: response.data.data,
          count: response.data.count || response.data.data.length,
          unreadCount: response.data.unreadCount || 0,
        };
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          count: response.data.count || response.data.data.length,
          unreadCount: response.data.unreadCount || 0,
        };
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      // Se o endpoint não existir, não é erro crítico (é esperado)
      if (err?.response?.status === 404) {
        // Log apenas uma vez para não poluir o console
        if (!(window as any).__notificationsEndpointWarningShown) {
          console.log("ℹ️ Endpoint /api/notifications não existe. Usando apenas WebSocket para notificações em tempo real.");
          (window as any).__notificationsEndpointWarningShown = true;
        }
        return {
          success: false,
          data: [],
          count: 0,
          unreadCount: 0,
        };
      }
      
      const data = err?.response?.data;
      let message = "Erro ao buscar notificações";
      
      if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Marcar notificação como lida
   * TODO: Implementar quando o backend tiver endpoint PUT /api/notifications/:id/read
   */
  async markAsRead(notificationId: string | number): Promise<void> {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (err: any) {
      // Se o endpoint não existir, não é erro crítico
      if (err?.response?.status === 404) {
        console.warn("⚠️ Endpoint /api/notifications/:id/read não existe.");
        return;
      }
      
      const data = err?.response?.data;
      let message = "Erro ao marcar notificação como lida";
      
      if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Marcar todas as notificações como lidas
   * TODO: Implementar quando o backend tiver endpoint PUT /api/notifications/read-all
   */
  async markAllAsRead(): Promise<void> {
    try {
      await api.put("/notifications/read-all");
    } catch (err: any) {
      // Se o endpoint não existir, não é erro crítico
      if (err?.response?.status === 404) {
        console.warn("⚠️ Endpoint /api/notifications/read-all não existe.");
        return;
      }
      
      const data = err?.response?.data;
      let message = "Erro ao marcar todas as notificações como lidas";
      
      if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },
};
