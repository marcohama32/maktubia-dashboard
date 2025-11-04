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
  role?: string | { name?: string; description?: string; [key: string]: any };
  isActive?: boolean;
  lastLogin?: string | null;
  points?: number;
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
    total_actions?: number;
    total_customers_created?: number;
    total_loans_created?: number;
    days_since_last_login?: number | null;
    activity_status?: string;
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
  password?: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateUserDTO extends Partial<CreateUserDTO> {}

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
      
      if (_status === 500) {
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
      
      throw new Error(message);
    }
  },

  async getById(id: number): Promise<User> {
    try {
      const response = await api.get(`/users/${id}`);
      
      let user: User;
      
      // O backend retorna: { success: true, data: {...} }
      if (response.data?.data && typeof response.data.data === "object") {
        user = response.data.data;
      } else if (response.data && typeof response.data === "object" && "id" in response.data) {
        user = response.data;
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        throw new Error("Formato de resposta inesperado do backend");
      }
      
      // Adiciona 'name' para compatibilidade com código existente
      return {
        ...user,
        name: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Sem nome",
      };
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar usuário";
      
      if (_status === 500) {
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
      
      throw new Error(message);
    }
  },

  async create(data: CreateUserDTO): Promise<User> {
    try {
      const response = await api.post<User>("/users", data);
      return response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao criar usuário";
      if (data) {
        message = data.message || data.error || JSON.stringify(data) || message;
      } else if (err?.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  async update(id: number, data: UpdateUserDTO): Promise<User> {
    try {
      // Transformar dados para o formato que o backend espera
      const backendData: any = {};
      
      // Se houver firstName e lastName, combinar em name
      if (data.firstName || data.lastName) {
        backendData.name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
      } else if (data.name) {
        backendData.name = data.name;
      }
      
      // Adicionar outros campos se fornecidos (o backend aceita todos esses campos)
      if (data.username !== undefined && data.username !== null && data.username !== "") {
        backendData.username = data.username;
      }
      if (data.email !== undefined && data.email !== null && data.email !== "") {
        backendData.email = data.email;
      }
      if (data.phone !== undefined && data.phone !== null && data.phone !== "") {
        backendData.phone = data.phone;
      }
      if (data.bi !== undefined && data.bi !== null && data.bi !== "") {
        backendData.bi = data.bi;
      }
      if (data.role !== undefined && data.role !== null && data.role !== "") {
        backendData.role = data.role;
      }
      if (data.isActive !== undefined) {
        backendData.isActive = data.isActive;
      }
      if (data.password !== undefined && data.password !== null && data.password !== "") {
        backendData.password = data.password;
      }
      
      // Garantir que name e isActive estejam presentes (campos obrigatórios)
      if (!backendData.name) {
        throw new Error("Nome é obrigatório para atualização");
      }
      if (backendData.isActive === undefined) {
        backendData.isActive = true;
      }
      
      console.log("📤 Enviando para backend:", backendData);
      
      const response = await api.put<any>(`/users/${id}`, backendData);
      
      // O backend pode retornar { success: true, data: {...} } ou direto o objeto
      let user: User;
      
      if (response.data?.data && typeof response.data.data === "object") {
        // Formato: { data: {...} } ou { success: true, data: {...} }
        user = response.data.data;
      } else if (response.data && typeof response.data === "object" && "id" in response.data) {
        // Formato direto: {...}
        user = response.data;
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        throw new Error("Formato de resposta inesperado do backend");
      }
      
      // Adiciona 'name' para compatibilidade com código existente
      return {
        ...user,
        name: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Sem nome",
      };
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao actualizar usuário";
      if (data) {
        // Se o erro for sobre campos inválidos, mostrar mensagem mais clara
        if (data.message && data.message.includes("campo") || data.message && data.message.includes("válido")) {
          message = data.message;
        } else {
          message = data.message || data.error || JSON.stringify(data) || message;
        }
      } else if (err?.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/users/${id}`);
    } catch (err: any) {
      const _status = err?.response?.status;
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
};

