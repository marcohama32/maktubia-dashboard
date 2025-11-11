import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { campaignsService, Campaign } from "@/services/campaigns.service";
import { establishmentService } from "@/services/establishment.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { QRCodeSVG } from "qrcode.react";

export default function CampaignDetailsPage() {
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
      router.push(`/admin/campaigns/${campaignId}/edit`);
    }
  };

  const getCampaignMetrics = () => {
    if (!campaign) return null;
    // Usar métricas da API se disponíveis, senão usar campos legados
    if (campaign.metrics) {
      return {
        totalParticipants: campaign.metrics.totalParticipants ?? campaign.total_uses ?? 0,
        totalPurchases: campaign.metrics.totalPurchases ?? 0,
        confirmedPurchases: campaign.metrics.confirmedPurchases ?? 0,
        pendingPurchases: campaign.metrics.pendingPurchases ?? 0,
        rejectedPurchases: campaign.metrics.rejectedPurchases ?? 0,
        totalPointsEarned: campaign.metrics.totalPointsEarned ?? campaign.total_points_given ?? 0,
        totalPointsEarnedConfirmed: campaign.metrics.totalPointsEarnedConfirmed ?? 0,
        totalRevenue: campaign.metrics.totalRevenue ?? campaign.total_revenue ?? 0,
        totalRevenueConfirmed: campaign.metrics.totalRevenueConfirmed ?? 0,
        avgPurchaseAmount: campaign.metrics.avgPurchaseAmount ?? 0,
        maxPurchaseAmount: campaign.metrics.maxPurchaseAmount ?? 0,
        minPurchaseAmount: campaign.metrics.minPurchaseAmount ?? 0,
        avgPointsPerPurchase: campaign.metrics.avgPointsPerPurchase ?? 0,
      };
    }
    return {
      totalParticipants: campaign.total_uses ?? 0,
      totalPurchases: 0,
      confirmedPurchases: 0,
      pendingPurchases: 0,
      rejectedPurchases: 0,
      totalPointsEarned: campaign.total_points_given ?? 0,
      totalPointsEarnedConfirmed: 0,
      totalRevenue: campaign.total_revenue ?? 0,
      totalRevenueConfirmed: 0,
      avgPurchaseAmount: 0,
      maxPurchaseAmount: 0,
      minPurchaseAmount: 0,
      avgPointsPerPurchase: 0,
    };
  };

  const isActive = campaign?.status === "active" || campaign?.status === "Activo" || campaign?.is_active === true;
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

  const metrics = getCampaignMetrics();

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
          <h1 className="text-2xl font-bold text-gray-900">{campaign.campaignName || campaign.campaign_name || campaign.name || campaign.description || "Campanha"}</h1>
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
            <button
              onClick={handleEdit}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
      </div>

      {/* Métricas Principais */}
      {metrics && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Métricas da Campanha</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow">
              <p className="text-sm font-medium text-gray-500">Participantes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{metrics.totalParticipants || 0}</p>
            </div>
          <div className="rounded-lg bg-white p-6 shadow">
              <p className="text-sm font-medium text-gray-500">Total de Compras</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{metrics.totalPurchases || 0}</p>
              {metrics.confirmedPurchases !== undefined && (
                <p className="mt-1 text-xs text-gray-500">
                  {metrics.confirmedPurchases} confirmadas, {metrics.pendingPurchases || 0} pendentes, {metrics.rejectedPurchases || 0} rejeitadas
                </p>
              )}
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">Pontos Distribuídos</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">{(metrics.totalPointsEarned || 0).toLocaleString("pt-MZ")}</p>
              {metrics.totalPointsEarnedConfirmed !== undefined && metrics.totalPointsEarnedConfirmed > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {(metrics.totalPointsEarnedConfirmed).toLocaleString("pt-MZ")} de compras confirmadas
                </p>
              )}
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">Receita Total</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{(metrics.totalRevenue || 0).toLocaleString("pt-MZ")} MT</p>
              {metrics.totalRevenueConfirmed !== undefined && metrics.totalRevenueConfirmed > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {(metrics.totalRevenueConfirmed).toLocaleString("pt-MZ")} MT confirmada
                </p>
              )}
            </div>
          </div>

          {/* Métricas Detalhadas */}
          {(metrics.avgPurchaseAmount !== undefined || metrics.maxPurchaseAmount !== undefined || metrics.avgPointsPerPurchase !== undefined) && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {metrics.avgPurchaseAmount !== undefined && metrics.avgPurchaseAmount > 0 && (
                <div className="rounded-lg bg-white p-4 shadow">
                  <p className="text-sm font-medium text-gray-500">Valor Médio por Compra</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{metrics.avgPurchaseAmount.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT</p>
                </div>
              )}
              {metrics.maxPurchaseAmount !== undefined && metrics.maxPurchaseAmount > 0 && (
                <div className="rounded-lg bg-white p-4 shadow">
                  <p className="text-sm font-medium text-gray-500">Maior Compra</p>
                  <p className="mt-1 text-xl font-bold text-blue-600">{metrics.maxPurchaseAmount.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT</p>
                  {metrics.minPurchaseAmount !== undefined && metrics.minPurchaseAmount > 0 && (
                    <p className="mt-1 text-xs text-gray-500">Menor: {metrics.minPurchaseAmount.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT</p>
                  )}
        </div>
      )}
              {metrics.avgPointsPerPurchase !== undefined && metrics.avgPointsPerPurchase > 0 && (
                <div className="rounded-lg bg-white p-4 shadow">
                  <p className="text-sm font-medium text-gray-500">Média de Pontos por Compra</p>
                  <p className="mt-1 text-xl font-bold text-purple-600">{metrics.avgPointsPerPurchase.toFixed(1)} pts</p>
          </div>
              )}
            </div>
          )}

          {/* Métricas de Quiz */}
          {campaign.quizMetrics && (
            <div className="mt-4 rounded-lg bg-white p-6 shadow">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Métricas do Quiz</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Participantes</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{campaign.quizMetrics.totalParticipants || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total de Tentativas</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">{campaign.quizMetrics.totalAttempts || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tentativas Completadas</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">{campaign.quizMetrics.completedAttempts || 0}</p>
                </div>
            <div>
                  <p className="text-sm font-medium text-gray-500">Pontos Ganhos</p>
                  <p className="mt-1 text-2xl font-bold text-purple-600">{(campaign.quizMetrics.totalPointsEarned || 0).toLocaleString("pt-MZ")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header com Imagem e QR Code */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Imagem Principal com Carrossel */}
        {getAllImages.length > 0 && (() => {
          const hasMultipleImages = getAllImages.length > 1;
          const currentImage = getAllImages[currentImageIndex] || getAllImages[0] || "";

          return (
            <div className="lg:col-span-2 rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagens da Campanha</h2>
              <div className="relative">
                <div className="relative rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                  <img
                    key={currentImageIndex}
                    src={currentImage}
                    alt={`${campaign.campaignName || campaign.campaign_name || "Campanha"} - Imagem ${currentImageIndex + 1}`}
                    className="w-full h-auto max-h-96 object-contain transition-opacity duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  
                  {/* Botões de Navegação */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAutoRotating(false);
                          setCurrentImageIndex((prev) => (prev - 1 + getAllImages.length) % getAllImages.length);
                          setTimeout(() => setIsAutoRotating(true), 10000); // Retoma após 10 segundos
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 transition-all z-10"
                        title="Imagem anterior"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAutoRotating(false);
                          setCurrentImageIndex((prev) => (prev + 1) % getAllImages.length);
                          setTimeout(() => setIsAutoRotating(true), 10000); // Retoma após 10 segundos
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 transition-all z-10"
                        title="Próxima imagem"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Indicadores de Imagem */}
                  {hasMultipleImages && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {getAllImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAutoRotating(false);
                            setCurrentImageIndex(index);
                            setTimeout(() => setIsAutoRotating(true), 10000); // Retoma após 10 segundos
                          }}
                          className={`h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? "w-6 bg-white"
                              : "w-2 bg-white bg-opacity-50 hover:bg-opacity-75"
                          }`}
                          title={`Imagem ${index + 1}`}
                        />
                      ))}
            </div>
          )}

                  {/* Contador de Imagens */}
                  {hasMultipleImages && (
                    <div className="absolute top-2 right-2 rounded-full bg-black bg-opacity-50 text-white px-2 py-1 text-xs">
                      {currentImageIndex + 1} / {getAllImages.length}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* QR Code */}
        {campaign.qrCode && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h2>
            <div ref={qrCodeRef} className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
              <QRCodeSVG
                value={campaign.qrCode}
                size={200}
                level="H"
                includeMargin={true}
                className="mb-4"
              />
              <div className="mt-4 text-center">
                <p className="text-sm font-mono font-semibold text-gray-900 break-all">
                  {campaign.qrCode}
                </p>
                <p className="mt-2 text-xs text-gray-500">Código QR da Campanha</p>
                <button
                  onClick={() => {
                    const qrCodeValue = campaign.qrCode || "";
                    if (qrCodeValue) {
                      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrCodeValue)}&ecc=H`;
                      const link = document.createElement("a");
                      link.href = qrCodeUrl;
                      link.download = `QRCode_${campaign.campaignName || campaign.campaign_number || "Campanha"}.png`;
                      link.click();
                    }
                  }}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
                >
                  📥 Baixar QR Code
                </button>
              </div>
            </div>
            </div>
          )}
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

            {(campaign.sponsorName || campaign.sponsor_name) && (
              <div>
                <p className="text-sm font-medium text-gray-500">Patrocinador</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.sponsorName || campaign.sponsor_name}</p>
              </div>
            )}

            {(campaign.typeLabel || campaign.type) && (
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo de Campanha</p>
                <div className="mt-1">
                  <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                    {campaign.typeLabel || campaign.type}
                  </span>
                  {campaign.typeDescription && (
                    <p className="mt-2 text-xs text-gray-500">{campaign.typeDescription}</p>
                  )}
                </div>
            </div>
          )}

            {campaign.campaignNumber && (
            <div>
                <p className="text-sm font-medium text-gray-500">Número da Campanha</p>
                <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {campaign.campaignNumber}
                </p>
            </div>
          )}

            {(campaign.description || campaign.reward_description) && (
              <div>
                <p className="text-sm font-medium text-gray-500">Descrição</p>
                <p className="mt-1 text-sm text-gray-900 leading-relaxed">{campaign.description || campaign.reward_description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Configurações e Datas */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações e Datas</h2>
          
          <div className="space-y-4">

            {(campaign.validFrom || campaign.valid_from || campaign.start_date) && (
            <div>
              <p className="text-sm font-medium text-gray-500">Data de Início</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {new Date(campaign.validFrom || campaign.valid_from || campaign.start_date!).toLocaleDateString("pt-MZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
            </div>
          )}

            {(campaign.validUntil || campaign.valid_until || campaign.end_date) && (
            <div>
              <p className="text-sm font-medium text-gray-500">Data de Término</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {new Date(campaign.validUntil || campaign.valid_until || campaign.end_date!).toLocaleDateString("pt-MZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              </div>
            )}

            {campaign.redemptionDeadline && (
              <div>
                <p className="text-sm font-medium text-gray-500">Prazo de Resgate</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {new Date(campaign.redemptionDeadline).toLocaleDateString("pt-MZ", {
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

      {/* Configurações de Pontos e Valores */}
      {((campaign.accumulationRate !== undefined || campaign.accumulation_rate !== undefined) ||
        (campaign.totalPointsLimit !== undefined && campaign.totalPointsLimit !== null) ||
        campaign.min_purchase_amount !== undefined ||
        campaign.max_purchase_amount !== undefined) && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Pontos e Valores</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {(campaign.accumulationRate !== undefined || campaign.accumulation_rate !== undefined) && (
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa de Acumulação</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {(campaign.accumulationRate ?? campaign.accumulation_rate)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  1 MT = {((campaign.accumulationRate ?? campaign.accumulation_rate ?? 0) * 10).toFixed(1)} pts
                </p>
              </div>
            )}

            {((campaign.totalPointsLimit !== undefined && campaign.totalPointsLimit !== null) || (campaign.total_points_limit !== undefined && campaign.total_points_limit !== null)) && (
              <div>
                <p className="text-sm font-medium text-gray-500">Limite Total de Pontos</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {(campaign.totalPointsLimit ?? campaign.total_points_limit ?? 0).toLocaleString("pt-MZ")} pts
                </p>
                {(campaign.pointsAccumulated !== undefined && campaign.pointsAccumulated !== null) && (
                  <p className="mt-1 text-xs text-gray-500">
                    {(campaign.pointsAccumulated).toLocaleString("pt-MZ")} acumulados
                  </p>
                )}
              </div>
            )}

            {campaign.min_purchase_amount !== undefined && campaign.min_purchase_amount !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Valor Mínimo de Compra</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{campaign.min_purchase_amount.toLocaleString("pt-MZ")} MT</p>
              </div>
            )}

            {campaign.max_purchase_amount !== undefined && campaign.max_purchase_amount !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Valor Máximo de Compra</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{campaign.max_purchase_amount.toLocaleString("pt-MZ")} MT</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campos Específicos por Tipo de Campanha */}
      {campaign.type && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações Específicas</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* RewardType_Auto */}
            {(campaign.type === "RewardType_Auto" || campaign.typeLabel === "Oferta Automática") && (
              <>
                {campaign.autoPointsAmount !== undefined && campaign.autoPointsAmount !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pontos Automáticos</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.autoPointsAmount} pts</p>
                  </div>
                )}
                {campaign.autoPointsCondition && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Condição</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.autoPointsCondition}</p>
                  </div>
                )}
              </>
            )}

            {/* RewardType_Draw */}
            {(campaign.type === "RewardType_Draw" || campaign.typeLabel === "Sorteio") && (
              <>
                {campaign.drawMinSpend !== undefined && campaign.drawMinSpend !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Valor Mínimo para Participar</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.drawMinSpend.toLocaleString("pt-MZ")} MT</p>
                  </div>
                )}
                {campaign.drawChancesPerPurchase !== undefined && campaign.drawChancesPerPurchase !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Chances por Compra</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.drawChancesPerPurchase}</p>
                  </div>
                )}
                {campaign.drawPrizeDescription && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Descrição do Prémio</p>
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
                        day: "numeric"
                      })}
                    </p>
                  </div>
                )}
                {campaign.drawWinnersCount !== undefined && campaign.drawWinnersCount !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Número de Ganhadores</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.drawWinnersCount}</p>
                  </div>
                )}
              </>
            )}

            {/* RewardType_Exchange */}
            {(campaign.type === "RewardType_Exchange" || campaign.typeLabel === "Troca") && (
              <>
                {campaign.rewardPointsCost !== undefined && campaign.rewardPointsCost !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Custo em Pontos</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.rewardPointsCost.toLocaleString("pt-MZ")} pts</p>
                  </div>
                )}
                {campaign.rewardDescription && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Descrição da Recompensa</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.rewardDescription}</p>
                  </div>
                )}
                {campaign.rewardStock !== undefined && campaign.rewardStock !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estoque Disponível</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.rewardStock} unidades</p>
                  </div>
                )}
                {campaign.rewardStockRedeemed !== undefined && campaign.rewardStockRedeemed !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estoque Resgatado</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.rewardStockRedeemed} unidades</p>
                  </div>
                )}
              </>
            )}

            {/* RewardType_Quiz */}
            {(campaign.type === "RewardType_Quiz" || campaign.typeLabel === "Questões") && (
              <>
                {campaign.quizPointsPerCorrect !== undefined && campaign.quizPointsPerCorrect !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pontos por Resposta Correta</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.quizPointsPerCorrect} pts</p>
                  </div>
                )}
                {campaign.quizMaxAttempts !== undefined && campaign.quizMaxAttempts !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tentativas Máximas</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.quizMaxAttempts}</p>
                  </div>
                )}
                {campaign.quizTimeLimitSeconds !== undefined && campaign.quizTimeLimitSeconds !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tempo Limite</p>
                    <p className="mt-1 text-sm text-gray-900">{Math.floor(campaign.quizTimeLimitSeconds / 60)} minutos</p>
                  </div>
                )}
                {campaign.quizQuestions && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Total de Questões</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {Array.isArray(campaign.quizQuestions) ? campaign.quizQuestions.length : "N/A"} questões
                    </p>
                  </div>
                )}
              </>
            )}

            {/* RewardType_Referral */}
            {(campaign.type === "RewardType_Referral" || campaign.typeLabel === "Indicação") && (
              <>
                {campaign.referralPointsPerReferral !== undefined && campaign.referralPointsPerReferral !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pontos por Indicação</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.referralPointsPerReferral} pts</p>
                  </div>
                )}
                {campaign.referralMinReferrals !== undefined && campaign.referralMinReferrals !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mínimo de Indicações</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.referralMinReferrals}</p>
                  </div>
                )}
                {campaign.referralBonusPoints !== undefined && campaign.referralBonusPoints !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pontos Bônus</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.referralBonusPoints} pts</p>
                  </div>
                )}
                {campaign.referralCode && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Código de Indicação</p>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{campaign.referralCode}</p>
                  </div>
                )}
              </>
            )}

            {/* RewardType_Challenge */}
            {(campaign.type === "RewardType_Challenge" || campaign.typeLabel === "Desafio") && (
              <>
                {campaign.challengeObjective && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Objetivo do Desafio</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.challengeObjective}</p>
                  </div>
                )}
                {campaign.challengeTargetValue !== undefined && campaign.challengeTargetValue !== null && (
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
                {campaign.challengeRewardPoints !== undefined && campaign.challengeRewardPoints !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pontos de Recompensa</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.challengeRewardPoints} pts</p>
                  </div>
                )}
                {campaign.challengeBonusReward && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Recompensa Bônus</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.challengeBonusReward}</p>
                  </div>
                )}
              </>
            )}

            {/* RewardType_Party */}
            {(campaign.type === "RewardType_Party" || campaign.typeLabel === "Votação") && (
              <>
                {campaign.partyPointsPerVote !== undefined && campaign.partyPointsPerVote !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pontos por Voto</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.partyPointsPerVote} pts</p>
                  </div>
                )}
                {campaign.partyVotingDeadline && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Prazo de Votação</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(campaign.partyVotingDeadline).toLocaleDateString("pt-MZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
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
                        day: "numeric"
                      })}
                    </p>
                  </div>
                )}
                {campaign.partyWinnerReward && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Recompensa do Vencedor</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.partyWinnerReward}</p>
                  </div>
                )}
                {campaign.partyVotingOptions && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Opções de Votação</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {Array.isArray(campaign.partyVotingOptions) 
                        ? `${campaign.partyVotingOptions.length} opções`
                        : "N/A"}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* RewardType_Voucher */}
            {(campaign.type === "RewardType_Voucher" || campaign.typeLabel === "Voucher") && (
              <>
                {campaign.voucherCode && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Código do Voucher</p>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{campaign.voucherCode}</p>
                  </div>
                )}
                {campaign.voucherValue !== undefined && campaign.voucherValue !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Valor do Voucher</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.voucherValue.toLocaleString("pt-MZ")} MZN</p>
                  </div>
                )}
                {campaign.voucherType && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipo</p>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{campaign.voucherType}</p>
                  </div>
                )}
                {campaign.voucherCategory && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Categoria</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.voucherCategory}</p>
                  </div>
                )}
                {campaign.voucherExpiryDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data de Expiração</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(campaign.voucherExpiryDate).toLocaleDateString("pt-MZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                )}
                {campaign.voucherUsageLimit !== undefined && campaign.voucherUsageLimit !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Limite de Uso</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.voucherUsageLimit} vezes</p>
                  </div>
                )}
                {campaign.voucherMinPurchase !== undefined && campaign.voucherMinPurchase !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Compra Mínima</p>
                    <p className="mt-1 text-sm text-gray-900">{campaign.voucherMinPurchase.toLocaleString("pt-MZ")} MT</p>
                  </div>
                )}
                {((campaign.voucherPercentage !== undefined && campaign.voucherPercentage !== null) || 
                  (campaign.voucherFixedAmount !== undefined && campaign.voucherFixedAmount !== null)) && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tipo de Desconto</p>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {campaign.voucherPercentage !== undefined && campaign.voucherPercentage !== null ? "Percentual" : "Fixo"}
                    </p>
                  </div>
                )}
                {campaign.voucherPercentage !== undefined && campaign.voucherPercentage !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Valor do Desconto (Percentual)</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {campaign.voucherPercentage}%
                    </p>
                  </div>
                )}
                {campaign.voucherFixedAmount !== undefined && campaign.voucherFixedAmount !== null && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Valor do Desconto (Fixo)</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {campaign.voucherFixedAmount.toLocaleString("pt-MZ")} MT
                    </p>
                  </div>
                )}
                {(campaign.voucherSingleUse !== undefined || campaign.voucherRequiresCode !== undefined) && (
                  <div className="md:col-span-2 flex gap-4">
                    {campaign.voucherSingleUse !== undefined && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={campaign.voucherSingleUse || false}
                          disabled
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Uso Único</span>
                      </div>
                    )}
                    {campaign.voucherRequiresCode !== undefined && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={campaign.voucherRequiresCode || false}
                          disabled
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Código Obrigatório</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Outras Configurações */}
      {(campaign.vipOnly !== undefined || campaign.newCustomersOnly !== undefined || campaign.communicationBudget !== undefined) && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Outras Configurações</h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaign.vipOnly !== undefined && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={campaign.vipOnly || false}
                  disabled
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Apenas VIP</span>
              </div>
            )}
            {campaign.newCustomersOnly !== undefined && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={campaign.newCustomersOnly || false}
                  disabled
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Apenas Novos Clientes</span>
              </div>
            )}
            {campaign.communicationBudget !== undefined && campaign.communicationBudget > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Orçamento de Comunicação</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.communicationBudget.toLocaleString("pt-MZ")} MT</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {campaign && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false);
          }}
          onConfirm={handleDeleteConfirm}
          title="Confirmar Eliminação"
          message={`Tem certeza que deseja eliminar esta campanha?\n\nNome: ${campaign.campaignName || campaign.campaign_name || campaign.name || "-"}\nEstabelecimento: ${establishmentName}\n\nEsta ação não pode ser desfeita.`}
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

