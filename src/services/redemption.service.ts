import { api } from "./api";

export interface Redemption {
  redemption_id?: string;
  user_id?: number;
  establishment_id?: number;
  purchase_id?: string;
  points_amount?: number;
  points_used?: number;
  amount_mt_covered?: number;
  purchase_amount_mt?: number;
  description?: string;
  status?: "completed" | "pending" | "cancelled" | "failed";
  created_at?: string;
  updated_at?: string;
  // Dados relacionados
  user?: {
    id?: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
  };
  establishment?: {
    id?: number;
    name?: string;
    type?: string;
  };
  purchase?: {
    purchase_id?: string;
    purchase_code?: string;
    purchase_amount?: number;
    points_earned?: number;
    status?: string;
  };
}

export interface RedemptionsResponse {
  success: boolean;
  data: Redemption[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export interface RedeemPointsForPurchaseDTO {
  establishment_id: number;
  points_amount: number;
  purchase_amount_mt?: number;
  description?: string;
}

export interface PartialRedeemDTO {
  points_amount: number;
}

export interface ListRedemptionsParams {
  establishment_id?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface RedeemResult {
  redemption_id?: string;
  purchase_id?: string;
  user_id?: number;
  establishment_id?: number;
  points_used: number;
  amount_mt_covered: number;
  new_balance?: number;
  previous_balance?: number;
  purchase?: {
    purchase_id?: string;
    purchase_code?: string;
    purchase_amount?: number;
    points_earned?: number;
    status?: string;
  };
}

export const redemptionService = {
  /**
   * Resgatar pontos para criar uma compra
   * POST /api/purchases/redeem
   */
  async redeemForPurchase(data: RedeemPointsForPurchaseDTO): Promise<RedeemResult> {
    try {
      const response = await api.post("/purchases/redeem", data);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const redemptionData = response.data?.data || response.data || {};
      
      return redemptionData as RedeemResult;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao resgatar pontos";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para resgate";
      } else if (_status === 404) {
        message = data?.message || data?.error || "Estabelecimento não encontrado";
      } else if (data?.message) {
        // Mensagens específicas do backend
        if (data.message.includes("Saldo insuficiente") || data.message.includes("insuficiente")) {
          message = data.message;
        } else if (data.message.includes("não encontrado")) {
          message = data.message;
        } else if (data.message.includes("Pontos insuficientes")) {
          message = data.message;
        } else {
          message = data.message || data.error || message;
        }
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
   * Usar pontos parcialmente em uma compra existente
   * POST /api/purchases/:id/partial-redeem
   */
  async partialRedeem(purchaseId: string, data: PartialRedeemDTO): Promise<RedeemResult> {
    try {
      const response = await api.post(`/purchases/${purchaseId}/partial-redeem`, data);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const redemptionData = response.data?.data || response.data || {};
      
      return redemptionData as RedeemResult;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao resgatar pontos parcialmente";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para resgate parcial";
      } else if (_status === 404) {
        message = data?.message || data?.error || "Compra não encontrada";
      } else if (data?.message) {
        // Mensagens específicas do backend
        if (data.message.includes("Saldo insuficiente") || data.message.includes("insuficiente")) {
          message = data.message;
        } else if (data.message.includes("não encontrada") || data.message.includes("não pertence")) {
          message = data.message;
        } else {
          message = data.message || data.error || message;
        }
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
   * Listar resgates de pontos
   * GET /api/points/redemptions
   * Nota: Este endpoint pode estar em /points/redemptions ou /purchases com filtros
   */
  async listRedemptions(params?: ListRedemptionsParams): Promise<RedemptionsResponse> {
    try {
      const queryParams: any = {};
      if (params?.establishment_id !== undefined) queryParams.establishment_id = params.establishment_id;
      if (params?.start_date) queryParams.start_date = params.start_date;
      if (params?.end_date) queryParams.end_date = params.end_date;
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;

      // Tentar primeiro /points/redemptions, depois /purchases com filtros
      let response;
      try {
        response = await api.get("/points/redemptions", { params: queryParams });
      } catch (err: any) {
        // Se não existir, usar /purchases com filtro de resgate
        if (err?.response?.status === 404) {
          queryParams.is_redemption = true;
          response = await api.get("/purchases", { params: queryParams });
        } else {
          throw err;
        }
      }

      // Nova estrutura: { success: true, data: [...], pagination: {...}, message: "..." }
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
      let message = "Erro ao listar resgates";
      
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
};

