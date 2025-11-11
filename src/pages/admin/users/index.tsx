import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { userService, User } from "@/services/user.service";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const ITEMS_PER_PAGE = 10;

function UsersPageContent() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  
  // Estados para modais
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  useEffect(() => {
    // Carregar dados de forma assíncrona após a primeira renderização completa
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => loadUsers(), { timeout: 100 });
    } else {
      setTimeout(() => loadUsers(), 50);
    }
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await userService.getAll(currentPage, ITEMS_PER_PAGE);
      setUsers(response.data);
      setPagination(response.pagination || null);
    } catch (err: any) {
      // Não logar erros de rede (já logado no interceptor do axios)
      // Verificar flag, código de erro ou mensagem que indica erro de rede
      const isNetworkError = err.isNetworkError || 
        err.message === "Network Error" || 
        err.code === "ERR_NETWORK" ||
        err.message?.includes("Servidor não disponível") ||
        err.message?.includes("backend está rodando");
      if (!isNetworkError) {
        console.error("Erro ao carregar usuários:", err);
      }
      const errorMessage = err.message || "Erro ao carregar usuários";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }
    
    const term = searchTerm.toLowerCase();
    return users.filter((user) => {
      const fullName = user.fullName || user.name || "";
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      const username = user.username || "";
      const email = user.email || "";
      const phone = user.phone || "";
      const bi = user.bi || "";
      const roleName = typeof user.role === "string" ? user.role : user.role?.name || "";
      const roleDesc = typeof user.role === "object" ? user.role?.description || "" : "";
      const level = user.level || "";
      
      return (
        fullName.toLowerCase().includes(term) ||
        firstName.toLowerCase().includes(term) ||
        lastName.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        phone.toLowerCase().includes(term) ||
        username.toLowerCase().includes(term) ||
        bi.toLowerCase().includes(term) ||
        roleName.toLowerCase().includes(term) ||
        roleDesc.toLowerCase().includes(term) ||
        level.toLowerCase().includes(term)
      );
    });
  }, [users, searchTerm]);

  // Se há termo de busca, usa paginação local; caso contrário, usa paginação do backend
  const useLocalPagination = !!searchTerm.trim();
  const totalPages = useLocalPagination 
    ? Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
    : (pagination?.totalPages || 1);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = useLocalPagination 
    ? filteredUsers.slice(startIndex, endIndex)
    : filteredUsers;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);
      setConfirmModalOpen(false);
      
      await userService.delete(userToDelete.id);
      await loadUsers();
      
      // Mostrar modal de sucesso
      setAlertConfig({
        title: "Sucesso!",
        message: `O usuário "${userToDelete.fullName || userToDelete.name || userToDelete.username || "sem nome"}" foi eliminado com sucesso.`,
        type: "success",
      });
      setAlertModalOpen(true);
      setUserToDelete(null);
    } catch (err: any) {
      // Mostrar modal de erro
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao eliminar usuário. Por favor, tente novamente.",
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

  // Função auxiliar para obter o valor de role como string
  const getRoleString = (role: string | { name?: string; description?: string; [key: string]: any } | undefined): string => {
    if (!role) return "-";
    if (typeof role === "string") return role;
    return role.name || role.description || String(role);
  };

  return (
    <div className="relative p-6">
      {/* Loading Overlay */}
      {loading && users.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando usuários...</p>
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

      <div className="mb-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Pesquisar usuários por nome, email, telefone, username, BI ou função..."
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
      {filteredUsers.length > 0 ? (
        <>
          {/* Tabela de Usuários */}
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Telefone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      BI
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Função
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        #{user.id}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                              <span className="text-sm font-bold text-white">
                                {(user.fullName || user.name || user.username || "?").charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName || user.name || user.username || "-"}
                            </div>
                            {(user.firstName || user.lastName) && (
                              <div className="text-xs text-gray-500">
                                {user.firstName} {user.lastName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {user.username || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {user.email || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {user.phone || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {user.bi || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {user.role ? (
                          <div className="flex flex-col">
                            <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                              {getRoleString(user.role)}
                            </span>
                            {typeof user.role === "object" && user.role.description && (
                              <span className="mt-1 text-xs text-gray-500">{user.role.description}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              user.isActive !== false
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isActive !== false ? "Ativo" : "Inativo"}
                          </span>
                          {user.level && (
                            <span className="text-xs text-gray-500">{user.level}</span>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Paginação - só mostrar se houver dados */}
      {filteredUsers.length > 0 && totalPages > 1 && (
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
              ? `Mostrando ${pagination.page} de ${pagination.totalPages} páginas (${pagination.total} usuários)`
              : `Mostrando ${startIndex + 1} - ${Math.min(endIndex, filteredUsers.length)} de ${filteredUsers.length} usuários`
            }
          </div>
        </div>
      )}

      {/* Info de paginação quando há apenas uma página */}
      {filteredUsers.length > 0 && totalPages === 1 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Mostrando {filteredUsers.length} usuário{filteredUsers.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Mensagem quando não há dados */}
      {filteredUsers.length === 0 && !loading ? (
        <div className="rounded-lg bg-white py-12 text-center shadow">
          <p className="text-lg text-gray-500">
            {searchTerm ? "Nenhum usuário encontrado com essa pesquisa" : "Nenhum usuário encontrado"}
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
          message={`Tem certeza que deseja eliminar o usuário "${userToDelete.fullName || userToDelete.name || userToDelete.username || "sem nome"}"?\n\nID: #${userToDelete.id}\nNome: ${userToDelete.fullName || userToDelete.name || userToDelete.username || "-"}\nEmail: ${userToDelete.email || "-"}\nUsername: ${userToDelete.username || "-"}\nFunção: ${typeof userToDelete.role === "string" ? userToDelete.role : userToDelete.role?.name || "-"}\n\nEsta ação não pode ser desfeita.`}
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
    <ProtectedRoute requireAdmin={true} redirectTo="/">
      <UsersPageContent />
    </ProtectedRoute>
  );
}
