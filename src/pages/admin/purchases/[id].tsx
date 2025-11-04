import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { purchaseService, Purchase, PurchaseStatus } from "@/services/purchase.service";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { API_BASE_URL } from "@/services/api";

export default function PurchaseDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  
  // Estados para modais
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  // Função para processar URL da imagem do recibo
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

  useEffect(() => {
    if (id) {
      // Carregar dados de forma assíncrona após a primeira renderização completa
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => loadPurchase(Number(id)), { timeout: 100 });
      } else {
        setTimeout(() => loadPurchase(Number(id)), 50);
      }
    }
  }, [id]);

  const loadPurchase = async (purchaseId: number) => {
    try {
      setLoading(true);
      setError("");
      const data = await purchaseService.getById(purchaseId);
      setPurchase(data);
    } catch (err: any) {
      console.error("Erro ao carregar compra:", err);
      setError(err.message || "Erro ao carregar compra");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!purchase) return;

    try {
      setConfirmLoading(true);
      setConfirmModalOpen(false);
      
      const purchaseId = purchase.id || purchase.purchase_id;
      if (!purchaseId) {
        throw new Error("ID da compra não encontrado");
      }

      await purchaseService.confirm(purchaseId);
      await loadPurchase(purchaseId);
      
      // Mostrar modal de sucesso
      setAlertConfig({
        title: "Sucesso!",
        message: `A compra foi confirmada com sucesso. ${purchase.pointsEarned || purchase.points_earned || 0} pontos foram adicionados à carteira do cliente.`,
        type: "success",
      });
      setAlertModalOpen(true);
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

  const handleReject = async () => {
    if (!purchase) return;

    try {
      setRejectLoading(true);
      setRejectModalOpen(false);
      
      const purchaseId = purchase.id || purchase.purchase_id;
      if (!purchaseId) {
        throw new Error("ID da compra não encontrado");
      }

      await purchaseService.reject(purchaseId);
      await loadPurchase(purchaseId);
      
      // Mostrar modal de sucesso
      setAlertConfig({
        title: "Sucesso!",
        message: "A compra foi rejeitada.",
        type: "success",
      });
      setAlertModalOpen(true);
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

  const getStatusBadge = (status?: PurchaseStatus | string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">
            Pendente
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
            Confirmada
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
            Rejeitada
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Voltar
        </button>
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Voltar
        </button>
        <div className="py-12 text-center">
          <p className="text-gray-500">Compra não encontrada</p>
        </div>
      </div>
    );
  }

  const purchaseId = purchase.id || purchase.purchase_id || 0;
  const purchaseCode = purchase.purchaseCode || purchase.purchase_code || "-";
  const userName = purchase.user?.name || purchase.user?.username || "-";
  const userEmail = purchase.user?.email || "-";
  const userPhone = purchase.user?.phone || "-";
  const establishmentName = purchase.establishment?.name || purchase.establishmentName || purchase.establishment_name || "-";
  const establishmentType = purchase.establishment?.type || "-";
  const establishmentAddress = purchase.establishment?.address || "-";
  const establishmentPhone = purchase.establishment?.phone || "-";
  const purchaseAmount = purchase.purchaseAmount || purchase.purchase_amount || 0;
  const conversionRate = purchase.conversionRate || purchase.conversion_rate || 0;
  const bonusMultiplier = purchase.bonusMultiplier || purchase.bonus_multiplier || 1;
  const pointsEarned = purchase.pointsEarned || purchase.points_earned || 0;
  const status = purchase.status || "pending";
  const purchaseDate = purchase.purchaseDate || purchase.purchase_date || purchase.createdAt || purchase.created_at;
  const confirmedAt = purchase.confirmedAt || purchase.confirmed_at;
  const qrCode = purchase.qrCode || purchase.qr_code || "-";
  const notes = purchase.notes || "-";
  const receiptPhoto = purchase.receiptPhoto || purchase.receipt_photo;
  const receiptPhotoUrl = processReceiptUrl(receiptPhoto);

  return (
    <div className="relative p-6">
      {/* Loading Overlay */}
      {loading && !purchase && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando compra...</p>
          </div>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
        {status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmModalOpen(true)}
              disabled={confirmLoading || rejectLoading}
              className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {confirmLoading ? "A confirmar..." : "Confirmar Compra"}
            </button>
            <button
              onClick={() => setRejectModalOpen(true)}
              disabled={confirmLoading || rejectLoading}
              className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {rejectLoading ? "A rejeitar..." : "Rejeitar Compra"}
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-lg">
        {/* Header com linha fina */}
        <div className="border-b-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Compra #{purchaseCode}</h1>
                <p className="mt-1 text-sm text-gray-500">ID: {purchaseId}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(status)}
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Informações da Compra */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-500">Valor da Compra</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(purchaseAmount)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-500">Pontos Ganhos</h3>
              <p className="text-2xl font-bold text-blue-600">{pointsEarned} pontos</p>
            </div>
          </div>

          {/* Informações do Cliente */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Informações do Cliente</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-500">Nome</label>
                <p className="mt-1 text-sm text-gray-900">{userName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-sm text-gray-900">{userEmail}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Telefone</label>
                <p className="mt-1 text-sm text-gray-900">{userPhone}</p>
              </div>
            </div>
          </div>

          {/* Informações do Estabelecimento */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Informações do Estabelecimento</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-500">Nome</label>
                <p className="mt-1 text-sm text-gray-900">{establishmentName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Tipo</label>
                <p className="mt-1 text-sm text-gray-900">{establishmentType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Endereço</label>
                <p className="mt-1 text-sm text-gray-900">{establishmentAddress}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Telefone</label>
                <p className="mt-1 text-sm text-gray-900">{establishmentPhone}</p>
              </div>
            </div>
          </div>

          {/* Detalhes da Compra */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Detalhes da Compra</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-500">Código QR</label>
                <p className="mt-1 font-mono text-sm text-gray-900">{qrCode}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Data da Compra</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(purchaseDate)}</p>
              </div>
              {confirmedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Data de Confirmação</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(confirmedAt)}</p>
                </div>
              )}
              {purchase.confirmedBy && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Confirmado Por</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {purchase.confirmedBy.fullName || purchase.confirmedBy.username || "-"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cálculo de Pontos */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Cálculo de Pontos</h2>
            <div className="space-y-2 rounded-lg bg-blue-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor da Compra:</span>
                <span className="font-medium text-gray-900">{formatCurrency(purchaseAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxa de Conversão:</span>
                <span className="font-medium text-gray-900">{(conversionRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Multiplicador de Bônus:</span>
                <span className="font-medium text-gray-900">x{bonusMultiplier.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2">
                <span className="text-sm font-semibold text-gray-900">Pontos Ganhos:</span>
                <span className="text-lg font-bold text-blue-600">{pointsEarned} pontos</span>
              </div>
            </div>
          </div>

          {/* Campanha */}
          {purchase.campaign && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Campanha Ativa</h2>
              <div className="rounded-lg bg-purple-50 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Tipo</label>
                    <p className="mt-1 text-sm text-gray-900">{purchase.campaign.type || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Descrição</label>
                    <p className="mt-1 text-sm text-gray-900">{purchase.campaign.description || "-"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Taxa de Conversão da Campanha</label>
                    <p className="mt-1 text-sm text-gray-900">{((purchase.campaign.conversion_rate || 0) * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Multiplicador de Bônus</label>
                    <p className="mt-1 text-sm text-gray-900">x{(purchase.campaign.bonus_multiplier || 1).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recibo/Comprovativo */}
          <div className="border-t border-gray-200 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recibo/Comprovativo</h2>
              {receiptPhotoUrl && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recibo Disponível
                  </span>
                </div>
              )}
            </div>
            {receiptPhotoUrl ? (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="group relative mx-auto w-full max-w-2xl">
                  <img
                    src={receiptPhotoUrl}
                    alt="Recibo da compra"
                    className="h-auto w-full cursor-pointer rounded-lg border border-gray-200 shadow-lg transition-opacity hover:opacity-90"
                    onClick={() => setReceiptModalOpen(true)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/logo2.png";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-20">
                    <button
                      onClick={() => setReceiptModalOpen(true)}
                      className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-gray-900 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      Ampliar Recibo
                    </button>
                  </div>
                  <a
                    href={receiptPhotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2 top-2 flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Abrir em nova aba
                  </a>
                </div>
                <p className="mt-3 text-center text-sm text-gray-600">
                  Clique na imagem para ampliar e validar o recibo
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Recibo/Comprovativo não disponível
                    </p>
                    <p className="mt-1 text-xs text-yellow-600">
                      Esta compra não possui recibo anexado. Por favor, verifique com o cliente antes de confirmar.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notas */}
          {notes && notes !== "-" && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Notas</h2>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-700">{notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação - Confirmar Compra */}
      {purchase && confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
            onClick={() => !confirmLoading && setConfirmModalOpen(false)}
          ></div>

          {/* Modal panel */}
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
              {/* Header com gradiente */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white bg-opacity-20 p-2">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Confirmar Compra e Validar Pontos</h3>
                      <p className="mt-1 text-sm text-green-50">Confirme a compra para adicionar pontos ao cliente</p>
                    </div>
                  </div>
                  {!confirmLoading && (
                    <button
                      onClick={() => setConfirmModalOpen(false)}
                      className="text-white transition-colors hover:text-green-100"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto bg-white p-6">
                {/* Card de Pontos - Destaque */}
                <div className="mb-6 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pontos a serem creditados</p>
                      <p className="mt-2 text-4xl font-bold text-blue-600">
                        +{pointsEarned} <span className="text-xl text-gray-600">pontos</span>
                      </p>
                    </div>
                    <div className="rounded-full bg-blue-100 p-4">
                      <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Detalhes do cálculo */}
                  <div className="mt-4 rounded-lg border border-blue-100 bg-white p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-700">Cálculo de Pontos</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Valor da Compra:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(purchaseAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Taxa de Conversão:</span>
                        <span className="font-semibold text-gray-900">{(conversionRate * 100).toFixed(1)}%</span>
                      </div>
                      {bonusMultiplier > 1 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Multiplicador de Bônus:</span>
                          <span className="font-semibold text-green-600">x{bonusMultiplier.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
                        <span className="text-sm font-semibold text-gray-900">Total de Pontos:</span>
                        <span className="text-lg font-bold text-blue-600">{pointsEarned} pontos</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações da Compra */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Código da Compra</p>
                    <p className="font-mono text-sm font-semibold text-gray-900">{purchaseCode}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Valor</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(purchaseAmount)}</p>
                  </div>
                </div>

                {/* Cliente e Estabelecimento */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Cliente</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{userName}</p>
                    {userEmail && <p className="mt-1 text-xs text-gray-600">{userEmail}</p>}
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estabelecimento</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{establishmentName}</p>
                    {establishmentType && <p className="mt-1 text-xs text-gray-600">{establishmentType}</p>}
                  </div>
                </div>

                {/* Status do Recibo */}
                <div className={`mb-6 rounded-lg border-2 p-4 ${
                  receiptPhotoUrl 
                    ? "border-green-200 bg-green-50" 
                    : "border-yellow-200 bg-yellow-50"
                }`}>
                  <div className="flex items-center gap-3">
                    {receiptPhotoUrl ? (
                      <>
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-green-800">Recibo Validado</p>
                          <p className="mt-1 text-xs text-green-700">Recibo/comprovativo disponível e verificado</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-yellow-800">Recibo Não Disponível</p>
                          <p className="mt-1 text-xs text-yellow-700">Esta compra não possui recibo anexado. Confirme apenas se tiver verificado a compra por outros meios.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Aviso */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Ao confirmar esta compra:</p>
                      <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-blue-800">
                        <li>{pointsEarned} pontos serão adicionados à carteira do cliente</li>
                        <li>A compra mudará de status para "Confirmada"</li>
                        <li>O cliente poderá usar os pontos imediatamente</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer com botões - Always visible */}
              <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex flex-row justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmModalOpen(false)}
                    disabled={confirmLoading}
                    className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={confirmLoading}
                    style={{ 
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      minWidth: "200px",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "500",
                      cursor: confirmLoading ? "not-allowed" : "pointer",
                      opacity: confirmLoading ? 0.5 : 1
                    }}
                    className="inline-flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {confirmLoading ? (
                      <>
                        <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        A confirmar...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-white">Confirmar e Creditar Pontos</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
      )}

      {/* Modal de Confirmação - Rejeitar Compra */}
      {purchase && (
        <ConfirmModal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          onConfirm={handleReject}
          title="Rejeitar Compra"
          message={`Tem certeza que deseja rejeitar esta compra?\n\nCódigo: ${purchaseCode}\nCliente: ${userName}\nEstabelecimento: ${establishmentName}\nValor: ${formatCurrency(purchaseAmount)}\n\nEsta ação não pode ser desfeita.`}
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

      {/* Modal de Visualização do Recibo */}
      {receiptPhotoUrl && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity ${
            receiptModalOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setReceiptModalOpen(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">Recibo/Comprovativo - Validação</h3>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[calc(90vh-80px)] overflow-auto p-4">
              <img
                src={receiptPhotoUrl}
                alt="Recibo da compra - visualização ampliada"
                className="h-auto w-full rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/logo2.png";
                }}
              />
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-4">
              <div className="text-sm text-gray-600">
                <p>Código: {purchaseCode}</p>
                <p>Valor: {formatCurrency(purchaseAmount)}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={receiptPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Abrir em nova aba
                </a>
                <button
                  onClick={() => setReceiptModalOpen(false)}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

