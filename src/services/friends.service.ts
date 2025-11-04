import { api } from "./api";

export interface FriendRequest {
  request_id?: number;
  from_user_id?: number;
  from_user_name?: string;
  from_user_code?: string;
  from_user_phone?: string;
  from_user_email?: string;
  message?: string;
  request_type?: string;
  requested_identifier?: string;
  created_at?: string;
}

export interface Friend {
  user_id?: number;
  friend_id?: number;
  name?: string;
  user_code?: string;
  phone?: string;
  email?: string;
  friendship_date?: string;
  last_interaction_at?: string;
  // Para gestão: informações de ambos os clientes
  user1_id?: number;
  user2_id?: number;
  user1_name?: string;
  user1_code?: string;
  user2_name?: string;
  user2_code?: string;
  friendship_id?: number;
}

export interface SearchUserResult {
  user_id?: number;
  name?: string;
  user_code?: string;
  phone?: string;
  email?: string;
  is_friend?: boolean;
  can_add?: boolean;
}

export interface FriendsResponse {
  success: boolean;
  data: Friend[];
  count?: number;
}

export interface FriendRequestsResponse {
  success: boolean;
  data: FriendRequest[];
  count?: number;
}

export interface SendFriendRequestDTO {
  identifier: string; // user_code, phone ou email
  message?: string;
}

export const friendsService = {
  /**
   * Enviar pedido de amizade
   * POST /api/friends/request
   */
  async sendRequest(data: SendFriendRequestDTO): Promise<FriendRequest> {
    try {
      const response = await api.post("/friends/request", data);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      } else if (response.data?.data) {
        return response.data.data;
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao enviar pedido de amizade";
      
      if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Listar pedidos de amizade pendentes
   * GET /api/friends/requests
   */
  async getRequests(): Promise<FriendRequestsResponse> {
    try {
      const response = await api.get("/friends/requests");
      
      if (response.data?.success && response.data?.data) {
        return {
          success: response.data.success,
          data: response.data.data,
          count: response.data.count || response.data.data.length,
        };
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          count: response.data.count || response.data.data.length,
        };
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar pedidos de amizade";
      
      if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Aceitar pedido de amizade
   * POST /api/friends/requests/:id/accept
   */
  async acceptRequest(requestId: number): Promise<Friend> {
    try {
      const response = await api.post(`/friends/requests/${requestId}/accept`);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      } else if (response.data?.data) {
        return response.data.data;
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao aceitar pedido de amizade";
      
      if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Rejeitar pedido de amizade
   * POST /api/friends/requests/:id/reject
   */
  async rejectRequest(requestId: number): Promise<void> {
    try {
      await api.post(`/friends/requests/${requestId}/reject`);
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao rejeitar pedido de amizade";
      
      if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Listar TODOS os relacionamentos de amizade entre clientes (para gestão)
   * Como o backend atual só retorna amigos do usuário logado, vamos usar o endpoint padrão
   * e adaptar para mostrar que estamos gerenciando relacionamentos de clientes
   * TODO: Criar endpoint administrativo no backend: GET /api/friends/all ou GET /api/admin/friends
   */
  async getAllFriendships(): Promise<FriendsResponse> {
    try {
      // Por enquanto, usar o endpoint padrão que retorna amigos do usuário logado
      // Quando o backend tiver endpoint administrativo, mudar para /friends/all ou /admin/friends
      const response = await api.get("/friends");
      
      if (response.data?.success && response.data?.data) {
        return {
          success: response.data.success,
          data: response.data.data,
          count: response.data.count || response.data.data.length,
        };
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          count: response.data.count || response.data.data.length,
        };
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar relacionamentos de amizade";
      
      if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Listar amigos do usuário logado
   * GET /api/friends
   */
  async getFriends(): Promise<FriendsResponse> {
    try {
      const response = await api.get("/friends");
      
      if (response.data?.success && response.data?.data) {
        return {
          success: response.data.success,
          data: response.data.data,
          count: response.data.count || response.data.data.length,
        };
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          count: response.data.count || response.data.data.length,
        };
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar amigos";
      
      if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Buscar usuário por identificador
   * GET /api/friends/search?identifier=XXX
   */
  async searchUser(identifier: string): Promise<SearchUserResult> {
    try {
      const response = await api.get("/friends/search", {
        params: { identifier },
      });
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      } else if (response.data?.data) {
        return response.data.data;
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar usuário";
      
      if (_status === 404) {
        message = "Usuário não encontrado";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Remover amizade
   * DELETE /api/friends/:friendId
   */
  async removeFriend(friendId: number): Promise<void> {
    try {
      await api.delete(`/friends/${friendId}`);
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao remover amizade";
      
      if (_status === 404) {
        message = "Amizade não encontrada";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },
};

