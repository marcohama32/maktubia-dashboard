import { api } from "./api";

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: any;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolesResponse {
  success: boolean;
  data: Role[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  meta?: {
    showing: string;
    currentPage: number;
    perPage: number;
  };
}

export const roleService = {
  /**
   * Buscar todas as roles
   * GET /api/roles
   */
  async getAll(page: number = 1, limit: number = 100, search: string = "", isActive: boolean | null = null): Promise<RolesResponse> {
    try {
      const params: any = {
        page,
        limit,
      };
      
      if (search) {
        params.search = search;
      }
      
      if (isActive !== null) {
        params.is_active = isActive;
      }
      
      const response = await api.get("/roles", { params });
      
      // Normalizar resposta
      const rolesData = response.data?.data || [];
      const normalizedRoles = rolesData.map((role: any) => ({
        id: role.id || role.role_id,
        name: role.name || role.role_name,
        description: role.description || role.role_description || "",
        permissions: role.permissions || {},
        isActive: role.isActive !== undefined ? role.isActive : (role.is_active !== false),
        createdAt: role.createdAt || role.created_at,
        updatedAt: role.updatedAt || role.updated_at,
      }));
      
      return {
        success: response.data?.success !== false,
        data: normalizedRoles,
        pagination: response.data?.pagination,
        meta: response.data?.meta,
      };
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar roles";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Buscar role por ID
   * GET /api/roles/:id
   */
  async getById(id: number): Promise<Role> {
    try {
      const response = await api.get(`/roles/${id}`);
      
      const roleData = response.data?.data || response.data || {};
      
      return {
        id: roleData.id || roleData.role_id,
        name: roleData.name || roleData.role_name,
        description: roleData.description || roleData.role_description || "",
        permissions: roleData.permissions || {},
        isActive: roleData.isActive !== undefined ? roleData.isActive : (roleData.is_active !== false),
        createdAt: roleData.createdAt || roleData.created_at,
        updatedAt: roleData.updatedAt || roleData.updated_at,
      } as Role;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar role";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Role não encontrada";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Buscar role por nome
   * GET /api/roles/name/:name
   */
  async getByName(name: string): Promise<Role> {
    try {
      const response = await api.get(`/roles/name/${name}`);
      
      const roleData = response.data?.data || response.data || {};
      
      return {
        id: roleData.id || roleData.role_id,
        name: roleData.name || roleData.role_name,
        description: roleData.description || roleData.role_description || "",
        permissions: roleData.permissions || {},
        isActive: roleData.isActive !== undefined ? roleData.isActive : (roleData.is_active !== false),
        createdAt: roleData.createdAt || roleData.created_at,
        updatedAt: roleData.updatedAt || roleData.updated_at,
      } as Role;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar role";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Role não encontrada";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },
};

