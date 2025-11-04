import { api } from "./api";

export type PurchaseStatus = "pending" | "confirmed" | "rejected";

export interface Purchase {
  id?: number;
  purchase_id?: number;
  purchaseCode?: string;
  purchase_code?: string;
  userId?: number;
  user_id?: number;
  user?: {
    id?: number;
    username?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  establishmentId?: number;
  establishment_id?: number;
  establishment?: {
    id?: number;
    name?: string;
    type?: string;
    address?: string;
    phone?: string;
  };
  establishmentName?: string;
  establishment_name?: string;
  qrCode?: string;
  qr_code?: string;
  purchaseAmount?: number;
  purchase_amount?: number;
  conversionRate?: number;
  conversion_rate?: number;
  bonusMultiplier?: number;
  bonus_multiplier?: number;
  pointsEarned?: number;
  points_earned?: number;
  status?: PurchaseStatus;
  purchaseDate?: string;
  purchase_date?: string;
  confirmedAt?: string | null;
  confirmed_at?: string | null;
  confirmedBy?: {
    id?: number;
    username?: string;
    fullName?: string;
  } | null;
  notes?: string | null;
  receiptPhoto?: string | null;
  receipt_photo?: string | null;
  createdAt?: string;
  created_at?: string;
  campaign?: {
    id?: number;
    type?: string;
    description?: string;
    conversion_rate?: number;
    bonus_multiplier?: number;
  } | null;
}

export interface PurchaseMetrics {
  purchases?: {
    total?: number;
    confirmed?: number;
    pending?: number;
    rejected?: number;
  };
  revenue?: {
    total?: number;
    confirmed?: number;
    avgPurchaseAmount?: number;
    maxPurchaseAmount?: number;
    minPurchaseAmount?: number;
  };
  points?: {
    totalGiven?: number;
    totalConfirmed?: number;
    avgPointsPerPurchase?: number;
  };
  customers?: {
    unique?: number;
  };
  establishments?: {
    unique?: number;
  };
}

export interface PurchasesResponse {
  success: boolean;
  data: Purchase[];
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
    filters?: {
      search?: string | null;
      status?: string | null;
      establishment_id?: number | null;
      user_id?: number | null;
      start_date?: string | null;
      end_date?: string | null;
      min_amount?: number | null;
      max_amount?: number | null;
    };
  };
  metrics?: PurchaseMetrics;
}

export interface GetAllPurchasesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PurchaseStatus | null;
  establishment_id?: number | null;
  user_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  min_amount?: number | null;
  max_amount?: number | null;
}

export const purchaseService = {
  async getAll(params?: GetAllPurchasesParams): Promise<PurchasesResponse> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.search) queryParams.search = params.search;
      if (params?.status) queryParams.status = params.status;
      if (params?.establishment_id) queryParams.establishment_id = params.establishment_id;
      if (params?.user_id) queryParams.user_id = params.user_id;
      if (params?.start_date) queryParams.start_date = params.start_date;
      if (params?.end_date) queryParams.end_date = params.end_date;
      if (params?.min_amount !== undefined) queryParams.min_amount = params.min_amount;
      if (params?.max_amount !== undefined) queryParams.max_amount = params.max_amount;

      const response = await api.get("/purchases", { params: queryParams });

      // O backend retorna: { success: true, data: [...], pagination: {...}, meta: {...}, metrics: {...} }
      if (response.data?.success && response.data?.data && Array.isArray(response.data.data)) {
        return {
          success: response.data.success,
          data: response.data.data,
          pagination: response.data.pagination,
          meta: response.data.meta,
          metrics: response.data.metrics || undefined,
        };
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination,
          meta: response.data.meta,
          metrics: response.data.metrics || undefined,
        };
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar compras";

      if (status === 500) {
        message = "Erro no servidor. Por favor, verifique o backend ou contacte o administrador.";
        if (data?.message) {
          message += ` Detalhes: ${data.message}`;
        }
      } else if (status === 404) {
        message = "Endpoint não encontrado. Verifique se o backend está configurado correctamente.";
      } else if (status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (status === 403) {
        message = "Acesso negado. Apenas administradores podem visualizar todas as compras.";
      } else if (data) {
        message = data.message || data.error || data.detail || message;
      } else if (err?.message) {
        message = err.message;
      }

      throw new Error(message);
    }
  },

  async getById(id: number): Promise<Purchase> {
    try {
      const response = await api.get(`/purchases/${id}`);

      let purchase: Purchase;
      if (response.data?.success && response.data?.data && typeof response.data.data === "object") {
        purchase = response.data.data;
      } else if (response.data?.data && typeof response.data.data === "object") {
        purchase = response.data.data;
      } else if (response.data && typeof response.data === "object" && ("purchase_id" in response.data || "id" in response.data)) {
        purchase = response.data;
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        throw new Error("Formato de resposta inesperado do backend");
      }

      return purchase;
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar compra";

      if (status === 500) {
        message = "Erro no servidor. Por favor, verifique o backend ou contacte o administrador.";
        if (data?.message) {
          message += ` Detalhes: ${data.message}`;
        }
      } else if (status === 404) {
        message = "Compra não encontrada.";
      } else if (status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (status === 403) {
        message = "Acesso negado a esta compra.";
      } else if (data) {
        message = data.message || data.error || data.detail || message;
      } else if (err?.message) {
        message = err.message;
      }

      throw new Error(message);
    }
  },

  async confirm(id: number): Promise<Purchase> {
    try {
      const response = await api.post(`/purchases/${id}/confirm`);

      let purchase: Purchase;
      if (response.data?.success && response.data?.data && typeof response.data.data === "object") {
        purchase = response.data.data;
      } else if (response.data?.data && typeof response.data.data === "object") {
        purchase = response.data.data;
      } else if (response.data && typeof response.data === "object" && "id" in response.data) {
        // Se o backend retornar o objeto diretamente
        purchase = response.data;
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }

      return purchase;
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao confirmar compra";
      
      if (status === 500) {
        message = data?.message || data?.error || "Erro interno do servidor ao confirmar compra. Por favor, tente novamente.";
      } else if (status === 404) {
        message = "Compra não encontrada";
      } else if (status === 400) {
        message = data?.message || data?.error || "Dados inválidos para confirmar compra";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  async reject(id: number, reason?: string): Promise<Purchase> {
    try {
      const response = await api.post(`/purchases/${id}/reject`, { reason });

      let purchase: Purchase;
      if (response.data?.success && response.data?.data && typeof response.data.data === "object") {
        purchase = response.data.data;
      } else if (response.data?.data && typeof response.data.data === "object") {
        purchase = response.data.data;
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        throw new Error("Formato de resposta inesperado do backend");
      }

      return purchase;
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao rejeitar compra";
      if (data) {
        message = data.message || data.error || JSON.stringify(data) || message;
      } else if (err?.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  async getPendingByEstablishment(establishmentId: number, page?: number, limit?: number): Promise<PurchasesResponse> {
    try {
      const params: any = {};
      if (page !== undefined) params.page = page;
      if (limit !== undefined) params.limit = limit;

      const response = await api.get(`/purchases/establishment/${establishmentId}/pending`, { params });

      if (response.data?.success && response.data?.data && Array.isArray(response.data.data)) {
        return {
          success: response.data.success,
          data: response.data.data,
          pagination: response.data.pagination,
        };
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination,
        };
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar compras pendentes";

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
};

