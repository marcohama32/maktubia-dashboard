import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { customerService, Customer } from "@/services/customer.service";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant } from "@/utils/roleUtils";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const ITEMS_PER_PAGE = 10;

function CustomersPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  
  // Estados para modais
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  
  // Verificar se o usuário é admin ou merchant
  const userIsAdmin = useMemo(() => isAdmin(user), [user]);
  const userIsMerchant = useMemo(() => isMerchant(user), [user]);
  
  // Verificar se o cliente foi criado pelo merchant atual
  const canEditOrDelete = useCallback((customer: Customer): boolean => {
    if (userIsAdmin) return true; // Admin pode editar/apagar todos
    if (!userIsMerchant) return false; // Apenas merchants podem ter restrições
    if (!user?.id) return false; // Sem ID do usuário, não pode editar/apagar
    
    // Verificar se o cliente foi criado pelo merchant atual
    const createdById = customer.createdBy?.id;
    return createdById === user.id;
  }, [user, userIsAdmin, userIsMerchant]);

  useEffect(() => {
    // Carregar dados de forma assíncrona após a primeira renderização completa
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => loadCustomers(), { timeout: 100 });
    } else {
      setTimeout(() => loadCustomers(), 50);
    }
  }, [currentPage]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await customerService.getAll(currentPage, ITEMS_PER_PAGE);
      setCustomers(response.data);
      setPagination(response.pagination || null);
      setMetrics(response.metrics || null);
    } catch (err: any) {
      // Não logar erros de rede (já logado no interceptor do axios)
      // Verificar flag, código de erro ou mensagem que indica erro de rede
      const isNetworkError = err.isNetworkError || 
        err.message === "Network Error" || 
        err.code === "ERR_NETWORK" ||
        err.message?.includes("Servidor não disponível") ||
        err.message?.includes("backend está rodando");
      if (!isNetworkError) {
        console.error("Erro ao carregar clientes:", err);
      }
      const errorMessage = err.message || "Erro ao carregar clientes";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes baseado no termo de busca
  const filteredCustomers = useMemo(() => {
    let filtered = customers;
    
    // Se houver termo de busca, filtra localmente
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = customers.filter((customer) => {
        const fullName = customer.fullName || customer.name || "";
        const firstName = customer.firstName || "";
        const lastName = customer.lastName || "";
        const username = customer.username || "";
        const email = customer.email || "";
        const phone = customer.phone || "";
        const bi = customer.bi || "";
        const level = customer.level || "";
        
        return (
          fullName.toLowerCase().includes(term) ||
          firstName.toLowerCase().includes(term) ||
          lastName.toLowerCase().includes(term) ||
          email.toLowerCase().includes(term) ||
          phone.toLowerCase().includes(term) ||
          username.toLowerCase().includes(term) ||
          bi.toLowerCase().includes(term) ||
          level.toLowerCase().includes(term)
        );
      });
    }
    
    return filtered;
  }, [customers, searchTerm]);

  // Se há termo de busca, usa paginação local; caso contrário, usa paginação do backend
  const useLocalPagination = !!searchTerm.trim();
  const totalPages = useLocalPagination 
    ? Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE)
    : (pagination?.totalPages || 1);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCustomers = useLocalPagination 
    ? filteredCustomers.slice(startIndex, endIndex)
    : filteredCustomers;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    try {
      setDeleteLoading(true);
      setConfirmModalOpen(false);
      
      await customerService.delete(customerToDelete.id);
      await loadCustomers();
      
      // Mostrar modal de sucesso
      setAlertConfig({
        title: "Sucesso!",
        message: `O cliente "${customerToDelete.fullName || customerToDelete.name || customerToDelete.username || "sem nome"}" foi eliminado com sucesso.`,
        type: "success",
      });
      setAlertModalOpen(true);
      setCustomerToDelete(null);
    } catch (err: any) {
      // Mostrar modal de erro
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao eliminar cliente. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmModalOpen(false);
    setCustomerToDelete(null);
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/customers/${id}/edit`);
  };

  const handleView = (id: number) => {
    router.push(`/admin/customers/${id}`);
  };

  const handleCreate = () => {
    router.push("/admin/customers/new");
  };

  return (
    <div className="relative p-6">
      {/* Loading Overlay */}
      {loading && customers.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando clientes...</p>
          </div>
        </div>
      )}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          {metrics && (
            <p className="mt-1 text-sm text-gray-500">
              {userIsMerchant && !userIsAdmin ? (
                <>
                  Total: {metrics.total_customers || customers.length} | 
                  Você pode editar/apagar apenas os clientes criados por você
                </>
              ) : (
                <>
                  Total: {metrics.total_customers || customers.length} | 
                  Ativos: {metrics.active_customers || customers.filter(c => c.isActive !== false).length} | 
                  Inativos: {metrics.inactive_customers || customers.filter(c => c.isActive === false).length}
                </>
              )}
            </p>
          )}
        </div>
        {userIsAdmin && (
          <button
            onClick={handleCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + Novo Cliente
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Pesquisar clientes por nome, email, telefone, username, BI ou nível..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Renderizar conteúdo imediatamente - sempre mostrar estrutura */}
      {filteredCustomers.length > 0 ? (
        <>
          {/* Tabela de Clientes */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Username
                    </th>
                    {userIsAdmin && (
                      <>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Telefone
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          BI
                        </th>
                      </>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Pontos / Nível
                    </th>
                    {userIsAdmin && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedCustomers.map((customer) => {
                      const canModify = canEditOrDelete(customer);
                      return (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            #{customer.id}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 shrink-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                                  <span className="text-sm font-bold text-white">
                                    {(customer.fullName || customer.name || customer.username || "?").charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.fullName || customer.name || customer.username || "-"}
                                </div>
                                {(customer.firstName || customer.lastName) && (
                                  <div className="text-xs text-gray-500">
                                    {customer.firstName} {customer.lastName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {customer.username || "-"}
                          </td>
                          {userIsAdmin && (
                            <>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {customer.email || "-"}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {customer.phone || "-"}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {customer.bi || "-"}
                              </td>
                            </>
                          )}
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {customer.points !== undefined && (
                                <span className="text-sm font-semibold text-gray-900">
                                  {customer.points.toLocaleString("pt-MZ")} pts
                                </span>
                              )}
                              {customer.level && (
                                <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
                                  {customer.level}
                                </span>
                              )}
                              {customer.balance !== undefined && customer.balance > 0 && userIsAdmin && (
                                <span className="text-xs text-gray-500">
                                  Saldo: {customer.balance.toLocaleString("pt-MZ")} MZN
                                </span>
                              )}
                            </div>
                          </td>
                          {userIsAdmin && (
                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  customer.isActive !== false
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {customer.isActive !== false ? "Ativo" : "Inativo"}
                              </span>
                            </td>
                          )}
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(customer.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Ver detalhes"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              {canModify && (
                                <>
                                  <button
                                    onClick={() => handleEdit(customer.id)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Editar"
                                  >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(customer)}
                                    disabled={deleteLoading}
                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                    title="Eliminar"
                                  >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                              {!canModify && userIsMerchant && (
                                <span className="text-xs text-gray-400" title="Você só pode editar/apagar clientes criados por você">
                                  Sem permissão
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : filteredCustomers.length === 0 && !loading ? (
        <div className="rounded-lg bg-white py-12 text-center shadow">
          <p className="text-lg text-gray-500">
            {searchTerm ? "Nenhum cliente encontrado com essa pesquisa" : "Nenhum cliente encontrado"}
          </p>
        </div>
      ) : null}

      {/* Paginação */}
      {filteredCustomers.length > 0 && totalPages > 1 && (
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
                  return <span key={`ellipsis-${page}`} className="px-2">...</span>;
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
              ? `Mostrando ${pagination.page} de ${pagination.totalPages} páginas (${pagination.total} clientes)`
              : `Mostrando ${startIndex + 1} - ${Math.min(endIndex, filteredCustomers.length)} de ${filteredCustomers.length} clientes`
            }
          </div>
        </div>
      )}

      {/* Info de paginação quando há apenas uma página */}
      {filteredCustomers.length > 0 && totalPages === 1 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Mostrando {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Modal de Confirmação */}
      {customerToDelete && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Confirmar Eliminação"
          message={`Tem certeza que deseja eliminar o cliente "${customerToDelete.fullName || customerToDelete.name || customerToDelete.username || "sem nome"}"?\n\nID: #${customerToDelete.id}\nNome: ${customerToDelete.fullName || customerToDelete.name || customerToDelete.username || "-"}\nEmail: ${customerToDelete.email || "-"}\nUsername: ${customerToDelete.username || "-"}\nPontos: ${customerToDelete.points || 0}\nNível: ${customerToDelete.level || "-"}\n\nEsta ação não pode ser desfeita.`}
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

export default function CustomersPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "merchant"]} redirectTo="/">
      <CustomersPageContent />
    </ProtectedRoute>
  );
}

