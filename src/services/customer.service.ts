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
  password?: string;
  isActive?: boolean;
}

export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {}

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
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar clientes";
      
      if (status === 500) {
        message = "Erro no servidor. Por favor, verifique o backend ou contacte o administrador.";
        if (data?.message) {
          message += ` Detalhes: ${data.message}`;
        }
      } else if (status === 404) {
        message = "Endpoint não encontrado. Verifique se o backend está configurado correctamente.";
      } else if (status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data) {
        message = data.message || data.error || data.detail || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
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
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar cliente";
      
      if (status === 500) {
        message = "Erro no servidor. Por favor, verifique o backend ou contacte o administrador.";
        if (data?.message) {
          message += ` Detalhes: ${data.message}`;
        }
      } else if (status === 404) {
        message = "Cliente não encontrado.";
      } else if (status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data) {
        message = data.message || data.error || data.detail || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  async create(data: CreateCustomerDTO): Promise<Customer> {
    try {
      // Criar cliente é criar um user com role_id = 1
      // O backend espera first_name, last_name (snake_case) e role: "user"
      const payload: any = {
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.firstName || data.name?.split(" ")[0] || "",
        last_name: data.lastName || data.name?.split(" ").slice(1).join(" ") || "",
        phone: data.phone || null,
        bi: data.bi || null,
        role: "user", // Garantir que seja role "user" (role_id = 1)
        isActive: data.isActive !== undefined ? data.isActive : true,
      };
      const response = await api.post("/users", payload);
      
      // O backend pode retornar: { success: true, data: {...} } ou objeto direto
      let customer: Customer;
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
      
      // Adiciona 'name' para compatibilidade
      return {
        ...customer,
        name: customer.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.username || "Sem nome",
      };
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao criar cliente";
      if (data) {
        message = data.message || data.error || JSON.stringify(data) || message;
      } else if (err?.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  async update(id: number, data: UpdateCustomerDTO): Promise<Customer> {
    try {
      // Atualizar cliente é atualizar um user
      // O backend espera first_name, last_name (snake_case)
      const payload: any = {};
      
      if (data.username !== undefined) payload.username = data.username;
      if (data.email !== undefined) payload.email = data.email;
      if (data.password !== undefined) payload.password = data.password;
      if (data.firstName !== undefined) payload.first_name = data.firstName;
      if (data.lastName !== undefined) payload.last_name = data.lastName;
      if (data.name !== undefined && !data.firstName && !data.lastName) {
        // Se só name foi fornecido, dividir
        const nameParts = data.name.trim().split(/\s+/).filter(part => part.length > 0);
        if (nameParts.length > 0) {
          payload.first_name = nameParts[0];
          payload.last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        }
      }
      if (data.phone !== undefined) payload.phone = data.phone || null;
      if (data.bi !== undefined) payload.bi = data.bi || null;
      if (data.isActive !== undefined) payload.isActive = data.isActive;
      
      const response = await api.put(`/users/${id}`, payload);
      
      // O backend pode retornar: { success: true, data: {...} } ou objeto direto
      let customer: Customer;
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
      
      // Adiciona 'name' para compatibilidade
      return {
        ...customer,
        name: customer.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.username || "Sem nome",
      };
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao actualizar cliente";
      if (data) {
        message = data.message || data.error || JSON.stringify(data) || message;
      } else if (err?.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  async delete(id: number): Promise<void> {
    try {
      // Deletar cliente é deletar um user
      await api.delete(`/users/${id}`);
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao eliminar cliente";
      if (data) {
        message = data.message || data.error || JSON.stringify(data) || message;
      } else if (err?.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },
};

