import { api } from "./api";

export interface Campaign {
  // IDs - pode ser UUID string ou number
  id?: string | number;
  campaign_id?: number | string;
  establishmentId?: string | number;
  establishment_id?: number;
  establishment?: {
    id?: number;
    name?: string;
    type?: string;
    address?: string;
    phone?: string;
    email?: string;
    image?: string;
    imageUrl?: string;
    qrCode?: string;
    color?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  // Campos principais (camelCase - estrutura real da API)
  campaignName?: string;
  campaignNumber?: string;
  sponsorName?: string;
  validFrom?: string;
  validUntil?: string;
  redemptionDeadline?: string;
  totalPointsLimit?: number;
  pointsAccumulated?: number;
  rewardDescription?: string;
  rewardValueMt?: number;
  rewardPointsCost?: number;
  rewardStock?: number;
  rewardStockRedeemed?: number;
  status?: "Rascunho" | "Activo" | "Parado" | "Cancelado" | "Concluído" | "Expirado" | "active" | "inactive" | "cancelled" | "expired";
  accumulationRate?: number;
  dailyLimitPerClient?: number;
  transactionLimit?: number;
  campaignLimitPerClient?: number;
  newCustomersOnly?: boolean;
  vipOnly?: boolean;
  allowedLocations?: number[];
  allowedPaymentMethods?: string[];
  notifyPush?: boolean;
  notifySms?: boolean;
  notifyEmail?: boolean;
  notifyWhatsapp?: boolean;
  communicationBudget?: number;
  communicationCreditsUsed?: number;
  pointsExpiryDays?: number;
  notes?: string;
  merchant_id?: number;
  // Campos de imagem e QR code (camelCase)
  image?: string;
  imageUrl?: string;
  images?: string[]; // Array de URLs de imagens
  qrCode?: string | null;
  // Campos auxiliares
  establishmentName?: string;
  establishmentType?: string;
  // Campos legados (snake_case - compatibilidade)
  campaign_name?: string;
  campaign_number?: string;
  sponsor_name?: string;
  valid_from?: string;
  valid_until?: string;
  redemption_deadline?: string;
  total_points_limit?: number;
  points_accumulated?: number;
  reward_description?: string;
  reward_value_mt?: number;
  reward_points_cost?: number;
  reward_stock?: number;
  accumulation_rate?: number;
  daily_limit_per_client?: number;
  transaction_limit?: number;
  campaign_limit_per_client?: number;
  new_customers_only?: boolean;
  vip_only?: boolean;
  allowed_locations?: number[];
  allowed_payment_methods?: string[];
  notify_push?: boolean;
  notify_sms?: boolean;
  notify_email?: boolean;
  notify_whatsapp?: boolean;
  communication_budget?: number;
  communication_credits_used?: number;
  points_expiry_days?: number;
  image_url?: string;
  photo?: string;
  photo_url?: string;
  qr_code?: string;
  qr_code_image?: string;
  // Campos legados (compatibilidade)
  type?: string; // "RewardType_Auto" | "RewardType_Draw" | "points_per_spend" | "vip_treatment" | "buy_get" | etc
  typeLabel?: string; // Label do tipo de campanha (ex: "Oferta Automática")
  typeDescription?: string; // Descrição do tipo de campanha
  name?: string; // Mapeado para campaign_name
  description?: string;
  conversionRate?: number;
  conversion_rate?: number;
  bonusMultiplier?: number;
  bonus_multiplier?: number;
  minSpend?: number;
  min_purchase_amount?: number;
  max_purchase_amount?: number;
  start_date?: string; // Mapeado para valid_from
  end_date?: string; // Mapeado para valid_until
  isActive?: boolean;
  is_active?: boolean;
  requiredVisits?: number;
  required_visits?: number;
  created_by?: number;
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
  updatedAt?: string;
  // Campos específicos por tipo de campanha (camelCase)
  // RewardType_Auto
  autoPointsAmount?: number | null;
  autoPointsCondition?: string | null;
  // RewardType_Draw
  drawParticipationCondition?: string | null;
  drawMinSpend?: number | null;
  drawChancesPerPurchase?: number | null;
  drawPrizeDescription?: string | null;
  drawDate?: string | null;
  drawWinnersCount?: number | null;
  // RewardType_Exchange
  exchangeMinPointsRequired?: number | null;
  // RewardType_Quiz
  quizQuestions?: any | null; // Array de questões ou JSON string
  quizPointsPerCorrect?: number | null;
  quizMaxAttempts?: number | null;
  quizTimeLimitSeconds?: number | null;
  // RewardType_Referral
  referralMinReferrals?: number | null;
  referralPointsPerReferral?: number | null;
  referralBonusPoints?: number | null;
  referralRequiresFirstPurchase?: boolean | null;
  referralCode?: string | null;
  // RewardType_Challenge
  challengeObjective?: string | null;
  challengeTargetValue?: number | null;
  challengeTargetType?: string | null;
  challengeRewardPoints?: number | null;
  challengeBonusReward?: string | null;
  challengeProgressTracking?: boolean | null;
  // RewardType_Party
  partyVotingOptions?: any | null; // Array de opções ou JSON string
  partyPointsPerVote?: number | null;
  partyWinnerReward?: string | null;
  partyVotingDeadline?: string | null;
  partyResultsDate?: string | null;
  // RewardType_Voucher
  voucherCode?: string | null;
  voucherValue?: number | null;
  voucherType?: "digital" | "físico" | "híbrido" | null;
  voucherCategory?: string | null;
  voucherDescription?: string | null;
  voucherTerms?: string | null;
  voucherExpiryDate?: string | null;
  voucherUsageLimit?: number | null;
  voucherMinPurchase?: number | null;
  voucherMaxDiscount?: number | null;
  voucherPercentage?: number | null;
  voucherFixedAmount?: number | null;
  voucherRequiresCode?: boolean | null;
  voucherSingleUse?: boolean | null;
  voucherApplyTo?: string | null;
  // Métricas e estatísticas (camelCase - estrutura real da API)
  metrics?: {
    totalParticipants?: number;
    totalPurchases?: number;
    confirmedPurchases?: number;
    pendingPurchases?: number;
    rejectedPurchases?: number;
    totalPointsEarned?: number;
    totalPointsEarnedConfirmed?: number;
    totalRevenue?: number;
    totalRevenueConfirmed?: number;
    avgPurchaseAmount?: number;
    maxPurchaseAmount?: number;
    minPurchaseAmount?: number;
    avgPointsPerPurchase?: number;
  } | null;
  // Participações e códigos de reserva
  participationsCount?: number;
  participations?: Array<{
    participationId: number;
    reservationCode: string;
    status: string;
    isValid: boolean;
    user: {
      userId: number;
      username: string;
      email: string;
      name: string;
      phone?: string;
    } | null;
    createdAt: string;
    usedAt: string | null;
    expiresAt: string | null;
  }>;
  // Participação do usuário atual (se for cliente)
  userReservationCode?: string | null;
  userParticipationStatus?: string | null;
  hasParticipated?: boolean;
  quizMetrics?: {
    totalParticipants?: number;
    totalAttempts?: number;
    completedAttempts?: number;
    totalPointsEarned?: number;
  } | null;
  campaignMetadata?: any | null;
  campaignRules?: any | null;
  campaignSettings?: any | null;
  // Estatísticas legadas
  total_uses?: number;
  total_points_given?: number;
  total_revenue?: number;
}

export interface CampaignsResponse {
  success: boolean;
  data: Campaign[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  generalMetrics?: {
    totalCampaigns?: number;
    totalEstablishments?: number;
    totalParticipants?: number;
    totalPurchases?: number;
    confirmedPurchases?: number;
    pendingPurchases?: number;
    rejectedPurchases?: number;
    totalPointsEarned?: number;
    totalPointsEarnedConfirmed?: number;
    totalRevenue?: number;
    totalRevenueConfirmed?: number;
    avgPurchaseAmount?: number;
    maxPurchaseAmount?: number;
    minPurchaseAmount?: number;
    avgPointsPerPurchase?: number;
  };
}

export interface CreateCampaignDTO {
  establishment_id: number | string;
  // Campos base obrigatórios (CR#3)
  campaign_name: string;
  valid_from: string;
  valid_until: string;
  reward_value_mt: number;
  reward_points_cost: number;
  // Campos opcionais
  sponsor_name?: string;
  total_points_limit?: number;
  redemption_deadline?: string;
  reward_description?: string;
  reward_stock?: number;
  status?: "Rascunho" | "Activo" | "Parado" | "Cancelado" | "Concluído" | "Expirado";
  accumulation_rate?: number; // Taxa de acumulação (ex: 0.1 = 1 MT = 10 pts)
  daily_limit_per_client?: number;
  transaction_limit?: number;
  campaign_limit_per_client?: number;
  new_customers_only?: boolean;
  vip_only?: boolean;
  allowed_locations?: number[];
  allowed_payment_methods?: string[];
  notify_push?: boolean;
  notify_sms?: boolean;
  notify_email?: boolean;
  notify_whatsapp?: boolean;
  communication_budget?: number;
  points_expiry_days?: number;
  notes?: string;
  // Campos de imagem e QR code
  image?: string | File;
  image_url?: string | File;
  photo?: string | File;
  photo_url?: string | File;
  qrCode?: string;
  qr_code?: string;
  qr_code_image?: string | File;
  // Campos legados (compatibilidade)
  type?: "RewardType_Auto" | "RewardType_Draw" | "RewardType_Exchange" | "RewardType_Quiz" | "RewardType_Referral" | "RewardType_Challenge" | "RewardType_Party" | "RewardType_Voucher" | "points_per_spend" | "vip_treatment" | "buy_get" | "points" | "percentage" | "fixed" | "bonus_multiplier";
  name?: string; // Mapeado para campaign_name
  description?: string;
  conversion_rate?: number; // Taxa de conversão (para points_per_spend)
  bonus_multiplier?: number;
  min_purchase_amount?: number; // Mapeado para min_spend
  max_purchase_amount?: number;
  start_date?: string; // Mapeado para valid_from
  end_date?: string; // Mapeado para valid_until
  is_active?: boolean;
  // Campos específicos para campanha automática
  benefit_description?: string;
  required_quantity?: number;
  // Novos campos por tipo (CR#3)
  draw_periodicity?: "daily" | "weekly" | "monthly" | "event";
  draw_points_per_participation?: number;
  draw_prizes_list?: any;
  exchange_prizes_list?: any;
}

export interface UpdateCampaignDTO {
  // Campos novos
  campaign_name?: string;
  sponsor_name?: string;
  valid_from?: string;
  valid_until?: string;
  redemption_deadline?: string;
  total_points_limit?: number;
  reward_description?: string;
  reward_value_mt?: number;
  reward_points_cost?: number;
  reward_stock?: number;
  status?: "Rascunho" | "Activo" | "Parado" | "Cancelado" | "Concluído" | "Expirado" | "active" | "inactive" | "cancelled" | "expired";
  accumulation_rate?: number;
  daily_limit_per_client?: number;
  transaction_limit?: number;
  campaign_limit_per_client?: number;
  new_customers_only?: boolean;
  vip_only?: boolean;
  allowed_locations?: number[];
  allowed_payment_methods?: string[];
  notify_push?: boolean;
  notify_sms?: boolean;
  notify_email?: boolean;
  notify_whatsapp?: boolean;
  communication_budget?: number;
  points_expiry_days?: number;
  notes?: string;
  // Campos de imagem e QR code
  image?: string | File;
  image_url?: string | File;
  photo?: string | File;
  photo_url?: string | File;
  qrCode?: string;
  qr_code?: string;
  qr_code_image?: string | File;
  // Campos legados (compatibilidade)
  name?: string;
  description?: string;
  conversion_rate?: number;
  bonus_multiplier?: number;
  min_purchase_amount?: number;
  max_purchase_amount?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  type?: string;
}

export interface GetAllCampaignsParams {
  page?: number;
  limit?: number;
  establishment_id?: number;
  status?: "active" | "inactive" | "cancelled" | "expired";
  type?: string;
  search?: string;
}

export interface ChangeCampaignStatusDTO {
  status: "active" | "inactive" | "cancelled" | "expired";
}

export const campaignsService = {
  /**
   * Buscar campanhas do merchant autenticado
   * GET /api/campaigns/my
   */
  async getMyCampaigns(params?: { page?: number; limit?: number; status?: string; establishment_id?: number; type?: string; search?: string }): Promise<CampaignsResponse> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.establishment_id !== undefined) queryParams.establishment_id = params.establishment_id;
      if (params?.status) queryParams.status = params.status;
      if (params?.type) queryParams.type = params.type;
      if (params?.search) queryParams.search = params.search;

      const response = await api.get("/campaigns/my", { params: queryParams });

      // Nova estrutura: { success: true, data: [...], pagination: {...} }
      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else {
        return {
          success: true,
          data: response.data?.data || response.data || [],
          pagination: response.data?.pagination,
        };
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar campanhas do merchant";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Buscar minhas campanhas (endpoint específico)
   * GET /api/campaigns/my-campaigns
   */
  async getMyCampaignsList(params?: { page?: number; limit?: number; status?: string; establishment_id?: number; search?: string }): Promise<CampaignsResponse> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.establishment_id !== undefined) queryParams.establishment_id = params.establishment_id;
      if (params?.status) queryParams.status = params.status;
      if (params?.search) queryParams.search = params.search;

      const response = await api.get("/campaigns/my-campaigns", { params: queryParams });

      // Nova estrutura: { success: true, data: [...], pagination: {...} }
      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else {
        return {
          success: true,
          data: response.data?.data || response.data || [],
          pagination: response.data?.pagination,
        };
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar minhas campanhas";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Buscar campanhas públicas
   * GET /api/campaigns/public
   */
  async getPublicCampaigns(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<CampaignsResponse> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.status) queryParams.status = params.status;
      if (params?.search) queryParams.search = params.search;

      const response = await api.get("/campaigns/public", { params: queryParams });

      // Nova estrutura: { success: true, data: [...], pagination: {...} }
      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else {
        return {
          success: true,
          data: response.data?.data || response.data || [],
          pagination: response.data?.pagination,
        };
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar campanhas públicas";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Buscar todas as campanhas (apenas admin)
   * GET /api/campaigns
   */
  async getAll(params?: GetAllCampaignsParams): Promise<CampaignsResponse> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.establishment_id !== undefined) queryParams.establishment_id = params.establishment_id;
      if (params?.status) queryParams.status = params.status;
      if (params?.type) queryParams.type = params.type;
      if (params?.search) queryParams.search = params.search;

      const response = await api.get("/campaigns", { params: queryParams });

      // Nova estrutura: { success: true, data: [...], pagination: {...} }
      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else {
        return {
          success: true,
          data: response.data?.data || response.data || [],
          pagination: response.data?.pagination,
        };
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar campanhas";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Buscar campanha por ID (pode ser número ou UUID)
   * GET /api/campaigns/:id
   */
  async getById(id: number | string): Promise<Campaign> {
    try {
      const response = await api.get(`/campaigns/${id}`);
      
      // Nova estrutura: { success: true, data: {...} }
      const campaignData = response.data?.data || response.data || {};
      
      return campaignData as Campaign;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar campanha";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Campanha não encontrada";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Buscar campanhas de um estabelecimento
   * GET /api/campaigns/establishment/:establishmentId
   */
  async getByEstablishment(establishmentId: number, params?: { page?: number; limit?: number; status?: string }): Promise<CampaignsResponse> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.status) queryParams.status = params.status;

      const response = await api.get(`/campaigns/establishment/${establishmentId}`, { params: queryParams });

      // Nova estrutura: { success: true, data: [...], pagination: {...} }
      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else {
        return {
          success: true,
          data: response.data?.data || response.data || [],
          pagination: response.data?.pagination,
        };
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar campanhas do estabelecimento";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Estabelecimento não encontrado";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Criar campanha (admin ou merchant com permissão)
   * POST /api/campaigns
   */
  async create(data: CreateCampaignDTO): Promise<Campaign> {
    try {
      // Verificar se há arquivos para enviar (imagem ou QR code)
      const hasFiles = data.image instanceof File || 
                       data.image_url instanceof File || 
                       data.photo instanceof File || 
                       data.photo_url instanceof File ||
                       data.qr_code_image instanceof File;
      
      // Se houver arquivos, usar FormData
      if (hasFiles) {
        const formData = new FormData();
        
        // Adicionar campos de texto
        // establishment_id deve ser número, mas FormData converte tudo para string
        // O backend precisa fazer parse para número
        formData.append("establishment_id", String(Number(data.establishment_id)));
        formData.append("campaign_name", data.campaign_name);
        formData.append("sponsor_name", data.sponsor_name);
        formData.append("valid_from", data.valid_from);
        formData.append("valid_until", data.valid_until);
        
        // Campos opcionais
        if (data.description) formData.append("description", data.description);
        if (data.total_points_limit !== undefined) formData.append("total_points_limit", String(data.total_points_limit));
        if (data.redemption_deadline) formData.append("redemption_deadline", data.redemption_deadline);
        if (data.reward_description) formData.append("reward_description", data.reward_description);
        if (data.reward_value_mt !== undefined) formData.append("reward_value_mt", String(data.reward_value_mt));
        if (data.reward_points_cost !== undefined) formData.append("reward_points_cost", String(data.reward_points_cost));
        if (data.reward_stock !== undefined) formData.append("reward_stock", String(data.reward_stock));
        if (data.status) formData.append("status", data.status);
        if (data.accumulation_rate !== undefined) formData.append("accumulation_rate", String(data.accumulation_rate));
        if (data.daily_limit_per_client !== undefined) formData.append("daily_limit_per_client", String(data.daily_limit_per_client));
        if (data.transaction_limit !== undefined) formData.append("transaction_limit", String(data.transaction_limit));
        if (data.campaign_limit_per_client !== undefined) formData.append("campaign_limit_per_client", String(data.campaign_limit_per_client));
        if (data.new_customers_only !== undefined) formData.append("new_customers_only", String(data.new_customers_only));
        if (data.vip_only !== undefined) formData.append("vip_only", String(data.vip_only));
        if (data.notify_push !== undefined) formData.append("notify_push", String(data.notify_push));
        if (data.notify_sms !== undefined) formData.append("notify_sms", String(data.notify_sms));
        if (data.notify_email !== undefined) formData.append("notify_email", String(data.notify_email));
        if (data.notify_whatsapp !== undefined) formData.append("notify_whatsapp", String(data.notify_whatsapp));
        if (data.communication_budget !== undefined) formData.append("communication_budget", String(data.communication_budget));
        if (data.points_expiry_days !== undefined) formData.append("points_expiry_days", String(data.points_expiry_days));
        if (data.notes) formData.append("notes", data.notes);
        if (data.qrCode) formData.append("qrCode", data.qrCode);
        if (data.qr_code) formData.append("qr_code", data.qr_code);
        
        // Adicionar arquivos
        if (data.image instanceof File) {
          formData.append("image", data.image);
        } else if (data.image && typeof data.image === "string") {
          formData.append("image", data.image);
        }
        
        if (data.image_url instanceof File) {
          formData.append("image_url", data.image_url);
        } else if (data.image_url && typeof data.image_url === "string") {
          formData.append("image_url", data.image_url);
        }
        
        if (data.photo instanceof File) {
          formData.append("photo", data.photo);
        } else if (data.photo && typeof data.photo === "string") {
          formData.append("photo", data.photo);
        }
        
        if (data.photo_url instanceof File) {
          formData.append("photo_url", data.photo_url);
        } else if (data.photo_url && typeof data.photo_url === "string") {
          formData.append("photo_url", data.photo_url);
        }
        
        if (data.qr_code_image instanceof File) {
          formData.append("qr_code_image", data.qr_code_image);
        } else if (data.qr_code_image && typeof data.qr_code_image === "string") {
          formData.append("qr_code_image", data.qr_code_image);
        }
        
        // Campos de compatibilidade
        formData.append("name", data.campaign_name);
        formData.append("start_date", data.valid_from);
        formData.append("end_date", data.valid_until);
        
        console.log("📤 [CAMPAIGNS SERVICE] Enviando FormData com arquivos");
        
        // Usar fetch diretamente para enviar FormData
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (!token) {
          throw new Error("Token de autenticação não encontrado. Por favor, faça login novamente.");
        }
        
        const API_BASE_URL = api.defaults.baseURL || "http://localhost:8000/api";
        const response = await fetch(`${API_BASE_URL}/campaigns`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        const campaignData = responseData?.data || responseData || {};
        
        return campaignData as Campaign;
      } else {
        // Se não houver arquivos, usar JSON normal
        // Garantir que não estamos enviando campaign_id ou id (devem ser gerados pelo banco)
        const payload: any = { ...data };
        if (payload.campaign_id !== undefined) {
          delete payload.campaign_id;
        }
        if (payload.id !== undefined) {
          delete payload.id;
        }
        
        console.log("📤 [CAMPAIGNS SERVICE] Enviando payload JSON (sem campaign_id):", payload);
        const response = await api.post("/campaigns", payload);
        
        // Nova estrutura: { success: true, data: {...}, message: "..." }
        const campaignData = response.data?.data || response.data || {};
        
        return campaignData as Campaign;
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao criar campanha";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        // Tentar extrair mensagem de erro mais detalhada
        if (data?.error) {
          message = typeof data.error === "string" ? data.error : data.error.message || data.error.error || JSON.stringify(data.error);
        } else if (data?.message) {
          message = data.message;
        } else {
          message = "Dados inválidos para criar campanha";
        }
        
        // Se houver detalhes sobre campos faltando, adicionar à mensagem
        if (data?.details) {
          const details = data.details;
          if (typeof details === "object") {
            const missingFields = Object.keys(details).filter(key => details[key] !== null && details[key] !== undefined);
            if (missingFields.length > 0) {
              message += `\n\nCampos faltando ou inválidos: ${missingFields.join(", ")}`;
            } else {
              // Tentar extrair informações de validação
              const validationErrors = Object.entries(details)
                .filter(([_, value]) => value !== null && value !== undefined)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ");
              if (validationErrors) {
                message += `\n\nDetalhes: ${validationErrors}`;
              }
            }
          } else if (typeof details === "string") {
            message += `\n\n${details}`;
          }
        }
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Você não tem permissão para criar campanhas.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      // @ts-ignore
      error.response = err?.response;
      // @ts-ignore
      error.details = data?.details;
      throw error;
    }
  },

  /**
   * Atualizar campanha (admin ou merchant que criou)
   * PUT /api/campaigns/:id
   */
  async update(id: number | string, data: UpdateCampaignDTO): Promise<Campaign> {
    try {
      // Verificar se há arquivos para enviar (imagem ou QR code)
      const hasFiles = data.image instanceof File || 
                       data.image_url instanceof File || 
                       data.photo instanceof File || 
                       data.photo_url instanceof File ||
                       data.qr_code_image instanceof File;
      
      // Se houver arquivos, usar FormData
      if (hasFiles) {
        const formData = new FormData();
        
        // Adicionar campos de texto (apenas se tiverem valor)
        if (data.campaign_name) formData.append("campaign_name", data.campaign_name);
        if (data.sponsor_name) formData.append("sponsor_name", data.sponsor_name);
        if (data.valid_from) formData.append("valid_from", data.valid_from);
        if (data.valid_until) formData.append("valid_until", data.valid_until);
        if (data.redemption_deadline) formData.append("redemption_deadline", data.redemption_deadline);
        if (data.description) formData.append("description", data.description);
        if (data.total_points_limit !== undefined) formData.append("total_points_limit", String(data.total_points_limit));
        if (data.reward_description) formData.append("reward_description", data.reward_description);
        if (data.reward_value_mt !== undefined) formData.append("reward_value_mt", String(data.reward_value_mt));
        if (data.reward_points_cost !== undefined) formData.append("reward_points_cost", String(data.reward_points_cost));
        if (data.reward_stock !== undefined) formData.append("reward_stock", String(data.reward_stock));
        if (data.status) formData.append("status", data.status);
        if (data.accumulation_rate !== undefined) formData.append("accumulation_rate", String(data.accumulation_rate));
        if (data.daily_limit_per_client !== undefined) formData.append("daily_limit_per_client", String(data.daily_limit_per_client));
        if (data.transaction_limit !== undefined) formData.append("transaction_limit", String(data.transaction_limit));
        if (data.campaign_limit_per_client !== undefined) formData.append("campaign_limit_per_client", String(data.campaign_limit_per_client));
        if (data.new_customers_only !== undefined) formData.append("new_customers_only", String(data.new_customers_only));
        if (data.vip_only !== undefined) formData.append("vip_only", String(data.vip_only));
        if (data.notify_push !== undefined) formData.append("notify_push", String(data.notify_push));
        if (data.notify_sms !== undefined) formData.append("notify_sms", String(data.notify_sms));
        if (data.notify_email !== undefined) formData.append("notify_email", String(data.notify_email));
        if (data.notify_whatsapp !== undefined) formData.append("notify_whatsapp", String(data.notify_whatsapp));
        if (data.communication_budget !== undefined) formData.append("communication_budget", String(data.communication_budget));
        if (data.points_expiry_days !== undefined) formData.append("points_expiry_days", String(data.points_expiry_days));
        if (data.notes) formData.append("notes", data.notes);
        if (data.qrCode) formData.append("qrCode", data.qrCode);
        if (data.qr_code) formData.append("qr_code", data.qr_code);
        
        // Adicionar arquivos
        if (data.image instanceof File) {
          formData.append("image", data.image);
        } else if (data.image && typeof data.image === "string") {
          formData.append("image", data.image);
        }
        
        if (data.image_url instanceof File) {
          formData.append("image_url", data.image_url);
        } else if (data.image_url && typeof data.image_url === "string") {
          formData.append("image_url", data.image_url);
        }
        
        if (data.photo instanceof File) {
          formData.append("photo", data.photo);
        } else if (data.photo && typeof data.photo === "string") {
          formData.append("photo", data.photo);
        }
        
        if (data.photo_url instanceof File) {
          formData.append("photo_url", data.photo_url);
        } else if (data.photo_url && typeof data.photo_url === "string") {
          formData.append("photo_url", data.photo_url);
        }
        
        if (data.qr_code_image instanceof File) {
          formData.append("qr_code_image", data.qr_code_image);
        } else if (data.qr_code_image && typeof data.qr_code_image === "string") {
          formData.append("qr_code_image", data.qr_code_image);
        }
        
        // Campos de compatibilidade
        if (data.name) formData.append("name", data.name);
        if (data.start_date) formData.append("start_date", data.start_date);
        if (data.end_date) formData.append("end_date", data.end_date);
        
        console.log("📤 [CAMPAIGNS SERVICE] Atualizando com FormData e arquivos");
        
        // Usar fetch diretamente para enviar FormData
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (!token) {
          throw new Error("Token de autenticação não encontrado. Por favor, faça login novamente.");
        }
        
        const API_BASE_URL = api.defaults.baseURL || "http://localhost:8000/api";
        const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        const campaignData = responseData?.data || responseData || {};
        
        return campaignData as Campaign;
      } else {
        // Se não houver arquivos, usar JSON normal
        const response = await api.put(`/campaigns/${id}`, data);
        
        // Nova estrutura: { success: true, data: {...}, message: "..." }
        const campaignData = response.data?.data || response.data || {};
        
        return campaignData as Campaign;
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao atualizar campanha";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para atualizar campanha";
      } else if (_status === 404) {
        message = "Campanha não encontrada";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Você não tem permissão para atualizar esta campanha.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Deletar campanha (apenas admin)
   * DELETE /api/campaigns/:id
   */
  async delete(id: number | string): Promise<void> {
    try {
      await api.delete(`/campaigns/${id}`);
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao deletar campanha";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Campanha não encontrada";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas administradores podem deletar campanhas.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Mudar status da campanha (Activar/Parar/Cancelar)
   * POST /api/campaigns/:id/status
   */
  async changeStatus(id: number | string, data: ChangeCampaignStatusDTO): Promise<Campaign> {
    try {
      const response = await api.post(`/campaigns/${id}/status`, data);
      
      // Nova estrutura: { success: true, data: {...}, message: "..." }
      const campaignData = response.data?.data || response.data || {};
      
      return campaignData as Campaign;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao mudar status da campanha";
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para mudar status";
      } else if (_status === 404) {
        message = "Campanha não encontrada";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Você não tem permissão para mudar o status desta campanha.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Ativar campanha (legado - mantido para compatibilidade)
   * POST /api/campaigns/:id/activate
   */
  async activate(id: number | string): Promise<Campaign> {
    return this.changeStatus(id, { status: "active" });
  },

  /**
   * Desativar campanha (legado - mantido para compatibilidade)
   * POST /api/campaigns/:id/deactivate
   */
  async deactivate(id: number | string): Promise<Campaign> {
    return this.changeStatus(id, { status: "inactive" });
  },

  /**
   * Participar de uma campanha (gerar código de reserva)
   * POST /api/campaigns/:id/participate
   */
  async participate(campaignId: number | string): Promise<{
    participationId: number;
    campaignId: string | number;
    campaignType: string;
    campaignDescription: string;
    reservationCode: string;
    status: string;
    expiresAt: string | null;
    createdAt: string;
  }> {
    try {
      const response = await api.post(`/campaigns/${campaignId}/participate`);
      
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao participar da campanha";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Não foi possível participar da campanha";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Apenas clientes podem participar de campanhas.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Listar minhas participações
   * GET /api/campaigns/my/participations
   */
  async getMyParticipations(): Promise<{
    participationId: number;
    campaignId: string | number;
    reservationCode: string;
    status: string;
    isValid: boolean;
    campaign: {
      type: string;
      description: string;
      validUntil: string | null;
    };
    establishment: {
      name: string;
      type: string;
    } | null;
    createdAt: string;
    usedAt: string | null;
    expiresAt: string | null;
  }[]> {
    try {
      const response = await api.get("/campaigns/my/participations");
      
      return response.data?.data || [];
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar participações";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Validar código de reserva
   * POST /api/campaigns/validate-reservation
   */
  async validateReservationCode(code: string): Promise<{
    participationId: number;
    campaignId: string | number;
    campaignType: string;
    campaignDescription: string;
    reservationCode: string;
    status: string;
    usedAt: Date;
  }> {
    try {
      const response = await api.post("/campaigns/validate-reservation", { code });
      
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao validar código de reserva";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Código de reserva inválido ou expirado";
      } else if (_status === 404) {
        message = data?.message || data?.error || "Código de reserva não encontrado";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Marcar reserva como usada
   * PUT /api/campaigns/:campaignId/participations/:participationId/mark-used
   */
  async markReservationAsUsed(campaignId: string | number, participationId: string | number): Promise<any> {
    try {
      const response = await api.put(`/campaigns/${campaignId}/participations/${participationId}/mark-used`);
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao marcar reserva como usada";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Esta reserva já foi marcada como usada";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado";
      } else if (_status === 404) {
        message = data?.message || data?.error || "Reserva não encontrada";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Buscar participações de uma campanha (códigos de reserva)
   * GET /api/campaigns/:id/participations
   */
  async getCampaignParticipations(campaignId: number | string, params?: { status?: 'pending' | 'used' | 'expired' | 'all'; search?: string }): Promise<{
    participationId: number;
    reservationCode: string;
    status: string;
    isValid: boolean;
    user: {
      userId: number;
      username: string;
      email: string;
      name: string;
      phone?: string;
    } | null;
    createdAt: string;
    usedAt: string | null;
    expiresAt: string | null;
  }[]> {
    try {
      const queryParams: any = {};
      if (params?.status !== undefined) queryParams.status = params.status;
      if (params?.search !== undefined) queryParams.search = params.search;
      
      const response = await api.get(`/campaigns/${campaignId}/participations`, { params: queryParams });
      
      return response.data?.data || [];
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar participações da campanha";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Apenas administradores e merchants podem ver participações.";
      } else if (_status === 404) {
        message = data?.message || data?.error || "Campanha não encontrada";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async getPendingPurchases(campaignId: string | number, params?: { page?: number; limit?: number; status?: 'pending' | 'validated' | 'rejected' | 'all' }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.status !== undefined) queryParams.status = params.status;

      const response = await api.get(`/auto-campaigns/${campaignId}/purchases`, { params: queryParams });
      // Retornar tanto os dados quanto as estatísticas
      return {
        data: response.data?.data || response.data,
        stats: response.data?.stats || null,
        pagination: response.data?.pagination || null
      };
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar pagamentos pendentes";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Você não tem permissão para ver pagamentos pendentes desta campanha.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async validatePurchase(purchaseId: string | number): Promise<any> {
    try {
      const response = await api.post(`/auto-campaigns/purchases/${purchaseId}/validate`);
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao validar pagamento";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Você não tem permissão para validar este pagamento.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async rejectPurchase(purchaseId: string | number, rejectionReason?: string): Promise<any> {
    try {
      const response = await api.post(`/auto-campaigns/purchases/${purchaseId}/reject`, {
        rejection_reason: rejectionReason || undefined
      });
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao rejeitar pagamento";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Você não tem permissão para rejeitar este pagamento.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },
};

// Interface para campanha automática simplificada
export interface AutoCampaign {
  id?: string | number;
  campaign_id?: string | number;
  establishment_id?: number | string;
  establishment_name?: string;
  benefit_description: string;
  valid_from: string;
  valid_until: string;
  min_purchase_amount?: number;
  is_active?: boolean;
}

export interface CreateAutoCampaignDTO {
  establishment_id: number | string;
  benefit_description: string;
  valid_from: string;
  valid_until: string;
  min_purchase_amount?: number;
}

export interface UpdateAutoCampaignDTO {
  benefit_description?: string;
  valid_from?: string;
  valid_until?: string;
  min_purchase_amount?: number;
}

export interface AutoCampaignsResponse {
  success: boolean;
  data: AutoCampaign[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Serviço específico para campanhas automáticas
export const autoCampaignsService = {
  /**
   * Criar campanha automática
   * POST /api/auto-campaigns
   */
  async create(data: CreateAutoCampaignDTO): Promise<AutoCampaign> {
    try {
      const response = await api.post("/auto-campaigns", data);
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao criar campanha automática";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para criar campanha automática";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Você não tem permissão para criar campanhas automáticas.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Listar campanhas automáticas
   * GET /api/auto-campaigns
   */
  async getAll(params?: { page?: number; limit?: number; establishment_id?: number }): Promise<AutoCampaignsResponse> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.establishment_id !== undefined) queryParams.establishment_id = params.establishment_id;

      const response = await api.get("/auto-campaigns", { params: queryParams });

      if (response.data?.success !== undefined) {
        return {
          success: response.data.success,
          data: response.data.data || [],
          pagination: response.data.pagination,
        };
      } else {
        return {
          success: true,
          data: response.data?.data || response.data || [],
          pagination: response.data?.pagination,
        };
      }
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar campanhas automáticas";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Buscar campanha automática por ID
   * GET /api/auto-campaigns/:id
   */
  async getById(id: number | string): Promise<AutoCampaign> {
    try {
      const response = await api.get(`/auto-campaigns/${id}`);
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar campanha automática";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Campanha automática não encontrada";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Atualizar campanha automática
   * PUT /api/auto-campaigns/:id
   */
  async update(id: number | string, data: UpdateAutoCampaignDTO): Promise<AutoCampaign> {
    try {
      const response = await api.put(`/auto-campaigns/${id}`, data);
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao atualizar campanha automática";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para atualizar campanha automática";
      } else if (_status === 404) {
        message = "Campanha automática não encontrada";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Acesso negado. Você não tem permissão para atualizar esta campanha automática.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Deletar campanha automática
   * DELETE /api/auto-campaigns/:id
   */
  async delete(id: number | string): Promise<void> {
    try {
      await api.delete(`/auto-campaigns/${id}`);
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao deletar campanha automática";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 404) {
        message = "Campanha automática não encontrada";
      } else if (_status === 403) {
        message = "Acesso negado. Apenas administradores podem deletar campanhas automáticas.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async getPendingPurchases(campaignId: string | number, params?: { page?: number; limit?: number; status?: 'pending' | 'validated' | 'rejected' | 'all' }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.status !== undefined) queryParams.status = params.status;

      const response = await api.get(`/auto-campaigns/${campaignId}/purchases`, { params: queryParams });
      // Retornar tanto os dados quanto as estatísticas
      return {
        data: response.data?.data || response.data,
        stats: response.data?.stats || null,
        pagination: response.data?.pagination || null
      };
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar pagamentos pendentes";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Você não tem permissão para ver pagamentos pendentes desta campanha.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async validatePurchase(purchaseId: string | number): Promise<any> {
    try {
      const response = await api.post(`/auto-campaigns/purchases/${purchaseId}/validate`);
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao validar pagamento";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Você não tem permissão para validar este pagamento.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async rejectPurchase(purchaseId: string | number, rejectionReason?: string): Promise<any> {
    try {
      const response = await api.post(`/auto-campaigns/purchases/${purchaseId}/reject`, {
        rejection_reason: rejectionReason || undefined
      });
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao rejeitar pagamento";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Você não tem permissão para rejeitar este pagamento.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },
};

// Serviço para compras de campanhas automáticas
export const campaignPurchasesService = {
  /**
   * Submeter compra para validação em campanha automática
   * POST /api/auto-campaigns/:campaignId/purchases
   */
  async submitPurchase(campaignId: string | number, data: { purchase_amount: number; notes?: string; receipt_photo?: File }): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('purchase_amount', data.purchase_amount.toString());
      if (data.notes) {
        formData.append('notes', data.notes);
      }
      if (data.receipt_photo) {
        formData.append('receipt_photo', data.receipt_photo);
      }

      const response = await api.post(`/auto-campaigns/${campaignId}/purchases`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao submeter compra para campanha";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 400) {
        message = data?.message || data?.error || "Dados inválidos para submeter compra";
      } else if (_status === 403) {
        message = data?.message || data?.error || "Apenas clientes podem submeter compras para campanhas";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  /**
   * Listar minhas compras de campanha automática
   * GET /api/auto-campaigns/:campaignId/my-purchases
   */
  async getMyPurchases(campaignId?: string | number, params?: { page?: number; limit?: number; status?: string }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.status) queryParams.status = params.status;

      const endpoint = campaignId 
        ? `/auto-campaigns/${campaignId}/my-purchases`
        : '/auto-campaigns/my-purchases';
      
      const response = await api.get(endpoint, { params: queryParams });
      // O backend retorna { success: true, data: [...], pagination: {...} }
      return response.data || { data: [], pagination: {} };
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar minhas compras de campanha";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async getPendingPurchases(campaignId: string | number, params?: { page?: number; limit?: number; status?: 'pending' | 'validated' | 'rejected' | 'all' }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.limit !== undefined) queryParams.limit = params.limit;
      if (params?.status !== undefined) queryParams.status = params.status;

      const response = await api.get(`/auto-campaigns/${campaignId}/purchases`, { params: queryParams });
      // Retornar tanto os dados quanto as estatísticas
      return {
        data: response.data?.data || response.data,
        stats: response.data?.stats || null,
        pagination: response.data?.pagination || null
      };
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar pagamentos pendentes";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Você não tem permissão para ver pagamentos pendentes desta campanha.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async validatePurchase(purchaseId: string | number): Promise<any> {
    try {
      const response = await api.post(`/auto-campaigns/purchases/${purchaseId}/validate`);
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao validar pagamento";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Você não tem permissão para validar este pagamento.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },

  async rejectPurchase(purchaseId: string | number, rejectionReason?: string): Promise<any> {
    try {
      const response = await api.post(`/auto-campaigns/purchases/${purchaseId}/reject`, {
        rejection_reason: rejectionReason || undefined
      });
      return response.data?.data || response.data;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao rejeitar pagamento";
      
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Você não tem permissão para rejeitar este pagamento.";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      const error = new Error(message);
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
    }
  },
};

