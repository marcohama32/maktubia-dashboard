import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { campaignsService, Campaign } from "@/services/campaigns.service";
import { merchantsService } from "@/services/merchants.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { QRCodeSVG } from "qrcode.react";

function CampaignDetailsPageContent() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [establishment, setEstablishment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"activate" | "deactivate" | "delete">("activate");
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => loadCampaign(id as string), { timeout: 100 });
      } else {
        setTimeout(() => loadCampaign(id as string), 50);
      }
    }
  }, [id]);

  // Função helper para obter todas as imagens
  const getAllImages = useMemo(() => {
    if (!campaign) return [];
    
    const allImages: string[] = [];
    if (campaign.image || campaign.imageUrl) {
      const mainImage = campaign.image || campaign.imageUrl || "";
      if (mainImage && mainImage.trim() !== "" && !allImages.includes(mainImage)) {
        allImages.push(mainImage);
      }
    }
    if (campaign.images && Array.isArray(campaign.images) && campaign.images.length > 0) {
      campaign.images.forEach(img => {
        if (img && img.trim() !== "" && !allImages.includes(img)) {
          allImages.push(img);
        }
      });
    }
    
    return allImages;
  }, [campaign?.image, campaign?.imageUrl, campaign?.images]);

  // Resetar índice de imagem quando a campanha mudar
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [campaign?.id]);

  // Auto-rotacionar imagens
  useEffect(() => {
    // Limpar intervalo anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!campaign || !isAutoRotating) {
      return;
    }

    const imageCount = getAllImages.length;
    if (imageCount <= 1) {
      return;
    }

    // Criar novo intervalo
    intervalRef.current = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const nextIndex = (prev + 1) % imageCount;
        return nextIndex;
      });
    }, 5000); // Muda a cada 5 segundos

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [campaign, getAllImages.length, isAutoRotating]);

  const loadCampaign = async (campaignId: string | number) => {
    try {
      setLoading(true);
      setError("");
      const data = await campaignsService.getById(campaignId);
      setCampaign(data);
      
      // Carregar estabelecimento se necessário
      if (data.establishment_id && !data.establishment) {
        try {
          const establishmentsResponse = await merchantsService.getMyEstablishments();
          const establishments = establishmentsResponse.data || [];
          const est = establishments.find((e: any) => e.id === data.establishment_id);
          if (est) {
            setEstablishment(est);
          }
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
    
    const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
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
      await campaignsService.changeStatus(campaignId, { status: newStatus });
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
    
    const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
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
      await campaignsService.delete(campaignId);
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

  const handleEdit = () => {
    if (!campaign) return;
    const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
    if (campaignId) {
      router.push(`/merchant/campaigns/${campaignId}/edit`);
    }
  };

  const getCampaignMetrics = () => {
    if (!campaign) return null;
    // Usar métricas da API se disponíveis, senão usar campos legados
    if (campaign.metrics) {
      return {
        totalParticipants: campaign.metrics.totalParticipants ?? campaign.total_uses ?? 0,
        totalPurchases: campaign.metrics.totalPurchases ?? 0,
        totalPointsEarned: campaign.metrics.totalPointsEarned ?? campaign.total_points_given ?? 0,
        totalRevenue: campaign.metrics.totalRevenue ?? campaign.total_revenue ?? 0,
      };
    }
    return {
      totalParticipants: campaign.total_uses ?? 0,
      totalPointsEarned: campaign.total_points_given ?? 0,
      totalRevenue: campaign.total_revenue ?? 0,
    };
  };

  const isActive = campaign?.status === "active" || campaign?.status === "Activo" || campaign?.is_active !== false;

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

  const metrics = getCampaignMetrics();

  return (
    <div className="p-6">
      {/* Botão Voltar */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/admin/campaigns")}
          className="text-blue-600 hover:text-blue-900 flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para Campanhas
        </button>
      </div>

      {/* Header com Título e Ações */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {campaign.campaignName || campaign.campaign_name || campaign.name || "Campanha"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {campaign.description || campaign.reward_description || ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
            isActive
              ? "bg-green-100 text-green-800"
              : campaign.status === "cancelled" || campaign.status === "Cancelado"
              ? "bg-red-100 text-red-800"
              : campaign.status === "Expirado" || campaign.status === "expired"
              ? "bg-orange-100 text-orange-800"
              : "bg-gray-100 text-gray-800"
          }`}>
            {campaign.status || (isActive ? "Activa" : "Inativa")}
          </span>
          <button
            onClick={handleEdit}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            title="Editar campanha"
          >
            Editar
          </button>
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
        </div>
      </div>

      {/* Métricas */}
      {metrics && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">Participantes</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{metrics.totalParticipants.toLocaleString("pt-MZ")}</p>
          </div>
          <div className="rounded-lg border-l-4 border-purple-500 bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">Pontos Distribuídos</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{metrics.totalPointsEarned.toLocaleString("pt-MZ")}</p>
          </div>
          <div className="rounded-lg border-l-4 border-green-500 bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">Receita Total</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{metrics.totalRevenue.toLocaleString("pt-MZ")} MT</p>
          </div>
          {metrics.totalPurchases !== undefined && metrics.totalPurchases > 0 && (
            <div className="rounded-lg border-l-4 border-yellow-500 bg-white p-6 shadow">
              <p className="text-sm font-medium text-gray-500">Compras</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{metrics.totalPurchases.toLocaleString("pt-MZ")}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Imagens da Campanha */}
        {getAllImages.length > 0 && (() => {
          const currentImage = getAllImages[currentImageIndex];
          return (
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Imagens da Campanha</h2>
                {getAllImages.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAutoRotating(!isAutoRotating)}
                      className={`rounded px-3 py-1 text-xs ${
                        isAutoRotating
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isAutoRotating ? "⏸ Pausar" : "▶ Reproduzir"}
                    </button>
                    <span className="text-sm text-gray-500">
                      {currentImageIndex + 1} / {getAllImages.length}
                    </span>
                  </div>
                )}
              </div>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={currentImage}
                  alt={`Campanha ${currentImageIndex + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-image.png";
                  }}
                />
                {getAllImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev - 1 + getAllImages.length) % getAllImages.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % getAllImages.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              {getAllImages.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto">
                  {getAllImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-20 w-20 shrink-0 overflow-hidden rounded border-2 ${
                        index === currentImageIndex
                          ? "border-blue-500"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Miniatura ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-image.png";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* QR Code */}
        {(campaign.qrCode || campaign.qr_code) && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">QR Code da Campanha</h2>
            <div ref={qrCodeRef} className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
              <QRCodeSVG
                value={campaign.qrCode || campaign.qr_code || ""}
                size={200}
                level="H"
                includeMargin={true}
                className="mb-4"
              />
              <div className="mt-4 text-center">
                <p className="break-all font-mono text-sm font-semibold text-gray-900">
                  {campaign.qrCode || campaign.qr_code}
                </p>
                <p className="mt-2 text-xs text-gray-500">Código QR da Campanha</p>
                <button
                  onClick={() => {
                    const qrCodeValue = campaign.qrCode || campaign.qr_code || "";
                    if (qrCodeValue) {
                      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrCodeValue)}&ecc=H`;
                      const link = document.createElement("a");
                      link.href = qrCodeUrl;
                      link.download = `QRCode_${campaign.campaignName || campaign.campaign_name || campaign.campaign_number || "Campanha"}.png`;
                      link.click();
                    }
                  }}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                >
                  📥 Baixar QR Code
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Informações Detalhadas */}
      <div className="mt-6 space-y-6">
        {/* Informações Básicas */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Número da Campanha</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {campaign.campaignNumber || campaign.campaign_number || campaign.id || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Estabelecimento</p>
              <p className="mt-1 text-sm text-gray-900">
                {campaign.establishment?.name || establishment?.name || campaign.establishmentName || `ID: ${campaign.establishment_id || campaign.establishmentId}`}
              </p>
            </div>

            {(campaign.sponsorName || campaign.sponsor_name) && (
              <div>
                <p className="text-sm font-medium text-gray-500">Patrocinador</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.sponsorName || campaign.sponsor_name}</p>
              </div>
            )}

            {(campaign.typeLabel || campaign.type) && (
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo de Campanha</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.typeLabel || campaign.type}</p>
                {campaign.typeDescription && (
                  <p className="mt-1 text-xs text-gray-500">{campaign.typeDescription}</p>
                )}
              </div>
            )}

            {(campaign.validFrom || campaign.valid_from || campaign.start_date) && (
              <div>
                <p className="text-sm font-medium text-gray-500">Data de Início</p>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(campaign.validFrom || campaign.valid_from || campaign.start_date!).toLocaleDateString("pt-MZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            {(campaign.validUntil || campaign.valid_until || campaign.end_date) && (
              <div>
                <p className="text-sm font-medium text-gray-500">Data de Término</p>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(campaign.validUntil || campaign.valid_until || campaign.end_date!).toLocaleDateString("pt-MZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            {campaign.createdAt && (
              <div>
                <p className="text-sm font-medium text-gray-500">Data de Criação</p>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(campaign.createdAt).toLocaleString("pt-MZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}

            {campaign.redemptionDeadline && (
              <div>
                <p className="text-sm font-medium text-gray-500">Prazo de Resgate</p>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(campaign.redemptionDeadline).toLocaleDateString("pt-MZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Configurações de Pontos */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Configurações de Pontos</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaign.accumulationRate !== undefined && campaign.accumulationRate !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa de Acumulação</p>
                <p className="mt-1 text-sm text-gray-900">
                  {campaign.accumulationRate} (1 MT = {(campaign.accumulationRate * 10).toFixed(1)} pts)
                </p>
              </div>
            )}

            {campaign.conversionRate !== undefined && campaign.conversionRate !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa de Conversão</p>
                <p className="mt-1 text-sm text-gray-900">{(campaign.conversionRate * 100).toFixed(1)}%</p>
              </div>
            )}

            {campaign.totalPointsLimit !== undefined && campaign.totalPointsLimit !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Limite Total de Pontos</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.totalPointsLimit.toLocaleString("pt-MZ")} pts</p>
              </div>
            )}

            {campaign.pointsAccumulated !== undefined && campaign.pointsAccumulated !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Pontos Acumulados</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.pointsAccumulated.toLocaleString("pt-MZ")} pts</p>
              </div>
            )}

            {campaign.bonusMultiplier !== undefined && campaign.bonusMultiplier !== null && campaign.bonusMultiplier !== 1 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Multiplicador de Bônus</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.bonusMultiplier}x</p>
              </div>
            )}

            {campaign.pointsExpiryDays !== undefined && campaign.pointsExpiryDays !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Dias para Expiração dos Pontos</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.pointsExpiryDays} dias</p>
              </div>
            )}
          </div>
        </div>

        {/* Configurações de Compra */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Configurações de Compra</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaign.minSpend !== undefined && campaign.minSpend !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Valor Mínimo de Compra</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.minSpend.toLocaleString("pt-MZ")} MT</p>
              </div>
            )}

            {campaign.minPurchaseAmount !== undefined && campaign.minPurchaseAmount !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Valor Mínimo de Compra (Legado)</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.minPurchaseAmount.toLocaleString("pt-MZ")} MT</p>
              </div>
            )}

            {campaign.maxPurchaseAmount !== undefined && campaign.maxPurchaseAmount !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Valor Máximo de Compra</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.maxPurchaseAmount.toLocaleString("pt-MZ")} MT</p>
              </div>
            )}

            {campaign.transactionLimit !== undefined && campaign.transactionLimit !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Limite por Transação</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.transactionLimit}</p>
              </div>
            )}

            {campaign.dailyLimitPerClient !== undefined && campaign.dailyLimitPerClient !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Limite Diário por Cliente</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.dailyLimitPerClient}</p>
              </div>
            )}

            {campaign.campaignLimitPerClient !== undefined && campaign.campaignLimitPerClient !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Limite Total por Cliente</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.campaignLimitPerClient}</p>
              </div>
            )}

            {campaign.requiredVisits !== undefined && campaign.requiredVisits !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Visitas Necessárias</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.requiredVisits} visitas</p>
              </div>
            )}
          </div>
        </div>

        {/* Recompensas */}
        {(campaign.rewardDescription || campaign.rewardValueMt !== undefined || campaign.rewardPointsCost !== undefined || campaign.rewardStock !== undefined) && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Recompensas</h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {campaign.rewardDescription && (
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-sm font-medium text-gray-500">Descrição da Recompensa</p>
                  <p className="mt-1 text-sm text-gray-900">{campaign.rewardDescription}</p>
                </div>
              )}

              {campaign.rewardValueMt !== undefined && campaign.rewardValueMt !== null && campaign.rewardValueMt > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Valor da Recompensa</p>
                  <p className="mt-1 text-sm text-gray-900">{campaign.rewardValueMt.toLocaleString("pt-MZ")} MT</p>
                </div>
              )}

              {campaign.rewardPointsCost !== undefined && campaign.rewardPointsCost !== null && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Custo em Pontos</p>
                  <p className="mt-1 text-sm text-gray-900">{campaign.rewardPointsCost.toLocaleString("pt-MZ")} pts</p>
                </div>
              )}

              {campaign.rewardStock !== undefined && campaign.rewardStock !== null && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Estoque Disponível</p>
                  <p className="mt-1 text-sm text-gray-900">{campaign.rewardStock}</p>
                </div>
              )}

              {campaign.rewardStockRedeemed !== undefined && campaign.rewardStockRedeemed !== null && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Estoque Resgatado</p>
                  <p className="mt-1 text-sm text-gray-900">{campaign.rewardStockRedeemed}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Restrições e Filtros */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Restrições e Filtros</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaign.newCustomersOnly !== undefined && (
              <div>
                <p className="text-sm font-medium text-gray-500">Apenas Novos Clientes</p>
                <p className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    campaign.newCustomersOnly ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {campaign.newCustomersOnly ? "Sim" : "Não"}
                  </span>
                </p>
              </div>
            )}

            {campaign.vipOnly !== undefined && (
              <div>
                <p className="text-sm font-medium text-gray-500">Apenas VIP</p>
                <p className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    campaign.vipOnly ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {campaign.vipOnly ? "Sim" : "Não"}
                  </span>
                </p>
              </div>
            )}

            {campaign.allowedLocations && Array.isArray(campaign.allowedLocations) && campaign.allowedLocations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Localizações Permitidas</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.allowedLocations.join(", ")}</p>
              </div>
            )}

            {campaign.allowedPaymentMethods && Array.isArray(campaign.allowedPaymentMethods) && campaign.allowedPaymentMethods.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Métodos de Pagamento Permitidos</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.allowedPaymentMethods.join(", ")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Notificações */}
        {(campaign.notifyPush !== undefined || campaign.notifySms !== undefined || campaign.notifyEmail !== undefined || campaign.notifyWhatsapp !== undefined) && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Notificações</h2>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {campaign.notifyPush !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Push</p>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      campaign.notifyPush ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {campaign.notifyPush ? "Ativado" : "Desativado"}
                    </span>
                  </p>
                </div>
              )}

              {campaign.notifySms !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-500">SMS</p>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      campaign.notifySms ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {campaign.notifySms ? "Ativado" : "Desativado"}
                    </span>
                  </p>
                </div>
              )}

              {campaign.notifyEmail !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      campaign.notifyEmail ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {campaign.notifyEmail ? "Ativado" : "Desativado"}
                    </span>
                  </p>
                </div>
              )}

              {campaign.notifyWhatsapp !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-500">WhatsApp</p>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      campaign.notifyWhatsapp ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {campaign.notifyWhatsapp ? "Ativado" : "Desativado"}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {(campaign.communicationBudget !== undefined || campaign.communicationCreditsUsed !== undefined) && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {campaign.communicationBudget !== undefined && campaign.communicationBudget !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Orçamento de Comunicação</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.communicationBudget.toLocaleString("pt-MZ")} MT</p>
                  </div>
                )}

                {campaign.communicationCreditsUsed !== undefined && campaign.communicationCreditsUsed !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Créditos Usados</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.communicationCreditsUsed.toLocaleString("pt-MZ")} MT</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Configurações Específicas por Tipo de Campanha */}
        {(() => {
          const campaignType = campaign.type || campaign.typeLabel || "";
          const hasSpecificConfig = 
            campaign.autoPointsAmount !== null || campaign.autoPointsCondition !== null ||
            campaign.drawParticipationCondition !== null || campaign.drawMinSpend !== null ||
            campaign.exchangeMinPointsRequired !== null ||
            campaign.quizQuestions !== null || campaign.quizPointsPerCorrect !== null ||
            campaign.referralMinReferrals !== null || campaign.referralCode !== null ||
            campaign.challengeObjective !== null || campaign.challengeTargetValue !== null ||
            campaign.partyVotingOptions !== null || campaign.partyPointsPerVote !== null ||
            campaign.voucherCode !== null || campaign.voucherType !== null;

          if (!hasSpecificConfig) return null;

          return (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Configurações Específicas</h2>
              
              {/* Oferta Automática (RewardType_Auto) */}
              {(campaignType.includes("Auto") || campaignType.includes("auto")) && (
                <div className="mb-6">
                  <h3 className="mb-3 text-md font-semibold text-gray-800">Oferta Automática</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {campaign.autoPointsAmount !== null && campaign.autoPointsAmount !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Quantidade de Pontos Automáticos</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.autoPointsAmount} pts</p>
                      </div>
                    )}
                    {campaign.autoPointsCondition && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Condição para Pontos Automáticos</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.autoPointsCondition}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sorteio (Draw) */}
              {(campaignType.includes("Draw") || campaignType.includes("draw") || campaignType.includes("Sorteio")) && (
                <div className="mb-6">
                  <h3 className="mb-3 text-md font-semibold text-gray-800">Sorteio</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaign.drawParticipationCondition && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Condição de Participação</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.drawParticipationCondition}</p>
                      </div>
                    )}
                    {campaign.drawMinSpend !== null && campaign.drawMinSpend !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Valor Mínimo para Participar</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.drawMinSpend.toLocaleString("pt-MZ")} MT</p>
                      </div>
                    )}
                    {campaign.drawChancesPerPurchase !== null && campaign.drawChancesPerPurchase !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Chances por Compra</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.drawChancesPerPurchase}</p>
                      </div>
                    )}
                    {campaign.drawPrizeDescription && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-sm font-medium text-gray-500">Descrição do Prêmio</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.drawPrizeDescription}</p>
                      </div>
                    )}
                    {campaign.drawDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Data do Sorteio</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(campaign.drawDate).toLocaleDateString("pt-MZ", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                    {campaign.drawWinnersCount !== null && campaign.drawWinnersCount !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Número de Ganhadores</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.drawWinnersCount}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Troca (Exchange) */}
              {(campaignType.includes("Exchange") || campaignType.includes("exchange") || campaignType.includes("Troca")) && (
                <div className="mb-6">
                  <h3 className="mb-3 text-md font-semibold text-gray-800">Troca</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {campaign.exchangeMinPointsRequired !== null && campaign.exchangeMinPointsRequired !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pontos Mínimos Necessários</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.exchangeMinPointsRequired.toLocaleString("pt-MZ")} pts</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quiz */}
              {(campaignType.includes("Quiz") || campaignType.includes("quiz")) && (
                <div className="mb-6">
                  <h3 className="mb-3 text-md font-semibold text-gray-800">Quiz</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {campaign.quizPointsPerCorrect !== null && campaign.quizPointsPerCorrect !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pontos por Resposta Correta</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.quizPointsPerCorrect} pts</p>
                      </div>
                    )}
                    {campaign.quizMaxAttempts !== null && campaign.quizMaxAttempts !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tentativas Máximas</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.quizMaxAttempts}</p>
                      </div>
                    )}
                    {campaign.quizTimeLimitSeconds !== null && campaign.quizTimeLimitSeconds !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tempo Limite</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.quizTimeLimitSeconds} segundos</p>
                      </div>
                    )}
                    {campaign.quizQuestions && Array.isArray(campaign.quizQuestions) && campaign.quizQuestions.length > 0 && (
                      <div className="md:col-span-2 lg:col-span-4">
                        <p className="text-sm font-medium text-gray-500">Número de Questões</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.quizQuestions.length} questões</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Indicação (Referral) */}
              {(campaignType.includes("Referral") || campaignType.includes("referral") || campaignType.includes("Indicação")) && (
                <div className="mb-6">
                  <h3 className="mb-3 text-md font-semibold text-gray-800">Indicação</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaign.referralCode && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Código de Indicação</p>
                        <p className="mt-1 text-sm font-mono font-semibold text-gray-900">{campaign.referralCode}</p>
                      </div>
                    )}
                    {campaign.referralMinReferrals !== null && campaign.referralMinReferrals !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Indicações Mínimas</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.referralMinReferrals}</p>
                      </div>
                    )}
                    {campaign.referralPointsPerReferral !== null && campaign.referralPointsPerReferral !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pontos por Indicação</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.referralPointsPerReferral} pts</p>
                      </div>
                    )}
                    {campaign.referralBonusPoints !== null && campaign.referralBonusPoints !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pontos de Bônus</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.referralBonusPoints} pts</p>
                      </div>
                    )}
                    {campaign.referralRequiresFirstPurchase !== null && campaign.referralRequiresFirstPurchase !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Requer Primeira Compra</p>
                        <p className="mt-1 text-sm text-gray-900">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            campaign.referralRequiresFirstPurchase ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {campaign.referralRequiresFirstPurchase ? "Sim" : "Não"}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Desafio (Challenge) */}
              {(campaignType.includes("Challenge") || campaignType.includes("challenge") || campaignType.includes("Desafio")) && (
                <div className="mb-6">
                  <h3 className="mb-3 text-md font-semibold text-gray-800">Desafio</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaign.challengeObjective && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-sm font-medium text-gray-500">Objetivo do Desafio</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.challengeObjective}</p>
                      </div>
                    )}
                    {campaign.challengeTargetValue !== null && campaign.challengeTargetValue !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Valor Alvo</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.challengeTargetValue}</p>
                      </div>
                    )}
                    {campaign.challengeTargetType && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tipo de Alvo</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.challengeTargetType}</p>
                      </div>
                    )}
                    {campaign.challengeRewardPoints !== null && campaign.challengeRewardPoints !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pontos de Recompensa</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.challengeRewardPoints.toLocaleString("pt-MZ")} pts</p>
                      </div>
                    )}
                    {campaign.challengeBonusReward && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Recompensa de Bônus</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.challengeBonusReward}</p>
                      </div>
                    )}
                    {campaign.challengeProgressTracking && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-sm font-medium text-gray-500">Rastreamento de Progresso</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.challengeProgressTracking}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Votação (Party) */}
              {(campaignType.includes("Party") || campaignType.includes("party") || campaignType.includes("Votação")) && (
                <div className="mb-6">
                  <h3 className="mb-3 text-md font-semibold text-gray-800">Votação</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaign.partyVotingOptions && Array.isArray(campaign.partyVotingOptions) && campaign.partyVotingOptions.length > 0 && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-sm font-medium text-gray-500">Opções de Votação</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {campaign.partyVotingOptions.map((option: string, index: number) => (
                            <span key={index} className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {campaign.partyPointsPerVote !== null && campaign.partyPointsPerVote !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pontos por Voto</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.partyPointsPerVote} pts</p>
                      </div>
                    )}
                    {campaign.partyWinnerReward && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Recompensa do Vencedor</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.partyWinnerReward}</p>
                      </div>
                    )}
                    {campaign.partyVotingDeadline && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Prazo de Votação</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(campaign.partyVotingDeadline).toLocaleDateString("pt-MZ", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                    {campaign.partyResultsDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Data dos Resultados</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(campaign.partyResultsDate).toLocaleDateString("pt-MZ", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Voucher */}
              {(campaignType.includes("Voucher") || campaignType.includes("voucher") || campaign.voucherCode || campaign.voucherType) && (
                <div className="mb-6">
                  <h3 className="mb-3 text-md font-semibold text-gray-800">Voucher</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaign.voucherCode && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Código do Voucher</p>
                        <p className="mt-1 text-sm font-mono font-semibold text-gray-900">{campaign.voucherCode}</p>
                      </div>
                    )}
                    {campaign.voucherType && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tipo de Voucher</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.voucherType}</p>
                      </div>
                    )}
                    {campaign.voucherCategory && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Categoria</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.voucherCategory}</p>
                      </div>
                    )}
                    {campaign.voucherValue !== null && campaign.voucherValue !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Valor do Voucher</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.voucherValue.toLocaleString("pt-MZ")} MT</p>
                      </div>
                    )}
                    {campaign.voucherPercentage !== null && campaign.voucherPercentage !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Percentual de Desconto</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.voucherPercentage}%</p>
                      </div>
                    )}
                    {campaign.voucherFixedAmount !== null && campaign.voucherFixedAmount !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Valor Fixo de Desconto</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.voucherFixedAmount.toLocaleString("pt-MZ")} MT</p>
                      </div>
                    )}
                    {campaign.voucherMinPurchase !== null && campaign.voucherMinPurchase !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Compra Mínima</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.voucherMinPurchase.toLocaleString("pt-MZ")} MT</p>
                      </div>
                    )}
                    {campaign.voucherMaxDiscount !== null && campaign.voucherMaxDiscount !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Desconto Máximo</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.voucherMaxDiscount.toLocaleString("pt-MZ")} MT</p>
                      </div>
                    )}
                    {campaign.voucherUsageLimit !== null && campaign.voucherUsageLimit !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Limite de Uso</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.voucherUsageLimit}</p>
                      </div>
                    )}
                    {campaign.voucherExpiryDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Data de Expiração</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(campaign.voucherExpiryDate).toLocaleDateString("pt-MZ", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                    {campaign.voucherRequiresCode !== null && campaign.voucherRequiresCode !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Requer Código</p>
                        <p className="mt-1 text-sm text-gray-900">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            campaign.voucherRequiresCode ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {campaign.voucherRequiresCode ? "Sim" : "Não"}
                          </span>
                        </p>
                      </div>
                    )}
                    {campaign.voucherSingleUse !== null && campaign.voucherSingleUse !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Uso Único</p>
                        <p className="mt-1 text-sm text-gray-900">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            campaign.voucherSingleUse ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {campaign.voucherSingleUse ? "Sim" : "Não"}
                          </span>
                        </p>
                      </div>
                    )}
                    {campaign.voucherApplyTo && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Aplicar a</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.voucherApplyTo}</p>
                      </div>
                    )}
                    {campaign.voucherDescription && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-sm font-medium text-gray-500">Descrição do Voucher</p>
                        <p className="mt-1 text-sm text-gray-900">{campaign.voucherDescription}</p>
                      </div>
                    )}
                    {campaign.voucherTerms && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-sm font-medium text-gray-500">Termos e Condições</p>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{campaign.voucherTerms}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Descrição e Notas */}
        {(campaign.description || campaign.notes) && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Descrição e Notas</h2>
            
            {campaign.description && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Descrição</p>
                <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{campaign.description}</p>
              </div>
            )}

            {campaign.notes && (
              <div>
                <p className="text-sm font-medium text-gray-500">Notas</p>
                <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{campaign.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Informações do Estabelecimento */}
        {campaign.establishment && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Informações do Estabelecimento</h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Nome</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.establishment.name}</p>
              </div>

              {campaign.establishment.type && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo</p>
                  <p className="mt-1 text-sm text-gray-900">{campaign.establishment.type}</p>
                </div>
              )}

              {campaign.establishment.address && (
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-sm font-medium text-gray-500">Endereço</p>
                  <p className="mt-1 text-sm text-gray-900">{campaign.establishment.address}</p>
                </div>
              )}

              {campaign.establishment.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Telefone</p>
                  <p className="mt-1 text-sm text-gray-900">{campaign.establishment.phone}</p>
                </div>
              )}

              {campaign.establishment.email && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-sm text-gray-900">{campaign.establishment.email}</p>
                </div>
              )}

              {campaign.establishment.qrCode && (
                <div>
                  <p className="text-sm font-medium text-gray-500">QR Code do Estabelecimento</p>
                  <p className="mt-1 text-sm font-mono text-gray-900 break-all">{campaign.establishment.qrCode}</p>
                </div>
              )}
            </div>
          </div>
        )}
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
          message={`Tem certeza que deseja eliminar esta campanha?\n\nNome: ${campaign.campaignName || campaign.campaign_name || campaign.name || "-"}\nEstabelecimento: ${campaign.establishment?.name || establishment?.name || `ID: ${campaign.establishment_id}`}\n\nEsta ação não pode ser desfeita.`}
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

export default function CampaignDetailsPage() {
  return (
    <ProtectedRoute requireMerchant={true} redirectTo="/">
      <CampaignDetailsPageContent />
    </ProtectedRoute>
  );
}
