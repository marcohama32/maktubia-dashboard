import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { campaignsService, Campaign } from "@/services/campaigns.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const ITEMS_PER_PAGE = 10;

function CampaignsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Estados para modais
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  // Carregar campanhas
  useEffect(() => {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => loadCampaigns(), { timeout: 100 });
    } else {
      setTimeout(() => loadCampaigns(), 50);
    }
  }, [currentPage, statusFilter, searchTerm]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Usar o endpoint /campaigns que retorna todas as campanhas (o backend filtra por role)
      const response = await campaignsService.getAll({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      
      setCampaigns(response.data || []);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error("Erro ao carregar campanhas:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar campanhas");
      }
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number | string) => {
    if (id) {
      router.push(`/campaigns/${id}`);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    
    const statusLower = status.toLowerCase();
    const statusMap: { [key: string]: { label: string; className: string } } = {
      "activo": { label: "Ativo", className: "bg-green-100 text-green-800" },
      "active": { label: "Ativo", className: "bg-green-100 text-green-800" },
      "parado": { label: "Parado", className: "bg-yellow-100 text-yellow-800" },
      "inactive": { label: "Inativo", className: "bg-yellow-100 text-yellow-800" },
      "cancelado": { label: "Cancelado", className: "bg-red-100 text-red-800" },
      "cancelled": { label: "Cancelado", className: "bg-red-100 text-red-800" },
      "concluído": { label: "Concluído", className: "bg-blue-100 text-blue-800" },
      "expirado": { label: "Expirado", className: "bg-gray-100 text-gray-800" },
      "expired": { label: "Expirado", className: "bg-gray-100 text-gray-800" },
      "rascunho": { label: "Rascunho", className: "bg-gray-100 text-gray-800" },
    };

    const statusInfo = statusMap[statusLower] || { label: status, className: "bg-gray-100 text-gray-800" };
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return new Intl.DateTimeFormat("pt-MZ", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return "-";
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "-";
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
    }).format(value);
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
          <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Explore todas as campanhas disponíveis
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

          {/* Status */}
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
              <option value="">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="cancelled">Cancelado</option>
              <option value="expired">Expirado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Lista de campanhas */}
      {campaigns.length === 0 && !loading ? (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma campanha encontrada</h3>
          <p className="mt-2 text-sm text-gray-500">
            Não há campanhas disponíveis no momento.
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campanha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estabelecimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pontos
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
                {campaigns.map((campaign) => {
                  const campaignId = campaign.id || campaign.campaign_id;
                  const campaignName = campaign.campaignName || campaign.campaign_name || "Sem nome";
                  const establishmentName = 
                    campaign.establishment?.name || 
                    campaign.establishmentName || 
                    "Sem estabelecimento";
                  
                  return (
                    <tr key={campaignId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{campaignName}</div>
                        {campaign.sponsorName && (
                          <div className="text-sm text-gray-500">Patrocinador: {campaign.sponsorName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{establishmentName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(campaign.validFrom || campaign.valid_from)} - {formatDate(campaign.validUntil || campaign.valid_until)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {campaign.rewardPointsCost || campaign.reward_points_cost || 0} pts
                        </div>
                        {campaign.rewardValueMt && (
                          <div className="text-sm text-gray-500">
                            {formatCurrency(campaign.rewardValueMt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(campaign.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleView(campaignId!)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> até{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * ITEMS_PER_PAGE, pagination.total || 0)}
                    </span>{" "}
                    de <span className="font-medium">{pagination.total || 0}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
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
    <ProtectedRoute>
      <CampaignsPageContent />
    </ProtectedRoute>
  );
}

