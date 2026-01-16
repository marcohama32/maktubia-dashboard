import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { campaignsService, Campaign, campaignPurchasesService } from "@/services/campaigns.service";
import { drawCampaignsService } from "@/services/drawCampaigns.service";
import { establishmentService } from "@/services/establishment.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant, isClient } from "@/utils/roleUtils";
import { API_BASE_URL } from "@/services/api";

// Função para traduzir tipos de campanha para português
const translateCampaignType = (type: string | undefined | null): string => {
  if (!type) return "Não definido";
  
  const typeMap: { [key: string]: string } = {
    'RewardType_Auto': 'Oferta Automática',
    'RewardType_Draw': 'Sorteio',
    'RewardType_Exchange': 'Troca',
    'RewardType_Quiz': 'Questões',
    'RewardType_Referral': 'Indicação',
    'RewardType_Challenge': 'Desafio',
    'RewardType_Party': 'Votação',
    'RewardType_Voucher': 'Voucher',
    'RewardType_Booking': 'Oferta de Desconto por Marcação',
    'points_per_spend': 'Pontos por Compra',
    'points': 'Pontos',
    'vip_treatment': 'Tratamento VIP',
    'buy_get': 'Compre e Ganhe',
    'bonus_multiplier': 'Multiplicador de Bônus'
  };
  
  return typeMap[type] || type;
};

export default function CampaignDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
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
  const [participations, setParticipations] = useState<any[]>([]);
  const [loadingParticipations, setLoadingParticipations] = useState(false);
  const [participationStatusFilter, setParticipationStatusFilter] = useState<'pending' | 'used' | 'expired' | 'all'>('all');
  const [participationSearch, setParticipationSearch] = useState<string>("");
  const [participationStats, setParticipationStats] = useState<{ total: number; pending: number; used: number; expired: number }>({
    total: 0,
    pending: 0,
    used: 0,
    expired: 0
  });
  const [markingAsUsedId, setMarkingAsUsedId] = useState<string | number | null>(null);
  
  // Estados para histórico de compras (campanhas automáticas - clientes)
  const [myCampaignPurchases, setMyCampaignPurchases] = useState<any[]>([]);
  const [loadingMyPurchases, setLoadingMyPurchases] = useState(false);
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);
  
  // Estados para pagamentos (admin/merchant)
  const [pendingPurchases, setPendingPurchases] = useState<any[]>([]);
  const [loadingPendingPurchases, setLoadingPendingPurchases] = useState(false);
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState<'pending' | 'validated' | 'rejected' | 'all'>('pending');
  const [purchaseStats, setPurchaseStats] = useState<{ total: number; pending: number; validated: number; rejected: number }>({
    total: 0,
    pending: 0,
    validated: 0,
    rejected: 0
  });
  const [validatingPurchaseId, setValidatingPurchaseId] = useState<string | number | null>(null);
  const [rejectingPurchaseId, setRejectingPurchaseId] = useState<string | number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Estados para compras de sorteio (admin/merchant)
  const [drawPurchases, setDrawPurchases] = useState<any[]>([]);
  const [loadingDrawPurchases, setLoadingDrawPurchases] = useState(false);
  const [drawPurchaseStatusFilter, setDrawPurchaseStatusFilter] = useState<'pending' | 'validated' | 'rejected' | 'all'>('pending');
  const [drawPurchaseStats, setDrawPurchaseStats] = useState<{ total: number; pending: number; validated: number; rejected: number }>({
    total: 0,
    pending: 0,
    validated: 0,
    rejected: 0
  });
  const [validatingDrawPurchaseId, setValidatingDrawPurchaseId] = useState<string | number | null>(null);
  const [rejectingDrawPurchaseId, setRejectingDrawPurchaseId] = useState<string | number | null>(null);
  const [drawRejectionReason, setDrawRejectionReason] = useState<string>("");
  const [showDrawRejectModal, setShowDrawRejectModal] = useState(false);

  useEffect(() => {
    if (id) {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => loadCampaign(id as string), { timeout: 100 });
      } else {
        setTimeout(() => loadCampaign(id as string), 50);
      }
    }
  }, [id]);

  // Carregar histórico de compras quando a campanha for automática e o usuário for cliente
  useEffect(() => {
    if (campaign && isClient(user) && campaign.type === 'RewardType_Auto') {
      const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
      if (campaignId) {
        loadMyCampaignPurchases(campaignId);
      }
    }
  }, [campaign, user]);

  // Carregar pagamentos quando a campanha for automática e o usuário for admin/merchant
  useEffect(() => {
    if (campaign && (isAdmin(user) || isMerchant(user)) && campaign.type === 'RewardType_Auto') {
      const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
      if (campaignId) {
        loadPendingPurchases(campaignId, purchaseStatusFilter);
      }
    }
  }, [campaign, user, purchaseStatusFilter]);

  // Carregar compras de sorteio quando a campanha for de sorteio e o usuário for admin/merchant
  useEffect(() => {
    if (campaign && (isAdmin(user) || isMerchant(user)) && campaign.type === 'RewardType_Draw') {
      const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
      if (campaignId) {
        // Carregar com status 'all' para obter todas as estatísticas
        loadDrawPurchases(campaignId, 'all');
      }
    }
  }, [campaign, user]);

  // Carregar participações quando a campanha for de reserva e o usuário for admin/merchant
  useEffect(() => {
    if (campaign && (isAdmin(user) || isMerchant(user)) && 
        (campaign.type === 'RewardType_Booking' || campaign.type === 'Oferta de Desconto por Marcação')) {
      const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
      if (campaignId) {
        loadParticipations(campaignId, participationStatusFilter, participationSearch);
      }
    }
  }, [campaign, user, participationStatusFilter, participationSearch]);

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
      
      // Para campanhas de sorteio, usar o endpoint específico que retorna vencedores
      let data;
      try {
        data = await campaignsService.getById(campaignId);
        // Se for campanha de sorteio e não tiver vencedores, tentar carregar do endpoint específico
        if (data.type === 'RewardType_Draw' && !data.winners && (isAdmin(user) || isMerchant(user))) {
          try {
            const drawData = await drawCampaignsService.getById(campaignId);
            if (drawData.winners) {
              data.winners = drawData.winners;
            }
            if (drawData.prizes) {
              data.prizes = drawData.prizes;
            }
            if (drawData.draw_executed !== undefined) {
              data.draw_executed = drawData.draw_executed;
            }
          } catch (drawErr) {
            console.warn("Erro ao carregar dados específicos de sorteio:", drawErr);
          }
        }
      } catch (err) {
        // Se falhar, tentar endpoint específico de sorteio
        if (err instanceof Error && err.message?.includes('404')) {
          try {
            data = await drawCampaignsService.getById(campaignId);
          } catch (drawErr) {
            throw err; // Lançar erro original
          }
        } else {
          throw err;
        }
      }
      
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
      
      // Carregar participações (códigos de reserva) se for admin ou merchant
      if ((isAdmin(user) || isMerchant(user)) && data.participations) {
        setParticipations(data.participations);
      } else if (isAdmin(user) || isMerchant(user)) {
        // Se não vier nas participações, buscar separadamente
        loadParticipations(campaignId, participationStatusFilter, participationSearch);
      }
      
      // Para campanhas de sorteio, atualizar drawPurchaseStats se disponível
      if (data.type === 'RewardType_Draw' && data.drawPurchaseStatsForAdmin && (isAdmin(user) || isMerchant(user))) {
        setDrawPurchaseStats({
          total: data.drawPurchaseStatsForAdmin.total || 0,
          pending: data.drawPurchaseStatsForAdmin.pending || 0,
          validated: data.drawPurchaseStatsForAdmin.validated || 0,
          rejected: data.drawPurchaseStatsForAdmin.rejected || 0
        });
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

  const loadMyCampaignPurchases = async (campaignId: string | number) => {
    try {
      setLoadingMyPurchases(true);
      const response = await campaignPurchasesService.getMyPurchases(campaignId, {
        page: 1,
        limit: 100
      });
      const purchases = response?.data || response || [];
      setMyCampaignPurchases(Array.isArray(purchases) ? purchases : []);
    } catch (err: any) {
      console.error("Erro ao carregar histórico de compras:", err);
      setMyCampaignPurchases([]);
    } finally {
      setLoadingMyPurchases(false);
    }
  };

  const loadPendingPurchases = async (campaignId: string | number, status: 'pending' | 'validated' | 'rejected' | 'all' = 'pending') => {
    try {
      setLoadingPendingPurchases(true);
      const response = await campaignPurchasesService.getPendingPurchases(campaignId, {
        page: 1,
        limit: 1000,
        status: status
      });
      const purchases = response?.data || response || [];
      setPendingPurchases(Array.isArray(purchases) ? purchases : []);
      
      // Atualizar estatísticas se disponíveis
      if (response?.stats) {
        setPurchaseStats({
          total: response.stats.total || 0,
          pending: response.stats.pending || 0,
          validated: response.stats.validated || 0,
          rejected: response.stats.rejected || 0
        });
      }
    } catch (err: any) {
      console.error("Erro ao carregar pagamentos:", err);
      setPendingPurchases([]);
    } finally {
      setLoadingPendingPurchases(false);
    }
  };

  const handleValidatePurchase = async (purchaseId: string | number) => {
    try {
      setValidatingPurchaseId(purchaseId);
      await campaignPurchasesService.validatePurchase(purchaseId);
      
      // Recarregar pagamentos
      const campaignId = campaign?.campaign_id || campaign?.id || campaign?.campaign_number;
      if (campaignId) {
        await loadPendingPurchases(campaignId, purchaseStatusFilter);
      }
      
      setAlertConfig({
        title: "Sucesso!",
        message: "Pagamento validado com sucesso! Os pontos foram creditados ao cliente.",
        type: "success",
      });
      setAlertModalOpen(true);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao validar pagamento.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setValidatingPurchaseId(null);
    }
  };

  const handleRejectPurchase = async (purchaseId: string | number) => {
    setRejectingPurchaseId(purchaseId);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingPurchaseId) return;
    
    try {
      await campaignPurchasesService.rejectPurchase(rejectingPurchaseId, rejectionReason);
      
      // Recarregar pagamentos
      const campaignId = campaign?.campaign_id || campaign?.id || campaign?.campaign_number;
      if (campaignId) {
        await loadPendingPurchases(campaignId, purchaseStatusFilter);
      }
      
      setAlertConfig({
        title: "Sucesso!",
        message: "Pagamento rejeitado com sucesso.",
        type: "success",
      });
      setAlertModalOpen(true);
      setShowRejectModal(false);
      setRejectionReason("");
      setRejectingPurchaseId(null);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao rejeitar pagamento.",
        type: "error",
      });
      setAlertModalOpen(true);
    }
  };

  // Funções para compras de sorteio
  const loadDrawPurchases = async (campaignId: string | number, status: 'pending' | 'validated' | 'rejected' | 'all' = 'pending') => {
    try {
      setLoadingDrawPurchases(true);
      const response = await drawCampaignsService.getPurchases(campaignId, {
        page: 1,
        limit: 1000,
        status: status
      });
      const purchases = response?.data || response || [];
      setDrawPurchases(Array.isArray(purchases) ? purchases : []);
      
      // Atualizar estatísticas se disponíveis
      if (response?.stats) {
        setDrawPurchaseStats({
          total: response.stats.total || 0,
          pending: response.stats.pending || 0,
          validated: response.stats.validated || 0,
          rejected: response.stats.rejected || 0
        });
      }
    } catch (err: any) {
      console.error("Erro ao carregar compras de sorteio:", err);
      setDrawPurchases([]);
    } finally {
      setLoadingDrawPurchases(false);
    }
  };

  const handleValidateDrawPurchase = async (purchaseId: string | number) => {
    try {
      setValidatingDrawPurchaseId(purchaseId);
      await drawCampaignsService.validatePurchase(purchaseId);
      
      // Recarregar compras
      const campaignId = campaign?.campaign_id || campaign?.id || campaign?.campaign_number;
      if (campaignId) {
        await loadDrawPurchases(campaignId, drawPurchaseStatusFilter);
      }
      
      setAlertConfig({
        title: "Sucesso!",
        message: "Compra validada com sucesso! As chances do cliente no sorteio aumentaram!",
        type: "success",
      });
      setAlertModalOpen(true);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao validar compra.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setValidatingDrawPurchaseId(null);
    }
  };

  const handleRejectDrawPurchase = async (purchaseId: string | number) => {
    setRejectingDrawPurchaseId(purchaseId);
    setShowDrawRejectModal(true);
  };

  const handleConfirmDrawReject = async () => {
    if (!rejectingDrawPurchaseId) return;
    
    try {
      await drawCampaignsService.rejectPurchase(rejectingDrawPurchaseId, drawRejectionReason);
      
      // Recarregar compras
      const campaignId = campaign?.campaign_id || campaign?.id || campaign?.campaign_number;
      if (campaignId) {
        await loadDrawPurchases(campaignId, drawPurchaseStatusFilter);
      }
      
      setAlertConfig({
        title: "Sucesso!",
        message: "Compra rejeitada com sucesso.",
        type: "success",
      });
      setAlertModalOpen(true);
      setShowDrawRejectModal(false);
      setDrawRejectionReason("");
      setRejectingDrawPurchaseId(null);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao rejeitar compra.",
        type: "error",
      });
      setAlertModalOpen(true);
    }
  };

  const loadParticipations = async (campaignId: string | number, status: 'pending' | 'used' | 'expired' | 'all' = 'all', search: string = "") => {
    try {
      setLoadingParticipations(true);
      const data = await campaignsService.getCampaignParticipations(campaignId, { status, search });
      setParticipations(data);
      
      // Calcular estatísticas (buscar todas para ter estatísticas corretas)
      try {
        const allData = await campaignsService.getCampaignParticipations(campaignId, { status: 'all', search: '' });
        const stats = {
          total: allData.length,
          pending: allData.filter((p: any) => p.status === 'pending' && (!p.expiresAt || new Date(p.expiresAt) > new Date())).length,
          used: allData.filter((p: any) => p.status === 'used').length,
          expired: allData.filter((p: any) => p.status === 'expired' || (p.expiresAt && new Date(p.expiresAt) <= new Date())).length
        };
        setParticipationStats(stats);
      } catch (statsErr) {
        console.warn("Erro ao calcular estatísticas:", statsErr);
      }
    } catch (err: any) {
      console.warn("Erro ao carregar participações:", err);
      setParticipations([]);
    } finally {
      setLoadingParticipations(false);
    }
  };

  const handleMarkReservationAsUsed = async (participationId: string | number) => {
    if (!campaign) return;
    
    try {
      setMarkingAsUsedId(participationId);
      const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
      await campaignsService.markReservationAsUsed(campaignId, participationId);
      
      // Recarregar participações e campanha (para atualizar métricas)
      await Promise.all([
        loadParticipations(campaignId, participationStatusFilter, participationSearch),
        loadCampaign(campaignId)
      ]);
      
      setAlertConfig({
        title: "Sucesso!",
        message: "Reserva marcada como usada com sucesso!",
        type: "success",
      });
      setAlertModalOpen(true);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao marcar reserva como usada.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setMarkingAsUsedId(null);
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
    
    // Para campanhas automáticas, usar purchaseStats se disponível (mais atualizado)
    if (campaign.type === 'RewardType_Auto' && purchaseStats) {
      return {
        totalParticipants: campaign.metrics?.totalParticipants ?? 0, // Usar métricas do backend (clientes únicos)
        totalPurchases: purchaseStats.total,
        confirmedPurchases: purchaseStats.validated,
        pendingPurchases: purchaseStats.pending,
        rejectedPurchases: purchaseStats.rejected,
        totalPointsEarned: campaign.metrics?.totalPointsEarned ?? campaign.total_points_given ?? 0,
        totalPointsEarnedConfirmed: campaign.metrics?.totalPointsEarnedConfirmed ?? 0,
        totalRevenue: campaign.metrics?.totalRevenue ?? campaign.total_revenue ?? 0,
        totalRevenueConfirmed: campaign.metrics?.totalRevenueConfirmed ?? 0,
        avgPurchaseAmount: campaign.metrics?.avgPurchaseAmount ?? 0,
        maxPurchaseAmount: campaign.metrics?.maxPurchaseAmount ?? 0,
        minPurchaseAmount: campaign.metrics?.minPurchaseAmount ?? 0,
        avgPointsPerPurchase: campaign.metrics?.avgPointsPerPurchase ?? 0,
      };
    }
    
    // Para campanhas de sorteio, usar drawPurchaseStats
    if (campaign.type === 'RewardType_Draw') {
      // Priorizar métricas do backend (campaign.metrics), depois drawPurchaseStatsForAdmin, depois drawPurchaseStats do estado
      const winnersCount = campaign.winners?.length || 0;
      const prizesCount = campaign.prizes?.length || 0;
      
      // Usar métricas do backend se disponível (mais confiável)
      if (campaign.metrics) {
        return {
          totalParticipants: campaign.metrics.totalParticipants ?? 0,
          totalPurchases: campaign.metrics.totalPurchases ?? 0,
          confirmedPurchases: campaign.metrics.confirmedPurchases ?? 0,
          pendingPurchases: campaign.metrics.pendingPurchases ?? 0,
          rejectedPurchases: campaign.metrics.rejectedPurchases ?? 0,
          totalPointsEarned: campaign.metrics.totalPointsEarned ?? 0,
          totalPointsEarnedConfirmed: campaign.metrics.totalPointsEarnedConfirmed ?? 0,
          totalRevenue: campaign.metrics.totalRevenue ?? 0,
          totalRevenueConfirmed: campaign.metrics.totalRevenueConfirmed ?? 0,
          avgPurchaseAmount: campaign.metrics.avgPurchaseAmount ?? 0,
          maxPurchaseAmount: campaign.metrics.maxPurchaseAmount ?? 0,
          minPurchaseAmount: campaign.metrics.minPurchaseAmount ?? 0,
          avgPointsPerPurchase: campaign.metrics.avgPointsPerPurchase ?? 0,
          // Métricas específicas de sorteio
          winnersCount: winnersCount,
          prizesCount: prizesCount,
          drawExecuted: campaign.draw_executed || false,
          totalValidatedPurchases: campaign.metrics.confirmedPurchases ?? 0,
        };
      }
      
      // Fallback para drawPurchaseStatsForAdmin ou drawPurchaseStats
      const drawStats = campaign.drawPurchaseStatsForAdmin || drawPurchaseStats;
      const stats = campaign.stats; // stats do drawCampaignController
      
      // Usar dados do drawStats se disponível, senão usar stats, senão usar 0
      const totalValidatedPurchases = drawStats?.validated ?? 
                                     stats?.validatedPurchases ?? 
                                     drawStats?.validated_count ?? 
                                     0;
      const totalPendingPurchases = drawStats?.pending ?? 
                                   stats?.pendingPurchases ?? 
                                   drawStats?.pending_count ?? 
                                   0;
      const totalRejectedPurchases = drawStats?.rejected ?? 
                                    drawStats?.rejected_count ?? 
                                    0;
      const totalPurchases = drawStats?.total ?? 
                            stats?.totalPurchases ?? 
                            drawStats?.total_count ?? 
                            0;
      
      // Calcular participantes únicos - tentar várias fontes
      const uniqueParticipants = stats?.uniqueParticipants ?? 
                                 drawStats?.unique_participants ??
                                 (campaign.metrics?.totalParticipants || 0);
      
      // Calcular receita total - somar valores das compras validadas
      const totalRevenue = drawStats?.total_amount || 
                          drawStats?.validated_amount ||
                          campaign.metrics?.totalRevenue || 
                          0;
      
      return {
        totalParticipants: uniqueParticipants,
        totalPurchases: totalPurchases,
        confirmedPurchases: totalValidatedPurchases,
        pendingPurchases: totalPendingPurchases,
        rejectedPurchases: totalRejectedPurchases,
        totalPointsEarned: campaign.metrics?.totalPointsEarned ?? 0,
        totalPointsEarnedConfirmed: campaign.metrics?.totalPointsEarnedConfirmed ?? 0,
        totalRevenue: totalRevenue,
        totalRevenueConfirmed: campaign.metrics?.totalRevenueConfirmed || 0,
        avgPurchaseAmount: campaign.metrics?.avgPurchaseAmount ?? 0,
        maxPurchaseAmount: campaign.metrics?.maxPurchaseAmount ?? 0,
        minPurchaseAmount: campaign.metrics?.minPurchaseAmount ?? 0,
        avgPointsPerPurchase: campaign.metrics?.avgPointsPerPurchase ?? 0,
        // Métricas específicas de sorteio
        winnersCount: winnersCount,
        prizesCount: prizesCount,
        drawExecuted: campaign.draw_executed || false,
        totalValidatedPurchases: totalValidatedPurchases,
      };
    }
    
    // Para campanhas de reserva/marcação, usar métricas do backend ou participationStats
    const isBookingCampaign = campaign.type === 'RewardType_Booking' || 
                              campaign.type === 'Oferta de Desconto por Marcação' ||
                              campaign.type?.toLowerCase()?.includes('booking') ||
                              campaign.type?.toLowerCase()?.includes('reserva');
    
    if (isBookingCampaign) {
      // Usar métricas do backend se disponíveis, senão usar participationStats
      if (campaign.metrics) {
        return {
          totalParticipants: campaign.metrics.totalParticipants ?? campaign.participationsCount ?? 0,
          totalPurchases: campaign.metrics.totalPurchases ?? campaign.participationsCount ?? 0,
          confirmedPurchases: campaign.metrics.confirmedPurchases ?? participationStats.used ?? 0,
          pendingPurchases: campaign.metrics.pendingPurchases ?? participationStats.pending ?? 0,
          rejectedPurchases: campaign.metrics.rejectedPurchases ?? participationStats.expired ?? 0,
          totalPointsEarned: campaign.metrics.totalPointsEarned ?? 0,
          totalPointsEarnedConfirmed: campaign.metrics.totalPointsEarnedConfirmed ?? 0,
          totalRevenue: campaign.metrics.totalRevenue ?? 0,
          totalRevenueConfirmed: campaign.metrics.totalRevenueConfirmed ?? 0,
          avgPurchaseAmount: campaign.metrics.avgPurchaseAmount ?? 0,
          maxPurchaseAmount: campaign.metrics.maxPurchaseAmount ?? 0,
          minPurchaseAmount: campaign.metrics.minPurchaseAmount ?? 0,
          avgPointsPerPurchase: campaign.metrics.avgPointsPerPurchase ?? 0,
        };
      } else {
        // Fallback para participationStats
        return {
          totalParticipants: campaign.participationsCount ?? participationStats.total ?? 0,
          totalPurchases: campaign.participationsCount ?? participationStats.total ?? 0,
          confirmedPurchases: participationStats.used ?? 0,
          pendingPurchases: participationStats.pending ?? 0,
          rejectedPurchases: participationStats.expired ?? 0,
          totalPointsEarned: 0,
          totalPointsEarnedConfirmed: 0,
          totalRevenue: 0,
          totalRevenueConfirmed: 0,
          avgPurchaseAmount: 0,
          maxPurchaseAmount: 0,
          minPurchaseAmount: 0,
          avgPointsPerPurchase: 0,
        };
      }
    }
    
    // Usar métricas da API se disponíveis, senão usar campos legados
    if (campaign.metrics) {
      return {
        totalParticipants: campaign.metrics.totalParticipants ?? campaign.participationsCount ?? campaign.total_uses ?? 0,
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
    
    // Fallback para campos legados
    return {
      totalParticipants: campaign.participationsCount ?? campaign.participations_count ?? campaign.total_uses ?? 0,
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
          <div className={`grid gap-4 ${isAdmin(user) || isMerchant(user) ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-1'}`}>
            <div className="rounded-lg bg-white p-6 shadow">
              <p className="text-sm font-medium text-gray-500">Participantes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{metrics.totalParticipants || 0}</p>
              {metrics.totalParticipants === 0 && (
                <p className="mt-1 text-xs text-gray-400 italic">
                  Nenhum participante ainda
                </p>
              )}
              {metrics.totalParticipants > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Clientes únicos na campanha
                </p>
              )}
            </div>
            {/* Métricas sensíveis - apenas para admin e merchant */}
            {(isAdmin(user) || isMerchant(user)) && (
              <>
                {(() => {
                  const isBookingCampaign = campaign.type === 'RewardType_Booking' || 
                                           campaign.type === 'Oferta de Desconto por Marcação' ||
                                           campaign.type?.toLowerCase()?.includes('booking') ||
                                           campaign.type?.toLowerCase()?.includes('reserva');
                  
                  const isDrawCampaign = campaign.type === 'RewardType_Draw';
                  
                  if (isBookingCampaign) {
                    // Para campanhas de marcação: mostrar reservas
                    return (
                      <>
                        <div className="rounded-lg bg-white p-6 shadow">
                          <p className="text-sm font-medium text-gray-500">Total de Reservas</p>
                          <p className="mt-2 text-3xl font-bold text-blue-600">{metrics.totalPurchases || 0}</p>
                          {metrics.confirmedPurchases !== undefined && (
                            <p className="mt-1 text-xs text-gray-500">
                              {metrics.confirmedPurchases} usadas, {metrics.pendingPurchases || 0} pendentes, {metrics.rejectedPurchases || 0} expiradas
                            </p>
                          )}
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow">
                          <p className="text-sm font-medium text-gray-500">Pontos Distribuídos</p>
                          <p className="mt-2 text-3xl font-bold text-purple-600">{(metrics.totalPointsEarned || 0).toLocaleString("pt-MZ")}</p>
                          {metrics.totalPointsEarnedConfirmed !== undefined && metrics.totalPointsEarnedConfirmed > 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                              {(metrics.totalPointsEarnedConfirmed).toLocaleString("pt-MZ")} de reservas usadas
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
                      </>
                    );
                  } else if (isDrawCampaign) {
                    // Para campanhas de sorteio: mostrar compras validadas, prêmios e vencedores
                    const confirmedPurchases = metrics?.confirmedPurchases ?? 0;
                    const pendingPurchases = metrics?.pendingPurchases ?? 0;
                    const rejectedPurchases = metrics?.rejectedPurchases ?? 0;
                    const totalPurchases = metrics?.totalPurchases ?? 0;
                    const prizesCount = metrics?.prizesCount ?? campaign?.prizes?.length ?? 0;
                    const winnersCount = metrics?.winnersCount ?? campaign?.winners?.length ?? 0;
                    const drawExecuted = metrics?.drawExecuted ?? campaign?.draw_executed ?? false;
                    const totalRevenue = metrics?.totalRevenue ?? 0;
                    
                    return (
                      <>
                        <div className="rounded-lg bg-white p-6 shadow">
                          <p className="text-sm font-medium text-gray-500">Compras Validadas</p>
                          <p className="mt-2 text-3xl font-bold text-green-600">{confirmedPurchases}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {pendingPurchases} pendentes, {rejectedPurchases} rejeitadas
                          </p>
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow">
                          <p className="text-sm font-medium text-gray-500">Prêmios</p>
                          <p className="mt-2 text-3xl font-bold text-yellow-600">{prizesCount}</p>
                          {drawExecuted && winnersCount > 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                              {winnersCount} vencedores selecionados
                            </p>
                          )}
                          {!drawExecuted && (
                            <p className="mt-1 text-xs text-gray-500">
                              Sorteio ainda não executado
                            </p>
                          )}
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow">
                          <p className="text-sm font-medium text-gray-500">Total de Compras</p>
                          <p className="mt-2 text-3xl font-bold text-blue-600">{totalPurchases}</p>
                          {totalRevenue > 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                              {totalRevenue.toLocaleString("pt-MZ")} MT em compras
                            </p>
                          )}
                          {totalPurchases === 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                              Nenhuma compra registrada ainda
                            </p>
                          )}
                        </div>
                      </>
                    );
                  } else {
                    // Para outras campanhas (automáticas, etc.): mostrar compras
                    return (
                      <>
                        <div className="rounded-lg bg-white p-6 shadow">
                          <p className="text-sm font-medium text-gray-500">Total de Compras</p>
                          <p className="mt-2 text-3xl font-bold text-blue-600">{metrics.totalPurchases || 0}</p>
                          {metrics.confirmedPurchases !== undefined && (
                            <p className="mt-1 text-xs text-gray-500">
                              {metrics.confirmedPurchases} confirmadas, {metrics.pendingPurchases || 0} pendentes, {metrics.rejectedPurchases || 0} rejeitadas
                            </p>
                          )}
                          {metrics.totalPurchases === 0 && (
                            <p className="mt-1 text-xs text-gray-400 italic">
                              Nenhuma compra registrada ainda
                            </p>
                          )}
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow">
                          <p className="text-sm font-medium text-gray-500">Compras Confirmadas</p>
                          <p className="mt-2 text-3xl font-bold text-green-600">{metrics.confirmedPurchases || 0}</p>
                          {metrics.totalPurchases > 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                              {((metrics.confirmedPurchases || 0) / (metrics.totalPurchases || 1) * 100).toFixed(1)}% do total
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
                          {metrics.totalPointsEarned === 0 && (
                            <p className="mt-1 text-xs text-gray-400 italic">
                              Nenhum ponto distribuído ainda
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
                          {metrics.totalRevenue === 0 && (
                            <p className="mt-1 text-xs text-gray-400 italic">
                              Nenhuma receita registrada ainda
                            </p>
                          )}
                        </div>
                      </>
                    );
                  }
                })()}
              </>
            )}
          </div>

          {/* Métricas Detalhadas - apenas para admin e merchant */}
          {(isAdmin(user) || isMerchant(user)) && (
            <div className="mt-4">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Métricas Detalhadas</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {metrics.avgPurchaseAmount !== undefined && metrics.avgPurchaseAmount > 0 && (
                <div className="rounded-lg bg-white p-4 shadow">
                  <p className="text-sm font-medium text-gray-500">Valor Médio por Compra</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{metrics.avgPurchaseAmount.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT</p>
                  {metrics.totalPurchases > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Baseado em {metrics.totalPurchases} compra{metrics.totalPurchases !== 1 ? 's' : ''}
                    </p>
                  )}
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
                  {metrics.totalPointsEarned > 0 && metrics.totalPurchases > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Total: {(metrics.totalPointsEarned).toLocaleString("pt-MZ")} pts
                    </p>
                  )}
                </div>
              )}
              {metrics.pendingPurchases !== undefined && (
                <div className="rounded-lg bg-white p-4 shadow border-l-4 border-yellow-500">
                  <p className="text-sm font-medium text-gray-500">Compras Pendentes</p>
                  <p className="mt-1 text-xl font-bold text-yellow-600">{metrics.pendingPurchases || 0}</p>
                  {metrics.totalPurchases > 0 ? (
                    <p className="mt-1 text-xs text-gray-500">
                      {((metrics.pendingPurchases / metrics.totalPurchases) * 100).toFixed(1)}% do total
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400 italic">Aguardando compras</p>
                  )}
                </div>
              )}
              {metrics.rejectedPurchases !== undefined && (
                <div className="rounded-lg bg-white p-4 shadow border-l-4 border-red-500">
                  <p className="text-sm font-medium text-gray-500">Compras Rejeitadas</p>
                  <p className="mt-1 text-xl font-bold text-red-600">{metrics.rejectedPurchases || 0}</p>
                  {metrics.totalPurchases > 0 ? (
                    <p className="mt-1 text-xs text-gray-500">
                      {((metrics.rejectedPurchases / metrics.totalPurchases) * 100).toFixed(1)}% do total
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400 italic">Nenhuma rejeição</p>
                  )}
                </div>
              )}
              {metrics.totalRevenueConfirmed !== undefined && (
                <div className="rounded-lg bg-white p-4 shadow border-l-4 border-green-500">
                  <p className="text-sm font-medium text-gray-500">Receita Confirmada</p>
                  <p className="mt-1 text-xl font-bold text-green-600">{(metrics.totalRevenueConfirmed || 0).toLocaleString("pt-MZ")} MT</p>
                  {metrics.totalRevenue > 0 ? (
                    <p className="mt-1 text-xs text-gray-500">
                      {((metrics.totalRevenueConfirmed / metrics.totalRevenue) * 100).toFixed(1)}% da receita total
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400 italic">Aguardando receita</p>
                  )}
                </div>
              )}
              {metrics.totalPointsEarnedConfirmed !== undefined && (
                <div className="rounded-lg bg-white p-4 shadow border-l-4 border-purple-500">
                  <p className="text-sm font-medium text-gray-500">Pontos Confirmados</p>
                  <p className="mt-1 text-xl font-bold text-purple-600">{(metrics.totalPointsEarnedConfirmed || 0).toLocaleString("pt-MZ")}</p>
                  {metrics.totalPointsEarned > 0 ? (
                    <p className="mt-1 text-xs text-gray-500">
                      {((metrics.totalPointsEarnedConfirmed / metrics.totalPointsEarned) * 100).toFixed(1)}% do total
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400 italic">Aguardando pontos</p>
                  )}
                </div>
                )}
              </div>
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
                    {translateCampaignType(campaign.typeLabel || campaign.type)}
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

          {/* Vencedores - apenas para campanhas de sorteio */}
          {campaign.type === 'RewardType_Draw' && campaign.draw_executed && campaign.winners && campaign.winners.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Vencedores</h3>
              <div className="space-y-3">
                {campaign.winners
                  .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                  .map((winner: any, index: number) => (
                    <div key={winner.winner_id || index} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500 text-white font-bold text-sm">
                          {winner.position || index + 1}º
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {winner.name || winner.userName || 'Nome não disponível'}
                            </p>
                            {winner.email && (
                              <p className="text-xs text-gray-500 mt-1">{winner.email}</p>
                            )}
                            {winner.phone && (
                              <p className="text-xs text-gray-500">{winner.phone}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">{winner.prize_name || 'Prêmio'}</p>
                            {winner.prize_points && winner.prize_points > 0 && (
                              <p className="text-xs text-gray-500 mt-1">{winner.prize_points} pontos</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Mensagem quando sorteio ainda não foi executado */}
          {campaign.type === 'RewardType_Draw' && !campaign.draw_executed && (
            <div className="mt-6">
              <h3 className="text-md font-semibold text-gray-900 mb-2">Vencedores</h3>
              <p className="text-sm text-gray-500">O sorteio ainda não foi executado. Os vencedores serão exibidos aqui após a execução do sorteio.</p>
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

      {/* Histórico de Compras - apenas para clientes em campanhas automáticas */}
      {isClient(user) && campaign.type === 'RewardType_Auto' && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Meu Histórico de Compras
              {myCampaignPurchases.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({myCampaignPurchases.length} {myCampaignPurchases.length === 1 ? 'compra' : 'compras'})
                </span>
              )}
            </h2>
            <button
              onClick={() => {
                const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
                if (campaignId) {
                  loadMyCampaignPurchases(campaignId);
                }
              }}
              disabled={loadingMyPurchases}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {loadingMyPurchases ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {loadingMyPurchases ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Carregando histórico...</p>
            </div>
          ) : myCampaignPurchases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Você ainda não submeteu nenhuma compra para esta campanha.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pontos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observações
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recibo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myCampaignPurchases.map((purchase: any) => (
                    <tr key={purchase.campaign_purchase_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {purchase.created_at ? new Date(purchase.created_at).toLocaleString("pt-BR") : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {parseFloat(purchase.purchase_amount || 0).toLocaleString("pt-MZ")} MT
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {purchase.points_earned ? `${purchase.points_earned} pontos` : "Aguardando validação"}
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
                           purchase.status === 'cancelled' ? 'Cancelada' :
                           purchase.status || 'N/A'}
                        </span>
                        {purchase.validated_at && (
                          <div className="mt-1 text-xs text-gray-500">
                            Validada em: {new Date(purchase.validated_at).toLocaleString("pt-BR")}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={purchase.notes || ""}>
                          {purchase.notes || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {purchase.receipt_photo ? (
                          <button
                            onClick={() => {
                              const receiptUrl = purchase.receipt_photo.startsWith('http://') || purchase.receipt_photo.startsWith('https://')
                                ? purchase.receipt_photo
                                : (() => {
                                    // Construir URL completa: API_BASE_URL já tem /api, então removemos e adicionamos o caminho
                                    const baseUrl = API_BASE_URL.replace(/\/api$/, '');
                                    return `${baseUrl}${purchase.receipt_photo}`;
                                  })();
                              setSelectedReceiptImage(receiptUrl);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm underline cursor-pointer"
                          >
                            Ver Recibo
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagamentos - apenas para admin e merchant em campanhas automáticas */}
      {(isAdmin(user) || isMerchant(user)) && campaign.type === 'RewardType_Auto' && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Pagamentos da Campanha
              {pendingPurchases.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({pendingPurchases.length} {pendingPurchases.length === 1 ? 'registro' : 'registros'})
                </span>
              )}
            </h2>
            <button
              onClick={() => {
                const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
                if (campaignId) {
                  loadPendingPurchases(campaignId, purchaseStatusFilter);
                }
              }}
              disabled={loadingPendingPurchases}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {loadingPendingPurchases ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {/* Abas de Status */}
          <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { id: 'pending' as const, label: 'Pendentes', count: purchaseStats.pending, activeClass: 'border-yellow-500 text-yellow-600', inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' },
                { id: 'validated' as const, label: 'Aprovados', count: purchaseStats.validated, activeClass: 'border-green-500 text-green-600', inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' },
                { id: 'rejected' as const, label: 'Rejeitados', count: purchaseStats.rejected, activeClass: 'border-red-500 text-red-600', inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' },
                { id: 'all' as const, label: 'Todos', count: purchaseStats.total, activeClass: 'border-blue-500 text-blue-600', inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setPurchaseStatusFilter(tab.id);
                    const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
                    if (campaignId) {
                      loadPendingPurchases(campaignId, tab.id);
                    }
                  }}
                  className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                    purchaseStatusFilter === tab.id ? tab.activeClass : tab.inactiveClass
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {loadingPendingPurchases ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Carregando pagamentos...</p>
            </div>
          ) : pendingPurchases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">
                {purchaseStatusFilter === 'pending' && 'Nenhum pagamento pendente no momento'}
                {purchaseStatusFilter === 'validated' && 'Nenhum pagamento aprovado ainda'}
                {purchaseStatusFilter === 'rejected' && 'Nenhum pagamento rejeitado'}
                {purchaseStatusFilter === 'all' && 'Nenhum pagamento registrado ainda'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pontos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recibo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {purchaseStatusFilter === 'pending' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingPurchases.map((purchase: any) => (
                    <tr key={purchase.campaign_purchase_id || purchase.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.user_name || purchase.userName || "Cliente"}
                        </div>
                        {purchase.user_email && (
                          <div className="text-sm text-gray-500">{purchase.user_email}</div>
                        )}
                        {purchase.user_phone && (
                          <div className="text-sm text-gray-500">{purchase.user_phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {parseFloat(purchase.purchase_amount || 0).toLocaleString("pt-MZ")} MT
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {purchase.points_earned || Math.floor(parseFloat(purchase.purchase_amount || 0) * 0.1)} pontos
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(purchase.created_at || purchase.createdAt).toLocaleDateString("pt-MZ", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {purchase.receipt_photo ? (
                          <button
                            onClick={() => {
                              const receiptUrl = purchase.receipt_photo.startsWith('http') 
                                ? purchase.receipt_photo 
                                : `${API_BASE_URL.replace('/api', '')}${purchase.receipt_photo}`;
                              setSelectedReceiptImage(receiptUrl);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Ver Recibo
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">Sem recibo</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {purchase.notes || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          purchase.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : purchase.status === 'validated'
                            ? 'bg-green-100 text-green-800'
                            : purchase.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {purchase.status === 'pending' && 'Pendente'}
                          {purchase.status === 'validated' && 'Aprovado'}
                          {purchase.status === 'rejected' && 'Rejeitado'}
                          {!['pending', 'validated', 'rejected'].includes(purchase.status) && purchase.status}
                        </span>
                        {purchase.status === 'rejected' && purchase.rejection_reason && (
                          <div className="mt-1 text-xs text-gray-500">
                            Motivo: {purchase.rejection_reason}
                          </div>
                        )}
                      </td>
                      {purchaseStatusFilter === 'pending' && (
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleValidatePurchase(purchase.campaign_purchase_id || purchase.id)}
                              disabled={validatingPurchaseId === (purchase.campaign_purchase_id || purchase.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {validatingPurchaseId === (purchase.campaign_purchase_id || purchase.id) ? (
                                <>
                                  <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-white"></div>
                                  Validando...
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Aceitar
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectPurchase(purchase.campaign_purchase_id || purchase.id)}
                              disabled={rejectingPurchaseId === (purchase.campaign_purchase_id || purchase.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Rejeitar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Compras de Sorteio - apenas para admin e merchant em campanhas de sorteio */}
      {(isAdmin(user) || isMerchant(user)) && campaign.type === 'RewardType_Draw' && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Compras da Campanha de Sorteio
              {drawPurchases.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({drawPurchases.length} {drawPurchases.length === 1 ? 'registro' : 'registros'})
                </span>
              )}
            </h2>
            <button
              onClick={() => {
                const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
                if (campaignId) {
                  loadDrawPurchases(campaignId, drawPurchaseStatusFilter);
                }
              }}
              disabled={loadingDrawPurchases}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {loadingDrawPurchases ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {/* Abas de Status */}
          <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { id: 'pending' as const, label: 'Pendentes', count: drawPurchaseStats.pending, activeClass: 'border-yellow-500 text-yellow-600', inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' },
                { id: 'validated' as const, label: 'Aprovados', count: drawPurchaseStats.validated, activeClass: 'border-green-500 text-green-600', inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' },
                { id: 'rejected' as const, label: 'Rejeitados', count: drawPurchaseStats.rejected, activeClass: 'border-red-500 text-red-600', inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' },
                { id: 'all' as const, label: 'Todos', count: drawPurchaseStats.total, activeClass: 'border-blue-500 text-blue-600', inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setDrawPurchaseStatusFilter(tab.id);
                    const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
                    if (campaignId) {
                      loadDrawPurchases(campaignId, tab.id);
                    }
                  }}
                  className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                    drawPurchaseStatusFilter === tab.id ? tab.activeClass : tab.inactiveClass
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {loadingDrawPurchases ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Carregando compras...</p>
            </div>
          ) : drawPurchases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">
                {drawPurchaseStatusFilter === 'pending' && 'Nenhuma compra pendente no momento'}
                {drawPurchaseStatusFilter === 'validated' && 'Nenhuma compra aprovada ainda'}
                {drawPurchaseStatusFilter === 'rejected' && 'Nenhuma compra rejeitada'}
                {drawPurchaseStatusFilter === 'all' && 'Nenhuma compra registrada ainda'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recibo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {drawPurchaseStatusFilter === 'pending' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drawPurchases.map((purchase: any) => (
                    <tr key={purchase.draw_purchase_id || purchase.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.user_name || purchase.userName || "Cliente"}
                        </div>
                        {purchase.user_email && (
                          <div className="text-sm text-gray-500">{purchase.user_email}</div>
                        )}
                        {purchase.user_phone && (
                          <div className="text-sm text-gray-500">{purchase.user_phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {parseFloat(purchase.purchase_amount || 0).toLocaleString("pt-MZ")} MT
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(purchase.created_at || purchase.createdAt).toLocaleDateString("pt-MZ", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {purchase.receipt_photo ? (
                          <button
                            onClick={() => {
                              const receiptUrl = purchase.receipt_photo.startsWith('http') 
                                ? purchase.receipt_photo 
                                : `${API_BASE_URL.replace('/api', '')}${purchase.receipt_photo}`;
                              setSelectedReceiptImage(receiptUrl);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Ver Recibo
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">Sem recibo</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {purchase.notes || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          purchase.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : purchase.status === 'validated'
                            ? 'bg-green-100 text-green-800'
                            : purchase.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {purchase.status === 'pending' && 'Pendente'}
                          {purchase.status === 'validated' && 'Aprovado'}
                          {purchase.status === 'rejected' && 'Rejeitado'}
                          {!['pending', 'validated', 'rejected'].includes(purchase.status) && purchase.status}
                        </span>
                        {purchase.status === 'rejected' && purchase.rejection_reason && (
                          <div className="mt-1 text-xs text-gray-500">
                            Motivo: {purchase.rejection_reason}
                          </div>
                        )}
                      </td>
                      {drawPurchaseStatusFilter === 'pending' && (
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleValidateDrawPurchase(purchase.draw_purchase_id || purchase.id)}
                              disabled={validatingDrawPurchaseId === (purchase.draw_purchase_id || purchase.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {validatingDrawPurchaseId === (purchase.draw_purchase_id || purchase.id) ? (
                                <>
                                  <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-white"></div>
                                  Validando...
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Aceitar
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectDrawPurchase(purchase.draw_purchase_id || purchase.id)}
                              disabled={rejectingDrawPurchaseId === (purchase.draw_purchase_id || purchase.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Rejeitar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Códigos de Reserva Gerados - apenas para admin e merchant em campanhas de reserva */}
      {(isAdmin(user) || isMerchant(user)) && 
       (campaign.type === 'RewardType_Booking' || campaign.type === 'Oferta de Desconto por Marcação') && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Códigos de Reserva Gerados
            </h2>
            <button
              onClick={() => {
                const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
                if (campaignId) {
                  loadParticipations(campaignId, participationStatusFilter, participationSearch);
                }
              }}
              disabled={loadingParticipations}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {loadingParticipations ? "Carregando..." : "Atualizar"}
            </button>
          </div>

          {/* Busca por código de reserva */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por código de reserva, nome ou email do cliente..."
              value={participationSearch}
              onChange={(e) => {
                setParticipationSearch(e.target.value);
                const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
                if (campaignId) {
                  loadParticipations(campaignId, participationStatusFilter, e.target.value);
                }
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Abas de Status */}
          <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { id: 'all' as const, label: 'Todos', count: participationStats.total, activeClass: 'border-blue-500 text-blue-600', inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' },
                { id: 'pending' as const, label: 'Pendentes', count: participationStats.pending, activeClass: 'border-yellow-500 text-yellow-600', inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' },
                { id: 'used' as const, label: 'Usadas', count: participationStats.used, activeClass: 'border-green-500 text-green-600', inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' },
                { id: 'expired' as const, label: 'Expiradas', count: participationStats.expired, activeClass: 'border-red-500 text-red-600', inactiveClass: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setParticipationStatusFilter(tab.id);
                    const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
                    if (campaignId) {
                      loadParticipations(campaignId, tab.id, participationSearch);
                    }
                  }}
                  className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                    participationStatusFilter === tab.id ? tab.activeClass : tab.inactiveClass
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {loadingParticipations ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Carregando códigos...</p>
            </div>
          ) : participations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Nenhum código de reserva gerado ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código de Reserva
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Criação
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Válido até
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participations.map((participation) => (
                    <tr key={participation.participationId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            {participation.reservationCode}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(participation.reservationCode);
                              setAlertConfig({
                                title: "Copiado!",
                                message: "Código copiado para a área de transferência",
                                type: "success",
                              });
                              setAlertModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Copiar código"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {participation.user ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900">{participation.user.name || participation.user.username}</p>
                            {participation.user.email && (
                              <p className="text-xs text-gray-500">{participation.user.email}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          participation.status === 'used'
                            ? "bg-gray-100 text-gray-800"
                            : participation.isValid
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {participation.status === 'used' ? 'Usado' : participation.isValid ? 'Válido' : 'Expirado'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {participation.createdAt ? new Date(participation.createdAt).toLocaleString("pt-MZ") : "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {participation.expiresAt ? new Date(participation.expiresAt).toLocaleString("pt-MZ") : "Sem expiração"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {participation.status !== 'used' && participation.isValid && (
                          <button
                            onClick={() => handleMarkReservationAsUsed(participation.participationId)}
                            disabled={markingAsUsedId === participation.participationId}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Marcar como usada"
                          >
                            {markingAsUsedId === participation.participationId ? (
                              <>
                                <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-white"></div>
                                Marcando...
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Marcar como Usada
                              </>
                            )}
                          </button>
                        )}
                        {participation.status === 'used' && (
                          <span className="text-xs text-gray-500">
                            Usada em {participation.usedAt ? new Date(participation.usedAt).toLocaleString("pt-MZ") : "N/A"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

      {/* Modal para visualizar recibo */}
      {selectedReceiptImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setSelectedReceiptImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
            <button
              onClick={() => setSelectedReceiptImage(null)}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg"
              aria-label="Fechar"
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedReceiptImage}
              alt="Recibo"
              className="max-w-full max-h-[90vh] mx-auto rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
                (e.target as HTMLImageElement).alt = 'Erro ao carregar imagem';
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Rejeição */}
      <ConfirmModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason("");
          setRejectingPurchaseId(null);
        }}
        onConfirm={handleConfirmReject}
        title="Rejeitar Pagamento"
        message={
          <div>
            <p className="mb-4">Tem certeza que deseja rejeitar este pagamento?</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo da rejeição (opcional):
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="Digite o motivo da rejeição..."
            />
          </div>
        }
        confirmText="Rejeitar"
        cancelText="Cancelar"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Modal de Rejeição de Compra de Sorteio */}
      <ConfirmModal
        isOpen={showDrawRejectModal}
        onClose={() => {
          setShowDrawRejectModal(false);
          setDrawRejectionReason("");
          setRejectingDrawPurchaseId(null);
        }}
        onConfirm={handleConfirmDrawReject}
        title="Rejeitar Compra de Sorteio"
        message={
          <div>
            <p className="mb-4">Tem certeza que deseja rejeitar esta compra?</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo da rejeição (opcional):
            </label>
            <textarea
              value={drawRejectionReason}
              onChange={(e) => setDrawRejectionReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="Digite o motivo da rejeição..."
            />
          </div>
        }
        confirmText="Rejeitar"
        cancelText="Cancelar"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}

