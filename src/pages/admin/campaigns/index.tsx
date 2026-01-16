import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { campaignsService, Campaign, GetAllCampaignsParams, campaignPurchasesService } from "@/services/campaigns.service";
import { drawCampaignsService } from "@/services/drawCampaigns.service";
import { establishmentService } from "@/services/establishment.service";
import { merchantsService } from "@/services/merchants.service";
import { isAdmin, isMerchant, isUser, isClient } from "@/utils/roleUtils";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { websocketService } from "@/services/websocket.service";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const ITEMS_PER_PAGE = 1000; // Carregar todas as campanhas do backend
const FRONTEND_ITEMS_PER_PAGE = 12; // Paginação no frontend (igual aos estabelecimentos)

type SortField = 'name' | 'establishment' | 'type' | 'status' | 'validUntil';
type SortDirection = 'asc' | 'desc';

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

function CampaignsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]); // Todas as campanhas carregadas
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEstablishments, setLoadingEstablishments] = useState(false);
  const [error, setError] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [establishmentFilter, setEstablishmentFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [generalMetrics, setGeneralMetrics] = useState<any>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Estados para modais
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  
  // Estados para participação
  const [participatingCampaignId, setParticipatingCampaignId] = useState<string | number | null>(null);
  const [reservationCode, setReservationCode] = useState<string | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  
  // Estados para submissão de compra (campanhas automáticas)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  
  // Estado para contagem de pagamentos por campanha (apenas para clientes)
  const [purchasesCountByCampaign, setPurchasesCountByCampaign] = useState<Record<string, number>>({});

  // Carregar estabelecimentos primeiro
  useEffect(() => {
    if (user) {
      loadEstablishments();
    }
  }, [user]);

  const loadEstablishments = async () => {
    try {
      setLoadingEstablishments(true);
      
      let establishmentsData: any[] = [];
      
      // Se for admin, carregar todos os estabelecimentos
      if (isAdmin(user)) {
        console.log("🔍 [CAMPAIGNS LIST] Usuário é admin - carregando todos os estabelecimentos");
        establishmentsData = await establishmentService.getAll(true);
      } 
      // Se for merchant, carregar apenas estabelecimentos do merchant
      else if (isMerchant(user)) {
        console.log("🔍 [CAMPAIGNS LIST] Usuário é merchant - carregando estabelecimentos do merchant");
        const response = await merchantsService.getMyEstablishments();
        establishmentsData = response.data || [];
      } 
      // Se for cliente (user), não precisa carregar estabelecimentos para filtro
      // Mas pode tentar carregar todos para exibir nos cards de campanha
      else if (isUser(user)) {
        console.log("🔍 [CAMPAIGNS LIST] Usuário é cliente - carregando estabelecimentos para exibição");
        try {
          establishmentsData = await establishmentService.getAll(true);
        } catch (err) {
          // Se falhar, não é crítico - clientes podem ver campanhas sem filtro de estabelecimento
          console.log("⚠️ [CAMPAIGNS LIST] Não foi possível carregar estabelecimentos, mas não é crítico para clientes");
          establishmentsData = [];
        }
      }
      // Se não tiver role definido, tentar carregar como merchant primeiro
      else {
        console.log("🔍 [CAMPAIGNS LIST] Role não definido - tentando carregar como merchant");
        try {
          const response = await merchantsService.getMyEstablishments();
          establishmentsData = response.data || [];
        } catch (merchantErr) {
          // Se falhar, tentar como admin
          console.log("🔍 [CAMPAIGNS LIST] Falhou como merchant - tentando como admin");
          establishmentsData = await establishmentService.getAll(true);
        }
      }
      
      console.log("✅ [CAMPAIGNS LIST] Estabelecimentos carregados:", establishmentsData.length);
      setEstablishments(establishmentsData);
    } catch (err: any) {
      console.error("❌ [CAMPAIGNS LIST] Erro ao carregar estabelecimentos:", err);
      // Não bloquear se falhar ao carregar estabelecimentos
      setEstablishments([]);
    } finally {
      setLoadingEstablishments(false);
    }
  };

  // Carregar campanhas após estabelecimentos
  // NOTA: Não incluir currentPage aqui porque a paginação é feita no frontend
  // O backend sempre retorna todas as campanhas (limit: 1000) e a paginação é no frontend
  useEffect(() => {
    if (establishments.length > 0 || !loadingEstablishments) {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => loadCampaigns(), { timeout: 100 });
      } else {
        setTimeout(() => loadCampaigns(), 50);
      }
    }
  }, [statusFilter, establishmentFilter, typeFilter, debouncedSearchTerm, establishments.length, loadingEstablishments]);

  // Carregar contagem de pagamentos para campanhas automáticas (apenas para clientes)
  useEffect(() => {
    if (isClient(user) && allCampaigns.length > 0) {
      loadPurchasesCount();
    }
  }, [allCampaigns, user]);

  // Escutar eventos WebSocket para atualização em tempo real
  useEffect(() => {
    if (!user?.user_id) return;

    const socket = websocketService.getSocket();
    if (!socket) return;

    // Eventos para clientes
    if (isClient(user)) {
      // Evento quando um pagamento é submetido
      const handlePurchaseSubmitted = (data: any) => {
        console.log('📥 [WEBSOCKET] Pagamento submetido:', data);
        if (data.user_id === String(user.user_id)) {
          // Recarregar campanhas para atualizar estatísticas
          loadCampaigns();
        }
      };

      // Evento quando um pagamento é validado
      const handlePurchaseValidated = (data: any) => {
        console.log('📥 [WEBSOCKET] Pagamento validado:', data);
        if (data.user_id === String(user.user_id)) {
          // Mostrar notificação de sucesso
          setAlertConfig({
            title: "Pagamento Aprovado!",
            message: data.message || `Seu pagamento foi aprovado! Você ganhou ${data.points_earned || 0} pontos.`,
            type: "success",
          });
          setAlertModalOpen(true);
          // Recarregar campanhas para atualizar estatísticas
          loadCampaigns();
        }
      };

      // Evento quando um pagamento é rejeitado
      const handlePurchaseRejected = (data: any) => {
        console.log('📥 [WEBSOCKET] Pagamento rejeitado:', data);
        if (data.user_id === String(user.user_id)) {
          // Mostrar notificação de rejeição
          setAlertConfig({
            title: "Pagamento Rejeitado",
            message: data.message || "Seu pagamento foi rejeitado pelo merchant.",
            type: "error",
          });
          setAlertModalOpen(true);
          // Recarregar campanhas para atualizar estatísticas
          loadCampaigns();
        }
      };

      socket.on('campaign_purchase_submitted', handlePurchaseSubmitted);
      socket.on('campaign_purchase_validated', handlePurchaseValidated);
      socket.on('campaign_purchase_rejected', handlePurchaseRejected);
      
      // Eventos para campanhas de sorteio
      const handleDrawPurchaseSubmitted = (data: any) => {
        console.log('📥 [WEBSOCKET] Compra de sorteio submetida:', data);
        if (data.user_id === String(user.user_id)) {
          setAlertConfig({
            title: "Compra Enviada!",
            message: "Sua compra foi enviada com sucesso! Aguarde a validação do merchant.",
            type: "success",
          });
          setAlertModalOpen(true);
          loadCampaigns();
        }
      };

      const handleDrawPurchaseValidated = (data: any) => {
        console.log('📥 [WEBSOCKET] Compra de sorteio validada:', data);
        if (data.user_id === String(user.user_id)) {
          setAlertConfig({
            title: "Compra Validada!",
            message: "Sua compra foi validada! Suas chances no sorteio aumentaram!",
            type: "success",
          });
          setAlertModalOpen(true);
          loadCampaigns();
        }
      };

      const handleDrawPurchaseRejected = (data: any) => {
        console.log('📥 [WEBSOCKET] Compra de sorteio rejeitada:', data);
        if (data.user_id === String(user.user_id)) {
          setAlertConfig({
            title: "Compra Rejeitada",
            message: data.message || "Sua compra foi rejeitada pelo merchant.",
            type: "error",
          });
          setAlertModalOpen(true);
          loadCampaigns();
        }
      };

      socket.on('draw_purchase_submitted', handleDrawPurchaseSubmitted);
      socket.on('draw_purchase_validated', handleDrawPurchaseValidated);
      socket.on('draw_purchase_rejected', handleDrawPurchaseRejected);

      return () => {
        socket.off('campaign_purchase_submitted', handlePurchaseSubmitted);
        socket.off('campaign_purchase_validated', handlePurchaseValidated);
        socket.off('campaign_purchase_rejected', handlePurchaseRejected);
        socket.off('draw_purchase_submitted', handleDrawPurchaseSubmitted);
        socket.off('draw_purchase_validated', handleDrawPurchaseValidated);
        socket.off('draw_purchase_rejected', handleDrawPurchaseRejected);
      };
    }

    // Eventos para admin/merchant
    if (isAdmin(user) || isMerchant(user)) {
      // Evento quando há novo pagamento pendente
      const handlePurchasePending = async (data: any) => {
        console.log('📥 [WEBSOCKET] Novo pagamento pendente:', data);
        
        // Verificar se é do estabelecimento do merchant (se for merchant)
        if (isMerchant(user) && !isAdmin(user)) {
          // Verificar se o merchant tem acesso ao estabelecimento
          const establishmentId = data.establishment_id;
          if (establishmentId) {
            try {
              // Buscar estabelecimentos do merchant
              const response = await merchantsService.getMyEstablishments();
              const merchantEstablishments = response.data || [];
              const hasAccess = merchantEstablishments.some((est: any) => 
                String(est.id || est.est_id || est.establishment_id) === String(establishmentId)
              );
              
              if (!hasAccess) {
                console.log('📥 [WEBSOCKET] Merchant não tem acesso a este estabelecimento, ignorando notificação');
                return;
              }
            } catch (err) {
              console.error('Erro ao verificar acesso do merchant:', err);
              return;
            }
          }
        }
        
        // Mostrar notificação
        setAlertConfig({
          title: "Novo Pagamento Pendente!",
          message: data.message || `Novo pagamento de ${data.purchase_amount?.toLocaleString("pt-MZ")} MT aguardando validação na campanha "${data.campaign_name}".`,
          type: "info",
        });
        setAlertModalOpen(true);
        // Recarregar campanhas para atualizar contagem
        loadCampaigns();
      };

      // Evento quando status de pagamento muda
      const handlePurchaseStatusChanged = (data: any) => {
        console.log('📥 [WEBSOCKET] Status de pagamento alterado:', data);
        // Recarregar campanhas para atualizar contagem
        loadCampaigns();
      };

      socket.on('campaign_purchase_pending', handlePurchasePending);
      socket.on('campaign_purchase_status_changed', handlePurchaseStatusChanged);
      
      // Eventos para campanhas de sorteio (admin/merchant)
      const handleDrawPurchasePending = async (data: any) => {
        console.log('📥 [WEBSOCKET] Nova compra de sorteio pendente:', data);
        
        // Verificar se é do estabelecimento do merchant (se for merchant)
        if (isMerchant(user) && !isAdmin(user)) {
          const establishmentId = data.establishment_id;
          if (establishmentId) {
            try {
              const response = await merchantsService.getMyEstablishments();
              const merchantEstablishments = response.data || [];
              const hasAccess = merchantEstablishments.some((est: any) => 
                String(est.id || est.est_id || est.establishment_id) === String(establishmentId)
              );
              
              if (!hasAccess) {
                console.log('📥 [WEBSOCKET] Merchant não tem acesso a este estabelecimento, ignorando notificação');
                return;
              }
            } catch (err) {
              console.error('Erro ao verificar acesso do merchant:', err);
              return;
            }
          }
        }
        
        setAlertConfig({
          title: "Nova Compra de Sorteio Pendente!",
          message: data.message || `Nova compra de ${data.purchase_amount?.toLocaleString("pt-MZ")} MT aguardando validação na campanha de sorteio "${data.campaign_name}".`,
          type: "info",
        });
        setAlertModalOpen(true);
        loadCampaigns();
      };

      const handleDrawPurchaseStatusChanged = (data: any) => {
        console.log('📥 [WEBSOCKET] Status de compra de sorteio alterado:', data);
        loadCampaigns();
      };

      socket.on('draw_purchase_pending', handleDrawPurchasePending);
      socket.on('draw_purchase_status_changed', handleDrawPurchaseStatusChanged);

      return () => {
        socket.off('campaign_purchase_pending', handlePurchasePending);
        socket.off('campaign_purchase_status_changed', handlePurchaseStatusChanged);
        socket.off('draw_purchase_pending', handleDrawPurchasePending);
        socket.off('draw_purchase_status_changed', handleDrawPurchaseStatusChanged);
      };
    }
  }, [user, allCampaigns.length]);

  const loadPurchasesCount = async () => {
    if (!isClient(user)) return;
    
    try {
      // Buscar todas as compras do cliente para campanhas automáticas
      const response = await campaignPurchasesService.getMyPurchases(undefined, {
        page: 1,
        limit: 1000
      });
      
      const purchases = response?.data || response || [];
      const countMap: Record<string, number> = {};
      
      // Contar pagamentos por campanha
      purchases.forEach((purchase: any) => {
        const campaignId = purchase.campaign_id || purchase.campaignId;
        if (campaignId) {
          countMap[campaignId] = (countMap[campaignId] || 0) + 1;
        }
      });
      
      setPurchasesCountByCampaign(countMap);
    } catch (err: any) {
      console.error("Erro ao carregar contagem de pagamentos:", err);
      // Não mostrar erro, apenas não carregar contagem
    }
  };

  // Debounce da pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, establishmentFilter, typeFilter, debouncedSearchTerm, sortField, sortDirection]);

  // Helper function para validar e converter status
  const getValidStatus = (status: string | undefined): "active" | "inactive" | "cancelled" | "expired" | undefined => {
    if (!status) return undefined;
    const validStatuses = ["active", "inactive", "cancelled", "expired"];
    return validStatuses.includes(status) ? status as "active" | "inactive" | "cancelled" | "expired" : undefined;
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError("");
      
      let response: any;
      const validStatus = getValidStatus(statusFilter);
      
      // Sempre carregar página 1 do backend porque a paginação é feita no frontend
      // O backend retorna todas as campanhas (limit: 1000) e fazemos a paginação no frontend
      if (isMerchant(user)) {
        console.log("🔍 [CAMPAIGNS LIST] Usuário é merchant - carregando campanhas do merchant");
        try {
          response = await campaignsService.getMyCampaigns({
            page: 1, // Sempre página 1 - paginação no frontend
            limit: ITEMS_PER_PAGE,
            status: validStatus,
            establishment_id: establishmentFilter ? Number(establishmentFilter) : undefined,
            type: typeFilter || undefined,
            search: debouncedSearchTerm || undefined,
          });
        } catch (merchantErr) {
          // Se falhar, carregar todas as campanhas
          console.log("🔍 [CAMPAIGNS LIST] Falhou como merchant - carregando todas as campanhas");
          const params: GetAllCampaignsParams = {
            page: 1, // Sempre página 1 - paginação no frontend
            limit: ITEMS_PER_PAGE,
            status: validStatus,
            establishment_id: establishmentFilter ? Number(establishmentFilter) : undefined,
            type: typeFilter || undefined,
            search: debouncedSearchTerm || undefined,
          };
          response = await campaignsService.getAll(params);
        }
      } else {
        // Admin, cliente ou outros - carregar todas as campanhas
        console.log("🔍 [CAMPAIGNS LIST] Carregando todas as campanhas");
        const params: GetAllCampaignsParams = {
          page: 1, // Sempre página 1 - paginação no frontend
          limit: ITEMS_PER_PAGE,
          status: validStatus,
          establishment_id: establishmentFilter ? Number(establishmentFilter) : undefined,
          type: typeFilter || undefined,
          search: debouncedSearchTerm || undefined,
        };
        response = await campaignsService.getAll(params);
      }
      
      let campaignsData = response.data || [];
      
      // Enriquecer campanhas com dados de estabelecimentos
      campaignsData = campaignsData.map((campaign: Campaign) => {
        // Se não tem establishment no objeto, buscar pelo establishment_id
        if (!campaign.establishment && campaign.establishment_id) {
          const establishment = establishments.find(e => e.id === campaign.establishment_id);
          if (establishment) {
            return {
              ...campaign,
              establishment: {
                id: establishment.id,
                name: establishment.name,
                type: establishment.type,
                address: establishment.address,
              },
            };
          }
        }
        return campaign;
      });
      
      setAllCampaigns(campaignsData); // Armazenar todas as campanhas
      setPagination(response.pagination);
      setGeneralMetrics(response.generalMetrics || null);
    } catch (err: any) {
      console.error("Erro ao carregar campanhas:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar campanhas");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const campaignId = campaignToDelete?.campaign_id || campaignToDelete?.id || campaignToDelete?.campaign_number;
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
      setDeleteLoading(true);
      setConfirmModalOpen(false);
      
      await campaignsService.delete(campaignId);
      await loadCampaigns();
      
      setAlertConfig({
        title: "Sucesso!",
        message: "A campanha foi eliminada com sucesso.",
        type: "success",
      });
      setAlertModalOpen(true);
      setCampaignToDelete(null);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao eliminar campanha. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmModalOpen(false);
    setCampaignToDelete(null);
  };

  const handleView = (campaign: Campaign | number | string) => {
    let campaignId: number | string;
    
    if (typeof campaign === 'object' && campaign !== null) {
      // Se for um objeto Campaign, extrair o ID
      campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number || "";
    } else {
      // Se for um ID direto
      campaignId = campaign;
    }
    
    if (!campaignId || campaignId === "") {
      setAlertConfig({
        title: "Erro!",
        message: "ID da campanha inválido.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }
    
    router.push(`/admin/campaigns/${campaignId}`);
  };

  const handleEdit = (campaign: Campaign) => {
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
    router.push(`/admin/campaigns/${campaignId}/edit`);
  };

  const handleCreate = () => {
    router.push("/admin/campaigns/new");
  };

  const handleStatusChange = async (campaign: Campaign, newStatus: "active" | "inactive" | "cancelled") => {
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
      await campaignsService.changeStatus(campaignId, { status: newStatus });
      await loadCampaigns();
      setAlertConfig({
        title: "Sucesso!",
        message: `Status da campanha alterado para ${newStatus}.`,
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
    }
  };

  const handleParticipate = async (campaignId: number | string) => {
    try {
      setParticipatingCampaignId(campaignId);
      const result = await campaignsService.participate(campaignId);
      
      setReservationCode(result.reservationCode);
      setShowReservationModal(true);
      
      setAlertConfig({
        title: "Sucesso!",
        message: "Reserva criada com sucesso! Use o código para aproveitar a campanha.",
        type: "success",
      });
      setAlertModalOpen(true);
      
      // Recarregar campanhas para atualizar a contagem de participações na tabela
      await loadCampaigns();
    } catch (err: any) {
      console.error("Erro ao participar da campanha:", err);
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao participar da campanha. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setParticipatingCampaignId(null);
    }
  };

  const handleOpenSubmitModal = (campaign: Campaign) => {
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

    const campaignType = selectedCampaign.type || selectedCampaign.typeLabel || "";
    const isDrawCampaign = campaignType === 'RewardType_Draw' || 
                           campaignType === 'Sorteio' ||
                           campaignType?.toLowerCase()?.includes('draw') ||
                           campaignType?.toLowerCase()?.includes('sorteio');
    
    // Para campanhas automáticas, validar valor mínimo
    if (!isDrawCampaign) {
      const minAmount = (selectedCampaign as any).min_purchase_amount || 0;
      if (parseFloat(purchaseAmount) < minAmount) {
        setAlertConfig({
          title: "Erro!",
          message: `O valor da compra deve ser pelo menos ${minAmount.toLocaleString("pt-MZ")} MT (valor mínimo da campanha).`,
          type: "error",
        });
        setAlertModalOpen(true);
        return;
      }
    }

    try {
      setSubmitting(true);
      
      const campaignId = selectedCampaign.campaign_id || selectedCampaign.id || "";
      
      if (isDrawCampaign) {
        // Submeter compra para campanha de sorteio
        await drawCampaignsService.submitPurchase(campaignId, {
          purchase_amount: parseFloat(purchaseAmount),
          notes: notes || undefined,
          receipt_photo: receiptPhoto || undefined,
        });

        setAlertConfig({
          title: "Sucesso!",
          message: "Compra submetida com sucesso! Aguarde a validação do merchant. Cada compra validada aumenta suas chances no sorteio!",
          type: "success",
        });
      } else {
        // Submeter compra para campanha automática
        await campaignPurchasesService.submitPurchase(campaignId, {
          purchase_amount: parseFloat(purchaseAmount),
          notes: notes || undefined,
          receipt_photo: receiptPhoto || undefined,
        });

        setAlertConfig({
          title: "Sucesso!",
          message: "Compra submetida com sucesso! Aguarde a validação do merchant para receber seus pontos.",
          type: "success",
        });
      }
      
      setAlertModalOpen(true);
      
      setShowSubmitModal(false);
      setSelectedCampaign(null);
      setPurchaseAmount("");
      setNotes("");
      setReceiptPhoto(null);
      setReceiptPreview(null);
      
      // Recarregar campanhas e contagem de pagamentos para atualizar imediatamente
      // O WebSocket também atualizará quando o backend processar
      await loadCampaigns();
      if (isClient(user)) {
        loadPurchasesCount();
      }
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

  // Filtrar e ordenar campanhas
  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = [...allCampaigns];

    // Aplicar filtros
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(campaign => {
        // Para campanhas automáticas, usar benefit_description como nome
        const name = (campaign.type === 'RewardType_Auto' 
          ? (campaign.benefit_description || campaign.campaignName || campaign.campaign_name || campaign.name || campaign.description || "")
          : (campaign.campaignName || campaign.campaign_name || campaign.name || campaign.description || "")
        ).toLowerCase();
        const description = (campaign.description || campaign.reward_description || "").toLowerCase();
        const establishmentName = (
          campaign.establishmentName ||
          campaign.establishment?.name ||
          establishments.find(e => e.id === campaign.establishment_id || e.id === String(campaign.establishment_id))?.name ||
          ""
        ).toLowerCase();
        return name.includes(searchLower) || description.includes(searchLower) || establishmentName.includes(searchLower);
      });
    }

    if (statusFilter) {
      filtered = filtered.filter(campaign => {
        if (statusFilter === "active") {
          return campaign.status === "active" || campaign.status === "Activo" || campaign.is_active === true;
        }
        if (statusFilter === "inactive") {
          return campaign.status === "inactive" || campaign.status === "Inativo" || campaign.is_active === false;
        }
        return campaign.status === statusFilter;
      });
    }

    if (establishmentFilter) {
      filtered = filtered.filter(campaign => {
        const estId = campaign.establishment_id || campaign.establishmentId;
        return String(estId) === String(establishmentFilter);
      });
    }

    if (typeFilter) {
      filtered = filtered.filter(campaign => campaign.type === typeFilter);
    }

    // Aplicar ordenação
    // Se não houver ordenação manual, ordenar por data de criação (mais recente primeiro)
    if (!sortField) {
      filtered.sort((a, b) => {
        // Tentar ordenar por created_at se existir
        const aCreatedAt = (a as any).created_at || (a as any).createdAt;
        const bCreatedAt = (b as any).created_at || (b as any).createdAt;
        
        if (aCreatedAt && bCreatedAt) {
          return new Date(bCreatedAt).getTime() - new Date(aCreatedAt).getTime(); // DESC
        }
        
        // Fallback: extrair timestamp do campaign_id e ordenar por ele
        const aId = String(a.campaign_id || a.id || '');
        const bId = String(b.campaign_id || b.id || '');
        
        // Extrair timestamp de 13 dígitos do ID (formato: CAMP_xxx_TIMESTAMP_xxx)
        const extractTimestamp = (id: string): number => {
          const match = id.match(/(\d{13})/);
          return match ? parseInt(match[1]) : 0;
        };
        
        const aTimestamp = extractTimestamp(aId);
        const bTimestamp = extractTimestamp(bId);
        
        // Se ambos têm timestamp, ordenar por timestamp (mais recente primeiro)
        if (aTimestamp > 0 && bTimestamp > 0) {
          return bTimestamp - aTimestamp; // DESC
        }
        
        // Se apenas um tem timestamp, ele vem primeiro
        if (aTimestamp > 0 && bTimestamp === 0) return -1;
        if (bTimestamp > 0 && aTimestamp === 0) return 1;
        
        // Se nenhum tem timestamp, ordenar alfabeticamente (ordem reversa para DESC)
        return bId.localeCompare(aId); // DESC
      });
    } else {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'name':
            aValue = (a.campaignName || a.campaign_name || a.name || a.description || "").toLowerCase();
            bValue = (b.campaignName || b.campaign_name || b.name || b.description || "").toLowerCase();
            break;
          case 'establishment':
            aValue = (
              a.establishmentName ||
              a.establishment?.name ||
              establishments.find(e => e.id === a.establishment_id || e.id === String(a.establishment_id))?.name ||
              ""
            ).toLowerCase();
            bValue = (
              b.establishmentName ||
              b.establishment?.name ||
              establishments.find(e => e.id === b.establishment_id || e.id === String(b.establishment_id))?.name ||
              ""
            ).toLowerCase();
            break;
          case 'type':
            aValue = (a.type || "").toLowerCase();
            bValue = (b.type || "").toLowerCase();
            break;
          case 'status':
            aValue = a.status || (a.is_active !== false ? "active" : "inactive");
            bValue = b.status || (b.is_active !== false ? "active" : "inactive");
            break;
          case 'validUntil':
            aValue = a.validUntil ? new Date(a.validUntil).getTime() : 0;
            bValue = b.validUntil ? new Date(b.validUntil).getTime() : 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allCampaigns, debouncedSearchTerm, statusFilter, establishmentFilter, typeFilter, sortField, sortDirection, establishments]);

  // Paginação no frontend
  const totalPages = Math.ceil(filteredAndSortedCampaigns.length / FRONTEND_ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * FRONTEND_ITEMS_PER_PAGE;
  const endIndex = startIndex + FRONTEND_ITEMS_PER_PAGE;
  const paginatedCampaigns = useMemo(() => {
    return filteredAndSortedCampaigns.slice(startIndex, endIndex);
  }, [filteredAndSortedCampaigns, startIndex, endIndex]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Scroll para o topo quando a página mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  return (
    <div className="relative p-6">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-gray-600">Carregando...</div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
        <div className="flex items-center gap-3">
          {/* Botões para clientes */}
          {(() => {
            const clientCheck = isClient(user);
            if (typeof window !== 'undefined' && user) {
              console.log('🔍 [CAMPAIGNS] Verificando botões de cliente:', {
                user,
                isClient: clientCheck,
                isAdmin: isAdmin(user),
                isMerchant: isMerchant(user),
                isUser: isUser(user)
              });
            }
            return clientCheck;
          })() && (
            <>
              <button
                onClick={() => {
                  console.log('🔍 [CAMPAIGNS] Clicou em Meus Pontos');
                  router.push("/client/points");
                }}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-purple-600 bg-white px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Meus Pontos
              </button>
              <button
                onClick={() => {
                  console.log('🔍 [CAMPAIGNS] Clicou em Minhas Participações');
                  router.push("/client/campaigns/participations");
                }}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Minhas Participações
              </button>
            </>
          )}
          {/* Botão de criar campanha apenas para admin e merchant */}
          {(isAdmin(user) || isMerchant(user)) && (
            <button
              onClick={handleCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              + Nova Campanha
            </button>
          )}
        </div>
      </div>

      {/* Filtros e Pesquisa */}
      <div className="mb-6 rounded-lg bg-gradient-to-br from-white to-gray-50 p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filtros e Pesquisa</h2>
          {(statusFilter || establishmentFilter || typeFilter || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setEstablishmentFilter("");
                setTypeFilter("");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Busca Melhorada */}
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Pesquisar Campanhas
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por nome, descrição ou estabelecimento..."
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {debouncedSearchTerm && (
              <p className="mt-1 text-xs text-gray-500">
                {filteredAndSortedCampaigns.length} campanha(s) encontrada(s)
              </p>
            )}
          </div>

          {/* Filtro por Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              📊 Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
            >
              <option value="">Todos os status</option>
              <option value="active">✅ Ativas</option>
              <option value="inactive">⏸️ Inativas</option>
              <option value="cancelled">❌ Canceladas</option>
              <option value="Rascunho">📝 Rascunho</option>
              <option value="Expirado">⏰ Expirado</option>
            </select>
          </div>

          {/* Filtro por Estabelecimento - apenas para admin e merchant */}
          {establishments.length > 0 && (isAdmin(user) || isMerchant(user)) && (
            <div>
              <label htmlFor="establishment" className="block text-sm font-medium text-gray-700 mb-2">
                🏪 Estabelecimento
              </label>
              <select
                id="establishment"
                value={establishmentFilter}
                onChange={(e) => {
                  setEstablishmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
              >
                <option value="">Todos os estabelecimentos</option>
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por Tipo */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              🏷️ Tipo de Campanha
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
            >
              <option value="">Todos os tipos</option>
              <option value="RewardType_Auto">Oferta Automática</option>
              <option value="RewardType_Draw">Sorteio</option>
              <option value="RewardType_Exchange">Troca</option>
              <option value="RewardType_Quiz">Questões</option>
              <option value="RewardType_Referral">Indicação</option>
              <option value="RewardType_Challenge">Desafio</option>
              <option value="RewardType_Party">Votação</option>
              <option value="RewardType_Voucher">Voucher</option>
            </select>
          </div>
        </div>
      </div>

      {/* Métricas Gerais */}
      <div className={`mb-4 grid gap-2 ${isAdmin(user) || isMerchant(user) ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-2'}`}>
        {/* Cards de Métricas */}
        <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Campanhas</p>
          <p className="mt-0.5 text-xl font-bold text-gray-900">{generalMetrics?.totalCampaigns || pagination?.total || allCampaigns.length || 0}</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Participantes</p>
          <p className="mt-0.5 text-xl font-bold text-gray-900">{(generalMetrics?.totalParticipants || 0).toLocaleString("pt-MZ")}</p>
        </div>
        {/* Métricas sensíveis - apenas para admin e merchant */}
        {(isAdmin(user) || isMerchant(user)) && (
          <>
            <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Pontos</p>
              <p className="mt-0.5 text-xl font-bold text-gray-900">{(generalMetrics?.totalPointsEarned || 0).toLocaleString("pt-MZ")}</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Receita</p>
              <p className="mt-0.5 text-xl font-bold text-gray-900">{(generalMetrics?.totalRevenue || 0).toLocaleString("pt-MZ")} MT</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Compras</p>
              <p className="mt-0.5 text-xl font-bold text-gray-900">{(generalMetrics?.totalPurchases || 0).toLocaleString("pt-MZ")}</p>
            </div>
          </>
        )}
        {/* Gráfico de Pizza - Distribuição por Status */}
        {allCampaigns.length > 0 && (
          <div className="col-span-2 rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Campanhas por Status</h3>
            <CampaignsByStatusChart campaigns={allCampaigns} />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Tabela de Campanhas */}
      <div className="overflow-hidden rounded-lg bg-white shadow-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Nome
                  {sortField === 'name' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('establishment')}
              >
                <div className="flex items-center gap-2">
                  Estabelecimento
                  {sortField === 'establishment' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-2">
                  Tipo
                  {sortField === 'type' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  {sortField === 'status' && (
                    <span className="text-blue-600">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Data Inicial
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Data de Expiração
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(!paginatedCampaigns || paginatedCampaigns.length === 0) ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 font-medium">Nenhuma campanha encontrada</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchTerm || statusFilter || establishmentFilter || typeFilter
                        ? "Tente ajustar os filtros"
                        : "Não há campanhas cadastradas"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              (paginatedCampaigns || []).map((campaign) => (
                <tr key={campaign.campaign_id || campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="max-w-lg min-w-[300px]">
                      {(() => {
                        // Determinar o nome principal da campanha (sem usar description como fallback)
                        const mainName = campaign.type === 'RewardType_Auto' 
                          ? (campaign.benefit_description || campaign.campaignName || campaign.campaign_name || campaign.name || "Sem nome")
                          : campaign.type === 'RewardType_Draw'
                          ? (campaign.participation_criteria || campaign.campaignName || campaign.campaign_name || campaign.name || "Sem nome")
                          : (campaign.campaignName || campaign.campaign_name || campaign.name || "Sem nome");
                        
                        // Determinar a descrição secundária (só mostrar se for diferente do nome principal e não vazia)
                        let secondaryDescription = null;
                        if (campaign.type !== 'RewardType_Auto' && campaign.type !== 'RewardType_Draw') {
                          const rewardDesc = campaign.reward_description?.trim();
                          const desc = campaign.description?.trim();
                          
                          // Só mostrar se for diferente do nome principal e não vazio
                          if (rewardDesc && rewardDesc !== mainName && rewardDesc.length > 0) {
                            secondaryDescription = rewardDesc;
                          } else if (desc && desc !== mainName && desc.length > 0) {
                            secondaryDescription = desc;
                          }
                        }
                        
                        return (
                          <>
                            <div className="text-sm font-medium text-gray-900 break-words whitespace-normal">
                              {mainName}
                            </div>
                            {secondaryDescription && (
                              <div className="text-xs text-gray-500 mt-1 break-words whitespace-normal">
                                {secondaryDescription}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(() => {
                        // Tentar múltiplas fontes para o nome do estabelecimento
                        const establishmentName = 
                          campaign.establishmentName ||
                          campaign.establishment?.name ||
                          (campaign.establishment_id 
                            ? establishments.find(e => e.id === campaign.establishment_id || e.id === String(campaign.establishment_id))?.name 
                            : null) ||
                          (campaign.establishmentId
                            ? establishments.find(e => e.id === campaign.establishmentId || e.id === String(campaign.establishmentId))?.name
                            : null) ||
                          (campaign.merchant_id 
                            ? establishments.find(e => e.id === campaign.merchant_id)?.name 
                            : null);
                        
                        if (establishmentName) {
                          return establishmentName;
                        }
                        
                        // Se não encontrou, mostrar ID ou "Não definido"
                        if (campaign.establishment_id) {
                          return `ID: ${campaign.establishment_id}`;
                        }
                        if (campaign.establishmentId) {
                          return `ID: ${campaign.establishmentId}`;
                        }
                        if (campaign.merchant_id) {
                          return `ID: ${campaign.merchant_id}`;
                        }
                        return "Não definido";
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {translateCampaignType(campaign.typeLabel || campaign.type || (campaign.accumulation_rate ? "points_per_spend" : "points"))}
                      </span>
                      {campaign.typeDescription && (
                        <div className="text-xs text-gray-500">
                          {campaign.typeDescription}
                        </div>
                      )}
                      {/* Indicadores - mostrar apenas um por vez */}
                      {(() => {
                        const campaignType = campaign.type || campaign.typeLabel || "";
                        const hasBenefitDescription = !!(campaign as any).benefit_description;
                        const isAutoCampaign = campaignType === 'RewardType_Auto' || 
                                               campaignType === 'Oferta Automática' ||
                                               campaignType?.toLowerCase()?.includes('auto') ||
                                               hasBenefitDescription;
                        
                        const isDrawCampaign = campaignType === 'RewardType_Draw' || 
                                               campaignType === 'Sorteio' ||
                                               campaignType?.toLowerCase()?.includes('draw') ||
                                               campaignType?.toLowerCase()?.includes('sorteio') ||
                                               !!(campaign as any).participation_criteria;
                        
                        // Para clientes em campanhas de sorteio: mostrar estatísticas de compras
                        if (isClient(user) && isDrawCampaign) {
                          const drawStats = (campaign as any).drawPurchaseStats;
                          
                          if (drawStats) {
                            const { approved_count, pending_count, approved_amount, pending_amount } = drawStats;
                            const totalApproved = approved_count || 0;
                            const totalPending = pending_count || 0;
                            const totalAmount = approved_amount || 0;
                            const totalPendingAmount = pending_amount || 0;
                            
                            return (
                              <div className="mt-1 flex flex-col gap-1.5">
                                {/* Compras aprovadas */}
                                {totalApproved > 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {totalApproved} {totalApproved === 1 ? 'compra aprovada' : 'compras aprovadas'}
                                    {totalAmount > 0 && (
                                      <span className="ml-1">• {totalAmount.toLocaleString("pt-MZ")} MT</span>
                                    )}
                                  </div>
                                )}
                                
                                {/* Compras pendentes */}
                                {totalPending > 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {totalPending} {totalPending === 1 ? 'compra pendente' : 'compras pendentes'}
                                    {totalPendingAmount > 0 && (
                                      <span className="ml-1">• {totalPendingAmount.toLocaleString("pt-MZ")} MT</span>
                                    )}
                                  </div>
                                )}
                                
                                {/* Se não há compras */}
                                {totalApproved === 0 && totalPending === 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Nenhuma compra enviada
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            // Fallback para quando não há estatísticas
                            return (
                              <div className="mt-1">
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Nenhuma compra enviada
                                </div>
                              </div>
                            );
                          }
                        }
                        
                        // Para clientes em campanhas automáticas: mostrar estatísticas detalhadas de pagamentos
                        if (isClient(user) && isAutoCampaign) {
                          const purchaseStats = (campaign as any).purchaseStats;
                          const minPurchaseAmount = (campaign as any).min_purchase_amount || 0;
                          
                          if (purchaseStats) {
                            const { approved_count, pending_count, approved_amount, pending_amount, approved_points } = purchaseStats;
                            const totalApproved = approved_count || 0;
                            const totalPending = pending_count || 0;
                            const totalAmount = approved_amount || 0;
                            const totalPendingAmount = pending_amount || 0;
                            const totalPoints = approved_points || 0;
                            const remaining = minPurchaseAmount > 0 ? Math.max(0, minPurchaseAmount - totalAmount) : 0;
                            
                            return (
                              <div className="mt-1 flex flex-col gap-1.5">
                                {/* Pagamentos aprovados */}
                                {totalApproved > 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {totalApproved} {totalApproved === 1 ? 'pagamento aprovado' : 'pagamentos aprovados'}
                                    {totalAmount > 0 && (
                                      <span className="ml-1">• {totalAmount.toLocaleString("pt-MZ")} MT</span>
                                    )}
                                    {totalPoints > 0 && (
                                      <span className="ml-1">• {totalPoints} pontos</span>
                                    )}
                                  </div>
                                )}
                                
                                {/* Pagamentos pendentes */}
                                {totalPending > 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {totalPending} {totalPending === 1 ? 'pagamento pendente' : 'pagamentos pendentes'}
                                    {totalPendingAmount > 0 && (
                                      <span className="ml-1">• {totalPendingAmount.toLocaleString("pt-MZ")} MT</span>
                                    )}
                                  </div>
                                )}
                                
                                {/* Quanto falta */}
                                {minPurchaseAmount > 0 && remaining > 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    Faltam {remaining.toLocaleString("pt-MZ")} MT para atingir o objetivo
                                  </div>
                                )}
                                
                                {/* Se não há pagamentos */}
                                {totalApproved === 0 && totalPending === 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Nenhum pagamento enviado
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            // Fallback para quando não há estatísticas (usar contagem simples)
                            const campaignId = campaign.campaign_id || campaign.id || campaign.campaign_number;
                            const purchasesCount = campaignId ? (purchasesCountByCampaign[campaignId] || 0) : 0;
                            
                            return (
                              <div className="mt-1">
                                {purchasesCount > 0 ? (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {purchasesCount} {purchasesCount === 1 ? 'pagamento enviado' : 'pagamentos enviados'}
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Nenhum pagamento enviado
                                  </div>
                                )}
                              </div>
                            );
                          }
                        }
                        
                        // Para admin/merchant em campanhas de sorteio: mostrar estatísticas completas
                        if ((isAdmin(user) || isMerchant(user)) && isDrawCampaign) {
                          const drawStats = (campaign as any).drawPurchaseStatsForAdmin;
                          if (drawStats) {
                            const total = drawStats.total || 0;
                            const pending = drawStats.pending || 0;
                            const validated = drawStats.validated || 0;
                            
                            return (
                              <div className="mt-1 flex flex-col gap-1.5">
                                {/* Total de compras */}
                                {total > 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    {total} {total === 1 ? 'compra realizada' : 'compras realizadas'}
                                  </div>
                                )}
                                
                                {/* Compras pendentes */}
                                {pending > 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 animate-pulse">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {pending} {pending === 1 ? 'compra pendente' : 'compras pendentes'}
                                  </div>
                                )}
                                
                                {/* Compras aprovadas */}
                                {validated > 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {validated} {validated === 1 ? 'compra aprovada' : 'compras aprovadas'}
                                  </div>
                                )}
                                
                                {/* Se não há compras */}
                                {total === 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    Nenhuma compra ainda
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            // Fallback se não houver estatísticas
                            return (
                              <div className="mt-1">
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                  </svg>
                                  Nenhuma compra ainda
                                </div>
                              </div>
                            );
                          }
                        }
                        
                        // Para admin/merchant em campanhas automáticas: mostrar estatísticas completas
                        if ((isAdmin(user) || isMerchant(user)) && isAutoCampaign) {
                          const stats = (campaign as any).purchaseStatsForAdmin;
                          if (stats) {
                            const total = stats.total || 0;
                            const pending = stats.pending || 0;
                            const validated = stats.validated || 0;
                            
                            return (
                              <div className="mt-1 flex flex-col gap-1.5">
                                {/* Total de compras */}
                                {total > 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    {total} {total === 1 ? 'compra realizada' : 'compras realizadas'}
                                  </div>
                                )}
                                
                                {/* Pagamentos pendentes */}
                                {pending > 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 animate-pulse">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {pending} {pending === 1 ? 'pagamento pendente' : 'pagamentos pendentes'}
                                  </div>
                                )}
                                
                                {/* Pagamentos aprovados */}
                                {validated > 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {validated} {validated === 1 ? 'pagamento aprovado' : 'pagamentos aprovados'}
                                  </div>
                                )}
                                
                                {/* Se não há compras */}
                                {total === 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    Nenhuma compra ainda
                                  </div>
                                )}
                              </div>
                            );
                          } else {
                            // Fallback se não houver estatísticas
                            return (
                              <div className="mt-1">
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                  </svg>
                                  Nenhuma compra ainda
                                </div>
                              </div>
                            );
                          }
                        }
                        
                        // Para campanhas que usam códigos de reserva (ex: RewardType_Booking): mostrar indicador de códigos
                        // Não mostrar para campanhas automáticas ou de compras
                        const usesReservationCodes = campaignType === 'RewardType_Booking' || 
                                                     campaignType === 'Oferta de Desconto por Marcação' ||
                                                     campaignType?.toLowerCase()?.includes('booking') ||
                                                     campaignType?.toLowerCase()?.includes('reserva');
                        
                        if (usesReservationCodes && campaign.participationsCount !== undefined) {
                          return (
                            <div className={`text-xs mt-1 font-medium ${
                              campaign.participationsCount > 0 ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              {campaign.participationsCount > 0 
                                ? `${campaign.participationsCount} código(s) gerado(s)`
                                : 'Nenhum código gerado'
                              }
                            </div>
                          );
                        }
                        
                        // Para outras campanhas que não são automáticas nem de reserva, não mostrar nada
                        return null;
                        
                        return null;
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      campaign.status === "active" || campaign.status === "Activo" || campaign.is_active === true
                        ? "bg-green-100 text-green-800"
                        : campaign.status === "cancelled" || campaign.status === "Cancelado"
                        ? "bg-red-100 text-red-800"
                        : campaign.status === "Rascunho"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {campaign.status || (campaign.is_active !== false ? "active" : "inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(campaign.validFrom || campaign.valid_from || campaign.start_date || campaign.draw_start_date) ? (
                        new Date(campaign.draw_start_date || campaign.validFrom || campaign.valid_from || campaign.start_date).toLocaleDateString("pt-MZ", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })
                      ) : (
                        <span className="text-gray-400">Não definida</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(campaign.validUntil || campaign.valid_until || campaign.end_date || campaign.draw_end_date) ? (
                        <>
                          {new Date(campaign.draw_end_date || campaign.validUntil || campaign.valid_until || campaign.end_date).toLocaleDateString("pt-MZ", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })}
                          {new Date(campaign.validUntil || campaign.valid_until || campaign.end_date) < new Date() && (
                            <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Expirada
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">Sem expiração</span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      {/* Botão de visualizar - disponível para todos */}
                      <button
                        onClick={() => handleView(campaign)}
                        className="text-green-600 hover:text-green-900 transition-colors duration-200 hover:scale-110"
                        title="Ver detalhes da campanha"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {/* Botão Participar ou Código - apenas para clientes */}
                      {isClient(user) && (() => {
                        const campaignType = campaign.type || campaign.typeLabel || "";
                        const hasBenefitDescription = !!(campaign as any).benefit_description;
                        
                        // Para campanhas automáticas e de sorteio, mostrar botão "Enviar Compra"
                        const isAutoCampaign = campaignType === 'RewardType_Auto' || 
                                               campaignType === 'Oferta Automática' ||
                                               campaignType?.toLowerCase()?.includes('auto') ||
                                               hasBenefitDescription;
                        
                        const isDrawCampaign = campaignType === 'RewardType_Draw' || 
                                               campaignType === 'Sorteio' ||
                                               campaignType?.toLowerCase()?.includes('draw') ||
                                               campaignType?.toLowerCase()?.includes('sorteio') ||
                                               !!(campaign as any).participation_criteria;
                        
                        if (isAutoCampaign || isDrawCampaign) {
                          const validFrom = campaign.validFrom || campaign.valid_from || campaign.start_date || (campaign as any).draw_start_date;
                          const validUntil = campaign.validUntil || campaign.valid_until || campaign.end_date || (campaign as any).draw_end_date;
                          const now = new Date();
                          const isExpired = validUntil && new Date(validUntil) < now;
                          const notStarted = validFrom && new Date(validFrom) > now;
                          const isActive = campaign.isActive !== false && campaign.is_active !== false;
                          const canSubmit = isActive && !isExpired && !notStarted;
                          
                          return (
                            <button
                              onClick={() => handleOpenSubmitModal(campaign)}
                              disabled={!canSubmit}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                canSubmit
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-gray-400 text-white cursor-not-allowed"
                              }`}
                              title={
                                isExpired 
                                  ? "Campanha expirada"
                                  : notStarted
                                  ? "Campanha ainda não começou"
                                  : !isActive
                                  ? "Campanha inativa"
                                  : isDrawCampaign
                                  ? "Enviar compra para aumentar suas chances no sorteio"
                                  : "Enviar compra para validação"
                              }
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Enviar Compra
                            </button>
                          );
                        }
                        
                        // Verificar se a campanha permite participação
                        const hasBookingFields = 
                          (campaign as any).booking_discount_type || 
                          (campaign as any).booking_discount_value;
                        // Tipos que permitem participação (geram código de reserva)
                        const participableTypes = ['RewardType_Voucher', 'RewardType_Booking'];
                        const allowsParticipation = participableTypes.includes(campaignType) || hasBookingFields;
                        
                        if (!allowsParticipation) {
                          return null;
                        }
                        
                        // LÓGICA SIMPLES: Se tem código, mostra código. Senão, mostra botão.
                        const userCode = campaign.userReservationCode || 
                                       campaign.user_reservation_code || 
                                       (campaign as any).user_reservation_code;
                        
                        if (userCode) {
                          // Já tem código - mostrar código
                          return (
                            <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5">
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-green-800">Seu código:</span>
                                <code className="text-sm font-mono font-bold text-green-900 bg-green-100 px-2 py-0.5 rounded">
                                  {userCode}
                                </code>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(userCode);
                                  setAlertConfig({
                                    title: "Copiado!",
                                    message: "Código copiado para a área de transferência",
                                    type: "success",
                                  });
                                  setAlertModalOpen(true);
                                }}
                                className="text-green-700 hover:text-green-900"
                                title="Copiar código"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          );
                        }
                        
                        // Verificar se a campanha está dentro do prazo válido
                        const validFrom = campaign.validFrom || campaign.valid_from || campaign.start_date;
                        const validUntil = campaign.validUntil || campaign.valid_until || campaign.end_date;
                        const now = new Date();
                        // Normalizar data atual para comparar apenas a data (sem hora)
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        
                        // Converter datas para comparar corretamente (considerar apenas data, não hora)
                        // Se não tem data de expiração, considerar como não expirada
                        // Se não tem data de início, considerar como já iniciada
                        let isExpired = false;
                        let notStarted = false;
                        
                        if (validUntil) {
                          const expiryDate = new Date(validUntil);
                          const expiryDateOnly = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
                          isExpired = expiryDateOnly < today;
                        }
                        
                        if (validFrom) {
                          const startDate = new Date(validFrom);
                          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                          notStarted = startDateOnly > today;
                        }
                        
                        // Verificar status ativo - considerar ativo se não estiver explicitamente inativo
                        // Por padrão, se não houver informação de status, considerar como ativo
                        // O backend retorna isActive baseado em campaign.isactive, mas pode ser null/undefined
                        const isActive = 
                          campaign.status === 'active' || 
                          campaign.status === 'Activo' || 
                          campaign.isActive === true || 
                          campaign.is_active === true ||
                          // Se o status não está explicitamente 'inactive' ou 'Inativo', considerar ativo
                          (campaign.status !== 'inactive' && campaign.status !== 'Inativo' && campaign.status !== false && campaign.status !== null && campaign.status !== undefined) ||
                          // Se isActive ou is_active não estão explicitamente false, considerar ativo
                          (campaign.isActive !== false && campaign.is_active !== false) ||
                          // Se todos os campos de status são null/undefined, considerar ativo por padrão
                          (campaign.status === undefined && campaign.isActive === undefined && campaign.is_active === undefined);
                        
                        const canParticipate = isActive && !isExpired && !notStarted;
                        
                        // Debug para entender por que o botão está desabilitado
                        if (typeof window !== 'undefined' && (campaign.type === 'RewardType_Booking' || campaign.type === 'RewardType_Voucher')) {
                          console.log('🔍 [PARTICIPAR DEBUG]', {
                            campaignId: campaign.campaign_id || campaign.id,
                            campaignName: campaign.campaignName || campaign.campaign_name || campaign.name,
                            type: campaign.type,
                            status: campaign.status,
                            isActive: campaign.isActive,
                            is_active: campaign.is_active,
                            validFrom,
                            validUntil,
                            today: today.toISOString().split('T')[0],
                            now: now.toISOString(),
                            isExpired,
                            notStarted,
                            calculatedIsActive: isActive,
                            canParticipate,
                            disabled: !canParticipate,
                            reason: !canParticipate ? (
                              !isActive ? 'Campanha não está ativa' :
                              isExpired ? 'Campanha expirada' :
                              notStarted ? 'Campanha ainda não começou' :
                              'Desconhecido'
                            ) : 'Pode participar'
                          });
                        }
                        
                        // Não tem código - mostrar botão para participar
                        return (
                          <button
                            onClick={() => {
                              const campaignId = campaign.campaign_id || campaign.id;
                              if (!campaignId) {
                                setAlertConfig({
                                  title: "Erro!",
                                  message: "ID da campanha inválido",
                                  type: "error",
                                });
                                setAlertModalOpen(true);
                                return;
                              }
                              
                              if (!isActive) {
                                setAlertConfig({
                                  title: "Atenção!",
                                  message: "Esta campanha não está ativa",
                                  type: "warning",
                                });
                                setAlertModalOpen(true);
                                return;
                              }
                              
                              if (isExpired) {
                                setAlertConfig({
                                  title: "Atenção!",
                                  message: "Esta campanha já expirou. Não é possível participar de campanhas expiradas.",
                                  type: "warning",
                                });
                                setAlertModalOpen(true);
                                return;
                              }
                              
                              if (notStarted) {
                                setAlertConfig({
                                  title: "Atenção!",
                                  message: "Esta campanha ainda não começou",
                                  type: "warning",
                                });
                                setAlertModalOpen(true);
                                return;
                              }
                              
                              handleParticipate(campaignId);
                            }}
                            disabled={participatingCampaignId === (campaign.campaign_id || campaign.id) || !canParticipate}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              canParticipate
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-400 text-white cursor-not-allowed"
                            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                            title={
                              isExpired 
                                ? "Campanha expirada - não é possível participar"
                                : notStarted
                                ? "Campanha ainda não começou"
                                : !isActive
                                ? "Campanha inativa"
                                : "Participar da campanha"
                            }
                          >
                            {participatingCampaignId === (campaign.campaign_id || campaign.id) ? (
                              <>
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Participando...
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Participar
                              </>
                            )}
                          </button>
                        );
                      })()}
                      {/* Ações de edição/exclusão apenas para admin e merchant */}
                      {(isAdmin(user) || isMerchant(user)) && (
                        <>
                          <button
                            onClick={() => handleEdit(campaign)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar campanha"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {campaign.status !== "active" && campaign.status !== "Activo" && (
                            <button
                              onClick={() => handleStatusChange(campaign, "active")}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ativar campanha"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          {(campaign.status === "active" || campaign.status === "Activo") && (
                            <button
                              onClick={() => handleStatusChange(campaign, "inactive")}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Desativar campanha"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(campaign)}
                            disabled={deleteLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Eliminar"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Paginação - Estilo igual aos estabelecimentos */}
      {filteredAndSortedCampaigns.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-4">
          {/* Controles de paginação - apenas se houver mais de uma página */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage((prev) => {
                    const newPage = Math.max(1, prev - 1);
                    // Scroll para o topo quando mudar de página
                    if (typeof window !== 'undefined') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    return newPage;
                  });
                }}
                disabled={currentPage === 1}
                className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </button>
              
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page);
                          // Scroll para o topo quando mudar de página
                          if (typeof window !== 'undefined') {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={`rounded-xl px-4 py-2.5 font-semibold transition-all duration-200 ${
                          currentPage === page
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                            : "border-2 border-gray-200 bg-white text-gray-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={`ellipsis-${page}`} className="px-2 text-gray-400">...</span>;
                  } else {
                    return null;
                  }
                })}
              </div>
              
              <button
                onClick={() => {
                  setCurrentPage((prev) => {
                    const newPage = Math.min(totalPages, prev + 1);
                    // Scroll para o topo quando mudar de página
                    if (typeof window !== 'undefined') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    return newPage;
                  });
                }}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-700"
              >
                Próxima
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Info de paginação - sempre visível quando há campanhas */}
          <div className="rounded-xl bg-white px-6 py-3 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              Mostrando <span className="font-bold text-gray-900">{startIndex + 1}</span> - <span className="font-bold text-gray-900">{Math.min(endIndex, filteredAndSortedCampaigns.length)}</span> de <span className="font-bold text-gray-900">{filteredAndSortedCampaigns.length}</span> campanha(s)
            </p>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {campaignToDelete && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Confirmar Eliminação"
          message={`Tem certeza que deseja eliminar esta campanha?\n\nID: #${campaignToDelete.campaign_id || campaignToDelete.id}\nNome: ${campaignToDelete.campaignName || campaignToDelete.campaign_name || campaignToDelete.name || "-"}\nEstabelecimento: ${(() => {
            const establishmentName = 
              campaignToDelete.establishment?.name ||
              (campaignToDelete.establishment_id 
                ? establishments.find(e => e.id === campaignToDelete.establishment_id)?.name 
                : null);
            return establishmentName || `ID: ${campaignToDelete.establishment_id || "N/A"}`;
          })()}\n\nEsta ação não pode ser desfeita.`}
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

      {/* Modal de Código de Reserva */}
      {showReservationModal && reservationCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Código de Reserva Gerado</h2>
              <button
                onClick={() => {
                  setShowReservationModal(false);
                  setReservationCode(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Seu código de reserva foi gerado com sucesso! Use este código no estabelecimento para aproveitar a campanha.
              </p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Código de Reserva</p>
                <p className="text-2xl font-bold text-blue-700 font-mono tracking-wider">
                  {reservationCode}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reservationCode);
                  setAlertConfig({
                    title: "Copiado!",
                    message: "Código copiado para a área de transferência",
                    type: "success",
                  });
                  setAlertModalOpen(true);
                }}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Copiar Código
              </button>
              <button
                onClick={() => {
                  setShowReservationModal(false);
                  setReservationCode(null);
                }}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Submissão de Compra (Campanhas Automáticas) */}
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
                <strong>Campanha:</strong> {(selectedCampaign as any).benefit_description || selectedCampaign.campaignName || selectedCampaign.campaign_name || selectedCampaign.name || "Campanha Automática"}
              </p>
              {(selectedCampaign as any).min_purchase_amount && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Valor Mínimo:</strong> {(selectedCampaign as any).min_purchase_amount.toLocaleString("pt-MZ")} MT
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
                  min={(selectedCampaign as any).min_purchase_amount || 0}
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
                    <img src={receiptPreview} alt="Preview do recibo" className="max-w-full h-auto rounded-lg border border-gray-300" />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    setSelectedCampaign(null);
                    setPurchaseAmount("");
                    setNotes("");
                    setReceiptPhoto(null);
                    setReceiptPreview(null);
                  }}
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitPurchase}
                  disabled={submitting || !purchaseAmount || parseFloat(purchaseAmount) <= 0}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Enviando..." : "Enviar Compra"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "merchant", "user"]} redirectTo="/">
      <CampaignsPageContent />
    </ProtectedRoute>
  );
}

// Componente de Gráfico - Campanhas por Status
function CampaignsByStatusChart({ campaigns }: { campaigns: Campaign[] }) {
  const statusData = useMemo(() => {
    const statusCount: Record<string, number> = {};
    
    campaigns.forEach((campaign) => {
      const status = campaign.status || (campaign.is_active !== false ? "Activo" : "Inativo");
      const normalizedStatus = 
        status === "active" || status === "Activo" ? "Ativas"
        : status === "inactive" || status === "Inativo" ? "Inativas"
        : status === "cancelled" || status === "Cancelado" ? "Canceladas"
        : status === "Rascunho" ? "Rascunho"
        : status === "Expirado" ? "Expirado"
        : status;
      
      statusCount[normalizedStatus] = (statusCount[normalizedStatus] || 0) + 1;
    });

    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
    }));
  }, [campaigns]);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  if (statusData.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Sem dados para exibir</p>;
  }

  const ResponsiveContainerComponent = ResponsiveContainer as any;
  const PieChartComponent = PieChart as any;
  const PieComponent = Pie as any;
  const CellComponent = Cell as any;
  const TooltipComponent = Tooltip as any;
  const LegendComponent = Legend as any;
  
  return (
    <ResponsiveContainerComponent width="100%" height={120}>
      <PieChartComponent>
        <PieComponent
          data={statusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
          outerRadius={45}
          fill="#8884d8"
          dataKey="value"
        >
          {statusData.map((entry, index) => (
            <CellComponent key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </PieComponent>
        <TooltipComponent />
        <LegendComponent wrapperStyle={{ fontSize: "10px" }} iconSize={8} />
      </PieChartComponent>
    </ResponsiveContainerComponent>
  );
}

// Componente de Gráfico - Campanhas por Tipo
function CampaignsByTypeChart({ campaigns }: { campaigns: Campaign[] }) {
  const typeData = useMemo(() => {
    const typeCount: Record<string, number> = {};
    
    campaigns.forEach((campaign) => {
      const type = translateCampaignType(campaign.typeLabel || campaign.type || "Outro");
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return Object.entries(typeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [campaigns]);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

  if (typeData.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Sem dados para exibir</p>;
  }

  const ResponsiveContainerComponent = ResponsiveContainer as any;
  const PieChartComponent = PieChart as any;
  const PieComponent = Pie as any;
  const CellComponent = Cell as any;
  const TooltipComponent = Tooltip as any;
  const LegendComponent = Legend as any;
  
  return (
    <ResponsiveContainerComponent width="100%" height={200}>
      <PieChartComponent>
        <PieComponent
          data={typeData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={60}
          fill="#8884d8"
          dataKey="value"
        >
          {typeData.map((entry, index) => (
            <CellComponent key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </PieComponent>
        <TooltipComponent />
        <LegendComponent wrapperStyle={{ fontSize: "12px" }} />
      </PieChartComponent>
    </ResponsiveContainerComponent>
  );
}

// Componente de Gráfico - Compras por Status
function PurchasesByStatusChart({ metrics }: { metrics: any }) {
  const purchaseData = useMemo(() => {
    const data = [];
    
    if (metrics.confirmedPurchases > 0) {
      data.push({ name: "Confirmadas", value: metrics.confirmedPurchases });
    }
    if (metrics.pendingPurchases > 0) {
      data.push({ name: "Pendentes", value: metrics.pendingPurchases });
    }
    if (metrics.rejectedPurchases > 0) {
      data.push({ name: "Rejeitadas", value: metrics.rejectedPurchases });
    }

    return data;
  }, [metrics]);

  const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

  if (purchaseData.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Sem dados para exibir</p>;
  }

  const ResponsiveContainerComponent = ResponsiveContainer as any;
  const PieChartComponent = PieChart as any;
  const PieComponent = Pie as any;
  const CellComponent = Cell as any;
  const TooltipComponent = Tooltip as any;
  const LegendComponent = Legend as any;
  
  return (
    <ResponsiveContainerComponent width="100%" height={200}>
      <PieChartComponent>
        <PieComponent
          data={purchaseData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent, value }: any) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
          outerRadius={60}
          fill="#8884d8"
          dataKey="value"
        >
          {purchaseData.map((entry, index) => (
            <CellComponent key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </PieComponent>
        <TooltipComponent />
        <LegendComponent wrapperStyle={{ fontSize: "12px" }} />
      </PieChartComponent>
    </ResponsiveContainerComponent>
  );
}

