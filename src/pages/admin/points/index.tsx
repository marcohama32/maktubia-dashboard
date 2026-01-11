import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { pointsService, PointsPurchase, PointsSale, PointsAssignment, ListPointsPurchasesParams, ListPointsSalesParams, ListAssignmentsParams } from "@/services/points.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant, isUser } from "@/utils/roleUtils";

const ITEMS_PER_PAGE = 10;

export default function PointsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userIsAdmin = isAdmin(user);
  const userIsMerchant = isMerchant(user);
  const userIsUser = isUser(user);
  
  // Clientes só podem ver "purchases", admin e merchant podem ver todos
  const [activeTab, setActiveTab] = useState<"purchases" | "sales" | "assignments">("purchases");
  const [purchases, setPurchases] = useState<PointsPurchase[]>([]);
  const [sales, setSales] = useState<PointsSale[]>([]);
  const [assignments, setAssignments] = useState<PointsAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  
  // Se for cliente, garantir que só veja "purchases"
  useEffect(() => {
    if (userIsUser && activeTab !== "purchases") {
      setActiveTab("purchases");
    }
  }, [userIsUser, activeTab]);

  useEffect(() => {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => loadData(), { timeout: 100 });
    } else {
      setTimeout(() => loadData(), 50);
    }
  }, [currentPage, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      
      if (activeTab === "purchases") {
        const params: ListPointsPurchasesParams = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        };
        try {
          const response = await pointsService.listPurchases(params);
          setPurchases(response.data || []);
          setPagination(response.pagination);
        } catch (err: any) {
          // Se houver erro (500, 404, etc.), definir array vazio e não mostrar erro técnico
          setPurchases([]);
          setPagination(null);
          // Apenas logar erro no console para debug (não mostrar para usuário)
          const is500 = err?.response?.status === 500;
          const is404 = err?.response?.status === 404;
          if (!is500 && !is404) {
            // Só logar se não for erro comum do backend
            console.error("Erro ao carregar purchases:", err);
          }
        }
      } else if (activeTab === "sales") {
        // Apenas admin e merchant podem ver sales
        if (userIsAdmin || userIsMerchant) {
          const params: ListPointsSalesParams = {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
          };
          try {
            const response = await pointsService.listSales(params);
            setSales(response.data || []);
            setPagination(response.pagination);
          } catch (err: any) {
            // Se o endpoint não existir, apenas definir array vazio
            if (err?.response?.status === 404) {
              setSales([]);
              setPagination(null);
            } else {
              throw err;
            }
          }
        }
      } else if (activeTab === "assignments") {
        // Apenas admin e merchant podem ver assignments
        if (userIsAdmin || userIsMerchant) {
          const params: ListAssignmentsParams = {
            page: currentPage,
            limit: ITEMS_PER_PAGE,
          };
          try {
            const response = await pointsService.listAssignments(params);
            setAssignments(response.data || []);
            setPagination(response.pagination);
          } catch (err: any) {
            // Se o endpoint não existir, apenas definir array vazio
            if (err?.response?.status === 404) {
              setAssignments([]);
              setPagination(null);
            } else {
              throw err;
            }
          }
        }
      }
    } catch (err: any) {
      console.error(`Erro ao carregar ${activeTab}:`, err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      const is404 = err?.response?.status === 404;
      const is500 = err?.response?.status === 500;
      
      // Não mostrar erro para o usuário - apenas definir arrays vazios
      // A página mostrará mensagem amigável de "nenhum dado disponível"
      if (activeTab === "purchases") {
        setPurchases([]);
      } else if (activeTab === "sales") {
        setSales([]);
      } else if (activeTab === "assignments") {
        setAssignments([]);
      }
      setPagination(null);
      
      // Apenas logar erro no console para debug (não mostrar para usuário)
      if (!isNetworkError && !is404 && !is500) {
        console.error(`Erro ao carregar ${activeTab}:`, err);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderTable = () => {
    if (activeTab === "purchases") {
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor (MT)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pontos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchases.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Nenhuma compra encontrada</td></tr>
            ) : (
              purchases.map((purchase) => (
                <tr key={purchase.purchase_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{purchase.purchase_id}</td>
                  <td className="px-6 py-4 text-sm">{purchase.amount_mt?.toFixed(2) || "0.00"} MT</td>
                  <td className="px-6 py-4 text-sm font-medium">{purchase.points_amount || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      purchase.status === "confirmed" ? "bg-green-100 text-green-800" :
                      purchase.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {purchase.status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {purchase.created_at ? new Date(purchase.created_at).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    } else if (activeTab === "sales") {
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pontos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor (MT)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Nenhuma venda encontrada</td></tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.sale_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{sale.sale_id}</td>
                  <td className="px-6 py-4 text-sm font-medium">{sale.points_amount || 0}</td>
                  <td className="px-6 py-4 text-sm">{sale.amount_mt?.toFixed(2) || "0.00"} MT</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sale.status === "confirmed" ? "bg-green-100 text-green-800" :
                      sale.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {sale.status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    } else {
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atribuído Para</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pontos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razão</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assignments.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Nenhuma atribuição encontrada</td></tr>
            ) : (
              assignments.map((assignment) => (
                <tr key={assignment.assignment_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{assignment.assignment_id}</td>
                  <td className="px-6 py-4 text-sm">
                    {assignment.assigned_user?.fullName || `ID: ${assignment.assigned_to}`}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{assignment.points_amount || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{assignment.reason || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="relative p-6">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-gray-600">Carregando...</div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Pontos</h1>
      </div>

      {/* Abas - Apenas admin e merchant veem abas, Clientes veem tabela diretamente */}
      {(userIsAdmin || userIsMerchant) && (
        <div className="mb-4 flex gap-4 border-b">
          <button
            onClick={() => { setActiveTab("purchases"); setCurrentPage(1); }}
            className={`px-4 py-2 ${activeTab === "purchases" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Compras
          </button>
          <button
            onClick={() => { setActiveTab("sales"); setCurrentPage(1); }}
            className={`px-4 py-2 ${activeTab === "sales" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Vendas
          </button>
          <button
            onClick={() => { setActiveTab("assignments"); setCurrentPage(1); }}
            className={`px-4 py-2 ${activeTab === "assignments" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Atribuições
          </button>
        </div>
      )}

      {/* Não mostrar erros técnicos - apenas mostrar mensagem de "nenhum dado" na tabela */}

      {/* Tabela de Pontos */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          {renderTable()}
        </div>
      </div>

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
            Mostrando {pagination.page} de {pagination.totalPages} páginas ({pagination.total} registros)
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

