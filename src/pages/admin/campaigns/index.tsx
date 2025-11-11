import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { campaignsService, Campaign, GetAllCampaignsParams } from "@/services/campaigns.service";
import { establishmentService } from "@/services/establishment.service";
import { merchantsService } from "@/services/merchants.service";
import { isAdmin, isMerchant } from "@/utils/roleUtils";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const ITEMS_PER_PAGE = 10;

function CampaignsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEstablishments, setLoadingEstablishments] = useState(false);
  const [error, setError] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [establishmentFilter, setEstablishmentFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [generalMetrics, setGeneralMetrics] = useState<any>(null);
  
  // Estados para modais
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  // Carregar estabelecimentos primeiro
  useEffect(() => {
    if (user) {
      loadEstablishments();
    }
  }, [user]);

  const loadEstablishments = async () => {
    try {
      setLoadingEstablishments(true);
      
      let establishmentsData: any[] = [];
      
      // Se for admin, carregar todos os estabelecimentos
      if (isAdmin(user)) {
        console.log("🔍 [CAMPAIGNS LIST] Usuário é admin - carregando todos os estabelecimentos");
        establishmentsData = await establishmentService.getAll(true);
      } 
      // Se for merchant, carregar apenas estabelecimentos do merchant
      else if (isMerchant(user)) {
        console.log("🔍 [CAMPAIGNS LIST] Usuário é merchant - carregando estabelecimentos do merchant");
        const response = await merchantsService.getMyEstablishments();
        establishmentsData = response.data || [];
      } 
      // Se não tiver role definido, tentar carregar como merchant primeiro
      else {
        console.log("🔍 [CAMPAIGNS LIST] Role não definido - tentando carregar como merchant");
        try {
          const response = await merchantsService.getMyEstablishments();
          establishmentsData = response.data || [];
        } catch (merchantErr) {
          // Se falhar, tentar como admin
          console.log("🔍 [CAMPAIGNS LIST] Falhou como merchant - tentando como admin");
          establishmentsData = await establishmentService.getAll(true);
        }
      }
      
      console.log("✅ [CAMPAIGNS LIST] Estabelecimentos carregados:", establishmentsData.length);
      setEstablishments(establishmentsData);
    } catch (err: any) {
      console.error("❌ [CAMPAIGNS LIST] Erro ao carregar estabelecimentos:", err);
      // Não bloquear se falhar ao carregar estabelecimentos
    } finally {
      setLoadingEstablishments(false);
    }
  };

  // Carregar campanhas após estabelecimentos
  useEffect(() => {
    if (establishments.length > 0 || !loadingEstablishments) {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => loadCampaigns(), { timeout: 100 });
      } else {
        setTimeout(() => loadCampaigns(), 50);
      }
    }
  }, [currentPage, statusFilter, establishmentFilter, typeFilter, searchTerm, establishments.length, loadingEstablishments]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, establishmentFilter, typeFilter, searchTerm]);

  // Helper function para validar e converter status
  const getValidStatus = (status: string | undefined): "active" | "inactive" | "cancelled" | "expired" | undefined => {
    if (!status) return undefined;
    const validStatuses = ["active", "inactive", "cancelled", "expired"];
    return validStatuses.includes(status) ? status as "active" | "inactive" | "cancelled" | "expired" : undefined;
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError("");
      
      let response: any;
      const validStatus = getValidStatus(statusFilter);
      
      // Se for admin, carregar todas as campanhas
      if (isAdmin(user)) {
        console.log("🔍 [CAMPAIGNS LIST] Usuário é admin - carregando todas as campanhas");
        const params: GetAllCampaignsParams = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          status: validStatus,
          establishment_id: establishmentFilter ? Number(establishmentFilter) : undefined,
          type: typeFilter || undefined,
          search: searchTerm || undefined,
        };
        response = await campaignsService.getAll(params);
      } 
      // Se for merchant, carregar apenas campanhas do merchant
      else if (isMerchant(user)) {
        console.log("🔍 [CAMPAIGNS LIST] Usuário é merchant - carregando campanhas do merchant");
        response = await campaignsService.getMyCampaigns({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          status: validStatus,
          establishment_id: establishmentFilter ? Number(establishmentFilter) : undefined,
          type: typeFilter || undefined,
          search: searchTerm || undefined,
        });
      } 
      // Se não tiver role definido, tentar carregar como merchant primeiro
      else {
        console.log("🔍 [CAMPAIGNS LIST] Role não definido - tentando carregar como merchant");
        try {
          response = await campaignsService.getMyCampaigns({
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            status: validStatus,
            establishment_id: establishmentFilter ? Number(establishmentFilter) : undefined,
            type: typeFilter || undefined,
            search: searchTerm || undefined,
          });
        } catch (merchantErr) {
          // Se falhar, tentar como admin
          console.log("🔍 [CAMPAIGNS LIST] Falhou como merchant - tentando como admin");
          const params: GetAllCampaignsParams = {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            status: validStatus,
            establishment_id: establishmentFilter ? Number(establishmentFilter) : undefined,
            type: typeFilter || undefined,
            search: searchTerm || undefined,
          };
          response = await campaignsService.getAll(params);
        }
      }
      
      let campaignsData = response.data || [];
      
      // Enriquecer campanhas com dados de estabelecimentos
      campaignsData = campaignsData.map((campaign: Campaign) => {
        // Se não tem establishment no objeto, buscar pelo establishment_id
        if (!campaign.establishment && campaign.establishment_id) {
          const establishment = establishments.find(e => e.id === campaign.establishment_id);
          if (establishment) {
            return {
              ...campaign,
              establishment: {
                id: establishment.id,
                name: establishment.name,
                type: establishment.type,
                address: establishment.address,
              },
            };
          }
        }
        return campaign;
      });
      
      setCampaigns(campaignsData);
      setPagination(response.pagination);
      setGeneralMetrics(response.generalMetrics || null);
    } catch (err: any) {
      console.error("Erro ao carregar campanhas:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar campanhas");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const campaignId = campaignToDelete?.campaign_id || campaignToDelete?.id || campaignToDelete?.campaign_number;
    if (!campaignId) {
      setAlertConfig({
        title: "Erro!",
        message: "ID da campanha inválido.",
        type: "error",
      });
      setAlertModalOpen(true);
      setConfirmModalOpen(false);
      return;
    }

    try {
      setDeleteLoading(true);
      setConfirmModalOpen(false);
      
      await campaignsService.delete(campaignId);
      await loadCampaigns();
      
      setAlertConfig({
        title: "Sucesso!",
        message: "A campanha foi eliminada com sucesso.",
        type: "success",
      });
      setAlertModalOpen(true);
      setCampaignToDelete(null);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao eliminar campanha. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmModalOpen(false);
    setCampaignToDelete(null);
  };

  const handleView = (id: number | string) => {
    router.push(`/admin/campaigns/${id}`);
  };

  const handleEdit = (campaign: Campaign) => {
    const campaignId = campaign.campaign_id || campaign.id;
    if (!campaignId) {
      setAlertConfig({
        title: "Erro!",
        message: "ID da campanha inválido.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }
    router.push(`/admin/campaigns/${campaignId}/edit`);
  };

  const handleCreate = () => {
    router.push("/admin/campaigns/new");
  };

  const handleStatusChange = async (campaign: Campaign, newStatus: "active" | "inactive" | "cancelled") => {
    const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
    if (!campaignId) {
      setAlertConfig({
        title: "Erro!",
        message: "ID da campanha inválido.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    try {
      await campaignsService.changeStatus(campaignId, { status: newStatus });
      await loadCampaigns();
      setAlertConfig({
        title: "Sucesso!",
        message: `Status da campanha alterado para ${newStatus}.`,
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

  return (
    <div className="relative p-6">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-gray-600">Carregando...</div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
        <button
          onClick={handleCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + Nova Campanha
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Busca */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome da campanha..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
              <option value="cancelled">Canceladas</option>
              <option value="Rascunho">Rascunho</option>
              <option value="Expirado">Expirado</option>
            </select>
          </div>

          {/* Filtro por Estabelecimento */}
          {establishments.length > 0 && (
            <div>
              <label htmlFor="establishment" className="block text-sm font-medium text-gray-700 mb-1">
                Estabelecimento
              </label>
              <select
                id="establishment"
                value={establishmentFilter}
                onChange={(e) => setEstablishmentFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Todos os estabelecimentos</option>
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por Tipo */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Campanha
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              <option value="RewardType_Auto">Oferta Automática</option>
              <option value="RewardType_Draw">Sorteio</option>
              <option value="RewardType_Exchange">Troca</option>
              <option value="RewardType_Quiz">Questões</option>
              <option value="RewardType_Referral">Indicação</option>
              <option value="RewardType_Challenge">Desafio</option>
              <option value="RewardType_Party">Votação</option>
              <option value="RewardType_Voucher">Voucher</option>
            </select>
          </div>
        </div>

        {/* Botão Limpar Filtros */}
        {(statusFilter || establishmentFilter || typeFilter || searchTerm) && (
          <div className="mt-4">
            <button
              onClick={() => {
                setStatusFilter("");
                setEstablishmentFilter("");
                setTypeFilter("");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Métricas Gerais */}
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
        {/* Cards de Métricas */}
        <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Campanhas</p>
          <p className="mt-0.5 text-xl font-bold text-gray-900">{generalMetrics?.totalCampaigns || pagination?.total || campaigns.length || 0}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Participantes</p>
          <p className="mt-0.5 text-xl font-bold text-gray-900">{(generalMetrics?.totalParticipants || 0).toLocaleString("pt-MZ")}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Pontos</p>
          <p className="mt-0.5 text-xl font-bold text-gray-900">{(generalMetrics?.totalPointsEarned || 0).toLocaleString("pt-MZ")}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Receita</p>
          <p className="mt-0.5 text-xl font-bold text-gray-900">{(generalMetrics?.totalRevenue || 0).toLocaleString("pt-MZ")} MT</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Compras</p>
          <p className="mt-0.5 text-xl font-bold text-gray-900">{(generalMetrics?.totalPurchases || 0).toLocaleString("pt-MZ")}</p>
        </div>
        {/* Gráfico de Pizza - Distribuição por Status */}
        {campaigns.length > 0 && (
          <div className="col-span-2 rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Campanhas por Status</h3>
            <CampaignsByStatusChart campaigns={campaigns} />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Tabela de Campanhas */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estabelecimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Nenhuma campanha encontrada
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.campaign_id || campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {campaign.campaignName || campaign.campaign_name || campaign.name || campaign.description || "Sem nome"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {campaign.reward_description || campaign.description || ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(() => {
                        // Tentar múltiplas fontes para o nome do estabelecimento
                        const establishmentName = 
                          campaign.establishment?.name ||
                          (campaign.establishment_id 
                            ? establishments.find(e => e.id === campaign.establishment_id)?.name 
                            : null) ||
                          (campaign.merchant_id 
                            ? establishments.find(e => e.id === campaign.merchant_id)?.name 
                            : null);
                        
                        if (establishmentName) {
                          return establishmentName;
                        }
                        
                        // Se não encontrou, mostrar ID ou "Não definido"
                        if (campaign.establishment_id) {
                          return `ID: ${campaign.establishment_id}`;
                        }
                        if (campaign.merchant_id) {
                          return `ID: ${campaign.merchant_id}`;
                        }
                        return "Não definido";
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {campaign.typeLabel || campaign.type || (campaign.accumulation_rate ? "points_per_spend" : "points")}
                    </span>
                    {campaign.typeDescription && (
                      <div className="text-xs text-gray-500 mt-1">
                        {campaign.typeDescription}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      campaign.status === "active" || campaign.status === "Activo" || campaign.is_active === true
                        ? "bg-green-100 text-green-800"
                        : campaign.status === "cancelled" || campaign.status === "Cancelado"
                        ? "bg-red-100 text-red-800"
                        : campaign.status === "Rascunho"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {campaign.status || (campaign.is_active !== false ? "active" : "inactive")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(campaign.campaign_id || campaign.id || campaign.campaign_number || "")}
                        className="text-green-600 hover:text-green-900"
                        title="Ver detalhes"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar campanha"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {campaign.status !== "active" && campaign.status !== "Activo" && (
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
                      {(campaign.status === "active" || campaign.status === "Activo") && (
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
                        disabled={deleteLoading}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Eliminar"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Paginação */}
      {(pagination || campaigns.length > 0) && (
        <div className="mt-4 rounded-lg bg-white border border-gray-200 px-4 py-2.5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Informações de paginação */}
            <div className="text-xs text-gray-600">
              {pagination ? (
                <>
                  Mostrando <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> a{" "}
                  <span className="font-semibold">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{" "}
                  de <span className="font-semibold">{pagination.total}</span> campanhas
                </>
              ) : (
                <>
                  Total: <span className="font-semibold">{campaigns.length}</span> campanhas
                </>
              )}
            </div>

            {/* Controles de paginação */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Primeira página"
                >
                  ««
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                          className={`rounded px-3 py-1.5 text-xs ${
                            currentPage === page
                              ? "bg-blue-600 text-white font-semibold"
                              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={`ellipsis-${page}`} className="px-1 text-xs text-gray-500">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage >= pagination.totalPages}
                  className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
                <button
                  onClick={() => setCurrentPage(pagination.totalPages)}
                  disabled={currentPage >= pagination.totalPages}
                  className="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Última página"
                >
                  »»
                </button>
              </div>
            )}
            {pagination && pagination.totalPages === 1 && (
              <div className="text-xs text-gray-500">
                Página {pagination.page} de {pagination.totalPages}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {campaignToDelete && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Confirmar Eliminação"
          message={`Tem certeza que deseja eliminar esta campanha?\n\nID: #${campaignToDelete.campaign_id || campaignToDelete.id}\nNome: ${campaignToDelete.campaignName || campaignToDelete.campaign_name || campaignToDelete.name || "-"}\nEstabelecimento: ${(() => {
            const establishmentName = 
              campaignToDelete.establishment?.name ||
              (campaignToDelete.establishment_id 
                ? establishments.find(e => e.id === campaignToDelete.establishment_id)?.name 
                : null);
            return establishmentName || `ID: ${campaignToDelete.establishment_id || "N/A"}`;
          })()}\n\nEsta ação não pode ser desfeita.`}
          confirmText="Sim, Eliminar"
          cancelText="Cancelar"
          type="danger"
          isLoading={deleteLoading}
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

export default function CampaignsPage() {
  return (
    <ProtectedRoute requireAdmin={true} redirectTo="/">
      <CampaignsPageContent />
    </ProtectedRoute>
  );
}

// Componente de Gráfico - Campanhas por Status
function CampaignsByStatusChart({ campaigns }: { campaigns: Campaign[] }) {
  const statusData = useMemo(() => {
    const statusCount: Record<string, number> = {};
    
    campaigns.forEach((campaign) => {
      const status = campaign.status || (campaign.is_active !== false ? "Activo" : "Inativo");
      const normalizedStatus = 
        status === "active" || status === "Activo" ? "Ativas"
        : status === "inactive" || status === "Inativo" ? "Inativas"
        : status === "cancelled" || status === "Cancelado" ? "Canceladas"
        : status === "Rascunho" ? "Rascunho"
        : status === "Expirado" ? "Expirado"
        : status;
      
      statusCount[normalizedStatus] = (statusCount[normalizedStatus] || 0) + 1;
    });

    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
    }));
  }, [campaigns]);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  if (statusData.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Sem dados para exibir</p>;
  }

  return (
    // @ts-expect-error - Recharts type incompatibility with React 18
    <ResponsiveContainer width="100%" height={120}>
      {/* @ts-expect-error - Recharts type incompatibility with React 18 */}
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          outerRadius={45}
          fill="#8884d8"
          dataKey="value"
        >
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: "10px" }} iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Componente de Gráfico - Campanhas por Tipo
function CampaignsByTypeChart({ campaigns }: { campaigns: Campaign[] }) {
  const typeData = useMemo(() => {
    const typeCount: Record<string, number> = {};
    
    campaigns.forEach((campaign) => {
      const type = campaign.typeLabel || campaign.type || "Outro";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return Object.entries(typeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [campaigns]);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

  if (typeData.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Sem dados para exibir</p>;
  }

  return (
    // @ts-expect-error - Recharts type incompatibility with React 18
    <ResponsiveContainer width="100%" height={200}>
      {/* @ts-expect-error - Recharts type incompatibility with React 18 */}
      <PieChart>
        <Pie
          data={typeData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={60}
          fill="#8884d8"
          dataKey="value"
        >
          {typeData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Componente de Gráfico - Compras por Status
function PurchasesByStatusChart({ metrics }: { metrics: any }) {
  const purchaseData = useMemo(() => {
    const data = [];
    
    if (metrics.confirmedPurchases > 0) {
      data.push({ name: "Confirmadas", value: metrics.confirmedPurchases });
    }
    if (metrics.pendingPurchases > 0) {
      data.push({ name: "Pendentes", value: metrics.pendingPurchases });
    }
    if (metrics.rejectedPurchases > 0) {
      data.push({ name: "Rejeitadas", value: metrics.rejectedPurchases });
    }

    return data;
  }, [metrics]);

  const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

  if (purchaseData.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Sem dados para exibir</p>;
  }

  return (
    // @ts-expect-error - Recharts type incompatibility with React 18
    <ResponsiveContainer width="100%" height={200}>
      {/* @ts-expect-error - Recharts type incompatibility with React 18 */}
      <PieChart>
        <Pie
          data={purchaseData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
          outerRadius={60}
          fill="#8884d8"
          dataKey="value"
        >
          {purchaseData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

