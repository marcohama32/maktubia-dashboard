import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { campaignsService, Campaign } from "@/services/campaigns.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const ITEMS_PER_PAGE = 10;

function PublicCampaignsPageContent() {
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
      
      const response = await campaignsService.getPublicCampaigns({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      
      setCampaigns(response.data || []);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error("Erro ao carregar campanhas públicas:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar campanhas públicas");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number | string) => {
    router.push(`/merchant/campaigns/${id}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Campanhas Públicas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Explore campanhas públicas de todos os estabelecimentos
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
        </div>

        {/* Botão Limpar Filtros */}
        {(statusFilter || searchTerm) && (
          <div className="mt-4">
            <button
              onClick={() => {
                setStatusFilter("");
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
                    {loading ? "Carregando..." : "Nenhuma campanha pública encontrada"}
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
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
                        {campaign.establishment?.name || campaign.establishmentName || campaign.establishment_name || `ID: ${campaign.establishment_id || "N/A"}`}
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

export default function PublicCampaignsPage() {
  return (
    <ProtectedRoute requireMerchant={true} redirectTo="/">
      <PublicCampaignsPageContent />
    </ProtectedRoute>
  );
}

