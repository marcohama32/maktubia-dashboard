import { api } from "./api";

export interface DiscountReservationCampaign {
  id?: string | number;
  campaign_id?: number | string;
  establishment_id?: number;
  establishment?: {
    id?: number;
    name?: string;
    type?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  campaign_name?: string;
  tipo_beneficio?: "desconto_percentual" | "desconto_fixo";
  consumo_minimo?: number;
  data_inicial?: string;
  data_final?: string;
  limite_utilizacao_cliente?: number;
  percentual_desconto?: number;
  valor_desconto_fixo?: number;
  status?: "Rascunho" | "Activo" | "Parado" | "Cancelado" | "Concluído" | "Expirado" | "active" | "inactive" | "cancelled" | "expired";
  created_at?: string;
  updated_at?: string;
}

export interface CreateDiscountReservationCampaignDTO {
  establishment_id: number;
  campaign_name: string;
  tipo_beneficio: "desconto_percentual" | "desconto_fixo";
  consumo_minimo: number;
  data_inicial: string;
  data_final: string;
  limite_utilizacao_cliente: number;
  percentual_desconto?: number;
  valor_desconto_fixo?: number;
}

export interface UpdateDiscountReservationCampaignDTO {
  campaign_name?: string;
  tipo_beneficio?: "desconto_percentual" | "desconto_fixo";
  consumo_minimo?: number;
  data_inicial?: string;
  data_final?: string;
  limite_utilizacao_cliente?: number;
  percentual_desconto?: number;
  valor_desconto_fixo?: number;
  status?: "Rascunho" | "Activo" | "Parado" | "Cancelado" | "Concluído" | "Expirado" | "active" | "inactive" | "cancelled" | "expired";
}

export interface ChangeDiscountReservationCampaignStatusDTO {
  status: "active" | "inactive" | "cancelled" | "expired";
}

export const discountReservationCampaignsService = {
  /**
   * Buscar todas as campanhas de desconto por marcação
   * GET /api/discount-reservation-campaigns
   */
  async getAll(params?: { page?: number; limit?: number; establishment_id?: number; status?: string }): Promise<{ success: boolean; data: DiscountReservationCampaign[]; pagination?: any }> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.establishment_id !== undefined) queryParams.establishment_id = params.establishment_id;
      if (params?.status) queryParams.status = params.status;

      const response = await api.get("/discount-reservation-campaigns", { params: queryParams });

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
      let message = "Erro ao buscar campanhas de desconto por marcação";
      
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
   * Buscar campanha por ID
   * GET /api/discount-reservation-campaigns/:id
   */
  async getById(id: number | string): Promise<DiscountReservationCampaign> {
    try {
      const response = await api.get(`/discount-reservation-campaigns/${id}`);
      
      const campaignData = response.data?.data || response.data || {};
      
      return campaignData as DiscountReservationCampaign;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar campanha";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Campanha não encontrada";
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
   * Criar campanha de desconto por marcação
   * POST /api/discount-reservation-campaigns
   */
  async create(data: CreateDiscountReservationCampaignDTO): Promise<DiscountReservationCampaign> {
    try {
      const response = await api.post("/discount-reservation-campaigns", data);
      
      const campaignData = response.data?.data || response.data || {};
      
      return campaignData as DiscountReservationCampaign;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao criar campanha";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        if (data?.error) {
          message = typeof data.error === "string" ? data.error : data.error.message || data.error.error || JSON.stringify(data.error);
        } else if (data?.message) {
          message = data.message;
        } else {
          message = "Dados inválidos para criar campanha";
        }
        
        if (data?.details) {
          const details = data.details;
          if (typeof details === "object") {
            const missingFields = Object.keys(details).filter(key => details[key] !== null && details[key] !== undefined);
            if (missingFields.length > 0) {
              message += `\n\nCampos faltando ou inválidos: ${missingFields.join(", ")}`;
            }
          } else if (typeof details === "string") {
            message += `\n\n${details}`;
          }
        }
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Você não tem permissão para criar campanhas.";
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
   * Atualizar campanha
   * PUT /api/discount-reservation-campaigns/:id
   */
  async update(id: number | string, data: UpdateDiscountReservationCampaignDTO): Promise<DiscountReservationCampaign> {
    try {
      const response = await api.put(`/discount-reservation-campaigns/${id}`, data);
      
      const campaignData = response.data?.data || response.data || {};
      
      return campaignData as DiscountReservationCampaign;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao atualizar campanha";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para atualizar campanha";
      } else if (_status === 404) {
        message = "Campanha não encontrada";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Você não tem permissão para atualizar esta campanha.";
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
   * Deletar campanha
   * DELETE /api/discount-reservation-campaigns/:id
   */
  async delete(id: number | string): Promise<void> {
    try {
      await api.delete(`/discount-reservation-campaigns/${id}`);
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao deletar campanha";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Campanha não encontrada";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas administradores podem deletar campanhas.";
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
   * Mudar status da campanha
   * POST /api/discount-reservation-campaigns/:id/status
   */
  async changeStatus(id: number | string, data: ChangeDiscountReservationCampaignStatusDTO): Promise<DiscountReservationCampaign> {
    try {
      const response = await api.post(`/discount-reservation-campaigns/${id}/status`, data);
      
      const campaignData = response.data?.data || response.data || {};
      
      return campaignData as DiscountReservationCampaign;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao mudar status da campanha";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para mudar status";
      } else if (_status === 404) {
        message = "Campanha não encontrada";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Você não tem permissão para mudar o status desta campanha.";
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

