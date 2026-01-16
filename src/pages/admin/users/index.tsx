import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { userService, User } from "@/services/user.service";
import { customerService, Customer } from "@/services/customer.service";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { isAdmin as checkIsAdmin, isMerchant as checkIsMerchant, getUserRole } from "@/utils/roleUtils";

const ITEMS_PER_PAGE = 10;

type UserTab = "admin" | "merchants" | "clientes";

function UsersPageContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UserTab>("admin");
  
  // Estados para Admin e Merchants (employees)
  const [employees, setEmployees] = useState<User[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  // Estados para Clientes
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // Estados compartilhados
  const [error, setError] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  
  // Estados para modais
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | Customer | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  // Carregar dados baseado na aba ativa
  useEffect(() => {
    if (activeTab === "admin" || activeTab === "merchants") {
      loadEmployees();
    } else if (activeTab === "clientes") {
      loadCustomers();
    }
  }, [activeTab, currentPage]);

  // Resetar página quando trocar de aba
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
  }, [activeTab]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      setError("");
      const response = await userService.getAll(currentPage, ITEMS_PER_PAGE);
      setEmployees(response.data || []);
      setPagination(response.pagination || null);
    } catch (err: any) {
      const isNetworkError = err.isNetworkError || 
        err.message === "Network Error" || 
        err.code === "ERR_NETWORK" ||
        err.message?.includes("Servidor não disponível") ||
        err.message?.includes("backend está rodando");
      if (!isNetworkError) {
        console.error("Erro ao carregar funcionários:", err);
      }
      const errorMessage = err.message || "Erro ao carregar funcionários";
      setError(errorMessage);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      setError("");
      const response = await customerService.getAll(currentPage, ITEMS_PER_PAGE);
      setCustomers(response.data || []);
      setPagination(response.pagination || null);
    } catch (err: any) {
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
      setLoadingCustomers(false);
    }
  };

  // Filtrar dados baseado na aba ativa e termo de busca
  const filteredData = useMemo(() => {
    let data: (User | Customer)[] = [];
    
    if (activeTab === "admin") {
      data = employees.filter(user => {
        const roleName = getUserRole(user);
        return roleName === "admin" || roleName === "administrator" || roleName === "administrador";
      });
    } else if (activeTab === "merchants") {
      data = employees.filter(user => {
        const roleName = getUserRole(user);
        return roleName === "merchant" || roleName === "merchante" || roleName === "comerciante";
      });
    } else if (activeTab === "clientes") {
      data = customers;
    }
    
    if (!searchTerm.trim()) {
      return data;
    }
    
    const term = searchTerm.toLowerCase();
    return data.filter((item) => {
      const fullName = (item as any).fullName || (item as any).name || "";
      const firstName = (item as any).firstName || "";
      const lastName = (item as any).lastName || "";
      const username = (item as any).username || "";
      const email = (item as any).email || "";
      const phone = (item as any).phone || "";
      const bi = (item as any).bi || "";
      const roleName = typeof (item as any).role === "string" ? (item as any).role : (item as any).role?.name || "";
      
      return (
        fullName.toLowerCase().includes(term) ||
        firstName.toLowerCase().includes(term) ||
        lastName.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        phone.toLowerCase().includes(term) ||
        username.toLowerCase().includes(term) ||
        bi.toLowerCase().includes(term) ||
        roleName.toLowerCase().includes(term)
      );
    });
  }, [activeTab, employees, customers, searchTerm]);

  // Paginação
  const useLocalPagination = !!searchTerm.trim();
  const totalPages = useLocalPagination 
    ? Math.ceil(filteredData.length / ITEMS_PER_PAGE)
    : (pagination?.totalPages || 1);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = useLocalPagination 
    ? filteredData.slice(startIndex, endIndex)
    : filteredData;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDeleteClick = (user: User | Customer) => {
    setUserToDelete(user);
    setConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);
      setConfirmModalOpen(false);
      
      // Usar o serviço correto baseado na aba ativa
      if (activeTab === "clientes") {
        await customerService.delete(userToDelete.id);
      } else {
        await userService.delete(userToDelete.id);
      }
      
      // Recarregar dados da aba ativa
      if (activeTab === "admin" || activeTab === "merchants") {
        await loadEmployees();
      } else {
        await loadCustomers();
      }
      
      setAlertConfig({
        title: "Sucesso!",
        message: `O ${activeTab === "clientes" ? "cliente" : "usuário"} "${(userToDelete as any).fullName || (userToDelete as any).name || (userToDelete as any).username || "sem nome"}" foi eliminado com sucesso.`,
        type: "success",
      });
      setAlertModalOpen(true);
      setUserToDelete(null);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao eliminar. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmModalOpen(false);
    setUserToDelete(null);
  };

  const handleEdit = (id: number) => {
    router.push(`/admin/users/${id}/edit`);
  };

  const handleView = (id: number) => {
    router.push(`/admin/users/${id}`);
  };

  const handleCreate = () => {
    router.push("/admin/users/new");
  };

  const getRoleString = (role: string | { name?: string; description?: string; [key: string]: any } | undefined): string => {
    if (!role) return "-";
    if (typeof role === "string") return role;
    return role.name || role.description || String(role);
  };

  const loading = activeTab === "clientes" ? loadingCustomers : loadingEmployees;
  const data = activeTab === "clientes" ? customers : employees;

  return (
    <div className="relative p-6">
      {/* Loading Overlay */}
      {loading && data.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando {activeTab === "clientes" ? "clientes" : "usuários"}...</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <button
          onClick={handleCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + Novo Usuário
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("admin")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "admin"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Admin
            {activeTab === "admin" && filteredData.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                {filteredData.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("merchants")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "merchants"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Merchants
            {activeTab === "merchants" && filteredData.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                {filteredData.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("clientes")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "clientes"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Clientes
            {activeTab === "clientes" && filteredData.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                {filteredData.length}
              </span>
            )}
          </button>
        </nav>
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
            placeholder={`Pesquisar ${activeTab === "clientes" ? "clientes" : "usuários"} por nome, email, telefone, username, BI...`}
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

      {/* Tabela */}
      {filteredData.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Código
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Username
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Telefone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      BI
                    </th>
                    {activeTab !== "clientes" && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Função
                      </th>
                    )}
                    {activeTab === "clientes" && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Pontos
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedData.map((item) => {
                    const user = item as User | Customer;
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {(user as any).user_code || (user as any).userCode || (user as any).code || `#${user.id}`}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 shrink-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                                <span className="text-sm font-bold text-white">
                                  {((user as any).fullName || (user as any).name || (user as any).username || "?").charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {(user as any).fullName || (user as any).name || (user as any).username || "-"}
                              </div>
                              {((user as any).firstName || (user as any).lastName) && (
                                <div className="text-xs text-gray-500">
                                  {(user as any).firstName} {(user as any).lastName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {(user as any).username || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {(user as any).email || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {(user as any).phone || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {(user as any).bi || "-"}
                        </td>
                        {activeTab !== "clientes" && (
                          <td className="whitespace-nowrap px-6 py-4">
                            {(user as any).role ? (
                              <div className="flex flex-col">
                                <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                                  {getRoleString((user as any).role)}
                                </span>
                                {typeof (user as any).role === "object" && (user as any).role.description && (
                                  <span className="mt-1 text-xs text-gray-500">{(user as any).role.description}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                        )}
                        {activeTab === "clientes" && (
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {(user as any).points || (user as any).balance || 0}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                (user as any).isActive !== false
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {(user as any).isActive !== false ? "Ativo" : "Inativo"}
                            </span>
                            {(user as any).level && (
                              <span className="text-xs text-gray-500">{(user as any).level}</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(user.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Ver detalhes"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Paginação */}
      {filteredData.length > 0 && totalPages > 1 && (
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
              ? `Mostrando ${pagination.page} de ${pagination.totalPages} páginas (${pagination.total} ${activeTab === "clientes" ? "clientes" : "usuários"})`
              : `Mostrando ${startIndex + 1} - ${Math.min(endIndex, filteredData.length)} de ${filteredData.length} ${activeTab === "clientes" ? "clientes" : "usuários"}`
            }
          </div>
        </div>
      )}

      {/* Info de paginação quando há apenas uma página */}
      {filteredData.length > 0 && totalPages === 1 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Mostrando {filteredData.length} {activeTab === "clientes" ? "cliente" : "usuário"}{filteredData.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Mensagem quando não há dados */}
      {filteredData.length === 0 && !loading ? (
        <div className="rounded-lg bg-white py-12 text-center shadow">
          <p className="text-lg text-gray-500">
            {searchTerm ? `Nenhum ${activeTab === "clientes" ? "cliente" : "usuário"} encontrado com essa pesquisa` : `Nenhum ${activeTab === "clientes" ? "cliente" : "usuário"} encontrado`}
          </p>
        </div>
      ) : null}

      {/* Modal de Confirmação */}
      {userToDelete && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Confirmar Eliminação"
          message={`Tem certeza que deseja eliminar o ${activeTab === "clientes" ? "cliente" : "usuário"} "${(userToDelete as any).fullName || (userToDelete as any).name || (userToDelete as any).username || "sem nome"}"?\n\nID: #${userToDelete.id}\nNome: ${(userToDelete as any).fullName || (userToDelete as any).name || (userToDelete as any).username || "-"}\nEmail: ${(userToDelete as any).email || "-"}\nUsername: ${(userToDelete as any).username || "-"}\n${activeTab !== "clientes" ? `Função: ${typeof (userToDelete as any).role === "string" ? (userToDelete as any).role : (userToDelete as any).role?.name || "-"}\n` : ""}\nEsta ação não pode ser desfeita.`}
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

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "merchant"]} redirectTo="/">
      <UsersPageContent />
    </ProtectedRoute>
  );
}
