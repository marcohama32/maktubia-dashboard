import { api } from "./api";
import {
  DashboardResponse,
  DashboardMetricsResponse,
  DashboardChartsResponse,
  DashboardActivitiesResponse,
  DashboardData,
  PointsStats,
  PurchaseStats,
  TransferStats,
  FriendsStats,
  ChartsData,
  Activity,
} from "@/types/dashboard";

/**
 * Serviço de Dashboard
 * Gerencia chamadas aos endpoints de dashboard do backend
 */

export interface DashboardQueryParams {
  period?: "7d" | "30d" | "90d";
  type?: "all" | "points" | "purchases" | "transfers" | "friends";
}

export interface DashboardMetricsParams {
  type: "points" | "purchases" | "transfers" | "friends";
  period?: "7d" | "30d" | "90d";
}

export interface DashboardChartsParams {
  type?: "timeline" | "distribution" | "all";
  period?: "7d" | "30d" | "90d";
}

export interface DashboardActivitiesParams {
  limit?: number;
}

export interface MerchantDashboardQueryParams {
  period?: "7d" | "30d" | "90d";
  establishment_id?: number;
}

export interface MerchantDashboardData {
  establishments?: Array<{
    establishment_id: number;
    est_id: string;
    name: string;
  }>;
  metrics?: {
    campaigns?: {
      total?: number;
      active?: number;
      inactive?: number;
      by_type?: Record<string, number>;
      by_status?: Record<string, number>;
    };
    purchases?: {
      total?: number;
      confirmed?: number;
      pending?: number;
      rejected?: number;
      conversion_rate?: number;
    };
    revenue?: {
      total?: number;
      last_7_days?: number;
      last_30_days?: number;
      last_90_days?: number;
      average_ticket?: number;
    };
    points?: {
      total_given?: number;
      average_per_purchase?: number;
      points_per_real?: number;
    };
    customers?: {
      unique_customers?: number;
      purchases_per_customer?: number;
    };
  };
  period_stats?: {
    last_7_days?: {
      purchases?: number;
      confirmed?: number;
      revenue?: number;
      points?: number;
    };
    last_30_days?: {
      purchases?: number;
      confirmed?: number;
      revenue?: number;
      points?: number;
    };
    last_90_days?: {
      purchases?: number;
      confirmed?: number;
      revenue?: number;
      points?: number;
    };
  };
  establishment_stats?: Array<{
    establishment_id: number;
    est_id: string;
    name: string;
    campaigns?: {
      total?: number;
      active?: number;
      inactive?: number;
      by_type?: Record<string, number>;
      by_status?: Record<string, number>;
      top_campaigns?: Array<{
        campaign_id: string;
        campaign_name: string;
        type: string;
        status: string;
        revenue: number;
        points_given: number;
        purchases_count: number;
      }>;
    };
    purchases?: {
      total?: number;
      confirmed?: number;
      pending?: number;
      rejected?: number;
      conversion_rate?: number;
    };
    revenue?: {
      total?: number;
      last_7_days?: number;
      last_30_days?: number;
      last_90_days?: number;
      average_ticket?: number;
    };
    points?: {
      total_given?: number;
      points_per_real?: number;
      average_per_purchase?: number;
    };
    customers?: {
      unique_customers?: number;
      purchases_per_customer?: number;
    };
    period_stats?: {
      last_7_days?: { purchases?: number; confirmed?: number; revenue?: number; points?: number };
      last_30_days?: { purchases?: number; confirmed?: number; revenue?: number; points?: number };
      last_90_days?: { purchases?: number; confirmed?: number; revenue?: number; points?: number };
    };
  }>;
  aggregated_metrics?: any;
  top_campaigns?: Array<{
    campaign_id: string;
    campaign_name: string;
    type: string;
    status: string;
    revenue: number;
    points_given: number;
    purchases_count: number;
    created_at?: string;
    valid_from?: string;
    valid_until?: string;
  }>;
  recent_purchases?: any[];
  campaigns?: Array<{
    campaign_id: string;
    campaign_name: string;
    type: string;
    status: string;
    establishment_id: number;
    est_id?: string;
    establishment_name?: string;
    created_at?: string;
    valid_from?: string;
    valid_until?: string;
  }>;
  top_customers?: {
    by_purchases?: any[];
    by_revenue?: any[];
  };
  timeline?: any[];
  campaign_efficiency?: Array<{
    campaign_id: string;
    campaign_name: string;
    type: string;
    status: string;
    revenue: number;
    points_given: number;
    purchases_count: number;
    created_at?: string;
    valid_from?: string;
    valid_until?: string;
    efficiency?: number;
    roi?: number;
    points_per_purchase?: number;
  }>;
  period_comparison?: {
    current_period?: {
      days?: number;
      purchases?: number;
      revenue?: number;
      points?: number;
    };
    previous_period?: {
      days?: number;
      purchases?: number;
      revenue?: number;
      points?: number;
    };
    growth?: {
      revenue_growth?: number;
      purchases_growth?: number;
    };
  };
  performance_score?: {
    score?: number;
    max_score?: number;
    breakdown?: {
      conversion_rate?: number;
      revenue_growth?: number;
      active_campaigns_ratio?: number;
      average_ticket?: number;
      purchases_per_customer?: number;
    };
  };
  insights?: Array<{
    type: string;
    severity: "info" | "warning" | "error" | "success";
    message: string;
    action?: string;
  }>;
  alerts?: any[];
  summary?: {
    total_campaigns?: number;
    active_campaigns?: number;
    total_purchases?: number;
    total_revenue?: number;
    total_points_given?: number;
    unique_customers?: number;
    conversion_rate?: number;
    average_ticket?: number;
    points_per_real?: number;
  };
}

export interface MerchantDashboardResponse {
  success: boolean;
  data: MerchantDashboardData;
  message?: string;
}

class DashboardService {
  /**
   * Obter dashboard completo
   */
  async getDashboard(params?: DashboardQueryParams): Promise<DashboardData> {
    try {
      const queryParams: any = {};
      if (params?.period) queryParams.period = params.period;
      if (params?.type) queryParams.type = params.type;

      const response = await api.get<DashboardResponse>("/dashboard", { params: queryParams });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar dashboard";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 404) {
        message = "Dashboard não encontrado";
      } else if (_status === 500) {
        message = data?.message || data?.error || "Erro interno do servidor ao buscar dashboard.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }

      const error = new Error(message);
      // Preservar flag de erro de rede
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  }

  /**
   * Obter métricas específicas
   */
  async getMetrics(params: DashboardMetricsParams): Promise<PointsStats | PurchaseStats | TransferStats | FriendsStats> {
    try {
      const queryParams: any = { type: params.type };
      if (params.period) queryParams.period = params.period;

      const response = await api.get<DashboardMetricsResponse>("/dashboard/metrics", { params: queryParams });

      if (response.data?.success && response.data?.data?.metrics) {
        return response.data.data.metrics;
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar métricas do dashboard";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Tipo de métrica inválido";
      } else if (_status === 500) {
        message = data?.message || data?.error || "Erro interno do servidor ao buscar métricas.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }

      const error = new Error(message);
      // Preservar flag de erro de rede
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  }

  /**
   * Obter dados para gráficos
   */
  async getCharts(params?: DashboardChartsParams): Promise<ChartsData | Partial<ChartsData>> {
    try {
      const queryParams: any = {};
      if (params?.type) queryParams.type = params.type;
      if (params?.period) queryParams.period = params.period;

      const response = await api.get<DashboardChartsResponse>("/dashboard/charts", { params: queryParams });

      if (response.data?.success && response.data?.data?.charts) {
        return response.data.data.charts;
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar gráficos do dashboard";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Tipo de gráfico inválido";
      } else if (_status === 500) {
        message = data?.message || data?.error || "Erro interno do servidor ao buscar gráficos.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }

      const error = new Error(message);
      // Preservar flag de erro de rede
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  }

  /**
   * Obter atividades recentes
   */
  async getActivities(params?: DashboardActivitiesParams): Promise<Activity[]> {
    try {
      const queryParams: any = {};
      if (params?.limit) queryParams.limit = params.limit;

      const response = await api.get<DashboardActivitiesResponse>("/dashboard/activities", { params: queryParams });

      if (response.data?.success && response.data?.data?.activities) {
        return response.data.data.activities;
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar atividades do dashboard";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 500) {
        message = data?.message || data?.error || "Erro interno do servidor ao buscar atividades.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }

      const error = new Error(message);
      // Preservar flag de erro de rede
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  }

  /**
   * Obter dashboard completo do merchant
   * GET /api/merchant-dashboard/complete
   */
  async getMerchantDashboard(params?: MerchantDashboardQueryParams): Promise<MerchantDashboardData> {
    try {
      const queryParams: any = {};
      if (params?.period) queryParams.period = params.period;
      if (params?.establishment_id !== undefined) queryParams.establishment_id = params.establishment_id;

      const response = await api.get<MerchantDashboardResponse>("/merchant-dashboard/complete", { params: queryParams });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      } else if (response.data?.data) {
        // Se não tiver success flag, assumir que data é válido
        return response.data.data;
      } else {
        throw new Error("Formato de resposta inesperado do backend");
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar dashboard do merchant";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas merchants podem acessar este dashboard.";
      } else if (_status === 404) {
        message = "Dashboard do merchant não encontrado";
      } else if (_status === 500) {
        message = data?.message || data?.error || "Erro interno do servidor ao buscar dashboard do merchant.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }

      const error = new Error(message);
      // Preservar flag de erro de rede
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();


