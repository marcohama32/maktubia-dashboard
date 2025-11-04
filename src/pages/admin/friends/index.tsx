import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { friendsService, Friend, FriendRequest } from "@/services/friends.service";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { useAuth } from "@/contexts/AuthContext";

export default function FriendsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para modais
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");

  useEffect(() => {
    // Carregar dados de forma assíncrona após a primeira renderização completa
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => {
        loadFriends();
        loadRequests();
      }, { timeout: 100 });
    } else {
      setTimeout(() => {
        loadFriends();
        loadRequests();
      }, 50);
    }
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      setError("");
      // Buscar TODOS os relacionamentos de amizade entre clientes (para gestão)
      const response = await friendsService.getAllFriendships();
      setFriends(response.data || []);
    } catch (err: any) {
      console.error("Erro ao carregar relacionamentos de amizade:", err);
      
      // Verificar se é erro de conexão
      if (err.message?.includes("Network Error") || err.message?.includes("ERR_CONNECTION_REFUSED")) {
        setError("Servidor não está disponível. Por favor, verifique se o backend está rodando na porta 8000.");
      } else {
        const errorMessage = err.message || "Erro ao carregar relacionamentos de amizade";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      // Buscar TODOS os pedidos pendentes (para gestão)
      const response = await friendsService.getRequests();
      setRequests(response.data || []);
    } catch (err: any) {
      console.error("Erro ao carregar pedidos de amizade:", err);
      // Não mostrar erro para pedidos, apenas para relacionamentos
      // O erro já será mostrado em loadFriends se for problema de conexão
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await friendsService.acceptRequest(requestId);
      setAlertConfig({
        title: "Sucesso!",
        message: "Pedido de amizade aceito!",
        type: "success",
      });
      setAlertModalOpen(true);
      loadFriends(); // Recarregar relacionamentos
      loadRequests(); // Recarregar pedidos
    } catch (err: any) {
      console.error("Erro ao aceitar pedido:", err);
      setAlertConfig({
        title: "Erro",
        message: err.message || "Erro ao aceitar pedido de amizade",
        type: "error",
      });
      setAlertModalOpen(true);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await friendsService.rejectRequest(requestId);
      setAlertConfig({
        title: "Sucesso!",
        message: "Pedido de amizade rejeitado",
        type: "success",
      });
      setAlertModalOpen(true);
      loadRequests(); // Recarregar pedidos
    } catch (err: any) {
      console.error("Erro ao rejeitar pedido:", err);
      setAlertConfig({
        title: "Erro",
        message: err.message || "Erro ao rejeitar pedido de amizade",
        type: "error",
      });
      setAlertModalOpen(true);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendToRemove) return;

    try {
      // Usar friendship_id se disponível, senão usar friend_id ou user_id
      const friendshipId = friendToRemove.friendship_id || friendToRemove.friend_id || friendToRemove.user_id || 0;
      await friendsService.removeFriend(friendshipId);
      setConfirmModalOpen(false);
      setFriendToRemove(null);
      setAlertConfig({
        title: "Sucesso!",
        message: "Amizade removida com sucesso",
        type: "success",
      });
      setAlertModalOpen(true);
      loadFriends(); // Recarregar relacionamentos
    } catch (err: any) {
      console.error("Erro ao remover amizade:", err);
      setConfirmModalOpen(false);
      setAlertConfig({
        title: "Erro",
        message: err.message || "Erro ao remover amizade",
        type: "error",
      });
      setAlertModalOpen(true);
      setFriendToRemove(null);
    }
  };

  // Filtrar relacionamentos por busca
  // Verificar se o usuário é admin
  const isAdmin = useMemo(() => {
    if (!user) {
      return false;
    }
    
    // Função auxiliar para normalizar role
    const normalizeRole = (roleValue: any): string => {
      if (!roleValue) return "";
      
      // Se é string, retorna diretamente
      if (typeof roleValue === "string") {
        return roleValue.toLowerCase().trim();
      }
      
      // Se é objeto, extrai o name
      if (typeof roleValue === "object" && roleValue !== null) {
        const name = roleValue.name || roleValue.role_name || roleValue.role || "";
        return String(name).toLowerCase().trim();
      }
      
      return String(roleValue).toLowerCase().trim();
    };
    
    // Verificar role (pode estar em diferentes campos)
    const roleName = normalizeRole(user.role) || 
                    normalizeRole(user.role_name) || 
                    normalizeRole(user.user_role) ||
                    normalizeRole((user as any).role?.name);
    
    // Verificar se é admin (suporta diferentes variações)
    const adminVariations = ["admin", "administrator", "administrador", "adm"];
    const isAdminResult = adminVariations.includes(roleName);
    
    return isAdminResult;
  }, [user]);

  const filteredFriends = useMemo(() => {
    if (!searchTerm.trim()) {
      return friends;
    }
    
    const term = searchTerm.toLowerCase();
    return friends.filter((friendship) => {
      // Buscar em ambos os clientes do relacionamento
      const name1 = friendship.user1_name || friendship.name || "";
      const name2 = friendship.user2_name || "";
      const code1 = friendship.user1_code || friendship.user_code || "";
      const code2 = friendship.user2_code || "";
      const phone = friendship.phone || "";
      const email = friendship.email || "";
      
      return (
        name1.toLowerCase().includes(term) ||
        name2.toLowerCase().includes(term) ||
        code1.toLowerCase().includes(term) ||
        code2.toLowerCase().includes(term) ||
        phone.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term)
      );
    });
  }, [friends, searchTerm]);


  return (
    <div className="relative p-6">
      {/* Loading Overlay */}
      {loading && friends.length === 0 && requests.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando amigos...</p>
          </div>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Maktubia Friends</h1>
        <p className="mt-1 text-sm text-gray-600">
          Visualize e gerencie relacionamentos de amizade entre clientes do sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("friends")}
            className={`border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "friends"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Relacionamentos ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`relative border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "requests"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Pedidos Pendentes ({requests.length})
            {requests.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-1 text-xs font-bold leading-none text-white">
                {requests.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="mb-1 font-semibold text-red-800">Erro de Conexão</h3>
              <p className="text-sm text-red-700">{error}</p>
              {error.includes("Servidor não está disponível") && (
                <div className="mt-3 rounded bg-red-100 p-2 text-xs text-red-600">
                  <p className="mb-1 font-semibold">Para resolver:</p>
                  <ol className="list-inside list-decimal space-y-1">
                    <li>Certifique-se de que o backend está rodando</li>
                    <li>Verifique se o servidor está acessível em http://72.60.20.31:8000</li>
                    <li>Verifique as configurações de CORS no backend</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Friends */}
      {activeTab === "friends" && (
        <>
          {/* Busca de Relacionamentos */}
          <div className="mb-6">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Pesquisar relacionamentos por nome, código, telefone ou email dos clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lista de Amigos */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : error && error.includes("Servidor não está disponível") ? (
            <div className="rounded-lg border border-red-200 bg-white py-12 text-center shadow">
              <svg className="mx-auto mb-4 h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="mb-2 text-lg font-semibold text-gray-700">Servidor Indisponível</p>
              <p className="text-sm text-gray-600">
                Não foi possível conectar ao servidor. Verifique se o backend está rodando.
              </p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="rounded-lg bg-white py-12 text-center shadow">
              <p className="text-lg text-gray-500">
                {searchTerm ? "Nenhum relacionamento encontrado com essa pesquisa" : "Nenhum relacionamento de amizade entre clientes encontrado."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFriends.map((friendship) => {
                const friendshipId = friendship.friendship_id || friendship.user_id || friendship.friend_id || 0;
                
                // Obter informações de ambos os clientes
                // Se temos user1_name/user2_name, usar; senão, assumir que o "friend" é o outro cliente
                // e o usuário logado é o primeiro
                const currentUserName = user?.name || user?.fullName || "Usuário Logado";
                const currentUserCode = (user as any)?.user_code || "-";
                
                const client1Name = friendship.user1_name || currentUserName;
                const client1Code = friendship.user1_code || currentUserCode;
                const client2Name = friendship.user2_name || friendship.name || "Cliente 2";
                const client2Code = friendship.user2_code || friendship.user_code || "-";
                
                const avatar1Initial = client1Name.charAt(0).toUpperCase();
                const avatar2Initial = client2Name.charAt(0).toUpperCase();

                return (
                  <div
                    key={friendshipId}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow transition-shadow hover:shadow-lg"
                  >
                    {/* Header com ambos os clientes */}
                    <div className="mb-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex flex-1 items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                            {avatar1Initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">{client1Name}</p>
                            <p className="truncate font-mono text-xs text-gray-500">{client1Code}</p>
                          </div>
                        </div>
                        
                        <div className="mx-2 text-gray-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                        
                        <div className="flex flex-1 items-center gap-2">
                          <div className="min-w-0 flex-1 text-right">
                            <p className="truncate text-sm font-semibold text-gray-900">{client2Name}</p>
                            <p className="truncate font-mono text-xs text-gray-500">{client2Code}</p>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                            {avatar2Initial}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Informações do relacionamento */}
                    <div className="mb-4 space-y-2 border-t border-gray-200 pt-3 text-xs text-gray-600">
                      {friendship.friendship_date && (
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Desde {new Date(friendship.friendship_date).toLocaleDateString("pt-MZ")}</span>
                        </div>
                      )}
                      {friendship.last_interaction_at && (
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Última interação: {new Date(friendship.last_interaction_at).toLocaleDateString("pt-MZ")}</span>
                        </div>
                      )}
                    </div>

                    {isAdmin ? (
                      <button
                        onClick={() => {
                          setFriendToRemove(friendship);
                          setConfirmModalOpen(true);
                        }}
                        className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
                        title="Remover amizade entre estes clientes (apenas administradores)"
                      >
                        Remover Amizade
                      </button>
                    ) : (
                      <div className="w-full cursor-not-allowed rounded-lg bg-gray-200 px-4 py-2 text-center text-sm text-gray-600">
                        Apenas administradores podem remover amizades
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: Requests */}
      {activeTab === "requests" && (
        <>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-lg bg-white py-12 text-center shadow">
              <p className="text-lg text-gray-500">
                Nenhum pedido de amizade pendente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const requestId = request.request_id || 0;
                const fromUserName = request.from_user_name || "Sem nome";
                const fromUserCode = request.from_user_code || "-";
                const fromUserPhone = request.from_user_phone || "-";
                const fromUserEmail = request.from_user_email || "-";
                const avatarInitial = fromUserName.charAt(0).toUpperCase();

                return (
                  <div
                    key={requestId}
                    className="rounded-lg border border-gray-200 bg-white p-6 shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500 text-xl font-bold text-white">
                          {avatarInitial}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{fromUserName}</p>
                          <p className="font-mono text-sm text-gray-500">{fromUserCode}</p>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            {fromUserPhone !== "-" && <p>📱 {fromUserPhone}</p>}
                            {fromUserEmail !== "-" && <p>✉️ {fromUserEmail}</p>}
                          </div>
                          {request.message && (
                            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                              <p className="text-sm italic text-gray-700">"{request.message}"</p>
                            </div>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            Enviado em {request.created_at ? new Date(request.created_at).toLocaleDateString("pt-MZ", { 
                              day: "numeric", 
                              month: "long", 
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            }) : "-"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(requestId)}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                          title="Aceitar pedido de amizade entre estes clientes"
                        >
                          Aceitar
                        </button>
                        <button
                          onClick={() => handleRejectRequest(requestId)}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                          title="Rejeitar pedido de amizade entre estes clientes"
                        >
                          Rejeitar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}


      {/* Modal de Confirmação - Remover Amizade */}
      {friendToRemove && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false);
            setFriendToRemove(null);
          }}
          onConfirm={handleRemoveFriend}
          title="Remover Amizade"
          message={`Tem certeza que deseja remover a amizade entre estes clientes?\n\n${friendToRemove.user1_name || "Cliente 1"} (${friendToRemove.user1_code || "-"}) ↔ ${friendToRemove.user2_name || "Cliente 2"} (${friendToRemove.user2_code || "-"})\n\nEsta ação não pode ser desfeita.`}
          confirmText="Sim, Remover"
          cancelText="Cancelar"
          type="danger"
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

