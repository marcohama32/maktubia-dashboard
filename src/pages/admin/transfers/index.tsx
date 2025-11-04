import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { transferService, Transfer, TransferPointsDTO } from "@/services/transfer.service";
import { friendsService, Friend } from "@/services/friends.service";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { useAuth } from "@/contexts/AuthContext";

const ITEMS_PER_PAGE = 10;

export default function TransfersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "sent" | "received">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState<TransferPointsDTO>({
    to_user_id: 0,
    amount: 0,
    description: "",
  });
  
  // Estados para modais
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  useEffect(() => {
    // Carregar dados de forma assíncrona após a primeira renderização completa
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => {
        loadTransfers();
        loadFriends();
      }, { timeout: 100 });
    } else {
      setTimeout(() => {
        loadTransfers();
        loadFriends();
      }, 50);
    }
  }, [currentPage, typeFilter]);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await transferService.getAll({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        type: typeFilter,
      });
      setTransfers(response.data || []);
      setPagination(response.pagination || null);
    } catch (err: any) {
      console.error("Erro ao carregar transferências:", err);
      const errorMessage = err.message || "Erro ao carregar transferências";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await friendsService.getFriends();
      setFriends(response.data || []);
    } catch (err: any) {
      console.error("Erro ao carregar amigos:", err);
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.to_user_id || !transferForm.amount || transferForm.amount <= 0) {
      setAlertConfig({
        title: "Erro",
        message: "Por favor, selecione um amigo e informe um valor maior que zero",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    try {
      setTransferLoading(true);
      setConfirmModalOpen(false);
      
      await transferService.transferPoints(transferForm);
      
      setAlertConfig({
        title: "Sucesso!",
        message: `Transferência de ${transferForm.amount} pontos realizada com sucesso!`,
        type: "success",
      });
      setAlertModalOpen(true);
      setShowTransferModal(false);
      setTransferForm({ to_user_id: 0, amount: 0, description: "" });
      loadTransfers(); // Recarregar transferências
    } catch (err: any) {
      console.error("Erro ao transferir pontos:", err);
      setAlertConfig({
        title: "Erro",
        message: err.message || "Erro ao transferir pontos",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setTransferLoading(false);
    }
  };

  // Filtrar transferências por busca
  const filteredTransfers = useMemo(() => {
    let filtered = transfers;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((transfer) => {
        const fromName = transfer.from_user_name || "";
        const toName = transfer.to_user_name || "";
        const fromCode = transfer.from_user_code || "";
        const toCode = transfer.to_user_code || "";
        const description = transfer.description || "";
        
        return (
          fromName.toLowerCase().includes(term) ||
          toName.toLowerCase().includes(term) ||
          fromCode.toLowerCase().includes(term) ||
          toCode.toLowerCase().includes(term) ||
          description.toLowerCase().includes(term)
        );
      });
    }
    
    return filtered;
  }, [transfers, searchTerm]);

  // Paginação local para busca
  const useLocalPagination = !!searchTerm.trim();
  const totalPages = useLocalPagination 
    ? Math.ceil(filteredTransfers.length / ITEMS_PER_PAGE)
    : (pagination?.totalPages || 1);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTransfers = useLocalPagination 
    ? filteredTransfers.slice(startIndex, endIndex)
    : filteredTransfers;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

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

  return (
    <div className="relative p-6">
      {/* Loading Overlay */}
      {loading && transfers.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando transferências...</p>
          </div>
        </div>
      )}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transferências P2P</h1>
          <p className="mt-1 text-sm text-gray-600">
            Transfira pontos para seus Maktubia Friends
          </p>
        </div>
        <button
          onClick={() => {
            if (friends.length === 0) {
              setAlertConfig({
                title: "Atenção",
                message: "Você precisa ter amigos para transferir pontos. Adicione amigos primeiro!",
                type: "warning",
              });
              setAlertModalOpen(true);
              router.push("/admin/friends");
            } else {
              setShowTransferModal(true);
            }
          }}
          className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          + Transferir Pontos
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Pesquisar transferências por nome, código ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "all" | "sent" | "received")}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="all">Todas</option>
          <option value="sent">Enviadas</option>
          <option value="received">Recebidas</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Lista de Transferências */}
      {loading && transfers.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      ) : paginatedTransfers.length === 0 ? (
        <div className="rounded-lg bg-white py-12 text-center shadow">
          <p className="text-lg text-gray-500">
            {searchTerm || typeFilter !== "all" ? "Nenhuma transferência encontrada" : "Nenhuma transferência realizada ainda"}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      De / Para
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Descrição
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paginatedTransfers.map((transfer) => {
                    const transferId = transfer.transfer_id || "-";
                    const isSent = transfer.is_sent !== false;
                    const isReceived = transfer.is_received !== false;
                    const fromName = transfer.from_user_name || "-";
                    const toName = transfer.to_user_name || "-";
                    const fromCode = transfer.from_user_code || "-";
                    const toCode = transfer.to_user_code || "-";
                    const amount = transfer.amount || 0;
                    const description = transfer.description || "-";
                    const status = transfer.status || "completed";
                    const transferDate = transfer.created_at;

                    return (
                      <tr key={transferId} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-500">
                          {transferId.substring(0, 20)}...
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex flex-col">
                            {isSent ? (
                              <>
                                <span className="text-sm font-medium text-gray-900">Você</span>
                                <span className="text-xs text-gray-500">→ {toName}</span>
                                <span className="font-mono text-xs text-gray-400">{toCode}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-medium text-gray-900">{fromName}</span>
                                <span className="font-mono text-xs text-gray-400">{fromCode}</span>
                                <span className="text-xs text-gray-500">→ Você</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`text-sm font-semibold ${isSent ? "text-red-600" : "text-green-600"}`}>
                            {isSent ? "-" : "+"}{amount} pts
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {description !== "-" ? description : "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {status === "completed" ? (
                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                              Concluída
                            </span>
                          ) : status === "pending" ? (
                            <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                              Pendente
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                              {status}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(transferDate)}
                        </td>
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
                  ? `Mostrando ${pagination.page} de ${pagination.totalPages} páginas (${pagination.total} transferências)`
                  : `Mostrando ${startIndex + 1} - ${Math.min(endIndex, filteredTransfers.length)} de ${filteredTransfers.length} transferências`
                }
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Transferência */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
            onClick={() => {
              if (!transferLoading) {
                setShowTransferModal(false);
                setTransferForm({ to_user_id: 0, amount: 0, description: "" });
              }
            }}
          ></div>
          <div
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h3 className="mb-2 text-xl font-bold text-gray-900">Transferir Pontos</h3>
              <p className="text-sm text-gray-600">
                Transfira pontos para um dos seus Maktubia Friends
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="to_user_id" className="mb-2 block text-sm font-medium text-gray-700">
                  Amigo <span className="text-red-500">*</span>
                </label>
                <select
                  id="to_user_id"
                  value={transferForm.to_user_id}
                  onChange={(e) => setTransferForm({ ...transferForm, to_user_id: parseInt(e.target.value) })}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  disabled={transferLoading}
                >
                  <option value={0}>Selecione um amigo</option>
                  {friends.map((friend) => {
                    const friendId = friend.friend_id || friend.user_id || 0;
                    const friendName = friend.name || "Sem nome";
                    const friendCode = friend.user_code || "-";
                    return (
                      <option key={friendId} value={friendId}>
                        {friendName} ({friendCode})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="mb-2 block text-sm font-medium text-gray-700">
                  Pontos <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  min="1"
                  value={transferForm.amount || ""}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: parseInt(e.target.value) || 0 })}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Quantidade de pontos"
                  disabled={transferLoading}
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                  Descrição (opcional)
                </label>
                <textarea
                  id="description"
                  value={transferForm.description || ""}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Motivo da transferência..."
                  disabled={transferLoading}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferForm({ to_user_id: 0, amount: 0, description: "" });
                }}
                disabled={transferLoading}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!transferForm.to_user_id || !transferForm.amount || transferForm.amount <= 0) {
                    setAlertConfig({
                      title: "Erro",
                      message: "Por favor, preencha todos os campos obrigatórios",
                      type: "error",
                    });
                    setAlertModalOpen(true);
                  } else {
                    setConfirmModalOpen(true);
                  }
                }}
                disabled={transferLoading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Transferir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {transferForm.to_user_id > 0 && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handleTransfer}
          title="Confirmar Transferência"
          message={`Tem certeza que deseja transferir ${transferForm.amount} pontos para ${friends.find(f => (f.friend_id || f.user_id) === transferForm.to_user_id)?.name || "este amigo"}?\n\n${transferForm.description ? `Descrição: ${transferForm.description}\n\n` : ""}Esta ação não pode ser desfeita.`}
          confirmText="Sim, Transferir"
          cancelText="Cancelar"
          type="warning"
          isLoading={transferLoading}
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

