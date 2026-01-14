import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { discountReservationCampaignsService, DiscountReservationCampaign } from "@/services/discountReservationCampaigns.service";
import { establishmentService } from "@/services/establishment.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant, isUser } from "@/utils/roleUtils";

export default function DiscountReservationCampaignDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const userIsClient = user ? isUser(user) && !isAdmin(user) && !isMerchant(user) : false;
  const [campaign, setCampaign] = useState<DiscountReservationCampaign | null>(null);
  const [establishment, setEstablishment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"activate" | "deactivate" | "delete">("activate");

  useEffect(() => {
    if (id) {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => loadCampaign(id as string), { timeout: 100 });
      } else {
        setTimeout(() => loadCampaign(id as string), 50);
      }
    }
  }, [id]);

  const loadCampaign = async (campaignId: string | number) => {
    try {
      setLoading(true);
      setError("");
      const data = await discountReservationCampaignsService.getById(campaignId);
      setCampaign(data);
      
      // Carregar estabelecimento se necessário
      if (data.establishment_id && !data.establishment) {
        try {
          const estData = await establishmentService.getById(data.establishment_id);
          setEstablishment(estData);
        } catch (err) {
          console.warn("Erro ao carregar estabelecimento:", err);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar campanha:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar campanha");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: "active" | "inactive") => {
    if (!campaign) return;
    
    const campaignId = campaign.campaign_id || campaign.id;
    if (!campaignId) {
      setAlertConfig({
        title: "Erro!",
        message: "ID da campanha inválido.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }
    
    try {
      setActionLoading(true);
      await discountReservationCampaignsService.changeStatus(campaignId, { status: newStatus });
      await loadCampaign(campaignId);
      setAlertConfig({
        title: "Sucesso!",
        message: `Campanha ${newStatus === "active" ? "ativada" : "desativada"} com sucesso.`,
        type: "success",
      });
      setAlertModalOpen(true);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao alterar status da campanha.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setActionType("delete");
    setConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaign) return;
    
    const campaignId = campaign.campaign_id || campaign.id;
    if (!campaignId) {
      setAlertConfig({
        title: "Erro!",
        message: "ID da campanha inválido.",
        type: "error",
      });
      setAlertModalOpen(true);
      setConfirmModalOpen(false);
      return;
    }
    
    try {
      setActionLoading(true);
      await discountReservationCampaignsService.delete(campaignId);
      setAlertConfig({
        title: "Sucesso!",
        message: "Campanha eliminada com sucesso.",
        type: "success",
      });
      setAlertModalOpen(true);
      setConfirmModalOpen(false);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push("/admin/campaigns");
      }, 2000);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao eliminar campanha.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const isActive = campaign?.status === "active" || campaign?.status === "Activo" || campaign?.status === "Activa";
  const establishmentName = campaign?.establishment?.name || establishment?.name || (campaign?.establishment_id ? `ID: ${campaign.establishment_id}` : "Não definido");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="font-medium text-gray-600">Carregando campanha...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error || "Campanha não encontrada"}
        </div>
        <button
          onClick={() => router.push("/admin/campaigns")}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Voltar para Campanhas
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push("/admin/campaigns")}
          className="mb-4 text-blue-600 hover:text-blue-900 flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para Campanhas
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {campaign.campaign_name || "Campanha de Desconto por Marcação"}
          </h1>
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              isActive
                ? "bg-green-100 text-green-800"
                : campaign.status === "cancelled" || campaign.status === "Cancelado"
                ? "bg-red-100 text-red-800"
                : campaign.status === "Rascunho"
                ? "bg-yellow-100 text-yellow-800"
                : campaign.status === "Expirado" || campaign.status === "expired"
                ? "bg-orange-100 text-orange-800"
                : "bg-gray-100 text-gray-800"
            }`}>
              {campaign.status || (isActive ? "Activa" : "Inativa")}
            </span>
            {!userIsClient && (
              <>
                {!isActive && (
                  <button
                    onClick={() => handleStatusChange("active")}
                    disabled={actionLoading}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Ativar
                  </button>
                )}
                {isActive && (
                  <button
                    onClick={() => handleStatusChange("inactive")}
                    disabled={actionLoading}
                    className="rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Desativar
                  </button>
                )}
                <button
                  onClick={handleDeleteClick}
                  disabled={actionLoading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Estabelecimento</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{establishmentName}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Nome da Campanha</p>
              <p className="mt-1 text-sm text-gray-900">{campaign.campaign_name || "-"}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Tipo de Benefício</p>
              <div className="mt-1">
                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                  {campaign.tipo_beneficio === "desconto_percentual" ? "Desconto Percentual" : "Desconto Fixo"}
                </span>
              </div>
            </div>

            {campaign.id && (
              <div>
                <p className="text-sm font-medium text-gray-500">ID da Campanha</p>
                <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {campaign.id}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Configurações e Datas */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações e Datas</h2>
          
          <div className="space-y-4">
            {campaign.data_inicial && (
              <div>
                <p className="text-sm font-medium text-gray-500">Data de Início</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {new Date(campaign.data_inicial).toLocaleDateString("pt-MZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
            )}

            {campaign.data_final && (
              <div>
                <p className="text-sm font-medium text-gray-500">Data de Término</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {new Date(campaign.data_final).toLocaleDateString("pt-MZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
            )}

            {campaign.created_at && (
              <div>
                <p className="text-sm font-medium text-gray-500">Data de Criação</p>
                <p className="mt-1 text-sm text-gray-900">{new Date(campaign.created_at).toLocaleString("pt-MZ")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configurações de Desconto */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Desconto</h2>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {campaign.consumo_minimo !== undefined && campaign.consumo_minimo !== null && (
            <div>
              <p className="text-sm font-medium text-gray-500">Consumo Mínimo</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {campaign.consumo_minimo.toLocaleString("pt-MZ")} MT
              </p>
            </div>
          )}

          {campaign.tipo_beneficio === "desconto_percentual" && campaign.percentual_desconto !== undefined && campaign.percentual_desconto !== null && (
            <div>
              <p className="text-sm font-medium text-gray-500">Percentual de Desconto</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {campaign.percentual_desconto}%
              </p>
            </div>
          )}

          {campaign.tipo_beneficio === "desconto_fixo" && campaign.valor_desconto_fixo !== undefined && campaign.valor_desconto_fixo !== null && (
            <div>
              <p className="text-sm font-medium text-gray-500">Valor do Desconto Fixo</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {campaign.valor_desconto_fixo.toLocaleString("pt-MZ")} MT
              </p>
            </div>
          )}

          {campaign.limite_utilizacao_cliente !== undefined && campaign.limite_utilizacao_cliente !== null && (
            <div>
              <p className="text-sm font-medium text-gray-500">Limite por Cliente</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {campaign.limite_utilizacao_cliente} {campaign.limite_utilizacao_cliente === 1 ? "vez" : "vezes"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação */}
      {campaign && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false);
          }}
          onConfirm={handleDeleteConfirm}
          title="Confirmar Eliminação"
          message={`Tem certeza que deseja eliminar esta campanha?\n\nNome: ${campaign.campaign_name || "-"}\nEstabelecimento: ${establishmentName}\n\nEsta ação não pode ser desfeita.`}
          confirmText="Sim, Eliminar"
          cancelText="Cancelar"
          type="danger"
          isLoading={actionLoading}
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


