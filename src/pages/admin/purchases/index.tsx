import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { isUser, isAdmin, isMerchant } from "@/utils/roleUtils";
import { purchaseService, Purchase, PurchaseStatus } from "@/services/purchase.service";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { API_BASE_URL } from "@/services/api";

const ITEMS_PER_PAGE = 10;

export default function PurchasesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userIsClient = user ? isUser(user) && !isAdmin(user) && !isMerchant(user) : false;
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | "">("");
  const [receiptFilter, setReceiptFilter] = useState<"all" | "with" | "without">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  
  // Estados para modais
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [purchaseToAction, setPurchaseToAction] = useState<Purchase | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  useEffect(() => {
    // Carregar dados de forma assíncrona após a primeira renderização completa
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => loadPurchases(), { timeout: 100 });
    } else {
      setTimeout(() => loadPurchases(), 50);
    }
  }, [currentPage, statusFilter]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setError("");
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }
      // Para clientes, o backend deve filtrar automaticamente por user_id
      // Não precisamos passar user_id explicitamente, o backend usa o token
      const response = await purchaseService.getAll(params);
      setPurchases(response.data || []);
      setPagination(response.pagination || null);
      setMetrics(response.metrics || null);
    } catch (err: any) {
      console.error("Erro ao carregar compras:", err);
      const errorMessage = err.message || "Erro ao carregar compras";
      setError(errorMessage);
      
      // Se for erro 500, pode ser problema no backend
      if (err?.response?.status === 500) {
        setError("Erro no servidor ao carregar compras. Por favor, tente novamente mais tarde ou contacte o suporte.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrar localmente se houver termo de busca ou filtro de recibo
  const filteredPurchases = useMemo(() => {
    let filtered = purchases;
    
    // Filtro por recibo
    if (receiptFilter === "with") {
      filtered = filtered.filter(p => !!(p.receiptPhoto || p.receipt_photo));
    } else if (receiptFilter === "without") {
      filtered = filtered.filter(p => !(p.receiptPhoto || p.receipt_photo));
    }
    
    // Filtro por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((purchase) => {
        const purchaseCode = purchase.purchaseCode || purchase.purchase_code || "";
        const userName = purchase.user?.name || purchase.user?.username || "";
        const userEmail = purchase.user?.email || "";
        const establishmentName = purchase.establishment?.name || purchase.establishmentName || purchase.establishment_name || "";
        
        return (
          purchaseCode.toLowerCase().includes(term) ||
          userName.toLowerCase().includes(term) ||
          userEmail.toLowerCase().includes(term) ||
          establishmentName.toLowerCase().includes(term)
        );
      });
    }
    
    return filtered;
  }, [purchases, searchTerm, receiptFilter]);

  // Se há termo de busca, usa paginação local; caso contrário, usa paginação do backend
  const useLocalPagination = !!searchTerm.trim();
  const totalPages = useLocalPagination 
    ? Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE)
    : (pagination?.totalPages || 1);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPurchases = useLocalPagination 
    ? filteredPurchases.slice(startIndex, endIndex)
    : filteredPurchases;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, receiptFilter]);

  const handleConfirmClick = (purchase: Purchase) => {
    setPurchaseToAction(purchase);
    setConfirmModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!purchaseToAction) return;

    try {
      setConfirmLoading(true);
      setConfirmModalOpen(false);
      
      const purchaseId = purchaseToAction.id || purchaseToAction.purchase_id;
      if (!purchaseId) {
        throw new Error("ID da compra não encontrado");
      }

      await purchaseService.confirm(purchaseId);
      await loadPurchases();
      
      // Mostrar modal de sucesso
      setAlertConfig({
        title: "Sucesso!",
        message: `A compra "${purchaseToAction.purchaseCode || purchaseToAction.purchase_code || "sem código"}" foi confirmada com sucesso.`,
        type: "success",
      });
      setAlertModalOpen(true);
      setPurchaseToAction(null);
    } catch (err: any) {
      // Mostrar modal de erro
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao confirmar compra. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleRejectClick = (purchase: Purchase) => {
    setPurchaseToAction(purchase);
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!purchaseToAction) return;

    try {
      setRejectLoading(true);
      setRejectModalOpen(false);
      
      const purchaseId = purchaseToAction.id || purchaseToAction.purchase_id;
      if (!purchaseId) {
        throw new Error("ID da compra não encontrado");
      }

      await purchaseService.reject(purchaseId);
      await loadPurchases();
      
      // Mostrar modal de sucesso
      setAlertConfig({
        title: "Sucesso!",
        message: `A compra "${purchaseToAction.purchaseCode || purchaseToAction.purchase_code || "sem código"}" foi rejeitada.`,
        type: "success",
      });
      setAlertModalOpen(true);
      setPurchaseToAction(null);
    } catch (err: any) {
      // Mostrar modal de erro
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao rejeitar compra. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleCancel = () => {
    setConfirmModalOpen(false);
    setRejectModalOpen(false);
    setPurchaseToAction(null);
  };

  const handleView = (id: number) => {
    router.push(`/admin/purchases/${id}`);
  };

  const getStatusBadge = (status?: PurchaseStatus | string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
            Pendente
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
            Confirmada
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
            Rejeitada
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
            {status || "-"}
          </span>
        );
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "-";
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-MZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const processReceiptUrl = (rawImageUrl: string | null | undefined): string | null => {
    if (!rawImageUrl) {
      return null;
    }
    
    if (rawImageUrl.startsWith("http://") || rawImageUrl.startsWith("https://")) {
      return rawImageUrl;
    }
    
    if (rawImageUrl.startsWith("/")) {
      if (rawImageUrl.startsWith("/api")) {
        return `http://72.60.20.31:8000${rawImageUrl}`;
      }
      return `${API_BASE_URL}${rawImageUrl}`;
    }
    
    return `${API_BASE_URL}/${rawImageUrl}`;
  };

  return (
    <div className="relative p-6">
      {/* Loading Overlay */}
      {loading && purchases.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando compras...</p>
          </div>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
        {metrics && (
          <div className="mt-4 space-y-4">
            {/* Cards de Status - Primeira Linha */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Métricas de Compras */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Total de Compras</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.purchases?.total || 0}</p>
            </div>

            {/* Card - Confirmadas */}
            <div 
              onClick={() => {
                setStatusFilter(statusFilter === "confirmed" ? "" : "confirmed");
                setCurrentPage(1);
              }}
              className={`cursor-pointer rounded-lg border-2 bg-white p-4 shadow transition-all hover:shadow-lg ${
                statusFilter === "confirmed" 
                  ? "border-green-500 bg-green-50" 
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Confirmadas</p>
                {statusFilter === "confirmed" && (
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <p className={`text-2xl font-bold ${statusFilter === "confirmed" ? "text-green-600" : "text-gray-900"}`}>
                {metrics.purchases?.confirmed || 0}
              </p>
              <p className="mt-1 text-xs text-gray-500">Clique para filtrar</p>
            </div>

            {/* Card - Pendentes */}
            <div 
              onClick={() => {
                setStatusFilter(statusFilter === "pending" ? "" : "pending");
                setCurrentPage(1);
              }}
              className={`cursor-pointer rounded-lg border-2 bg-white p-4 shadow transition-all hover:shadow-lg ${
                statusFilter === "pending" 
                  ? "border-yellow-500 bg-yellow-50" 
                  : "border-gray-200 hover:border-yellow-300"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pendentes</p>
                {statusFilter === "pending" && (
                  <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <p className={`text-2xl font-bold ${statusFilter === "pending" ? "text-yellow-600" : "text-gray-900"}`}>
                {metrics.purchases?.pending || 0}
              </p>
              <p className="mt-1 text-xs text-gray-500">Clique para filtrar</p>
            </div>

            {/* Card - Rejeitadas */}
            <div 
              onClick={() => {
                setStatusFilter(statusFilter === "rejected" ? "" : "rejected");
                setCurrentPage(1);
              }}
              className={`cursor-pointer rounded-lg border-2 bg-white p-4 shadow transition-all hover:shadow-lg ${
                statusFilter === "rejected" 
                  ? "border-red-500 bg-red-50" 
                  : "border-gray-200 hover:border-red-300"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rejeitadas</p>
                {statusFilter === "rejected" && (
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <p className={`text-2xl font-bold ${statusFilter === "rejected" ? "text-red-600" : "text-gray-900"}`}>
                {metrics.purchases?.rejected || 0}
              </p>
              <p className="mt-1 text-xs text-gray-500">Clique para filtrar</p>
            </div>

            </div>

            {/* Outras Métricas - Segunda Linha (apenas para admin/merchant) */}
            {!userIsClient && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Métricas de Receita */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Receita Total</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.revenue?.total || 0)}</p>
                  <div className="mt-2 text-xs text-gray-600">
                    Confirmada: {formatCurrency(metrics.revenue?.confirmed || 0)}
                  </div>
                  {metrics.revenue?.avgPurchaseAmount && (
                    <div className="mt-1 text-xs text-gray-500">
                      Média: {formatCurrency(metrics.revenue.avgPurchaseAmount)}
                    </div>
                  )}
                </div>

                {/* Métricas de Pontos */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Pontos Distribuídos</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.points?.totalGiven || 0} pts</p>
                  <div className="mt-2 text-xs text-gray-600">
                    Confirmados: {metrics.points?.totalConfirmed || 0} pts
                  </div>
                  {metrics.points?.avgPointsPerPurchase && (
                    <div className="mt-1 text-xs text-gray-500">
                      Média por compra: {Math.round(metrics.points.avgPointsPerPurchase)} pts
                    </div>
                  )}
                </div>

                {/* Métricas de Clientes e Estabelecimentos */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Participantes</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Clientes únicos:</span>
                      <span className="font-semibold text-gray-900">{metrics.customers?.unique || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Estabelecimentos:</span>
                      <span className="font-semibold text-gray-900">{metrics.establishments?.unique || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Métricas Adicionais de Receita (se disponíveis) */}
                {metrics.revenue && (metrics.revenue.maxPurchaseAmount || metrics.revenue.minPurchaseAmount) && (
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Valores</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Maior compra:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(metrics.revenue.maxPurchaseAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Menor compra:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(metrics.revenue.minPurchaseAmount || 0)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={userIsClient ? "Pesquisar por código de compra ou estabelecimento..." : "Pesquisar por código de compra, cliente ou estabelecimento..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PurchaseStatus | "")}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Todos os Status</option>
          <option value="pending">Pendente</option>
          <option value="confirmed">Confirmada</option>
          <option value="rejected">Rejeitada</option>
        </select>

        <select
          value={receiptFilter}
          onChange={(e) => setReceiptFilter(e.target.value as "all" | "with" | "without")}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="all">Todos os Recibos</option>
          <option value="with">Com Recibo</option>
          <option value="without">Sem Recibo</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading && purchases.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      ) : paginatedPurchases.length === 0 ? (
        <div className="rounded-lg bg-white py-12 text-center shadow">
          <p className="text-lg text-gray-500">
            {searchTerm || statusFilter || receiptFilter !== "all" ? "Nenhuma compra encontrada com esses filtros" : "Nenhuma compra encontrada"}
          </p>
        </div>
      ) : (
        <>
          {/* Tabela de Compras */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Código
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Cliente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Estabelecimento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Pontos
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Recibo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Data
                    </th>
                    {!userIsClient && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedPurchases.map((purchase) => {
                    const purchaseId = purchase.id || purchase.purchase_id || 0;
                    const purchaseCode = purchase.purchaseCode || purchase.purchase_code || "-";
                    const userName = purchase.user?.name || purchase.user?.username || "-";
                    const establishmentName = purchase.establishment?.name || purchase.establishmentName || purchase.establishment_name || "-";
                    const purchaseAmount = purchase.purchaseAmount || purchase.purchase_amount || 0;
                    const pointsEarned = purchase.pointsEarned || purchase.points_earned || 0;
                    const status = purchase.status || "pending";
                    const purchaseDate = purchase.purchaseDate || purchase.purchase_date || purchase.createdAt || purchase.created_at;
                    const receiptPhoto = purchase.receiptPhoto || purchase.receipt_photo;
                    const hasReceipt = !!receiptPhoto;

                    return (
                      <tr key={purchaseId} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {purchaseCode}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {userName}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {establishmentName}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(purchaseAmount)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            {pointsEarned} pts
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {getStatusBadge(status)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          {hasReceipt ? (
                            <span className="inline-flex items-center justify-center" title="Recibo disponível">
                              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center text-gray-400" title="Sem recibo">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(purchaseDate)}
                        </td>
                        {!userIsClient && (
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(purchaseId)}
                                className="text-green-600 hover:text-green-900"
                                title="Ver detalhes"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              {status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleConfirmClick(purchase)}
                                    disabled={confirmLoading || rejectLoading}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                    title="Confirmar compra"
                                  >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleRejectClick(purchase)}
                                    disabled={confirmLoading || rejectLoading}
                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                    title="Rejeitar compra"
                                  >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                        {userIsClient && (
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                            <button
                              onClick={() => handleView(purchaseId)}
                              className="text-green-600 hover:text-green-900"
                              title="Ver detalhes"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
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
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>

              <div className="text-sm text-gray-500">
                {pagination 
                  ? `Mostrando ${pagination.page} de ${pagination.totalPages} páginas (${pagination.total} compras)`
                  : `Mostrando ${startIndex + 1} - ${Math.min(endIndex, filteredPurchases.length)} de ${filteredPurchases.length} compras`
                }
              </div>
            </div>
          )}

          {totalPages === 1 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Mostrando {filteredPurchases.length} compra{filteredPurchases.length !== 1 ? "s" : ""}
            </div>
          )}
        </>
      )}

      {/* Modal de Confirmação - Confirmar Compra */}
      {purchaseToAction && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={handleCancel}
          onConfirm={handleConfirm}
          title="Confirmar Compra"
          message={`Tem certeza que deseja confirmar esta compra?\n\nCódigo: ${purchaseToAction.purchaseCode || purchaseToAction.purchase_code || "N/A"}\nCliente: ${purchaseToAction.user?.name || purchaseToAction.user?.username || "N/A"}\nEstabelecimento: ${purchaseToAction.establishment?.name || purchaseToAction.establishmentName || "N/A"}\nValor: ${formatCurrency(purchaseToAction.purchaseAmount || purchaseToAction.purchase_amount)}\nPontos a receber: ${purchaseToAction.pointsEarned || purchaseToAction.points_earned || 0} pontos\n\nAo confirmar, os pontos serão adicionados à carteira do cliente.`}
          confirmText="Sim, Confirmar"
          cancelText="Cancelar"
          type="success"
          isLoading={confirmLoading}
        />
      )}

      {/* Modal de Confirmação - Rejeitar Compra */}
      {purchaseToAction && (
        <ConfirmModal
          isOpen={rejectModalOpen}
          onClose={handleCancel}
          onConfirm={handleReject}
          title="Rejeitar Compra"
          message={`Tem certeza que deseja rejeitar esta compra?\n\nCódigo: ${purchaseToAction.purchaseCode || purchaseToAction.purchase_code || "N/A"}\nCliente: ${purchaseToAction.user?.name || purchaseToAction.user?.username || "N/A"}\nEstabelecimento: ${purchaseToAction.establishment?.name || purchaseToAction.establishmentName || "N/A"}\nValor: ${formatCurrency(purchaseToAction.purchaseAmount || purchaseToAction.purchase_amount)}\n\nEsta ação não pode ser desfeita.`}
          confirmText="Sim, Rejeitar"
          cancelText="Cancelar"
          type="danger"
          isLoading={rejectLoading}
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

