import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { campaignsService, Campaign } from "@/services/campaigns.service";
import { establishmentService } from "@/services/establishment.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { QRCodeSVG } from "qrcode.react";

function CampaignDetailsPageContent() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [establishment, setEstablishment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
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

    intervalRef.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imageCount);
    }, 5000);

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
          onClick={() => router.push("/campaigns")}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Voltar para Campanhas
        </button>
      </div>
    );
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return new Intl.DateTimeFormat("pt-MZ", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return "-";
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "-";
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push("/campaigns")}
          className="mb-4 text-blue-600 hover:text-blue-900 flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para Campanhas
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {campaign.campaignName || campaign.campaign_name || campaign.name || "Campanha"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {campaign.description || campaign.reward_description || ""}
            </p>
          </div>
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
        </div>
      </div>

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
                  
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAutoRotating(false);
                          setCurrentImageIndex((prev) => (prev - 1 + getAllImages.length) % getAllImages.length);
                          setTimeout(() => setIsAutoRotating(true), 10000);
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
                          setTimeout(() => setIsAutoRotating(true), 10000);
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

                  {hasMultipleImages && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {getAllImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAutoRotating(false);
                            setCurrentImageIndex(index);
                            setTimeout(() => setIsAutoRotating(true), 10000);
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

            <div>
              <p className="text-sm font-medium text-gray-500">Período de Validade</p>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(campaign.validFrom || campaign.valid_from)} até {formatDate(campaign.validUntil || campaign.valid_until)}
              </p>
            </div>

            {campaign.rewardDescription && (
              <div>
                <p className="text-sm font-medium text-gray-500">Descrição da Recompensa</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.rewardDescription}</p>
              </div>
            )}

            {campaign.rewardPointsCost !== undefined && campaign.rewardPointsCost > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Custo em Pontos</p>
                <p className="mt-1 text-2xl font-bold text-purple-600">{campaign.rewardPointsCost.toLocaleString("pt-MZ")} pts</p>
              </div>
            )}

            {campaign.rewardValueMt !== undefined && campaign.rewardValueMt > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Valor da Recompensa</p>
                <p className="mt-1 text-xl font-bold text-green-600">{formatCurrency(campaign.rewardValueMt)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes Adicionais</h2>
          
          <div className="space-y-4">
            {campaign.accumulationRate !== undefined && campaign.accumulationRate > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa de Acumulação</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.accumulationRate}%</p>
              </div>
            )}

            {campaign.dailyLimitPerClient !== undefined && campaign.dailyLimitPerClient > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Limite Diário por Cliente</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.dailyLimitPerClient}</p>
              </div>
            )}

            {campaign.campaignLimitPerClient !== undefined && campaign.campaignLimitPerClient > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Limite Total por Cliente</p>
                <p className="mt-1 text-sm text-gray-900">{campaign.campaignLimitPerClient}</p>
              </div>
            )}

            {campaign.notes && (
              <div>
                <p className="text-sm font-medium text-gray-500">Observações</p>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{campaign.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informações do Estabelecimento */}
      {campaign.establishment && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Estabelecimento</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Nome</p>
              <p className="mt-1 text-sm text-gray-900">{campaign.establishment.name || "-"}</p>
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

export default function CampaignDetailsPage() {
  return (
    <ProtectedRoute>
      <CampaignDetailsPageContent />
    </ProtectedRoute>
  );
}

