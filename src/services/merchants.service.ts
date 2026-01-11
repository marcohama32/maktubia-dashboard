import { api } from "./api";

export interface MerchantUser {
  merchant_user_id?: number;
  user_id?: number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  permissions?: {
    can_create_campaigns?: boolean;
    can_manage_merchant?: boolean;
    can_set_custom_points?: boolean;
    [key: string]: any;
  };
  is_active?: boolean;
  created_at?: string;
}

export interface Merchant {
  merchant_id?: number;
  name?: string;
  type?: string;
  address?: string;
  phone?: string;
  email?: string;
  image?: string;
  image_url?: string;
  qr_code?: string;
  color?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Nova estrutura: merchants têm users e campaigns
  users?: MerchantUser[];
  campaigns?: any[];
  // Campos legados (compatibilidade)
  user_id?: number;
  establishment_id?: number;
  can_create_campaigns?: boolean;
  can_set_custom_points?: boolean;
  user?: {
    id?: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  establishment?: {
    id?: number;
    name?: string;
    type?: string;
    address?: string;
  };
}

export interface MerchantsResponse {
  success: boolean;
  data: Merchant[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export interface CreateMerchantDTO {
  user_id: number;
  establishment_id: number;
  can_create_campaigns?: boolean;
  can_set_custom_points?: boolean;
  is_active?: boolean;
}

export interface UpdateMerchantDTO {
  can_create_campaigns?: boolean;
  can_set_custom_points?: boolean;
  is_active?: boolean;
}

export interface GetAllMerchantsParams {
  page?: number;
  limit?: number;
  is_active?: boolean;
}

export interface GetMerchantsByEstablishmentParams {
  establishmentId: string | number;
  page?: number;
  limit?: number;
  is_active?: boolean;
}

export interface GetMerchantsByUserParams {
  userId: number;
  page?: number;
  limit?: number;
  is_active?: boolean;
}

export const merchantsService = {
  /**
   * Buscar estabelecimentos do merchant autenticado
   * GET /api/establishments/merchants/establishments
   */
  async getMyEstablishments(): Promise<{
    success: boolean;
    data: Array<{
      id: number;
      name: string;
      type?: string;
      address?: string;
      phone?: string;
      email?: string;
      merchant_permissions?: {
        can_create_campaigns: boolean;
        can_set_custom_points: boolean;
        merchant_id: number;
      };
    }>;
    pagination?: any;
    isMerchant: boolean;
    isAdmin?: boolean;
  }> {
    try {
      const response = await api.get("/establishments/merchants/establishments");
      
      // Nova estrutura: { success: true, data: [...], pagination: {...}, isMerchant: boolean, isAdmin?: boolean }
      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          pagination: response.data.pagination,
          isMerchant: response.data.isMerchant || false,
          isAdmin: response.data.isAdmin || false,
        };
      } else {
        return {
          success: true,
          data: response.data?.data || response.data || [],
          pagination: response.data?.pagination,
          isMerchant: (response.data?.data || response.data || []).length > 0,
          isAdmin: response.data?.isAdmin || false,
        };
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar estabelecimentos";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
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
   * Verificar se usuário é merchant de algum estabelecimento
   * GET /api/merchants/check
   */
  async checkUserMerchants(): Promise<{ success: boolean; data: Merchant[]; isMerchant: boolean }> {
    try {
      const response = await api.get("/merchants/check");
      
      // Nova estrutura: { success: true, data: [...], isMerchant: boolean }
      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          isMerchant: response.data.isMerchant || false,
        };
      } else {
        return {
          success: true,
          data: response.data?.data || response.data || [],
          isMerchant: (response.data?.data || response.data || []).length > 0,
        };
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao verificar merchants";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
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
   * Buscar merchants de um estabelecimento
   * GET /api/merchants/establishment/:establishmentId
   */
  async getMerchantsByEstablishment(params: GetMerchantsByEstablishmentParams): Promise<MerchantsResponse> {
    try {
      const queryParams: any = {};
      if (params.page !== undefined) queryParams.page = params.page;
      if (params.limit !== undefined) queryParams.limit = params.limit;
      if (params.is_active !== undefined) queryParams.is_active = params.is_active;

      // Converter ID para string para a URL (aceita tanto números quanto strings)
      const establishmentIdString = String(params.establishmentId);
      const response = await api.get(`/merchants/establishment/${establishmentIdString}`, { params: queryParams });

      // Nova estrutura: { success: true, data: [...], pagination: {...} }
      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else {
        return {
          success: true,
          data: response.data?.data || response.data || [],
          pagination: response.data?.pagination,
        };
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar merchants do estabelecimento";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Estabelecimento não encontrado";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
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
   * Buscar merchants de um usuário
   * GET /api/merchants/user/:userId
   */
  async getMerchantsByUser(params: GetMerchantsByUserParams): Promise<MerchantsResponse> {
    try {
      const queryParams: any = {};
      if (params.page !== undefined) queryParams.page = params.page;
      if (params.limit !== undefined) queryParams.limit = params.limit;
      if (params.is_active !== undefined) queryParams.is_active = params.is_active;

      const response = await api.get(`/merchants/user/${params.userId}`, { params: queryParams });

      // Nova estrutura: { success: true, data: [...], pagination: {...} }
      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else {
        return {
          success: true,
          data: response.data?.data || response.data || [],
          pagination: response.data?.pagination,
        };
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar merchants do usuário";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Usuário não encontrado";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
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
   * Buscar todos os merchants (apenas admin)
   * GET /api/merchants
   */
  async getAll(params?: GetAllMerchantsParams): Promise<MerchantsResponse> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.is_active !== undefined) queryParams.is_active = params.is_active;

      const response = await api.get("/merchants", { params: queryParams });

      // Nova estrutura: { success: true, data: [...], pagination: {...} }
      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else {
        return {
          success: true,
          data: response.data?.data || response.data || [],
          pagination: response.data?.pagination,
        };
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar merchants";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas administradores podem listar todos os merchants.";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
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
   * Buscar merchant por ID (apenas admin)
   * GET /api/merchants/:id
   */
  async getById(id: number): Promise<Merchant> {
    try {
      const response = await api.get(`/merchants/${id}`);
      
      // Nova estrutura: { success: true, data: {...} }
      const merchantData = response.data?.data || response.data || {};
      
      return merchantData as Merchant;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar merchant";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Merchant não encontrado";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas administradores podem buscar merchants.";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
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
   * Criar merchant (apenas admin)
   * POST /api/merchants
   */
  async create(data: CreateMerchantDTO): Promise<Merchant> {
    try {
      const response = await api.post("/merchants", data);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const merchantData = response.data?.data || response.data || {};
      
      return merchantData as Merchant;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao criar merchant";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para criar merchant";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas administradores podem criar merchants.";
      } else if (_status === 409) {
        message = data?.message || data?.error || "Este usuário já é merchant deste estabelecimento.";
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
   * Atualizar merchant (apenas admin)
   * PUT /api/merchants/:id
   */
  async update(id: number, data: UpdateMerchantDTO): Promise<Merchant> {
    try {
      const response = await api.put(`/merchants/${id}`, data);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const merchantData = response.data?.data || response.data || {};
      
      return merchantData as Merchant;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao atualizar merchant";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para atualizar merchant";
      } else if (_status === 404) {
        message = "Merchant não encontrado";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas administradores podem atualizar merchants.";
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
   * Deletar merchant (apenas admin)
   * DELETE /api/merchants/:id
   */
  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/merchants/${id}`);
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao deletar merchant";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Merchant não encontrado";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas administradores podem deletar merchants.";
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
   * Dar permissão de criar campanhas (apenas admin)
   * POST /api/merchants/:id/permissions/campaigns/grant
   */
  async grantCampaignPermission(id: number): Promise<Merchant> {
    try {
      const response = await api.post(`/merchants/${id}/permissions/campaigns/grant`);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const merchantData = response.data?.data || response.data || {};
      
      return merchantData as Merchant;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao conceder permissão de campanhas";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Merchant não encontrado";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas administradores podem conceder permissões.";
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
   * Remover permissão de criar campanhas (apenas admin)
   * POST /api/merchants/:id/permissions/campaigns/revoke
   */
  async revokeCampaignPermission(id: number): Promise<Merchant> {
    try {
      const response = await api.post(`/merchants/${id}/permissions/campaigns/revoke`);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const merchantData = response.data?.data || response.data || {};
      
      return merchantData as Merchant;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao revogar permissão de campanhas";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Merchant não encontrado";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas administradores podem revogar permissões.";
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
   * Dar permissão de definir pontos personalizados (apenas admin)
   * POST /api/merchants/:id/permissions/custom-points/grant
   */
  async grantCustomPointsPermission(id: number): Promise<Merchant> {
    try {
      const response = await api.post(`/merchants/${id}/permissions/custom-points/grant`);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const merchantData = response.data?.data || response.data || {};
      
      return merchantData as Merchant;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao conceder permissão de pontos personalizados";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Merchant não encontrado";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas administradores podem conceder permissões.";
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
   * Remover permissão de definir pontos personalizados (apenas admin)
   * POST /api/merchants/:id/permissions/custom-points/revoke
   */
  async revokeCustomPointsPermission(id: number): Promise<Merchant> {
    try {
      const response = await api.post(`/merchants/${id}/permissions/custom-points/revoke`);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const merchantData = response.data?.data || response.data || {};
      
      return merchantData as Merchant;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao revogar permissão de pontos personalizados";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Merchant não encontrado";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas administradores podem revogar permissões.";
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

