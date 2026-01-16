import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { autoCampaignsService, campaignPurchasesService } from "@/services/campaigns.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getUserRole } from "@/utils/roleUtils";
import { AutoCampaign } from "@/services/campaigns.service";

function AutoCampaignsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<AutoCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  
  // Estados para modal de submissão
  const [selectedCampaign, setSelectedCampaign] = useState<AutoCampaign | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Estados para alertas
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  
  // Estados para minhas compras
  const [myPurchases, setMyPurchases] = useState<any[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [showPurchases, setShowPurchases] = useState(false);

  // Verificar se é cliente
  const userRole = getUserRole(user);
  const isClient = userRole === 'user' || userRole === 'cliente';

  useEffect(() => {
    if (!isClient) {
      router.push("/");
      return;
    }
    
    loadCampaigns();
    loadMyPurchases();
  }, [isClient, router]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await autoCampaignsService.getAll({ page: 1, limit: 100 });
      setCampaigns(response.data || []);
    } catch (err: any) {
      console.error("Erro ao carregar campanhas automáticas:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar campanhas automáticas");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMyPurchases = async () => {
    try {
      setLoadingPurchases(true);
      
      // Buscar todas as compras pendentes do cliente
      const response = await campaignPurchasesService.getMyPurchases(undefined, {
        page: 1,
        limit: 50,
        status: 'pending'
      });
      
      // O backend retorna { success: true, data: [...], pagination: {...} }
      const purchases = response?.data || response || [];
      setMyPurchases(Array.isArray(purchases) ? purchases : []);
    } catch (err: any) {
      console.error("Erro ao carregar minhas compras:", err);
      setMyPurchases([]);
      // Não mostrar erro, apenas não carregar compras
    } finally {
      setLoadingPurchases(false);
    }
  };

  const handleOpenSubmitModal = (campaign: AutoCampaign) => {
    setSelectedCampaign(campaign);
    setPurchaseAmount("");
    setNotes("");
    setReceiptPhoto(null);
    setReceiptPreview(null);
    setShowSubmitModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPurchase = async () => {
    if (!selectedCampaign) return;

    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, informe um valor de compra válido.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    const minAmount = selectedCampaign.min_purchase_amount || 0;
    if (parseFloat(purchaseAmount) < minAmount) {
      setAlertConfig({
        title: "Erro!",
        message: `O valor da compra deve ser pelo menos ${minAmount.toLocaleString("pt-MZ")} MT (valor mínimo da campanha).`,
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      
      await campaignPurchasesService.submitPurchase(selectedCampaign.campaign_id || selectedCampaign.id || "", {
        purchase_amount: parseFloat(purchaseAmount),
        notes: notes || undefined,
        receipt_photo: receiptPhoto || undefined,
      });

      setAlertConfig({
        title: "Sucesso!",
        message: "Compra submetida com sucesso! Aguarde a validação do merchant para receber seus pontos.",
        type: "success",
      });
      setAlertModalOpen(true);
      
      setShowSubmitModal(false);
      setSelectedCampaign(null);
      setPurchaseAmount("");
      setNotes("");
      setReceiptPhoto(null);
      setReceiptPreview(null);
      
      // Recarregar campanhas e compras
      loadCampaigns();
      loadMyPurchases();
    } catch (err: any) {
      console.error("Erro ao submeter compra:", err);
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao submeter compra. Tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch {
      return dateString;
    }
  };

  const isCampaignActive = (campaign: AutoCampaign) => {
    if (!campaign.is_active) return false;
    const now = new Date();
    const validFrom = campaign.valid_from ? new Date(campaign.valid_from) : null;
    const validUntil = campaign.valid_until ? new Date(campaign.valid_until) : null;
    
    if (validFrom && now < validFrom) return false;
    if (validUntil && now > validUntil) return false;
    
    return true;
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
            <h1 className="text-2xl font-bold text-gray-900">Ofertas Automáticas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Envie suas compras para validação e ganhe pontos
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowPurchases(!showPurchases);
            if (!showPurchases) {
              loadMyPurchases();
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {showPurchases ? "Ocultar" : "Ver"} Minhas Compras {myPurchases.length > 0 && `(${myPurchases.length})`}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Seção de Minhas Compras Pendentes */}
      {showPurchases && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Minhas Compras Pendentes</h2>
            <button
              onClick={loadMyPurchases}
              disabled={loadingPurchases}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {loadingPurchases ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {loadingPurchases ? (
            <div className="py-8 text-center text-gray-500">Carregando compras...</div>
          ) : myPurchases.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-sm">Você não tem compras pendentes no momento.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campanha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estabelecimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pontos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myPurchases.map((purchase: any) => (
                    <tr key={purchase.campaign_purchase_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.benefit_description || purchase.campaign_name || "Campanha Automática"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {purchase.establishment_name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {parseFloat(purchase.purchase_amount || 0).toLocaleString("pt-MZ")} MT
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {purchase.points_earned || 0} pontos
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(purchase.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          purchase.status === 'pending'
                            ? "bg-yellow-100 text-yellow-800"
                            : purchase.status === 'validated'
                            ? "bg-green-100 text-green-800"
                            : purchase.status === 'rejected'
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {purchase.status === 'pending' ? 'Pendente' :
                           purchase.status === 'validated' ? 'Validada' :
                           purchase.status === 'rejected' ? 'Rejeitada' :
                           purchase.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Lista de Campanhas Automáticas */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma campanha automática encontrada</h3>
            <p className="mt-2 text-sm text-gray-500">
              Não há campanhas automáticas disponíveis no momento.
            </p>
          </div>
        ) : (
          campaigns.map((campaign) => {
            const active = isCampaignActive(campaign);

            return (
              <div
                key={campaign.campaign_id || campaign.id}
                className={`rounded-lg border-2 p-6 shadow transition-all ${
                  active
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {campaign.benefit_description || "Campanha Automática"}
                          </h3>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            active
                              ? "bg-green-200 text-green-800"
                              : "bg-gray-200 text-gray-700"
                          }`}>
                            {active ? "Ativa" : "Inativa"}
                          </span>
                        </div>
                        {campaign.establishment_name && (
                          <p className="mt-1 text-sm text-gray-600">
                            <span className="font-medium">📍 Estabelecimento:</span> {campaign.establishment_name}
                          </p>
                        )}
                        {campaign.min_purchase_amount && (
                          <p className="mt-1 text-sm text-gray-600">
                            <span className="font-medium">💰 Valor Mínimo:</span> {campaign.min_purchase_amount.toLocaleString("pt-MZ")} MT
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                          {campaign.valid_from && (
                            <span>
                              <span className="font-medium">Início:</span> {formatDate(campaign.valid_from)}
                            </span>
                          )}
                          {campaign.valid_until && (
                            <span>
                              <span className="font-medium">Término:</span> {formatDate(campaign.valid_until)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {active && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleOpenSubmitModal(campaign)}
                        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                      >
                        Enviar Compra
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Submissão de Compra */}
      {showSubmitModal && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Enviar Compra</h2>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSelectedCampaign(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={submitting}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Campanha:</strong> {selectedCampaign.benefit_description}
              </p>
              {selectedCampaign.min_purchase_amount && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Valor Mínimo:</strong> {selectedCampaign.min_purchase_amount.toLocaleString("pt-MZ")} MT
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="purchase_amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Valor da Compra (MT) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="purchase_amount"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  min={selectedCampaign.min_purchase_amount || 0}
                  step="0.01"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex: 2000.00"
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Informações adicionais sobre a compra..."
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="receipt_photo" className="block text-sm font-medium text-gray-700 mb-2">
                  Foto do Recibo (opcional)
                </label>
                <input
                  type="file"
                  id="receipt_photo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={submitting}
                />
                {receiptPreview && (
                  <div className="mt-2">
                    <img
                      src={receiptPreview}
                      alt="Preview do recibo"
                      className="max-w-full h-auto rounded-lg border border-gray-300"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSelectedCampaign(null);
                }}
                disabled={submitting}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitPurchase}
                disabled={submitting || !purchaseAmount}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Enviando..." : "Enviar Compra"}
              </button>
            </div>
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

export default function AutoCampaignsPage() {
  return (
    <ProtectedRoute requireClient={true} redirectTo="/">
      <AutoCampaignsPageContent />
    </ProtectedRoute>
  );
}

