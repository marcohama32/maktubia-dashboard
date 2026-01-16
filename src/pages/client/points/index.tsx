import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/user.service";
import { pointsService, PointsLedger } from "@/services/points.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getUserRole } from "@/utils/roleUtils";

interface PointsData {
  points: number;
  level: string;
  balance: number;
  pointsToNextLevel?: number;
}

interface PointsSummary {
  origin_type: string;
  total_points: number;
  count: number;
  first_occurrence?: string;
  last_occurrence?: string;
}

// Função para traduzir tipos de origem de pontos
const translateOriginType = (type: string | undefined | null): string => {
  if (!type) return "Não definido";
  
  const typeMap: { [key: string]: string } = {
    'purchase': 'Compra',
    'purchase_earned': 'Pontos de Compra',
    'campaign_bonus': 'Bônus de Campanha',
    'assignment': 'Atribuição',
    'transfer': 'Transferência',
    'redemption': 'Resgate',
    'sale': 'Venda de Pontos',
  };
  
  return typeMap[type] || type;
};

// Função para obter cor do nível
const getLevelColor = (level: string): string => {
  const levelMap: { [key: string]: string } = {
    'bronze': 'bg-amber-100 text-amber-800 border-amber-300',
    'silver': 'bg-gray-100 text-gray-800 border-gray-300',
    'gold': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'platinum': 'bg-blue-100 text-blue-800 border-blue-300',
    'diamond': 'bg-purple-100 text-purple-800 border-purple-300',
  };
  return levelMap[level?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
};

// Função para traduzir nome do nível
const translateLevel = (level: string): string => {
  const levelMap: { [key: string]: string } = {
    'bronze': 'Bronze',
    'silver': 'Prata',
    'gold': 'Ouro',
    'platinum': 'Platina',
    'diamond': 'Diamante',
  };
  return levelMap[level?.toLowerCase()] || level;
};

function PointsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [ledger, setLedger] = useState<PointsLedger[]>([]);
  const [summary, setSummary] = useState<PointsSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOrigin, setFilterOrigin] = useState<string>("");
  
  // Estados para modais
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  // Verificar se é cliente
  const userRole = getUserRole(user);
  const isClient = userRole === 'user' || userRole === 'cliente';

  useEffect(() => {
    if (!isClient) {
      router.push("/");
      return;
    }
    
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => {
        loadPointsData();
        loadLedger();
        loadSummary();
      }, { timeout: 100 });
    } else {
      setTimeout(() => {
        loadPointsData();
        loadLedger();
        loadSummary();
      }, 50);
    }
  }, [isClient, router, currentPage, filterOrigin]);

  const loadPointsData = async () => {
    try {
      if (!user?.id) return;
      
      const userData = await userService.getById(user.id);
      setPointsData({
        points: userData.points || userData.wallet?.points || 0,
        level: userData.level || 'bronze',
        balance: userData.balance || userData.wallet?.balance || 0,
        pointsToNextLevel: userData.pointsToNextLevel || 0,
      });
    } catch (err: any) {
      console.error("Erro ao carregar dados de pontos:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar dados de pontos");
      }
    }
  };

  const loadLedger = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params: any = {
        page: currentPage,
        limit: 20,
      };
      
      if (filterOrigin) {
        params.origin_type = filterOrigin;
      }
      
      const response = await pointsService.getPointsLedger(params);
      setLedger(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error("Erro ao carregar histórico de pontos:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar histórico de pontos");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      if (!user?.id) return;
      
      const summaryData = await pointsService.getPointsSummaryByOrigin(user.id);
      setSummary(summaryData || []);
    } catch (err: any) {
      console.error("Erro ao carregar resumo de pontos:", err);
      // Não mostrar erro aqui, é opcional
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("pt-BR");
    } catch {
      return dateString;
    }
  };

  const formatPoints = (points: number | null | undefined): string => {
    if (points === null || points === undefined) return "0";
    return new Intl.NumberFormat("pt-BR").format(points);
  };

  const getPointsColor = (points: number): string => {
    if (points > 0) return "text-green-600";
    if (points < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="relative p-6">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-gray-600">Carregando...</div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Pontos</h1>
            <p className="mt-1 text-sm text-gray-500">
              Visualize seu saldo, nível e histórico de pontos
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Cards de Resumo */}
      {pointsData && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Saldo de Pontos */}
          <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Saldo de Pontos</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">
                  {formatPoints(pointsData.points)}
                </p>
              </div>
              <div className="rounded-full bg-blue-200 p-3">
                <svg className="h-8 w-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Nível */}
          <div className={`rounded-lg border-2 p-6 shadow ${getLevelColor(pointsData.level)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Nível Atual</p>
                <p className="mt-2 text-3xl font-bold">
                  {translateLevel(pointsData.level)}
                </p>
                {pointsData.pointsToNextLevel !== undefined && pointsData.pointsToNextLevel > 0 && (
                  <p className="mt-1 text-xs">
                    {formatPoints(pointsData.pointsToNextLevel)} pontos para próximo nível
                  </p>
                )}
              </div>
              <div className="rounded-full bg-white bg-opacity-50 p-3">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Saldo em MT */}
          <div className="rounded-lg border-2 border-green-300 bg-green-50 p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Saldo em MT</p>
                <p className="mt-2 text-3xl font-bold text-green-900">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "MZN" }).format(pointsData.balance)}
                </p>
              </div>
              <div className="rounded-full bg-green-200 p-3">
                <svg className="h-8 w-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo por Origem */}
      {summary.length > 0 && (
        <div className="mb-6 rounded-lg border-2 border-gray-300 bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Resumo por Origem</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summary.map((item, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700">
                  {translateOriginType(item.origin_type)}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatPoints(item.total_points)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.count} {item.count === 1 ? 'transação' : 'transações'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros e Histórico */}
      <div className="rounded-lg border-2 border-gray-300 bg-white p-6 shadow">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Histórico de Pontos</h2>
          <div className="flex gap-2">
            <select
              value={filterOrigin}
              onChange={(e) => {
                setFilterOrigin(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Todas as origens</option>
              <option value="purchase">Compra</option>
              <option value="purchase_earned">Pontos de Compra</option>
              <option value="campaign_bonus">Bônus de Campanha</option>
              <option value="assignment">Atribuição</option>
              <option value="transfer">Transferência</option>
              <option value="redemption">Resgate</option>
              <option value="sale">Venda de Pontos</option>
            </select>
          </div>
        </div>

        {/* Tabela de Histórico */}
        {ledger.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma transação encontrada</h3>
            <p className="mt-2 text-sm text-gray-500">
              Você ainda não possui transações de pontos registradas.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                      Origem
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700">
                      Pontos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700">
                      ID de Origem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {ledger.map((entry) => (
                    <tr key={entry.ledger_id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          {translateOriginType(entry.origin_type)}
                        </span>
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold ${getPointsColor(entry.points || 0)}`}>
                        {entry.points && entry.points > 0 ? '+' : ''}{formatPoints(entry.points)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {entry.origin_id || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>

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

export default function PointsPage() {
  return (
    <ProtectedRoute requireClient={true} redirectTo="/admin/campaigns">
      <PointsPageContent />
    </ProtectedRoute>
  );
}



