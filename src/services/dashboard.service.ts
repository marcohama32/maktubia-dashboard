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

      if (_status === 401) {
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

      throw new Error(message);
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

      if (_status === 401) {
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

      throw new Error(message);
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

      if (_status === 401) {
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

      throw new Error(message);
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

      if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 500) {
        message = data?.message || data?.error || "Erro interno do servidor ao buscar atividades.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }

      throw new Error(message);
    }
  }
}

export const dashboardService = new DashboardService();


