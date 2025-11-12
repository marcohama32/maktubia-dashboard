import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { merchantsService } from "@/services/merchants.service";
import { campaignsService, Campaign } from "@/services/campaigns.service";
import { dashboardService, MerchantDashboardData } from "@/services/dashboard.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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

// Wrappers para componentes do recharts
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

interface MerchantEstablishment {
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
}

function MerchantDashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [establishments, setEstablishments] = useState<MerchantEstablishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]); // Todas as campanhas para métricas (fallback)
  const [dashboardData, setDashboardData] = useState<MerchantDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [campaignToAction, setCampaignToAction] = useState<Campaign | null>(null);
  const [actionType, setActionType] = useState<"activate" | "deactivate" | "delete">("activate");

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (user) {
      loadEstablishments();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEstablishment !== null) {
      loadCampaigns();
    } else if (establishments.length > 0) {
      // Se não houver seleção mas há establishments, carregar campanhas de todos
      loadAllCampaigns();
    }
  }, [selectedEstablishment, currentPage, statusFilter]);

  // Carregar dashboard do merchant usando o endpoint específico
  useEffect(() => {
    if (establishments.length > 0) {
      loadMerchantDashboard();
    }
  }, [establishments, selectedEstablishment, selectedPeriod]);

  const loadEstablishments = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await merchantsService.getMyEstablishments();
      setEstablishments(response.data || []);
      
      // Se houver apenas um establishment, selecionar automaticamente
      if (response.data?.length === 1) {
        setSelectedEstablishment(response.data[0].id);
      }
    } catch (err: any) {
      console.error("Erro ao carregar estabelecimentos:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar estabelecimentos");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    if (!selectedEstablishment) return;
    
    try {
      setCampaignsLoading(true);
      setError("");
      // Usar endpoint específico para campanhas do merchant
      const response = await campaignsService.getMyCampaigns({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: statusFilter || undefined,
        establishment_id: selectedEstablishment,
      });
      setCampaigns(response.data || []);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error("Erro ao carregar campanhas:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar campanhas");
      }
    } finally {
      setCampaignsLoading(false);
    }
  };

  const loadAllCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      setError("");
      // Usar endpoint específico para campanhas do merchant (todas dos seus establishments)
      const response = await campaignsService.getMyCampaigns({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: statusFilter || undefined,
        // Não passar establishment_id para buscar todas as campanhas do merchant
      });
      
      setCampaigns(response.data || []);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error("Erro ao carregar campanhas:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar campanhas");
      }
    } finally {
      setCampaignsLoading(false);
    }
  };

  // Carregar dashboard do merchant usando endpoint específico
  const loadMerchantDashboard = async () => {
    try {
      setMetricsLoading(true);
      const data = await dashboardService.getMerchantDashboard({
        period: selectedPeriod,
        establishment_id: selectedEstablishment || undefined,
      });
      
      setDashboardData(data);
      
      // Se o endpoint retornar campanhas, usar elas para fallback
      if (data.campaigns && data.campaigns.length > 0) {
        // Converter campanhas do endpoint para formato Campaign
        const convertedCampaigns: Campaign[] = data.campaigns.map((c: any) => ({
          campaign_id: c.campaign_id,
          id: c.campaign_id,
          campaignName: c.campaign_name,
          campaign_name: c.campaign_name,
          name: c.campaign_name,
          type: c.type,
          status: c.status,
          establishment_id: c.establishment_id,
          establishmentName: c.establishment_name,
          valid_from: c.valid_from,
          valid_until: c.valid_until,
          createdAt: c.created_at,
        }));
        setAllCampaigns(convertedCampaigns);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dashboard do merchant:", err);
      // Fallback: carregar campanhas manualmente se o endpoint falhar
      loadAllCampaignsForMetrics();
    } finally {
      setMetricsLoading(false);
    }
  };

  // Fallback: carregar todas as campanhas para métricas (sem paginação)
  const loadAllCampaignsForMetrics = async () => {
    try {
      const response = await campaignsService.getMyCampaigns({
        page: 1,
        limit: 1000, // Limite alto para pegar todas
        establishment_id: selectedEstablishment || undefined,
      });
      
      setAllCampaigns(response.data || []);
    } catch (err: any) {
      console.error("Erro ao carregar campanhas para métricas:", err);
    }
  };

  const handleCreateCampaign = () => {
    if (selectedEstablishment) {
      router.push(`/merchant/campaigns/new?establishment=${selectedEstablishment}`);
    } else {
      router.push("/merchant/campaigns/new");
    }
  };

  const handleViewCampaign = (id: number) => {
    router.push(`/merchant/campaigns/${id}`);
  };

  const handleStatusChange = async (campaign: Campaign, newStatus: "active" | "inactive") => {
    try {
      await campaignsService.changeStatus(campaign.campaign_id || campaign.id!, { status: newStatus });
      await loadCampaigns();
      setAlertConfig({
        title: "Sucesso!",
        message: `Campanha ${newStatus === "active" ? "ativada" : "desativada"} com sucesso.`,
        type: "success",
      });
      setAlertModalOpen(true);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao alterar status da campanha.",
        type: "error",
      });
      setAlertModalOpen(true);
    }
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setCampaignToAction(campaign);
    setActionType("delete");
    setConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToAction) return;
    
    try {
      await campaignsService.delete(campaignToAction.campaign_id || campaignToAction.id!);
      await loadCampaigns();
      setAlertConfig({
        title: "Sucesso!",
        message: "Campanha eliminada com sucesso.",
        type: "success",
      });
      setAlertModalOpen(true);
      setConfirmModalOpen(false);
      setCampaignToAction(null);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao eliminar campanha.",
        type: "error",
      });
      setAlertModalOpen(true);
    }
  };

  const getCampaignMetrics = (campaign: Campaign) => {
    // Usar métricas da API se disponíveis, senão usar campos legados
    if (campaign.metrics) {
      return {
        totalUses: campaign.metrics.totalParticipants ?? campaign.total_uses ?? 0,
        totalPointsGiven: campaign.metrics.totalPointsEarned ?? campaign.total_points_given ?? 0,
        totalRevenue: campaign.metrics.totalRevenue ?? campaign.total_revenue ?? 0,
        totalPurchases: campaign.metrics.totalPurchases ?? 0,
      };
    }
    return {
      totalUses: campaign.total_uses || 0,
      totalPointsGiven: campaign.total_points_given || 0,
      totalRevenue: campaign.total_revenue || 0,
      totalPurchases: 0,
    };
  };

  const getEstablishmentName = (establishmentId?: number) => {
    if (!establishmentId) return "-";
    const establishment = establishments.find(e => e.id === establishmentId);
    return establishment?.name || `ID: ${establishmentId}`;
  };

  const canCreateCampaign = (establishmentId?: number) => {
    if (!establishmentId) {
      // Se não há estabelecimento selecionado, verificar se há pelo menos um com permissão
      return establishments.some(e => e.merchant_permissions?.can_create_campaigns === true);
    }
    const establishment = establishments.find(e => e.id === establishmentId);
    return establishment?.merchant_permissions?.can_create_campaigns || false;
  };
  
  // Verificar se há pelo menos um estabelecimento com permissão para criar campanhas
  const hasAnyEstablishmentWithPermission = useMemo(() => {
    return establishments.some(e => e.merchant_permissions?.can_create_campaigns === true);
  }, [establishments]);

  // Usar métricas do endpoint ou calcular do fallback
  const metrics = useMemo(() => {
    // Se temos dados do endpoint, usar eles
    if (dashboardData?.summary) {
      return {
        totalCampaigns: dashboardData.summary.total_campaigns || 0,
        activeCampaigns: dashboardData.summary.active_campaigns || 0,
        inactiveCampaigns: (dashboardData.summary.total_campaigns || 0) - (dashboardData.summary.active_campaigns || 0),
        totalParticipants: dashboardData.summary.unique_customers || 0,
        totalPointsGiven: dashboardData.summary.total_points_given || 0,
        totalRevenue: dashboardData.summary.total_revenue || 0,
        totalPurchases: dashboardData.summary.total_purchases || 0,
      };
    }
    
    // Fallback: calcular métricas das campanhas
    const totalCampaigns = allCampaigns.length;
    const activeCampaigns = allCampaigns.filter(c => {
      const status = c.status?.toLowerCase() || "";
      return status === "active" || status === "activo" || c.is_active !== false;
    }).length;
    const inactiveCampaigns = totalCampaigns - activeCampaigns;
    
    let totalParticipants = 0;
    let totalPointsGiven = 0;
    let totalRevenue = 0;
    let totalPurchases = 0;

    allCampaigns.forEach(campaign => {
      const campaignMetrics = getCampaignMetrics(campaign);
      totalParticipants += campaignMetrics.totalUses;
      totalPointsGiven += campaignMetrics.totalPointsGiven;
      totalRevenue += campaignMetrics.totalRevenue;
      totalPurchases += campaignMetrics.totalPurchases;
    });

    return {
      totalCampaigns,
      activeCampaigns,
      inactiveCampaigns,
      totalParticipants,
      totalPointsGiven,
      totalRevenue,
      totalPurchases,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardData, allCampaigns]);

  // Preparar dados para gráfico de campanhas por status
  const campaignsByStatusData = useMemo(() => {
    // Se temos dados do endpoint, usar eles
    if (dashboardData?.metrics?.campaigns?.by_status) {
      return Object.entries(dashboardData.metrics.campaigns.by_status).map(([name, value]) => ({
        name,
        value: value as number,
      }));
    }
    
    // Fallback: calcular dos dados das campanhas
    const statusCount: Record<string, number> = {};
    
    allCampaigns.forEach(campaign => {
      const status = campaign.status?.toLowerCase() || "inativo";
      let statusKey = "Inativo";
      
      if (status === "active" || status === "activo") {
        statusKey = "Ativo";
      } else if (status === "cancelled" || status === "cancelado") {
        statusKey = "Cancelado";
      } else if (status === "expired" || status === "expirado") {
        statusKey = "Expirado";
      } else if (status === "rascunho") {
        statusKey = "Rascunho";
      }
      
      statusCount[statusKey] = (statusCount[statusKey] || 0) + 1;
    });

    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  }, [dashboardData, allCampaigns]);

  // Preparar dados para gráfico de receita por campanha (top 10)
  const revenueByCampaignData = useMemo(() => {
    // Se temos dados do endpoint, usar eles
    if (dashboardData?.top_campaigns && dashboardData.top_campaigns.length > 0) {
      return dashboardData.top_campaigns
        .map(campaign => ({
          name: (campaign.campaign_name || "Sem nome").substring(0, 20),
          receita: campaign.revenue || 0,
          participantes: campaign.purchases_count || 0,
        }))
        .filter(item => item.receita > 0)
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 10);
    }
    
    // Fallback: calcular dos dados das campanhas
    return allCampaigns
      .map(campaign => {
        const metrics = getCampaignMetrics(campaign);
        return {
          name: (campaign.campaignName || campaign.campaign_name || campaign.name || "Sem nome").substring(0, 20),
          receita: metrics.totalRevenue,
          participantes: metrics.totalUses,
        };
      })
      .filter(item => item.receita > 0)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10);
  }, [dashboardData, allCampaigns]);

  // Preparar dados para gráfico de participantes por campanha (top 10)
  const participantsByCampaignData = useMemo(() => {
    // Se temos dados do endpoint, usar eles
    if (dashboardData?.top_campaigns && dashboardData.top_campaigns.length > 0) {
      return dashboardData.top_campaigns
        .map(campaign => ({
          name: (campaign.campaign_name || "Sem nome").substring(0, 20),
          participantes: campaign.purchases_count || 0,
          receita: campaign.revenue || 0,
        }))
        .filter(item => item.participantes > 0)
        .sort((a, b) => b.participantes - a.participantes)
        .slice(0, 10);
    }
    
    // Fallback: calcular dos dados das campanhas
    return allCampaigns
      .map(campaign => {
        const metrics = getCampaignMetrics(campaign);
        return {
          name: (campaign.campaignName || campaign.campaign_name || campaign.name || "Sem nome").substring(0, 20),
          participantes: metrics.totalUses,
          receita: metrics.totalRevenue,
        };
      })
      .filter(item => item.participantes > 0)
      .sort((a, b) => b.participantes - a.participantes)
      .slice(0, 10);
  }, [dashboardData, allCampaigns]);

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
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Formatar pontos
  const formatPoints = (value: number) => {
    return new Intl.NumberFormat("pt-MZ").format(value);
  };

  return (
    <div className="relative p-6">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando estabelecimentos...</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            {selectedEstablishment 
              ? `Estabelecimento: ${getEstablishmentName(selectedEstablishment)}`
              : "Todos os estabelecimentos"
            }
            {dashboardData?.period_comparison?.current_period && (
              <> | Período: {dashboardData.period_comparison.current_period.days} dias</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as "7d" | "30d" | "90d")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          <button
            onClick={handleCreateCampaign}
            disabled={!hasAnyEstablishmentWithPermission}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Nova Campanha
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Campanhas */}
        <div className="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Campanhas</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{metrics.totalCampaigns}</p>
              <p className="mt-1 text-sm text-gray-600">
                {metrics.activeCampaigns} ativas
              </p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total de Participantes / Clientes Únicos */}
        <div className="rounded-lg border-l-4 border-green-500 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Clientes Únicos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {dashboardData?.summary?.unique_customers !== undefined
                  ? formatPoints(dashboardData.summary.unique_customers)
                  : formatPoints(metrics.totalParticipants)
                }
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {dashboardData?.summary?.total_purchases !== undefined && dashboardData.summary.total_purchases > 0
                  ? `${formatPoints(dashboardData.summary.total_purchases)} compras`
                  : metrics.totalPurchases > 0 && `${formatPoints(metrics.totalPurchases)} compras`
                }
              </p>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total de Pontos Distribuídos */}
        <div className="rounded-lg border-l-4 border-purple-500 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pontos Distribuídos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{formatPoints(metrics.totalPointsGiven)}</p>
              <p className="mt-1 text-sm text-gray-600">
                {dashboardData?.summary?.points_per_real !== undefined && dashboardData.summary.points_per_real > 0
                  ? `${formatPoints(dashboardData.summary.points_per_real)} pts por metical`
                  : metrics.totalCampaigns > 0 && `Média: ${formatPoints(Math.round(metrics.totalPointsGiven / metrics.totalCampaigns))} por campanha`
                }
              </p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total de Receita */}
        <div className="rounded-lg border-l-4 border-yellow-500 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Receita Total</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
              <p className="mt-1 text-sm text-gray-600">
                {dashboardData?.summary?.average_ticket !== undefined && dashboardData.summary.average_ticket > 0
                  ? `Ticket médio: ${formatCurrency(dashboardData.summary.average_ticket)}`
                  : metrics.totalPurchases > 0 && `Ticket médio: ${formatCurrency(Math.round(metrics.totalRevenue / metrics.totalPurchases))}`
                }
              </p>
            </div>
            <div className="rounded-lg bg-yellow-100 p-3">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Score e Insights */}
      {dashboardData && (
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Performance Score */}
          {dashboardData.performance_score && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Score de Performance</h2>
              <div className="flex items-center justify-center">
                <div className="relative h-32 w-32">
                  <svg className="h-32 w-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={dashboardData.performance_score.score! >= 70 ? COLORS.success : dashboardData.performance_score.score! >= 40 ? COLORS.warning : COLORS.danger}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(dashboardData.performance_score.score! / dashboardData.performance_score.max_score!) * 352} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {dashboardData.performance_score.score}
                      </div>
                      <div className="text-sm text-gray-500">
                        / {dashboardData.performance_score.max_score}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {dashboardData.performance_score.breakdown && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxa de Conversão:</span>
                    <span className="font-medium">{(dashboardData.performance_score.breakdown.conversion_rate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Crescimento de Receita:</span>
                    <span className="font-medium">{(dashboardData.performance_score.breakdown.revenue_growth || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxa de Campanhas Ativas:</span>
                    <span className="font-medium">{(dashboardData.performance_score.breakdown.active_campaigns_ratio || 0) * 100}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Insights */}
          {dashboardData.insights && dashboardData.insights.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Insights</h2>
              <div className="space-y-3">
                {dashboardData.insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border-l-4 p-4 ${
                      insight.severity === "error"
                        ? "border-red-500 bg-red-50"
                        : insight.severity === "warning"
                        ? "border-yellow-500 bg-yellow-50"
                        : insight.severity === "success"
                        ? "border-green-500 bg-green-50"
                        : "border-blue-500 bg-blue-50"
                    }`}
                  >
                    <p className="text-sm text-gray-700">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gráficos */}
      {(dashboardData || allCampaigns.length > 0) && (
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Gráfico de Campanhas por Status */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Campanhas por Status</h2>
            {campaignsByStatusData.length > 0 ? (
              <ResponsiveContainerWrapper width="100%" height={300}>
                <PieChartWrapper>
                  <PieWrapper
                    data={campaignsByStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {campaignsByStatusData.map((entry: any, index: number) => (
                      <CellWrapper key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </PieWrapper>
                  <TooltipWrapper />
                  <LegendWrapper />
                </PieChartWrapper>
              </ResponsiveContainerWrapper>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </div>

          {/* Gráfico de Receita por Campanha */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Top 10 Campanhas por Receita</h2>
            {revenueByCampaignData.length > 0 ? (
              <ResponsiveContainerWrapper width="100%" height={300}>
                <BarChartWrapper data={revenueByCampaignData}>
                  <CartesianGridWrapper strokeDasharray="3 3" />
                  <XAxisWrapper 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    style={{ fontSize: "10px" }}
                  />
                  <YAxisWrapper style={{ fontSize: "12px" }} />
                  <TooltipWrapper 
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <LegendWrapper />
                  <BarWrapper dataKey="receita" fill={COLORS.success} name="Receita (MT)" />
                </BarChartWrapper>
              </ResponsiveContainerWrapper>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </div>

          {/* Gráfico de Participantes por Campanha */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Top 10 Campanhas por Participantes</h2>
            {participantsByCampaignData.length > 0 ? (
              <ResponsiveContainerWrapper width="100%" height={300}>
                <BarChartWrapper data={participantsByCampaignData}>
                  <CartesianGridWrapper strokeDasharray="3 3" />
                  <XAxisWrapper 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    style={{ fontSize: "10px" }}
                  />
                  <YAxisWrapper style={{ fontSize: "12px" }} />
                  <TooltipWrapper />
                  <LegendWrapper />
                  <BarWrapper dataKey="participantes" fill={COLORS.primary} name="Participantes" />
                </BarChartWrapper>
              </ResponsiveContainerWrapper>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de Estabelecimentos */}
      {establishments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Meus Estabelecimentos</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setSelectedEstablishment(null);
                setCurrentPage(1);
              }}
              className={`rounded-lg px-4 py-2 transition-colors ${
                selectedEstablishment === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todos ({establishments.length})
            </button>
            {establishments.map((establishment, index) => {
              const establishmentId = establishment.id || establishment.establishment_id || `est-${index}`;
              return (
                <button
                  key={establishmentId}
                  onClick={() => {
                    setSelectedEstablishment(establishment.id || establishment.establishment_id);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-4 py-2 transition-colors ${
                    selectedEstablishment === (establishment.id || establishment.establishment_id)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {establishment.name}
                  {!establishment.merchant_permissions?.can_create_campaigns && (
                    <span className="ml-2 text-xs opacity-75">(sem permissão)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Título e Filtros para Lista de Campanhas */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Minhas Campanhas</h2>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Todas as campanhas</option>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
            <option value="cancelled">Canceladas</option>
            <option value="expired">Expiradas</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Tabela de Campanhas */}
      {campaignsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-lg bg-white py-12 text-center shadow">
          <p className="text-lg text-gray-500">
            {selectedEstablishment 
              ? "Nenhuma campanha encontrada para este estabelecimento"
              : "Nenhuma campanha encontrada"
            }
          </p>
          {selectedEstablishment && canCreateCampaign(selectedEstablishment) && (
            <button
              onClick={handleCreateCampaign}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Criar Primeira Campanha
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estabelecimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Métricas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {campaigns.map((campaign) => {
                  const metrics = getCampaignMetrics(campaign);
                  const isActive = campaign.status === "active" || campaign.status === "Activo" || campaign?.is_active !== false;
                  
                  return (
                    <tr key={campaign.campaign_id || campaign.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{campaign.campaignName || campaign.campaign_name || campaign.name || campaign.description || "Sem nome"}</div>
                        {(campaign.description || campaign.reward_description) && (
                          <div className="text-xs text-gray-500">{campaign.description || campaign.reward_description}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {getEstablishmentName(campaign.establishment_id)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                          {campaign.sponsor_name || campaign.type || "-"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div className="flex flex-col">
                          {(campaign.valid_from || campaign.start_date) && (
                            <span className="text-xs">Início: {new Date(campaign.valid_from || campaign.start_date!).toLocaleDateString()}</span>
                          )}
                          {(campaign.valid_until || campaign.end_date) && (
                            <span className="text-xs">Fim: {new Date(campaign.valid_until || campaign.end_date!).toLocaleDateString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-600">
                            <strong>Participantes:</strong> {metrics.totalUses}
                          </span>
                          {metrics.totalPurchases > 0 && (
                            <span className="text-xs text-gray-600">
                              <strong>Compras:</strong> {metrics.totalPurchases}
                            </span>
                          )}
                          <span className="text-xs text-gray-600">
                            <strong>Pontos:</strong> {metrics.totalPointsGiven.toLocaleString("pt-MZ")}
                          </span>
                          {metrics.totalRevenue > 0 && (
                            <span className="text-xs text-gray-600">
                              <strong>Receita:</strong> {metrics.totalRevenue.toLocaleString("pt-MZ")} MT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          isActive
                            ? "bg-green-100 text-green-800"
                            : campaign.status === "cancelled" || campaign.status === "Cancelado"
                            ? "bg-red-100 text-red-800"
                            : campaign.status === "Expirado" || campaign.status === "expired"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {campaign.status || (isActive ? "Activo" : "Inativo")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewCampaign(campaign.campaign_id || campaign.id!)}
                            className="text-green-600 hover:text-green-900"
                            title="Ver detalhes"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {!isActive && (
                            <button
                              onClick={() => handleStatusChange(campaign, "active")}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ativar campanha"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          {isActive && (
                            <button
                              onClick={() => handleStatusChange(campaign, "inactive")}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Desativar campanha"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(campaign)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar campanha"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`rounded-lg px-4 py-2 ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={`ellipsis-${page}`} className="px-2">...</span>;
                }
                return null;
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage >= pagination.totalPages}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próxima
            </button>
          </div>

          <div className="text-sm text-gray-500">
            Mostrando {pagination.page} de {pagination.totalPages} páginas ({pagination.total} campanhas)
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {campaignToAction && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false);
            setCampaignToAction(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Confirmar Eliminação"
          message={`Tem certeza que deseja eliminar esta campanha?\n\nNome: ${campaignToAction.name || "-"}\nEstabelecimento: ${getEstablishmentName(campaignToAction.establishment_id)}\n\nEsta ação não pode ser desfeita.`}
          confirmText="Sim, Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      )}

      {/* Modal de Alerta */}
      {alertConfig && (
        <AlertModal
          isOpen={alertModalOpen}
          onClose={() => {
            setAlertModalOpen(false);
            setAlertConfig(null);
          }}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          confirmText="OK"
          autoClose={alertConfig.type === "success" ? 3000 : 0}
        />
      )}
    </div>
  );
}

export default function MerchantDashboard() {
  return (
    <ProtectedRoute requireMerchant={true} redirectTo="/">
      <MerchantDashboardContent />
    </ProtectedRoute>
  );
}

