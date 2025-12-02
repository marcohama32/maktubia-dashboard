import { api } from "./api";

export interface Customer {
  id: number;
  name?: string; // Para compatibilidade
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  bi?: string | null; // Bilhete de Identidade (Mozambican ID)
  user_code?: string; // Código único do usuário
  role?: string | { id?: number; name?: string; description?: string; [key: string]: any };
  isActive?: boolean;
  lastLogin?: string | null;
  points?: number;
  balance?: number;
  level?: string;
  pointsToNextLevel?: number;
  permissions?: any;
  createdBy?: {
    id?: number;
    username?: string;
    fullName?: string;
    role?: string;
  } | null;
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
  };
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCustomerDTO {
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string;
  bi?: string;
  user_code?: string; // Código único do usuário
  tipo_documento?: string;
  numero_documento?: string;
  password?: string;
  isActive?: boolean;
}

export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {
  tipo_documento?: string;
  numero_documento?: string;
}

export interface CustomersResponse {
  success: boolean;
  data: Customer[];
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
    type: string;
  };
  metrics?: {
    total_customers: number;
    active_customers: number;
    inactive_customers: number;
    [key: string]: any;
  };
}

export const customerService = {
  async getAll(page?: number, limit?: number): Promise<CustomersResponse> {
    try {
      const params: any = {};
      if (page !== undefined) params.page = page;
      if (limit !== undefined) params.limit = limit;
      
      // Usar endpoint /users/customers que retorna usuários com role id = 1
      const response = await api.get("/users/customers", { params });
      
      // O backend retorna: { success: true, data: [...], pagination: {...}, meta: {...}, metrics: {...} }
      if (response.data?.success && response.data?.data && Array.isArray(response.data.data)) {
        // Mapear os dados para adicionar 'name' para compatibilidade
        const mappedData = response.data.data.map((customer: any) => ({
          ...customer,
          name: customer.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.username || "Sem nome",
        }));
        
        return {
          success: response.data.success,
          data: mappedData,
          pagination: response.data.pagination,
          meta: response.data.meta,
          metrics: response.data.metrics,
        };
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Formato alternativo sem success flag
        const mappedData = response.data.data.map((customer: any) => ({
          ...customer,
          name: customer.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.username || "Sem nome",
        }));
        
        return {
          success: true,
          data: mappedData,
          pagination: response.data.pagination,
          meta: response.data.meta,
          metrics: response.data.metrics,
        };
      } else if (Array.isArray(response.data)) {
        // Formato direto (array)
        return {
          success: true,
          data: response.data.map((customer: any) => ({
            ...customer,
            name: customer.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.username || "Sem nome",
          })),
        };
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar clientes";
      
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

  async getById(id: number): Promise<Customer> {
    try {
      // Usar endpoint /users/:id que retorna usuário específico
      // Como clientes são users com role id = 1, usar /users/:id
      const response = await api.get(`/users/${id}`);
      
      let customer: Customer;
      
      // O backend retorna: { success: true, data: {...} }
      if (response.data?.success && response.data?.data && typeof response.data.data === "object") {
        customer = response.data.data;
      } else if (response.data?.data && typeof response.data.data === "object") {
        customer = response.data.data;
      } else if (response.data && typeof response.data === "object" && "id" in response.data) {
        customer = response.data;
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        throw new Error("Formato de resposta inesperado do backend");
      }
      
      // Adiciona 'name' para compatibilidade com código existente
      return {
        ...customer,
        name: customer.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.username || "Sem nome",
      };
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar cliente";
      
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
        message = "Cliente não encontrado.";
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

  async create(data: CreateCustomerDTO): Promise<Customer> {
    try {
      // O backend aceita firstName/lastName ou name e normaliza para first_name/last_name
      // O backend também aceita role (nome) e converte para role_id
      const payload: any = {
        username: data.username,
        email: data.email,
        password: data.password,
        // Pode enviar firstName/lastName ou name - o backend normaliza
        firstName: data.firstName,
        lastName: data.lastName,
        name: data.name,
        phone: data.phone || null,
        bi: data.bi || null,
        role: "user", // Backend converte "user" para role_id = 1
        isActive: data.isActive !== undefined ? data.isActive : true,
      };
      const response = await api.post("/users", payload);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const customerData = response.data?.data || response.data || {};
      
      // Normalizar para o formato esperado pelo frontend
      return {
        ...customerData,
        name: customerData.fullName || `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim() || customerData.username || "Sem nome",
      } as Customer;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao criar cliente";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
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

  async update(id: number, data: UpdateCustomerDTO): Promise<Customer> {
    try {
      // O backend normaliza automaticamente:
      // - firstName/lastName ou name -> first_name/last_name
      // - role (nome) -> role_id
      // - isActive -> is_active
      // Podemos enviar no formato camelCase que o backend trata
      const payload: any = { ...data };
      
      // O backend aceita firstName/lastName diretamente e converte internamente
      // Não precisamos converter aqui, o backend faz isso
      
      const response = await api.put(`/users/${id}`, payload);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const customerData = response.data?.data || response.data || {};
      
      // Normalizar para o formato esperado pelo frontend
      return {
        ...customerData,
        name: customerData.fullName || `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim() || customerData.username || "Sem nome",
      } as Customer;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao actualizar cliente";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos";
      } else if (_status === 404) {
        message = "Cliente não encontrado";
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

  async delete(id: number): Promise<void> {
    try {
      // Deletar cliente é deletar um user
      await api.delete(`/users/${id}`);
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao eliminar cliente";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
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
};

