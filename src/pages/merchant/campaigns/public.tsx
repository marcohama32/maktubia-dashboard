import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { campaignsService, Campaign } from "@/services/campaigns.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getUserRole, isUser, isClient } from "@/utils/roleUtils";

const ITEMS_PER_PAGE = 10;

// Função para traduzir tipos de campanha para português
const translateCampaignType = (type: string | undefined | null): string => {
  if (!type) return "Não definido";
  
  const typeMap: { [key: string]: string } = {
    'RewardType_Auto': 'Oferta Automática',
    'RewardType_Draw': 'Sorteio',
    'RewardType_Exchange': 'Troca',
    'RewardType_Quiz': 'Questões',
    'RewardType_Referral': 'Indicação',
    'RewardType_Challenge': 'Desafio',
    'RewardType_Party': 'Votação',
    'RewardType_Voucher': 'Voucher',
    'RewardType_Booking': 'Oferta de Desconto por Marcação',
    'points_per_spend': 'Pontos por Compra',
    'points': 'Pontos',
    'vip_treatment': 'Tratamento VIP',
    'buy_get': 'Compre e Ganhe',
    'bonus_multiplier': 'Multiplicador de Bônus'
  };
  
  return typeMap[type] || type;
};

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
  
  // Estados para participação
  const [participatingCampaignId, setParticipatingCampaignId] = useState<string | number | null>(null);
  const [reservationCode, setReservationCode] = useState<string | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  
  // Verificar se o usuário é cliente
  const userRole = getUserRole(user);
  const userIsClient = isClient(user); // Usar função do roleUtils que já verifica todas as variações
  
  // Debug: logar informações do usuário
  useEffect(() => {
    console.log("🔍 [PUBLIC CAMPAIGNS] User info:", {
      user,
      userRole,
      isClient: userIsClient,
      hasUser: !!user,
      roleFromUser: user?.role,
      roleNameFromUser: user?.role_name,
      roleObject: typeof user?.role === 'object' ? user.role : null
    });
    
    // Log adicional para debug
    if (user) {
      console.log("🔍 [PUBLIC CAMPAIGNS] Detalhes completos do user:", JSON.stringify(user, null, 2));
    }
  }, [user, userRole, userIsClient]);

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
      
      // Se o usuário estiver autenticado, usar getAllCampaigns (que filtra por role)
      // Se não estiver autenticado, usar getPublicCampaigns
      const response = user 
        ? await campaignsService.getAll({
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            status: statusFilter || undefined,
            search: searchTerm || undefined,
          })
        : await campaignsService.getPublicCampaigns({
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
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number | string) => {
    router.push(`/merchant/campaigns/${id}`);
  };

  const handleParticipate = async (campaignId: number | string) => {
    try {
      setParticipatingCampaignId(campaignId);
      const result = await campaignsService.participate(campaignId);
      
      setReservationCode(result.reservationCode);
      setShowReservationModal(true);
      
      setAlertConfig({
        title: "Sucesso!",
        message: "Reserva criada com sucesso! Use o código para aproveitar a campanha.",
        type: "success",
      });
      setAlertModalOpen(true);
      
      // Recarregar campanhas para atualizar o código na tabela
      await loadCampaigns();
    } catch (err: any) {
      console.error("Erro ao participar da campanha:", err);
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao participar da campanha. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setParticipatingCampaignId(null);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campanhas Públicas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Explore campanhas públicas de todos os estabelecimentos
          </p>
          {/* Debug info - remover em produção */}
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-1 text-xs text-gray-400">
              Role: {userRole || 'N/A'} | É Cliente: {userIsClient ? 'Sim' : 'Não'} | Usuário: {user ? 'Logado' : 'Não logado'} | Campanhas: {campaigns.length}
            </p>
          )}
        </div>
        {isClient && (
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/client/points")}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Meus Pontos
            </button>
            <button
              onClick={() => router.push("/client/campaigns/participations")}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Minhas Participações
            </button>
          </div>
        )}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Inicial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Expiração
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
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
                        {translateCampaignType(campaign.typeLabel || campaign.type || "N/A")}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {campaign.validFrom || campaign.valid_from || campaign.start_date ? (
                          new Date(campaign.validFrom || campaign.valid_from || campaign.start_date).toLocaleDateString("pt-MZ", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })
                        ) : (
                          <span className="text-gray-400">Não definida</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {campaign.validUntil || campaign.valid_until || campaign.end_date ? (
                          <>
                            {new Date(campaign.validUntil || campaign.valid_until || campaign.end_date).toLocaleDateString("pt-MZ", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric"
                            })}
                            {new Date(campaign.validUntil || campaign.valid_until || campaign.end_date) < new Date() && (
                              <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Expirada
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">Sem expiração</span>
                        )}
                      </div>
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
                        {/* Botão Participar ou Código - apenas para clientes */}
                        {userIsClient && (() => {
                          // Verificar se a campanha permite participação
                          const campaignType = campaign.type || campaign.typeLabel || "";
                          const hasBookingFields = 
                            (campaign as any).booking_discount_type || 
                            (campaign as any).booking_discount_value;
                          const participableTypes = ['RewardType_Voucher'];
                          const allowsParticipation = participableTypes.includes(campaignType) || hasBookingFields;
                          
                          if (!allowsParticipation) {
                            return null;
                          }
                          
                          // LÓGICA SIMPLES: Se tem código, mostra código. Senão, mostra botão.
                          const userCode = campaign.userReservationCode || 
                                         campaign.user_reservation_code || 
                                         (campaign as any).user_reservation_code;
                          
                          if (userCode) {
                            // Já tem código - mostrar código
                            return (
                              <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5">
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-green-800">Seu código:</span>
                                  <code className="text-sm font-mono font-bold text-green-900 bg-green-100 px-2 py-0.5 rounded">
                                    {userCode}
                                  </code>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(userCode);
                                    setAlertConfig({
                                      title: "Copiado!",
                                      message: "Código copiado para a área de transferência",
                                      type: "success",
                                    });
                                    setAlertModalOpen(true);
                                  }}
                                  className="text-green-700 hover:text-green-900"
                                  title="Copiar código"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            );
                          }
                          
                          // Verificar se a campanha está dentro do prazo válido
                          const validFrom = campaign.validFrom || campaign.valid_from || campaign.start_date;
                          const validUntil = campaign.validUntil || campaign.valid_until || campaign.end_date;
                          const now = new Date();
                          const isExpired = validUntil && new Date(validUntil) < now;
                          const notStarted = validFrom && new Date(validFrom) > now;
                          const isActive = campaign.isActive !== false && campaign.is_active !== false;
                          const canParticipate = isActive && !isExpired && !notStarted;
                          
                          // Não tem código - mostrar botão para participar
                          return (
                            <button
                              onClick={() => {
                                const campaignId = campaign.campaign_id || campaign.id;
                                
                                if (!campaignId) {
                                  setAlertConfig({
                                    title: "Erro!",
                                    message: "ID da campanha inválido",
                                    type: "error",
                                  });
                                  setAlertModalOpen(true);
                                  return;
                                }
                                
                                if (!isActive) {
                                  setAlertConfig({
                                    title: "Atenção!",
                                    message: "Esta campanha não está ativa",
                                    type: "warning",
                                  });
                                  setAlertModalOpen(true);
                                  return;
                                }
                                
                                if (isExpired) {
                                  setAlertConfig({
                                    title: "Atenção!",
                                    message: "Esta campanha já expirou. Não é possível participar de campanhas expiradas.",
                                    type: "warning",
                                  });
                                  setAlertModalOpen(true);
                                  return;
                                }
                                
                                if (notStarted) {
                                  setAlertConfig({
                                    title: "Atenção!",
                                    message: "Esta campanha ainda não começou",
                                    type: "warning",
                                  });
                                  setAlertModalOpen(true);
                                  return;
                                }
                                
                                handleParticipate(campaignId);
                              }}
                              disabled={participatingCampaignId === (campaign.campaign_id || campaign.id) || !canParticipate}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                canParticipate
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-gray-400 text-white cursor-not-allowed"
                              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                              title={
                                isExpired 
                                  ? "Campanha expirada - não é possível participar"
                                  : notStarted
                                  ? "Campanha ainda não começou"
                                  : !isActive
                                  ? "Campanha inativa"
                                  : "Participar da campanha"
                              }
                            >
                              {participatingCampaignId === (campaign.campaign_id || campaign.id) ? (
                                <>
                                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Participando...
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Participar
                                </>
                              )}
                            </button>
                          );
                        })()}
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

      {/* Modal de Código de Reserva */}
      {showReservationModal && reservationCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Código de Reserva Gerado</h2>
              <button
                onClick={() => {
                  setShowReservationModal(false);
                  setReservationCode(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Seu código de reserva foi gerado com sucesso! Use este código no estabelecimento para aproveitar a campanha.
              </p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Código de Reserva</p>
                <p className="text-2xl font-bold text-blue-700 font-mono tracking-wider">
                  {reservationCode}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reservationCode);
                  setAlertConfig({
                    title: "Copiado!",
                    message: "Código copiado para a área de transferência",
                    type: "success",
                  });
                  setAlertModalOpen(true);
                }}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Copiar Código
              </button>
              <button
                onClick={() => {
                  setShowReservationModal(false);
                  setReservationCode(null);
                }}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicCampaignsPage() {
  return (
    <ProtectedRoute>
      <PublicCampaignsPageContent />
    </ProtectedRoute>
  );
}

