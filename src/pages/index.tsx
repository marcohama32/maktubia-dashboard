import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant, isUser } from "@/utils/roleUtils";
import { dashboardService, DashboardQueryParams, MerchantDashboardQueryParams } from "@/services/dashboard.service";
import { DashboardData, Activity, Insight } from "@/types/dashboard";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Wrappers para componentes do recharts para resolver problema de compatibilidade de tipos
const ResponsiveContainerWrapper = ResponsiveContainer as any;
const LineChartWrapper = LineChart as any;
const BarChartWrapper = BarChart as any;
const PieChartWrapper = PieChart as any;
const XAxisWrapper = XAxis as any;
const YAxisWrapper = YAxis as any;
const CartesianGridWrapper = CartesianGrid as any;
const TooltipWrapper = Tooltip as any;
const LegendWrapper = Legend as any;
const LineWrapper = Line as any;
const BarWrapper = Bar as any;
const PieWrapper = Pie as any;
const CellWrapper = Cell as any;

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [merchantDashboard, setMerchantDashboard] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d");

  // Determinar role do usuário
  const userIsAdmin = user ? isAdmin(user) : false;
  const userIsMerchant = user ? isMerchant(user) : false;
  const userIsUser = user ? isUser(user) : false;

  useEffect(() => {
    // Carregar dados de forma assíncrona após a primeira renderização completa
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => loadDashboard(), { timeout: 100 });
    } else {
      setTimeout(() => loadDashboard(), 50);
    }
  }, [selectedPeriod, user]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Merchant: usa endpoint específico do merchant
      if (userIsMerchant) {
        const params: MerchantDashboardQueryParams = {
          period: selectedPeriod,
        };
        const data = await dashboardService.getMerchantDashboard(params);
        setMerchantDashboard(data);
        setDashboard(null);
      }
      // Admin e Cliente: usam o endpoint padrão (backend já filtra automaticamente)
      else {
        const params: DashboardQueryParams = {
          period: selectedPeriod,
          type: "all",
        };
        const data = await dashboardService.getDashboard(params);
        setDashboard(data);
        setMerchantDashboard(null);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dashboard");
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cores para gráficos
  const COLORS = {
    primary: "#3B82F6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#06B6D4",
    purple: "#8B5CF6",
  };

  const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.info, COLORS.purple];

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Formatar pontos
  const formatPoints = (value: number) => {
    return new Intl.NumberFormat("pt-MZ").format(value);
  };

  // Formatar data
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string:", dateString);
      return "-";
    }
    return new Intl.DateTimeFormat("pt-MZ", {
      day: "2-digit",
      month: "short",
    }).format(date);
  };

  // Formatar data e hora
  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string:", dateString);
      return "-";
    }
    return new Intl.DateTimeFormat("pt-MZ", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Obter ícone de tendência
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") {
      return (
        <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    } else if (trend === "down") {
      return (
        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    );
  };

  // Obter cor de insight
  const getInsightColor = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-green-50 border-green-200 text-green-800";
      case "negative":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Erro ao carregar dashboard</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadDashboard}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Verificar se há dados para mostrar
  const hasData = dashboard || merchantDashboard;
  
  if (!hasData) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  // Renderizar dashboard do merchant se for merchant
  if (userIsMerchant && merchantDashboard) {
    // Redirecionar para o dashboard do merchant ou mostrar uma mensagem
    // Por enquanto, vamos mostrar os dados básicos do merchant
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meu Dashboard</h1>
            <p className="mt-1 text-gray-500">
              {merchantDashboard.summary 
                ? `Total: ${merchantDashboard.summary.total_campaigns || 0} campanhas, ${merchantDashboard.summary.unique_customers || 0} clientes`
                : "Visualize suas campanhas e clientes"
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Período:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as "7d" | "30d" | "90d")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
        </div>
        
        {/* Cards de Métricas para Merchant */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total de Campanhas */}
          <div className="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Campanhas</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{merchantDashboard.summary?.total_campaigns || merchantDashboard.metrics?.campaigns?.total || 0}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {merchantDashboard.summary?.active_campaigns || merchantDashboard.metrics?.campaigns?.active || 0} ativas
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Clientes Únicos */}
          <div className="rounded-lg border-l-4 border-green-500 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Clientes Únicos</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{merchantDashboard.summary?.unique_customers || merchantDashboard.metrics?.customers?.unique_customers || 0}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {merchantDashboard.summary?.total_purchases || merchantDashboard.metrics?.purchases?.total || 0} compras
                </p>
              </div>
              <div className="rounded-lg bg-green-100 p-3">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Receita Total */}
          <div className="rounded-lg border-l-4 border-purple-500 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Receita Total</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(merchantDashboard.summary?.total_revenue || merchantDashboard.metrics?.revenue?.total || 0)}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Ticket médio: {formatCurrency(merchantDashboard.summary?.average_ticket || merchantDashboard.metrics?.revenue?.average_ticket || 0)}
                </p>
              </div>
              <div className="rounded-lg bg-purple-100 p-3">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pontos Distribuídos */}
          <div className="rounded-lg border-l-4 border-yellow-500 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pontos Distribuídos</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{formatPoints(merchantDashboard.summary?.total_points_given || merchantDashboard.metrics?.points?.total_given || 0)}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {merchantDashboard.summary?.points_per_real || merchantDashboard.metrics?.points?.points_per_real || 0} pts por metical
                </p>
              </div>
              <div className="rounded-lg bg-yellow-100 p-3">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Dica:</strong> Para ver mais detalhes sobre suas campanhas e clientes, acesse o menu "Meu Dashboard" ou "Campanhas".
          </p>
        </div>
      </div>
    );
  }

  // Renderizar dashboard padrão (Admin ou Cliente)
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {userIsAdmin ? "Dashboard Administrativo" : "Meu Dashboard"}
          </h1>
          <p className="mt-1 text-gray-500">
            {dashboard?.period 
              ? `Período: ${dashboard.period.days || 0} dias (${formatDate(dashboard.period.start_date)} - ${formatDate(dashboard.period.end_date)})`
              : userIsAdmin 
                ? "Visão geral de todo o sistema"
                : "Suas informações pessoais"
            }
          </p>
        </div>
        
        {/* Seletor de Período */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Período:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as "7d" | "30d" | "90d")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Pontos */}
        <div className="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pontos Disponíveis</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{formatPoints(dashboard.points?.current_balance || 0)}</p>
              {(dashboard.points?.pending || 0) > 0 && (
                <p className="mt-1 text-sm text-yellow-600">
                  {formatPoints(dashboard.points?.pending || 0)} pendentes
                </p>
              )}
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {dashboard.trends?.points && (
            <div className="mt-4 flex items-center">
              {getTrendIcon(dashboard.trends.points?.trend || "stable")}
              <span className={`ml-2 text-sm font-medium ${dashboard.trends.points?.trend === "up" ? "text-green-600" : dashboard.trends.points?.trend === "down" ? "text-red-600" : "text-gray-600"}`}>
                {(dashboard.trends.points?.percentage || 0) > 0 ? "+" : ""}{(dashboard.trends.points?.percentage || 0).toFixed(1)}%
              </span>
              <span className="ml-2 text-xs text-gray-500">vs período anterior</span>
            </div>
          )}
        </div>

        {/* Compras */}
        <div className="rounded-lg border-l-4 border-green-500 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Compras</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{dashboard.purchases?.total_count || 0}</p>
              <p className="mt-1 text-sm text-gray-600">
                {formatCurrency(dashboard.purchases?.total_amount || 0)} gastos
              </p>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          {dashboard.trends?.purchases && (
            <div className="mt-4 flex items-center">
              {getTrendIcon(dashboard.trends.purchases?.trend || "stable")}
              <span className={`ml-2 text-sm font-medium ${dashboard.trends.purchases?.trend === "up" ? "text-green-600" : dashboard.trends.purchases?.trend === "down" ? "text-red-600" : "text-gray-600"}`}>
                {(dashboard.trends.purchases?.percentage || 0) > 0 ? "+" : ""}{(dashboard.trends.purchases?.percentage || 0).toFixed(1)}%
              </span>
              <span className="ml-2 text-xs text-gray-500">vs período anterior</span>
            </div>
          )}
        </div>

        {/* Transferências */}
        <div className="rounded-lg border-l-4 border-purple-500 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Transferências</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{dashboard.transfers?.total_count || 0}</p>
              <p className="mt-1 text-sm text-gray-600">
                {formatPoints(Math.abs(dashboard.transfers?.net_points || 0))} {(dashboard.transfers?.net_points || 0) >= 0 ? "recebidos" : "enviados"}
              </p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Amigos */}
        <div className="rounded-lg border-l-4 border-yellow-500 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Amigos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{dashboard.friends?.total || 0}</p>
              {(dashboard.friends?.new_in_period || 0) > 0 && (
                <p className="mt-1 text-sm text-green-600">
                  +{dashboard.friends?.new_in_period || 0} novos no período
                </p>
              )}
            </div>
            <div className="rounded-lg bg-yellow-100 p-3">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos - Timeline de Pontos e Compras */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Timeline de Pontos */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Evolução de Pontos</h2>
          {dashboard.charts?.points_timeline && dashboard.charts.points_timeline.length > 0 ? (
            <ResponsiveContainerWrapper width="100%" height={300}>
              <LineChartWrapper data={dashboard.charts.points_timeline as any}>
                <CartesianGridWrapper strokeDasharray="3 3" />
                <XAxisWrapper 
                  dataKey="date" 
                  tickFormatter={(value: any) => formatDate(value)}
                  style={{ fontSize: "12px" }}
                />
                <YAxisWrapper style={{ fontSize: "12px" }} />
                <TooltipWrapper 
                  formatter={(value: any) => formatPoints(value)}
                  labelFormatter={(label: any) => formatDate(label)}
                />
                <LegendWrapper />
                <LineWrapper 
                  type="monotone" 
                  dataKey="earned" 
                  stroke={COLORS.success} 
                  strokeWidth={2}
                  name="Ganhos"
                  dot={{ r: 4 }}
                />
                <LineWrapper 
                  type="monotone" 
                  dataKey="spent" 
                  stroke={COLORS.danger} 
                  strokeWidth={2}
                  name="Gastos"
                  dot={{ r: 4 }}
                />
                <LineWrapper 
                  type="monotone" 
                  dataKey="net" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  name="Líquido"
                  dot={{ r: 4 }}
                />
              </LineChartWrapper>
            </ResponsiveContainerWrapper>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-gray-500">
              Nenhum dado disponível para o período selecionado
            </div>
          )}
        </div>

        {/* Timeline de Compras */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Evolução de Compras</h2>
          {dashboard.charts?.purchases_timeline && dashboard.charts.purchases_timeline.length > 0 ? (
            <ResponsiveContainerWrapper width="100%" height={300}>
              <BarChartWrapper data={dashboard.charts.purchases_timeline as any}>
                <CartesianGridWrapper strokeDasharray="3 3" />
                <XAxisWrapper 
                  dataKey="date" 
                  tickFormatter={(value: any) => formatDate(value)}
                  style={{ fontSize: "12px" }}
                />
                <YAxisWrapper style={{ fontSize: "12px" }} />
                <TooltipWrapper 
                  formatter={(value: any, name: any) => {
                    if (name === "amount") return formatCurrency(value);
                    if (name === "points") return formatPoints(value);
                    return value;
                  }}
                  labelFormatter={(label: any) => formatDate(label)}
                />
                <LegendWrapper />
                <BarWrapper dataKey="count" fill={COLORS.primary} name="Quantidade" />
                <BarWrapper dataKey="amount" fill={COLORS.success} name="Valor (MZN)" />
              </BarChartWrapper>
            </ResponsiveContainerWrapper>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-gray-500">
              Nenhum dado disponível para o período selecionado
            </div>
          )}
        </div>
      </div>

      {/* Gráficos - Distribuição */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Distribuição de Compras por Status */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Compras por Status</h2>
          {dashboard.charts?.purchases_by_status && dashboard.charts.purchases_by_status.length > 0 ? (
            <ResponsiveContainerWrapper width="100%" height={300}>
              <PieChartWrapper>
                <PieWrapper
                  data={dashboard.charts.purchases_by_status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count, percent }: any) => `${status || "N/A"}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {dashboard.charts.purchases_by_status.map((entry, index) => (
                    <CellWrapper key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </PieWrapper>
                <TooltipWrapper />
              </PieChartWrapper>
            </ResponsiveContainerWrapper>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-gray-500">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Top Estabelecimentos */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Top Estabelecimentos</h2>
          {dashboard.charts?.purchases_by_establishment && dashboard.charts.purchases_by_establishment.length > 0 ? (
            <ResponsiveContainerWrapper width="100%" height={300}>
              <BarChartWrapper data={dashboard.charts.purchases_by_establishment as any} layout="vertical">
                <CartesianGridWrapper strokeDasharray="3 3" />
                <XAxisWrapper type="number" style={{ fontSize: "12px" }} />
                <YAxisWrapper 
                  dataKey="name" 
                  type="category" 
                  width={150}
                  style={{ fontSize: "12px" }}
                />
                <TooltipWrapper 
                  formatter={(value: any) => formatCurrency(value)}
                />
                <LegendWrapper />
                <BarWrapper dataKey="amount" fill={COLORS.primary} name="Valor (MZN)" />
              </BarChartWrapper>
            </ResponsiveContainerWrapper>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-gray-500">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </div>

      {/* Insights e Tendências */}
      {dashboard.trends?.insights && dashboard.trends.insights.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Insights e Tendências</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboard.trends.insights.map((insight: Insight, index: number) => (
              <div
                key={index}
                className={`rounded-lg border-2 p-4 ${getInsightColor(insight.type)}`}
              >
                <h3 className="mb-2 font-semibold">{insight.title}</h3>
                <p className="text-sm">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Atividades Recentes */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Atividades Recentes</h2>
          <button
            onClick={() => router.push("/admin/purchases")}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Ver todas →
          </button>
        </div>
        {dashboard.activities && dashboard.activities.length > 0 ? (
          <div className="space-y-3">
            {dashboard.activities.slice(0, 10).map((activity: Activity) => (
              <div
                key={activity.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                onClick={() => {
                  if (activity.type === "purchase" && activity.id) {
                    router.push(`/admin/purchases/${activity.id}`);
                  }
                }}
              >
                <div className="flex flex-1 items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    activity.type === "purchase" ? "bg-green-100 text-green-600" :
                    activity.type === "transfer" ? "bg-purple-100 text-purple-600" :
                    activity.type === "points" ? "bg-blue-100 text-blue-600" :
                    "bg-yellow-100 text-yellow-600"
                  }`}>
                    {activity.type === "purchase" && (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    )}
                    {activity.type === "transfer" && (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    )}
                    {activity.type === "points" && (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {activity.type === "friend" && (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  {activity.amount && (
                    <p className="font-semibold text-gray-900">{formatCurrency(activity.amount)}</p>
                  )}
                  {activity.points && (
                    <p className="text-sm text-blue-600">{formatPoints(activity.points)} pts</p>
                  )}
                  {activity.status && (
                    <span className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      activity.status === "confirmed" ? "bg-green-100 text-green-800" :
                      activity.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      activity.status === "rejected" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {activity.status === "confirmed" ? "Confirmada" :
                       activity.status === "pending" ? "Pendente" :
                       activity.status === "rejected" ? "Rejeitada" :
                       activity.status}
                    </span>
                  )}
                  <p className="mt-1 text-xs text-gray-400">{formatDateTime(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            Nenhuma atividade recente
          </div>
        )}
      </div>

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Estatísticas de Pontos */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Estatísticas de Pontos</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-gray-600">Ganhos no Período</span>
              <span className="font-semibold text-green-600">{formatPoints(dashboard.points?.period?.earned || 0)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-gray-600">Gastos no Período</span>
              <span className="font-semibold text-red-600">{formatPoints(dashboard.points?.period?.spent || 0)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-gray-600">Líquido no Período</span>
              <span className="font-semibold text-blue-600">{formatPoints(dashboard.points?.period?.net || 0)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-gray-600">Total de Transações</span>
              <span className="font-semibold text-gray-900">{dashboard.points?.period?.transactions || 0}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Saldo Disponível</span>
              <span className="text-lg font-semibold text-gray-900">{formatPoints(dashboard.points?.current_balance || 0)}</span>
            </div>
          </div>
        </div>

        {/* Estatísticas de Compras */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Estatísticas de Compras</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-gray-600">Confirmadas</span>
              <span className="font-semibold text-green-600">{dashboard.purchases?.confirmed_count || 0}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-gray-600">Pendentes</span>
              <span className="font-semibold text-yellow-600">{dashboard.purchases?.pending_count || 0}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-gray-600">Rejeitadas</span>
              <span className="font-semibold text-red-600">{dashboard.purchases?.rejected_count || 0}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-gray-600">Valor Total Confirmado</span>
              <span className="font-semibold text-gray-900">{formatCurrency(dashboard.purchases?.confirmed_amount || 0)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-gray-600">Pontos Ganhos</span>
              <span className="font-semibold text-blue-600">{formatPoints(dashboard.purchases?.confirmed_points_earned || 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Média por Compra</span>
              <span className="font-semibold text-gray-900">{formatCurrency(dashboard.purchases?.avg_amount || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Rankings */}
      {((dashboard.purchases?.top_establishments?.length || 0) > 0 || (dashboard.transfers?.top_friends?.length || 0) > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Estabelecimentos */}
          {dashboard.purchases?.top_establishments && dashboard.purchases.top_establishments.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Estabelecimentos Mais Visitados</h2>
              <div className="space-y-3">
                {dashboard.purchases.top_establishments.map((est, index) => (
                  <div key={est.establishment_id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{est.name}</p>
                        <p className="text-sm text-gray-500">{est.visits} {est.visits === 1 ? "visita" : "visitas"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(est.total_spent)}</p>
                      <p className="text-sm text-blue-600">{formatPoints(est.total_points)} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Amigos */}
          {dashboard.transfers?.top_friends && dashboard.transfers.top_friends.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Amigos Mais Ativos</h2>
              <div className="space-y-3">
                {dashboard.transfers.top_friends.map((friend, index) => (
                  <div key={friend.friend_id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{friend.name}</p>
                        <p className="text-sm text-gray-500">{friend.user_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{friend.transfer_count} {friend.transfer_count === 1 ? "transferência" : "transferências"}</p>
                      <p className="text-sm text-purple-600">{formatPoints(friend.total_amount)} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
