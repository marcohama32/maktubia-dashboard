import { api } from "./api";

export interface Transfer {
  transfer_id?: string;
  from_user_id?: number;
  from_user_name?: string;
  from_user_code?: string;
  to_user_id?: number;
  to_user_name?: string;
  to_user_code?: string;
  amount?: number;
  description?: string;
  status?: "completed" | "pending" | "cancelled" | "failed";
  created_at?: string;
  is_sent?: boolean;
  is_received?: boolean;
  new_balance?: number;
  previous_balance?: number;
  idempotency_key?: string;
}

export interface TransfersResponse {
  success: boolean;
  data: Transfer[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  meta?: {
    showing?: string;
    currentPage?: number;
    perPage?: number;
  };
  count?: number;
}

export interface TransferPointsDTO {
  to_user_id: number;
  amount: number;
  description?: string;
  idempotency_key?: string;
}

export interface GetAllTransfersParams {
  page?: number;
  limit?: number;
  type?: "sent" | "received" | "all";
}

export const transferService = {
  /**
   * Transferir pontos P2P
   * POST /api/transfers
   */
  async transferPoints(data: TransferPointsDTO): Promise<Transfer> {
    try {
      const response = await api.post("/transfers", data);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      } else if (response.data?.data) {
        return response.data.data;
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao transferir pontos";
      
      if (status === 403) {
        message = "Você só pode transferir pontos para seus Maktubia Friends. Adicione este usuário como amigo primeiro.";
      } else if (status === 400) {
        message = data?.message || data?.error || "Dados inválidos para transferência";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Listar transferências
   * GET /api/transfers?page=1&limit=20&type=all
   */
  async getAll(params?: GetAllTransfersParams): Promise<TransfersResponse> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.type) queryParams.type = params.type;

      const response = await api.get("/transfers", { params: queryParams });

      if (response.data?.success && response.data?.data && Array.isArray(response.data.data)) {
        return {
          success: response.data.success,
          data: response.data.data,
          pagination: response.data.pagination,
          meta: response.data.meta,
          count: response.data.count || response.data.data.length,
        };
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination,
          meta: response.data.meta,
          count: response.data.count || response.data.data.length,
        };
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar transferências";
      
      if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Obter transferência por ID
   * GET /api/transfers/:id
   */
  async getById(id: string): Promise<Transfer> {
    try {
      const response = await api.get(`/transfers/${id}`);
      
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      } else if (response.data?.data) {
        return response.data.data;
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar transferência";
      
      if (status === 404) {
        message = "Transferência não encontrada";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },
};


