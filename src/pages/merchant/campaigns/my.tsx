import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { campaignsService, Campaign } from "@/services/campaigns.service";
import { merchantsService } from "@/services/merchants.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const ITEMS_PER_PAGE = 10;

interface MerchantEstablishment {
  id: number;
  name: string;
  merchant_permissions?: {
    can_create_campaigns?: boolean;
    can_set_custom_points?: boolean;
  };
}

function MyCampaignsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [establishments, setEstablishments] = useState<MerchantEstablishment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEstablishments, setLoadingEstablishments] = useState(false);
  const [error, setError] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [establishmentFilter, setEstablishmentFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Estados para modais
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const [confirmModalOpenStatus, setConfirmModalOpenStatus] = useState(false);
  const [campaignToAction, setCampaignToAction] = useState<Campaign | null>(null);
  const [actionType, setActionType] = useState<"activate" | "deactivate">("activate");

  // Carregar estabelecimentos primeiro
  useEffect(() => {
    if (user) {
      loadEstablishments();
    }
  }, [user]);

  const loadEstablishments = async () => {
    try {
      setLoadingEstablishments(true);
      const response = await merchantsService.getMyEstablishments();
      setEstablishments(response.data || []);
    } catch (err: any) {
      console.error("Erro ao carregar estabelecimentos:", err);
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
  }, [currentPage, statusFilter, establishmentFilter, searchTerm, establishments.length, loadingEstablishments]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, establishmentFilter, searchTerm]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await campaignsService.getMyCampaignsList({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: statusFilter || undefined,
        establishment_id: establishmentFilter ? Number(establishmentFilter) : undefined,
        search: searchTerm || undefined,
      });
      
      setCampaigns(response.data || []);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error("Erro ao carregar minhas campanhas:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar minhas campanhas");
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
    router.push(`/merchant/campaigns/${id}`);
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
    router.push(`/merchant/campaigns/${campaignId}/edit`);
  };

  const handleCreate = () => {
    router.push("/merchant/campaigns/new");
  };

  const handleStatusChangeClick = (campaign: Campaign, newStatus: "activate" | "deactivate") => {
    setCampaignToAction(campaign);
    setActionType(newStatus);
    setConfirmModalOpenStatus(true);
  };

  const handleStatusChangeConfirm = async () => {
    const campaignId = campaignToAction?.campaign_id || campaignToAction?.id || campaignToAction?.campaign_number;
    if (!campaignId) {
      setAlertConfig({
        title: "Erro!",
        message: "ID da campanha inválido.",
        type: "error",
      });
      setAlertModalOpen(true);
      setConfirmModalOpenStatus(false);
      return;
    }

    try {
      const status = actionType === "activate" ? "active" : "inactive";
      await campaignsService.changeStatus(campaignId, { status });
      await loadCampaigns();
      setAlertConfig({
        title: "Sucesso!",
        message: `Status da campanha alterado para ${actionType === "activate" ? "ativa" : "inativa"}.`,
        type: "success",
      });
      setAlertModalOpen(true);
      setConfirmModalOpenStatus(false);
      setCampaignToAction(null);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao alterar status da campanha.",
        type: "error",
      });
      setAlertModalOpen(true);
    }
  };

  const handleStatusChangeCancel = () => {
    setConfirmModalOpenStatus(false);
    setCampaignToAction(null);
  };

  const getEstablishmentName = (establishmentId: number | undefined) => {
    if (!establishmentId) return "Não definido";
    const establishment = establishments.find(e => e.id === establishmentId);
    return establishment?.name || `ID: ${establishmentId}`;
  };

  return (
    <div className="relative p-6">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-gray-600">Carregando...</div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Campanhas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie suas campanhas
          </p>
        </div>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                {establishments.map((est, index) => {
                  const establishmentId = est.id || est.establishment_id || `est-${index}`;
                  return (
                    <option key={establishmentId} value={establishmentId}>
                      {est.name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Botão Limpar Filtros */}
        {(statusFilter || establishmentFilter || searchTerm) && (
          <div className="mt-4">
            <button
              onClick={() => {
                setStatusFilter("");
                setEstablishmentFilter("");
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
                    {loading ? "Carregando..." : "Nenhuma campanha encontrada"}
                  </td>
                </tr>
              ) : (
                campaigns
                  .filter((campaign) => {
                    if (searchTerm) {
                      const term = searchTerm.toLowerCase();
                      const name = (campaign.campaignName || campaign.campaign_name || campaign.name || "").toLowerCase();
                      return name.includes(term);
                    }
                    return true;
                  })
                  .map((campaign) => (
                    <tr key={campaign.campaign_id || campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.campaignName || campaign.campaign_name || campaign.name || "Sem nome"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {campaign.reward_description || campaign.description || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getEstablishmentName(campaign.establishment_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {campaign.typeLabel || campaign.type || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          campaign.status === "active" || campaign.status === "Activo" || campaign.is_active === true
                            ? "bg-green-100 text-green-800"
                            : campaign.status === "cancelled" || campaign.status === "Cancelado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {campaign.status || (campaign.is_active !== false ? "active" : "inactive")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleView(campaign.campaign_id || campaign.id || "")}
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
                              onClick={() => handleStatusChangeClick(campaign, "activate")}
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
                              onClick={() => handleStatusChangeClick(campaign, "deactivate")}
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

      {/* Modal de Confirmação - Deletar */}
      {campaignToDelete && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Confirmar Eliminação"
          message={`Tem certeza que deseja eliminar esta campanha?\n\nID: #${campaignToDelete.campaign_id || campaignToDelete.id}\nNome: ${campaignToDelete.campaignName || campaignToDelete.campaign_name || campaignToDelete.name || "-"}\nEstabelecimento: ${getEstablishmentName(campaignToDelete.establishment_id)}\n\nEsta ação não pode ser desfeita.`}
          confirmText="Sim, Eliminar"
          cancelText="Cancelar"
          type="danger"
          isLoading={deleteLoading}
        />
      )}

      {/* Modal de Confirmação - Status */}
      {campaignToAction && (
        <ConfirmModal
          isOpen={confirmModalOpenStatus}
          onClose={handleStatusChangeCancel}
          onConfirm={handleStatusChangeConfirm}
          title={`${actionType === "activate" ? "Ativar" : "Desativar"} Campanha`}
          message={`Tem certeza que deseja ${actionType === "activate" ? "ativar" : "desativar"} esta campanha?\n\nID: #${campaignToAction.campaign_id || campaignToAction.id}\nNome: ${campaignToAction.campaignName || campaignToAction.campaign_name || campaignToAction.name || "-"}`}
          confirmText={`Sim, ${actionType === "activate" ? "Ativar" : "Desativar"}`}
          cancelText="Cancelar"
          type={actionType === "activate" ? "success" : "warning"}
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

export default function MyCampaignsPage() {
  return (
    <ProtectedRoute requireMerchant={true} redirectTo="/">
      <MyCampaignsPageContent />
    </ProtectedRoute>
  );
}

