import { api } from "./api";

/**
 * Serviço de Pontos - Gerencia compra, venda, atribuição e rastreabilidade de pontos
 */

export interface PointsPurchase {
  purchase_id?: string;
  user_id?: number;
  amount_mt?: number;
  points_amount?: number;
  conversion_rate?: number;
  payment_method?: string;
  payment_reference?: string;
  status?: "pending" | "confirmed" | "failed" | "cancelled";
  created_at?: string;
  confirmed_at?: string;
  transaction_id?: string;
}

export interface PointsSale {
  sale_id?: string;
  user_id?: number;
  points_amount?: number;
  amount_mt?: number;
  conversion_rate?: number;
  payment_method?: string;
  payment_reference?: string;
  status?: "pending" | "confirmed" | "failed" | "cancelled";
  created_at?: string;
  confirmed_at?: string;
  transaction_id?: string;
}

export interface PointsAssignment {
  assignment_id?: string;
  assigned_by?: number;
  assigned_to?: number;
  points_amount?: number;
  reason?: string;
  establishment_id?: number;
  status?: "completed" | "pending" | "cancelled";
  created_at?: string;
  created_by?: {
    id?: number;
    username?: string;
    fullName?: string;
  };
  assigned_user?: {
    id?: number;
    username?: string;
    fullName?: string;
  };
}

export interface PointsTrace {
  ledger_id?: string;
  user_id?: number;
  points?: number;
  origin_type?: "purchase" | "sale" | "transfer" | "assignment" | "redemption" | "purchase_earned" | "campaign_bonus";
  origin_id?: string;
  parent_ledger_id?: string;
  chain?: Array<{
    ledger_id?: string;
    origin_type?: string;
    origin_id?: string;
    points?: number;
    created_at?: string;
  }>;
  created_at?: string;
}

export interface PointsLedger {
  ledger_id?: string;
  user_id?: number;
  points?: number;
  origin_type?: string;
  origin_id?: string;
  parent_ledger_id?: string;
  created_at?: string;
}

export interface PointsSummaryByOrigin {
  origin_type?: string;
  total_points?: number;
  count?: number;
  first_occurrence?: string;
  last_occurrence?: string;
}

export interface PurchasePointsDTO {
  amount_mt: number;
  payment_method?: string;
  payment_reference?: string;
}

export interface VerifyPaymentDTO {
  purchase_id: string;
  payment_reference?: string;
  transaction_id?: string;
}

export interface SellPointsDTO {
  points_amount: number;
  payment_method?: string;
  payment_account?: string;
}

export interface ConfirmSaleDTO {
  sale_id: string;
  payment_reference?: string;
  transaction_id?: string;
}

export interface AssignPointsDTO {
  assigned_to: number;
  points_amount: number;
  reason?: string;
  establishment_id?: number;
}

export interface AssignBulkPointsDTO {
  assignments: Array<{
    assigned_to: number;
    points_amount: number;
    reason?: string;
  }>;
  establishment_id?: number;
}

export interface ListPointsPurchasesParams {
  page?: number;
  limit?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface ListPointsSalesParams {
  page?: number;
  limit?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface ListAssignmentsParams {
  page?: number;
  limit?: number;
  assigned_to?: number;
  assigned_by?: number;
  establishment_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface TracePointsParams {
  amount?: number;
  user_id?: number;
}

export interface GetLedgerParams {
  page?: number;
  limit?: number;
  origin_type?: string;
  start_date?: string;
  end_date?: string;
}

export interface PointsServiceResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  message?: string;
}

export const pointsService = {
  /**
   * Comprar pontos com dinheiro
   * POST /api/points/purchase
   */
  async purchasePoints(data: PurchasePointsDTO): Promise<PointsPurchase> {
    try {
      const response = await api.post("/points/purchase", data);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const purchaseData = response.data?.data || response.data || {};
      
      return purchaseData as PointsPurchase;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao comprar pontos";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para comprar pontos";
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
   * Verificar e confirmar pagamento de compra de pontos
   * POST /api/points/purchase/verify
   */
  async verifyPayment(data: VerifyPaymentDTO): Promise<PointsPurchase> {
    try {
      const response = await api.post("/points/purchase/verify", data);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const purchaseData = response.data?.data || response.data || {};
      
      return purchaseData as PointsPurchase;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao verificar pagamento";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para verificar pagamento";
      } else if (_status === 404) {
        message = "Compra não encontrada";
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
   * Listar compras de pontos
   * GET /api/points/purchases
   */
  async listPurchases(params?: ListPointsPurchasesParams): Promise<PointsServiceResponse<PointsPurchase[]>> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.status) queryParams.status = params.status;
      if (params?.start_date) queryParams.start_date = params.start_date;
      if (params?.end_date) queryParams.end_date = params.end_date;

      const response = await api.get("/points/purchases", { params: queryParams });

      // Nova estrutura: { success: true, data: [...], pagination: {...} }
      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          pagination: response.data.pagination,
          message: response.data.message,
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
      let message = "Erro ao listar compras de pontos";
      
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
   * Vender pontos (converter para MT)
   * POST /api/points/sell
   */
  async sellPoints(data: SellPointsDTO): Promise<PointsSale> {
    try {
      const response = await api.post("/points/sell", data);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const saleData = response.data?.data || response.data || {};
      
      return saleData as PointsSale;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao vender pontos";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para vender pontos";
      } else if (_status === 403) {
        message = data?.message || data?.error || "KYC não verificado. É necessário verificar sua identidade para vender pontos.";
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
   * Confirmar venda (após recebimento do pagamento)
   * POST /api/points/sell/confirm
   */
  async confirmSale(data: ConfirmSaleDTO): Promise<PointsSale> {
    try {
      const response = await api.post("/points/sell/confirm", data);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const saleData = response.data?.data || response.data || {};
      
      return saleData as PointsSale;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao confirmar venda";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para confirmar venda";
      } else if (_status === 404) {
        message = "Venda não encontrada";
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
   * Listar vendas de pontos
   * GET /api/points/sales
   */
  async listSales(params?: ListPointsSalesParams): Promise<PointsServiceResponse<PointsSale[]>> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.status) queryParams.status = params.status;
      if (params?.start_date) queryParams.start_date = params.start_date;
      if (params?.end_date) queryParams.end_date = params.end_date;

      const response = await api.get("/points/sales", { params: queryParams });

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
      let message = "Erro ao listar vendas de pontos";
      
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
   * Obter taxa de venda atual
   * GET /api/points/sale-rate
   */
  async getSaleRate(): Promise<{ rate: number; currency?: string }> {
    try {
      const response = await api.get("/points/sale-rate");
      
      // Nova estrutura: { success: true, data: {...} }
      const rateData = response.data?.data || response.data || {};
      
      return rateData as { rate: number; currency?: string };
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao obter taxa de venda";
      
      // Detectar erros de rede
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
   * Atribuir pontos diretamente a um usuário (Merchant ou Admin)
   * POST /api/points/assign
   */
  async assignPoints(data: AssignPointsDTO): Promise<PointsAssignment> {
    try {
      const response = await api.post("/points/assign", data);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const assignmentData = response.data?.data || response.data || {};
      
      return assignmentData as PointsAssignment;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao atribuir pontos";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para atribuir pontos";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Apenas merchants e administradores podem atribuir pontos.";
      } else if (_status === 404) {
        message = "Usuário não encontrado";
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
   * Atribuir pontos em massa (bulk)
   * POST /api/points/assign-bulk
   */
  async assignBulkPoints(data: AssignBulkPointsDTO): Promise<PointsServiceResponse<PointsAssignment[]>> {
    try {
      const response = await api.post("/points/assign-bulk", data);
      
      // Nova estrutura: { success: true, data: [...], message: "..." }
      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          message: response.data.message,
        };
      } else {
        return {
          success: true,
          data: response.data?.data || response.data || [],
        };
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao atribuir pontos em massa";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para atribuir pontos em massa";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Apenas merchants e administradores podem atribuir pontos.";
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
   * Listar atribuições de pontos
   * GET /api/points/assignments
   */
  async listAssignments(params?: ListAssignmentsParams): Promise<PointsServiceResponse<PointsAssignment[]>> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.assigned_to !== undefined) queryParams.assigned_to = params.assigned_to;
      if (params?.assigned_by !== undefined) queryParams.assigned_by = params.assigned_by;
      if (params?.establishment_id !== undefined) queryParams.establishment_id = params.establishment_id;
      if (params?.start_date) queryParams.start_date = params.start_date;
      if (params?.end_date) queryParams.end_date = params.end_date;

      const response = await api.get("/points/assignments", { params: queryParams });

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
      let message = "Erro ao listar atribuições de pontos";
      
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
   * Rastrear origem de pontos de um usuário
   * GET /api/points/trace
   */
  async tracePointsOrigin(params?: TracePointsParams): Promise<PointsTrace> {
    try {
      const queryParams: any = {};
      if (params?.amount !== undefined) queryParams.amount = params.amount;
      if (params?.user_id !== undefined) queryParams.user_id = params.user_id;

      const response = await api.get("/points/trace", { params: queryParams });
      
      // Nova estrutura: { success: true, data: {...} }
      const traceData = response.data?.data || response.data || {};
      
      return traceData as PointsTrace;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao rastrear origem dos pontos";
      
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
   * Obter resumo de pontos agrupados por origem original
   * GET /api/points/summary-by-origin
   */
  async getPointsSummaryByOrigin(userId?: number): Promise<PointsSummaryByOrigin[]> {
    try {
      const queryParams: any = {};
      if (userId !== undefined) queryParams.user_id = userId;

      const response = await api.get("/points/summary-by-origin", { params: queryParams });
      
      // Nova estrutura: { success: true, data: [...] }
      const summaryData = response.data?.data || response.data || [];
      
      return Array.isArray(summaryData) ? summaryData : [summaryData];
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao obter resumo de pontos por origem";
      
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
   * Obter cadeia completa de um ponto específico
   * GET /api/points/chain/:ledger_id
   */
  async getPointsFullChain(ledgerId: string): Promise<PointsTrace> {
    try {
      const response = await api.get(`/points/chain/${ledgerId}`);
      
      // Nova estrutura: { success: true, data: {...} }
      const chainData = response.data?.data || response.data || {};
      
      return chainData as PointsTrace;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao obter cadeia de pontos";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Ledger não encontrado";
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
   * Listar todas as entradas do ledger de um usuário
   * GET /api/points/ledger
   */
  async getPointsLedger(params?: GetLedgerParams): Promise<PointsServiceResponse<PointsLedger[]>> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.origin_type) queryParams.origin_type = params.origin_type;
      if (params?.start_date) queryParams.start_date = params.start_date;
      if (params?.end_date) queryParams.end_date = params.end_date;

      const response = await api.get("/points/ledger", { params: queryParams });

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
      let message = "Erro ao obter ledger de pontos";
      
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


