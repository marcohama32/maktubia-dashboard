import { api } from "./api";

// Interfaces para campanhas de sorteio
export interface DrawPrize {
  prize_id?: number;
  position: number;
  prize_name: string;
  prize_points: number;
}

export interface DrawCampaign {
  campaign_id?: string;
  id?: string;
  establishment_id?: string;
  type?: string;
  participation_criteria: string;
  draw_start_date: string;
  draw_end_date: string;
  draw_executed?: boolean;
  draw_executed_at?: string;
  establishment_name?: string;
  prizes?: DrawPrize[];
  stats?: {
    totalPurchases: number;
    validatedPurchases: number;
    pendingPurchases: number;
    uniqueParticipants: number;
  };
  winners?: Array<{
    winner_id: number;
    user_id: string;
    position: number;
    prize_name: string;
    prize_points: number;
    selected_at: string;
    user_name?: string;
    user_email?: string;
  }>;
}

export interface CreateDrawCampaignDTO {
  establishment_id: string | number;
  participation_criteria: string;
  draw_start_date: string;
  draw_end_date: string;
  prizes: DrawPrize[];
}

export interface UpdateDrawCampaignDTO {
  participation_criteria?: string;
  draw_start_date?: string;
  draw_end_date?: string;
  prizes?: DrawPrize[];
}

export interface DrawCampaignsResponse {
  success: boolean;
  data: DrawCampaign[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DrawPurchase {
  draw_purchase_id: number;
  campaign_id: string;
  user_id: string;
  purchase_amount: number;
  receipt_photo?: string;
  status: 'pending' | 'validated' | 'rejected' | 'cancelled';
  validated_at?: string;
  validated_by?: number;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
}

// Serviço para campanhas de sorteio
export const drawCampaignsService = {
  /**
   * Criar campanha de sorteio
   * POST /api/draw-campaigns
   */
  async create(data: CreateDrawCampaignDTO): Promise<DrawCampaign> {
    try {
      const response = await api.post("/draw-campaigns", data);
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao criar campanha de sorteio";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para criar campanha de sorteio";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Você não tem permissão para criar campanhas de sorteio.";
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
   * Listar campanhas de sorteio
   * GET /api/draw-campaigns
   */
  async getAll(params?: { page?: number; limit?: number; establishment_id?: number }): Promise<DrawCampaignsResponse> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.establishment_id !== undefined) queryParams.establishment_id = params.establishment_id;

      const response = await api.get("/draw-campaigns", { params: queryParams });

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
      let message = "Erro ao buscar campanhas de sorteio";
      
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
   * Buscar campanha de sorteio por ID
   * GET /api/draw-campaigns/:id
   */
  async getById(id: number | string): Promise<DrawCampaign> {
    try {
      const response = await api.get(`/draw-campaigns/${id}`);
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar campanha de sorteio";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Campanha de sorteio não encontrada";
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
   * Atualizar campanha de sorteio
   * PUT /api/draw-campaigns/:id
   */
  async update(id: number | string, data: UpdateDrawCampaignDTO): Promise<DrawCampaign> {
    try {
      const response = await api.put(`/draw-campaigns/${id}`, data);
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao atualizar campanha de sorteio";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para atualizar campanha de sorteio";
      } else if (_status === 404) {
        message = "Campanha de sorteio não encontrada";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Você não tem permissão para atualizar esta campanha de sorteio.";
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
   * Executar sorteio da campanha
   * POST /api/draw-campaigns/:id/execute-draw
   */
  async executeDraw(id: number | string): Promise<{
    campaignId: string;
    winners: Array<{
      userId: string;
      position: number;
      prizeName: string;
      prizePoints: number;
      userName: string;
      userEmail: string;
    }>;
    totalParticipants: number;
    totalPrizes: number;
  }> {
    try {
      const response = await api.post(`/draw-campaigns/${id}/execute-draw`);
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao executar sorteio";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Não é possível executar o sorteio. Verifique se a campanha terminou e há compras validadas.";
      } else if (_status === 404) {
        message = "Campanha de sorteio não encontrada";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Você não tem permissão para executar este sorteio.";
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
   * Submeter compra para campanha de sorteio
   * POST /api/draw-campaigns/:campaignId/purchases
   */
  async submitPurchase(campaignId: string | number, data: { purchase_amount: number; notes?: string; receipt_photo?: File }): Promise<DrawPurchase> {
    try {
      const formData = new FormData();
      formData.append('purchase_amount', data.purchase_amount.toString());
      if (data.notes) {
        formData.append('notes', data.notes);
      }
      if (data.receipt_photo) {
        formData.append('receipt_photo', data.receipt_photo);
      }

      const response = await api.post(`/draw-campaigns/${campaignId}/purchases`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao submeter compra para campanha de sorteio";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para submeter compra";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Apenas clientes podem submeter compras para campanhas";
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
   * Listar compras de campanha de sorteio (Admin/Merchant)
   * GET /api/draw-campaigns/:campaignId/purchases
   */
  async getPurchases(campaignId: string | number, params?: { page?: number; limit?: number; status?: 'pending' | 'validated' | 'rejected' | 'all'; search?: string }): Promise<{
    data: DrawPurchase[];
    stats: {
      total: number;
      pending: number;
      validated: number;
      rejected: number;
    };
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.status !== undefined) queryParams.status = params.status;
      if (params?.search) queryParams.search = params.search;

      const response = await api.get(`/draw-campaigns/${campaignId}/purchases`, { params: queryParams });
      return {
        data: response.data?.data || response.data || [],
        stats: response.data?.stats || { total: 0, pending: 0, validated: 0, rejected: 0 },
        pagination: response.data?.pagination || null
      };
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar compras da campanha de sorteio";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Você não tem permissão para ver compras desta campanha.";
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
   * Validar compra de campanha de sorteio
   * POST /api/draw-campaigns/purchases/:purchaseId/validate
   */
  async validatePurchase(purchaseId: string | number): Promise<any> {
    try {
      const response = await api.post(`/draw-campaigns/purchases/${purchaseId}/validate`);
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao validar compra";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Você não tem permissão para validar esta compra.";
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
   * Rejeitar compra de campanha de sorteio
   * POST /api/draw-campaigns/purchases/:purchaseId/reject
   */
  async rejectPurchase(purchaseId: string | number, rejectionReason?: string): Promise<any> {
    try {
      const response = await api.post(`/draw-campaigns/purchases/${purchaseId}/reject`, {
        rejection_reason: rejectionReason || undefined
      });
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao rejeitar compra";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Você não tem permissão para rejeitar esta compra.";
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

