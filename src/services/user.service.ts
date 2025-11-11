import { api } from "./api";

export interface User {
  id: number;
  name?: string; // Para compatibilidade
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  bi?: string | null; // Bilhete de Identidade (Mozambican ID)
  role?: string | { id?: number; name?: string; description?: string; [key: string]: any };
  isActive?: boolean;
  lastLogin?: string | null;
  points?: number;
  level?: string;
  balance?: number;
  pointsToNextLevel?: number;
  permissions?: any;
  createdBy?: {
    id?: number;
    username?: string;
    fullName?: string;
    role?: string;
  } | null;
  // Nova estrutura de métricas de pontos (não mais loans)
  metrics?: {
    totalPurchases?: number;
    totalSpent?: number;
    firstPurchaseDate?: string | null;
    lastPurchaseDate?: string | null;
    maxPurchaseAmount?: number;
    minPurchaseAmount?: number;
    uniqueEstablishmentsVisited?: number;
    totalPointTransactions?: number;
    pointsEarned?: number;
    pointsSpent?: number;
    pointsBalance?: number;
    transfers?: {
      sent?: number;
      received?: number;
      pointsTransferredOut?: number;
      pointsTransferredIn?: number;
    };
    rewards?: {
      redeemed?: number;
      pointsSpent?: number;
    };
    daysSinceLastLogin?: number | null;
    daysSinceRegistration?: number;
    activityStatus?: string;
    // Métricas antigas (para funcionários)
    total_actions?: number;
    total_customers_created?: number;
    total_loans_created?: number;
    days_since_last_login?: number | null;
    activity_status?: string;
  };
  // Dados adicionais do /users/me
  profile?: {
    userId?: string;
    name?: string;
    phone?: string;
    email?: string;
    level?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  wallet?: {
    userId?: string;
    balance?: number;
    points?: number;
    updatedAt?: string;
  } | null;
  friends?: {
    total?: number;
    list?: Array<{
      user_id?: number;
      friend_id?: number;
      name?: string;
      user_code?: string;
      phone?: string;
      email?: string;
      friendship_date?: string;
      last_interaction_at?: string;
    }>;
  };
  friend_requests?: {
    total?: number;
    list?: Array<any>;
  };
  recent_transfers?: Array<any>;
  recent_transactions?: Array<any>;
  recent_purchases?: Array<any>;
  statistics?: {
    friends?: {
      total?: number;
      pending_requests?: number;
    };
    transfers?: {
      sent?: number;
      received?: number;
      points_sent?: number;
      points_received?: number;
    };
    purchases?: {
      total?: number;
      confirmed?: number;
      pending?: number;
      total_points_earned?: number;
      pending_points?: number;
    };
    wallet?: {
      balance?: number;
      points?: number;
      total_points?: number;
    };
  };
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserDTO {
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string;
  bi?: string;
  tipo_documento?: string;
  numero_documento?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateUserDTO extends Partial<CreateUserDTO> {
  tipo_documento?: string;
  numero_documento?: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  meta?: {
    showing: string;
    currentPage: number;
    perPage: number;
    type?: string;
  };
}

export const userService = {
  async getAll(page?: number, limit?: number): Promise<UsersResponse> {
    try {
      const params: any = {};
      if (page !== undefined) params.page = page;
      if (limit !== undefined) params.limit = limit;
      
      const response = await api.get("/users/employees", { params });
      
      // O backend retorna: { success: true, data: [...], pagination: {...}, meta: {...} }
      if (response.data?.success && response.data?.data && Array.isArray(response.data.data)) {
        const mappedData = response.data.data.map((user: any) => ({
          ...user,
          // Adiciona 'name' para compatibilidade com código existente
          name: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Sem nome",
        }));
        
        return {
          success: response.data.success,
          data: mappedData,
          pagination: response.data.pagination,
          meta: response.data.meta,
        };
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Formato alternativo sem success flag
        const mappedData = response.data.data.map((user: any) => ({
          ...user,
          name: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Sem nome",
        }));
        
        return {
          success: true,
          data: mappedData,
          pagination: response.data.pagination,
          meta: response.data.meta,
        };
      } else if (Array.isArray(response.data)) {
        // Formato direto (array)
        return {
          success: true,
          data: response.data.map((user: any) => ({
            ...user,
            name: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Sem nome",
          })),
        };
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar usuários";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 500) {
        message = "Erro no servidor. Por favor, verifique o backend ou contacte o administrador.";
        if (data?.message) {
          message += ` Detalhes: ${data.message}`;
        }
      } else if (_status === 404) {
        message = "Endpoint não encontrado. Verifique se o backend está configurado correctamente.";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data) {
        message = data.message || data.error || data.detail || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      // Preservar flag de erro de rede
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async getById(id: number): Promise<User> {
    try {
      const response = await api.get(`/users/${id}`);
      
      let user: User;
      
      // Nova estrutura: { success: true, data: {...} }
      const userData = response.data?.data || response.data || {};
      
      // Normalizar para o formato esperado pelo frontend
      return {
        ...userData,
        name: userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.username || "Sem nome",
      } as User;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar usuário";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 500) {
        message = "Erro no servidor. Por favor, verifique o backend ou contacte o administrador.";
        if (data?.message) {
          message += ` Detalhes: ${data.message}`;
        }
      } else if (_status === 404) {
        message = "Usuário não encontrado.";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data) {
        message = data.message || data.error || data.detail || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      // Preservar flag de erro de rede
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async create(data: CreateUserDTO): Promise<User> {
    try {
      // O backend aceita name ou firstName/lastName e normaliza para first_name/last_name
      // O backend também aceita role (nome) e converte para role_id
      
      // Log do payload para debug
      console.log("📤 [USER SERVICE] Enviando dados para criar usuário:", {
        username: data.username,
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        tipo_documento: (data as any).tipo_documento,
        numero_documento: (data as any).numero_documento,
        bi: data.bi,
        role: data.role,
        isActive: data.isActive,
        hasPassword: !!data.password,
      });
      
      const response = await api.post<any>("/users", data);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const userData = response.data?.data || response.data || {};
      
      // Normalizar para o formato esperado pelo frontend
      return {
        ...userData,
        name: userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.username || "Sem nome",
      } as User;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao criar usuário";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos ou campos obrigatórios ausentes";
      } else if (_status === 409) {
        message = data?.message || data?.error || "Username ou email já existem";
      } else if (data) {
        message = data.message || data.error || JSON.stringify(data) || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      // Preservar flag de erro de rede
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async update(id: number, data: UpdateUserDTO): Promise<User> {
    try {
      // O backend normaliza automaticamente:
      // - firstName/lastName ou name -> first_name/last_name
      // - role (nome) -> role_id
      // - isActive -> is_active
      // Podemos enviar no formato camelCase que o backend trata
      const backendData: any = { ...data };
      
      // O backend aceita firstName/lastName diretamente e converte internamente
      // Não precisamos converter aqui, o backend faz isso
      
      const response = await api.put<any>(`/users/${id}`, backendData);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const userData = response.data?.data || response.data || {};
      
      // Normalizar para o formato esperado pelo frontend
      return {
        ...userData,
        name: userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.username || "Sem nome",
      } as User;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao actualizar usuário";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos";
      } else if (_status === 404) {
        message = "Usuário não encontrado";
      } else if (_status === 409) {
        message = data?.message || data?.error || "Username ou email já existem";
      } else if (data) {
        // Se o erro for sobre campos inválidos, mostrar mensagem mais clara
        if (data.message && (data.message.includes("campo") || data.message.includes("válido"))) {
          message = data.message;
        } else {
          message = data.message || data.error || JSON.stringify(data) || message;
        }
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      // Preservar flag de erro de rede
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/users/${id}`);
    } catch (err: any) {
      const data = err?.response?.data;
      let message = "Erro ao eliminar usuário";
      if (data) {
        message = data.message || data.error || JSON.stringify(data) || message;
      } else if (err?.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  /**
   * Obter perfil do usuário logado
   */
  async getProfile(): Promise<User> {
    try {
      const response = await api.get<any>("/users/profile");
      
      // O backend retorna: { success: true, data: {...} }
      const userData = response.data?.data || response.data || {};
      
      return {
        ...userData,
        name: userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.username || "Sem nome",
      } as User;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar perfil";
      
      if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 404) {
        message = "Perfil não encontrado.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Atualizar perfil do usuário logado
   */
  async updateProfile(data: UpdateUserDTO): Promise<User> {
    try {
      const response = await api.put<any>("/users/profile", data);
      
      // O backend retorna: { success: true, data: {...} }
      const userData = response.data?.data || response.data || {};
      
      return {
        ...userData,
        name: userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.username || "Sem nome",
      } as User;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao atualizar perfil";
      
      if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Alterar senha do usuário
   */
  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.put(`/users/${id}/change-password`, {
        current_password: currentPassword,
        new_password: newPassword,
      });
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao alterar senha";
      
      if (_status === 401) {
        message = "Senha atual incorreta.";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Obter estatísticas de usuários
   */
  async getStats(): Promise<{
    total_users: number;
    active_users: number;
    recent_logins: number;
    admin_users: number;
  }> {
    try {
      const response = await api.get<any>("/users/stats");
      
      // O backend retorna: { success: true, data: {...} }
      return response.data?.data || response.data || {};
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar estatísticas";
      
      if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Logout do usuário
   */
  async logout(): Promise<void> {
    try {
      await api.post("/users/logout");
    } catch (err: any) {
      // Logout pode falhar se o token já estiver inválido, mas não é crítico
      // Não lançar erro para não bloquear o logout local
      console.warn("Erro ao fazer logout no servidor:", err?.message);
    }
  },
};

