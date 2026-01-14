import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { campaignsService, Campaign, UpdateCampaignDTO } from "@/services/campaigns.service";
import { establishmentService } from "@/services/establishment.service";
import { merchantsService } from "@/services/merchants.service";
import { isAdmin, isMerchant } from "@/utils/roleUtils";
import { AlertModal } from "@/components/modals/AlertModal";

export default function EditCampaignPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const redirectRef = useRef(false);

  // Interface para questões do quiz
  interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
    points?: number;
    explanation?: string;
  }

  // Interface para prémios de troca
  interface ExchangePrize {
    name: string;
    price_mt?: number;
    points_required: number;
  }

  // Estados para upload de arquivos
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Estados para gerenciar dados específicos por tipo
  const [exchangePrizes, setExchangePrizes] = useState<ExchangePrize[]>([]);
  const [newPrize, setNewPrize] = useState<ExchangePrize>({
    name: "",
    price_mt: undefined,
    points_required: 0,
  });
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [votingOptions, setVotingOptions] = useState<string[]>([]);
  const [newVotingOption, setNewVotingOption] = useState<string>("");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null);
  const [draggedOption, setDraggedOption] = useState<{ questionId: string; optionIndex: number } | null>(null);

  const [formData, setFormData] = useState<UpdateCampaignDTO & {
    type?: string;
    reward_value_mt?: number;
    reward_points_cost?: number;
    reward_description?: string;
    reward_stock?: number;
    // Campos específicos por tipo de campanha
    draw_periodicity?: "daily" | "weekly" | "monthly" | "event";
    draw_points_per_participation?: number;
    draw_prizes_list?: any;
    exchange_prizes_list?: any;
    quiz_questions?: any;
    quiz_points_per_correct?: number;
    quiz_max_attempts?: number;
    quiz_time_limit_seconds?: number;
    party_voting_options?: any;
    party_points_per_vote?: number;
    party_winner_reward?: string;
    party_voting_deadline?: string;
    party_results_date?: string;
    voucher_code?: string;
    voucher_value_mzn?: number;
    voucher_type?: "digital" | "físico" | "híbrido";
    voucher_category?: string;
    voucher_description?: string;
    voucher_terms?: string;
    voucher_expiry_date?: string;
    voucher_usage_limit?: number;
    voucher_min_purchase?: number;
    voucher_discount_type?: "percentual" | "fixo";
    voucher_discount_value?: number;
    voucher_single_use?: boolean;
    voucher_code_required?: boolean;
    booking_discount_type?: "percentual" | "fixo";
    booking_discount_value?: number;
    booking_min_advance_days?: number;
    booking_max_advance_days?: number;
    booking_service_types?: string[];
    booking_points_earned?: number;
    booking_confirmation_required?: boolean;
    // Campos para RewardType_Auto
    benefit_description?: string;
    required_quantity?: number;
  }>({
    campaign_name: "",
    sponsor_name: "",
    valid_from: "",
    valid_until: "",
    description: "",
    accumulation_rate: undefined,
    bonus_multiplier: undefined,
    min_purchase_amount: undefined,
    max_purchase_amount: undefined,
    total_points_limit: undefined,
    status: "Rascunho",
    is_active: true,
    type: undefined,
    reward_value_mt: undefined,
    reward_points_cost: undefined,
    reward_description: undefined,
    reward_stock: undefined,
    benefit_description: undefined,
    required_quantity: undefined,
  });

  useEffect(() => {
    if (router.isReady && id) {
      loadCampaign(id as string);
    }
    if (user) {
      loadEstablishments();
    }
  }, [router.isReady, id, user]);

  const loadEstablishments = async () => {
    try {
      let establishmentsData: any[] = [];
      
      // Se for admin, carregar todos os estabelecimentos
      if (isAdmin(user)) {
        console.log("🔍 [EDIT CAMPAIGN] Usuário é admin - carregando todos os estabelecimentos");
        establishmentsData = await establishmentService.getAll(true);
      } 
      // Se for merchant, carregar apenas estabelecimentos do merchant com permissão
      else if (isMerchant(user)) {
        console.log("🔍 [EDIT CAMPAIGN] Usuário é merchant - carregando estabelecimentos do merchant");
        const response = await merchantsService.getMyEstablishments();
        // Filtrar apenas estabelecimentos com permissão de criar campanhas
        establishmentsData = (response.data || []).filter((e: any) => 
          e.merchant_permissions?.can_create_campaigns === true
        );
        console.log("✅ [EDIT CAMPAIGN] Estabelecimentos com permissão:", establishmentsData.length);
      } 
      // Se não tiver role definido, tentar carregar como merchant primeiro
      else {
        console.log("🔍 [EDIT CAMPAIGN] Role não definido - tentando carregar como merchant");
        try {
          const response = await merchantsService.getMyEstablishments();
          // Filtrar apenas estabelecimentos com permissão de criar campanhas
          establishmentsData = (response.data || []).filter((e: any) => 
            e.merchant_permissions?.can_create_campaigns === true
          );
        } catch (merchantErr) {
          // Se falhar, tentar como admin
          console.log("🔍 [EDIT CAMPAIGN] Falhou como merchant - tentando como admin");
          establishmentsData = await establishmentService.getAll(true);
        }
      }
      
      console.log("✅ [EDIT CAMPAIGN] Estabelecimentos carregados:", establishmentsData.length);
      setEstablishments(establishmentsData);
    } catch (err: any) {
      console.error("❌ [EDIT CAMPAIGN] Erro ao carregar estabelecimentos:", err);
    }
  };
  
  // Função auxiliar para verificar se pode criar/editar campanha no estabelecimento
  const canCreateCampaign = (establishmentId: number): boolean => {
    // Admin pode criar em qualquer estabelecimento
    if (isAdmin(user)) {
      return true;
    }
    
    // Merchant precisa verificar permissão
    const establishment = establishments.find(e => e.id === establishmentId);
    return establishment?.merchant_permissions?.can_create_campaigns === true;
  };

  // Função auxiliar para converter data para formato YYYY-MM-DD
  const formatDateForInput = (dateString: string | undefined | null): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (err) {
      console.warn("Erro ao formatar data:", dateString, err);
      return "";
    }
  };

  const loadCampaign = async (campaignId: string | number) => {
    try {
      setLoading(true);
      setError("");
      const data = await campaignsService.getById(campaignId);
      setCampaign(data);
      
      console.log("📋 [EDIT] Dados da campanha carregados:", data);
      
      // Determinar o tipo de campanha
      const campaignType = data.type || data.typeLabel || undefined;
      
      // Preencher formulário com dados da campanha
      // Suportar tanto camelCase quanto snake_case
      const formDataToSet: any = {
        campaign_name: data.campaign_name || data.campaignName || data.name || "",
        sponsor_name: data.sponsor_name || data.sponsorName || "",
        valid_from: formatDateForInput(data.valid_from || data.validFrom || data.start_date || data.startDate),
        valid_until: formatDateForInput(data.valid_until || data.validUntil || data.end_date || data.endDate),
        description: data.description || data.reward_description || data.rewardDescription || "",
        accumulation_rate: data.accumulation_rate ?? data.accumulationRate ?? undefined,
        bonus_multiplier: data.bonus_multiplier ?? data.bonusMultiplier ?? undefined,
        min_purchase_amount: data.min_purchase_amount ?? data.minPurchaseAmount ?? undefined,
        max_purchase_amount: data.max_purchase_amount ?? data.maxPurchaseAmount ?? undefined,
        total_points_limit: data.total_points_limit ?? data.totalPointsLimit ?? undefined,
        status: (data.status as any) || (data.is_active !== false ? "Activo" : "Rascunho") || (data.isActive !== false ? "Activo" : "Rascunho") || "Rascunho",
        is_active: data.is_active !== undefined ? data.is_active !== false : (data.isActive !== undefined ? data.isActive !== false : true),
        type: campaignType,
        reward_value_mt: data.reward_value_mt ?? data.rewardValueMt ?? undefined,
        reward_points_cost: data.reward_points_cost ?? data.rewardPointsCost ?? undefined,
        reward_description: data.reward_description || data.rewardDescription || undefined,
        reward_stock: data.reward_stock ?? data.rewardStock ?? undefined,
        // Campos legados para compatibilidade
        name: data.campaign_name || data.campaignName || data.name,
        start_date: formatDateForInput(data.valid_from || data.validFrom || data.start_date || data.startDate),
        end_date: formatDateForInput(data.valid_until || data.validUntil || data.end_date || data.endDate),
      };

      // Popular campos específicos por tipo de campanha
      if (campaignType === "RewardType_Draw") {
        formDataToSet.draw_periodicity = data.drawPeriodicity || data.draw_periodicity || undefined;
        formDataToSet.draw_points_per_participation = data.drawPointsPerParticipation ?? data.draw_points_per_participation ?? undefined;
        if (data.drawPrizesList || data.draw_prizes_list) {
          try {
            formDataToSet.draw_prizes_list = typeof data.drawPrizesList === "string" ? JSON.parse(data.drawPrizesList) : (data.drawPrizesList || data.draw_prizes_list);
          } catch (e) {
            formDataToSet.draw_prizes_list = data.drawPrizesList || data.draw_prizes_list;
          }
        }
      }

      if (campaignType === "RewardType_Exchange") {
        if (data.exchangePrizesList || data.exchange_prizes_list) {
          try {
            const prizes = typeof data.exchangePrizesList === "string" ? JSON.parse(data.exchangePrizesList) : (typeof data.exchange_prizes_list === "string" ? JSON.parse(data.exchange_prizes_list) : (data.exchangePrizesList || data.exchange_prizes_list));
            if (Array.isArray(prizes)) {
              setExchangePrizes(prizes);
              formDataToSet.exchange_prizes_list = prizes;
            }
          } catch (e) {
            console.warn("Erro ao parsear exchange_prizes_list:", e);
          }
        }
      }

      if (campaignType === "RewardType_Quiz") {
        formDataToSet.quiz_points_per_correct = data.quizPointsPerCorrect ?? data.quiz_points_per_correct ?? undefined;
        formDataToSet.quiz_max_attempts = data.quizMaxAttempts ?? data.quiz_max_attempts ?? undefined;
        formDataToSet.quiz_time_limit_seconds = data.quizTimeLimitSeconds ?? data.quiz_time_limit_seconds ?? undefined;
        if (data.quizQuestions || data.quiz_questions) {
          try {
            const questions = typeof data.quizQuestions === "string" ? JSON.parse(data.quizQuestions) : (typeof data.quiz_questions === "string" ? JSON.parse(data.quiz_questions) : (data.quizQuestions || data.quiz_questions));
            if (Array.isArray(questions)) {
              setQuizQuestions(questions);
              formDataToSet.quiz_questions = questions;
            }
          } catch (e) {
            console.warn("Erro ao parsear quiz_questions:", e);
          }
        }
      }

      if (campaignType === "RewardType_Party") {
        formDataToSet.party_points_per_vote = data.partyPointsPerVote ?? data.party_points_per_vote ?? undefined;
        formDataToSet.party_winner_reward = data.partyWinnerReward || data.party_winner_reward || undefined;
        formDataToSet.party_voting_deadline = data.partyVotingDeadline || data.party_voting_deadline || undefined;
        formDataToSet.party_results_date = data.partyResultsDate || data.party_results_date || undefined;
        if (data.partyVotingOptions || data.party_voting_options) {
          try {
            const options = typeof data.partyVotingOptions === "string" ? JSON.parse(data.partyVotingOptions) : (typeof data.party_voting_options === "string" ? JSON.parse(data.party_voting_options) : (data.partyVotingOptions || data.party_voting_options));
            if (Array.isArray(options)) {
              setVotingOptions(options);
              formDataToSet.party_voting_options = options;
            }
          } catch (e) {
            console.warn("Erro ao parsear party_voting_options:", e);
          }
        }
      }

      if (campaignType === "RewardType_Voucher") {
        formDataToSet.voucher_code = data.voucherCode || data.voucher_code || undefined;
        formDataToSet.voucher_value_mzn = data.voucherValue ?? data.voucher_value_mzn ?? undefined;
        formDataToSet.voucher_type = data.voucherType || data.voucher_type || undefined;
        formDataToSet.voucher_category = data.voucherCategory || data.voucher_category || undefined;
        formDataToSet.voucher_description = data.voucherDescription || data.voucher_description || undefined;
        formDataToSet.voucher_terms = data.voucherTerms || data.voucher_terms || undefined;
        formDataToSet.voucher_expiry_date = formatDateForInput(data.voucherExpiryDate || data.voucher_expiry_date);
        formDataToSet.voucher_usage_limit = data.voucherUsageLimit ?? data.voucher_usage_limit ?? undefined;
        formDataToSet.voucher_min_purchase = data.voucherMinPurchase ?? data.voucher_min_purchase ?? undefined;
        formDataToSet.voucher_discount_type = data.voucherDiscountType || data.voucher_discount_type || undefined;
        formDataToSet.voucher_discount_value = data.voucherDiscountValue ?? data.voucher_discount_value ?? undefined;
        formDataToSet.voucher_single_use = data.voucherSingleUse ?? data.voucher_single_use ?? false;
        formDataToSet.voucher_code_required = data.voucherRequiresCode ?? data.voucher_code_required ?? false;
      }

      if (campaignType === "RewardType_Booking") {
        formDataToSet.booking_discount_type = data.bookingDiscountType || data.booking_discount_type || undefined;
        formDataToSet.booking_discount_value = data.bookingDiscountValue ?? data.booking_discount_value ?? undefined;
        formDataToSet.booking_min_advance_days = data.bookingMinAdvanceDays ?? data.booking_min_advance_days ?? undefined;
        formDataToSet.booking_max_advance_days = data.bookingMaxAdvanceDays ?? data.booking_max_advance_days ?? undefined;
        formDataToSet.booking_points_earned = data.bookingPointsEarned ?? data.booking_points_earned ?? undefined;
        formDataToSet.booking_confirmation_required = data.bookingConfirmationRequired ?? data.booking_confirmation_required ?? false;
        if (data.bookingServiceTypes || data.booking_service_types) {
          try {
            const serviceTypes = typeof data.bookingServiceTypes === "string" ? JSON.parse(data.bookingServiceTypes) : (typeof data.booking_service_types === "string" ? JSON.parse(data.booking_service_types) : (data.bookingServiceTypes || data.booking_service_types));
            if (Array.isArray(serviceTypes)) {
              formDataToSet.booking_service_types = serviceTypes;
            }
          } catch (e) {
            console.warn("Erro ao parsear booking_service_types:", e);
          }
        }
      }

      // Carregar preview da imagem se existir
      if (data.image || data.imageUrl || data.image_url) {
        setImagePreview(data.image || data.imageUrl || data.image_url || "");
      }
      
      console.log("📝 [EDIT] Formulário preenchido:", formDataToSet);
      setFormData(formDataToSet);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaign) {
      setAlertConfig({
        title: "Erro!",
        message: "Campanha não encontrada.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

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

    // Validar permissão para editar campanha (apenas para merchants)
    const establishmentId = campaign.establishment_id || campaign.establishmentId;
    const establishmentIdNumber = establishmentId ? Number(establishmentId) : undefined;
    if (!isAdmin(user) && establishmentIdNumber && !canCreateCampaign(establishmentIdNumber)) {
      setAlertConfig({
        title: "Erro!",
        message: "Você não tem permissão para editar campanhas deste estabelecimento. Entre em contato com o administrador.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    if (!formData.campaign_name || !formData.sponsor_name || !formData.valid_from || !formData.valid_until) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, preencha todos os campos obrigatórios (nome da campanha, patrocinador, data de início e data de término).",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    try {
      setSaving(true);
      setError("");
      
      // Preparar dados para envio
      const updateData: any = {
        campaign_name: formData.campaign_name,
        sponsor_name: formData.sponsor_name,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        description: formData.description || undefined,
        accumulation_rate: formData.accumulation_rate || undefined,
        bonus_multiplier: formData.bonus_multiplier || undefined,
        min_purchase_amount: formData.min_purchase_amount || undefined,
        max_purchase_amount: formData.max_purchase_amount || undefined,
        total_points_limit: formData.total_points_limit || undefined,
        status: formData.status || "Rascunho",
        is_active: formData.is_active !== false,
        // Campos legados para compatibilidade
        name: formData.campaign_name,
        start_date: formData.valid_from,
        end_date: formData.valid_until,
        // Campos específicos por tipo
        type: formData.type,
        reward_value_mt: formData.reward_value_mt || undefined,
        reward_points_cost: formData.reward_points_cost || undefined,
        reward_description: formData.reward_description || undefined,
        reward_stock: formData.reward_stock || undefined,
      };

      // Adicionar campos específicos por tipo de campanha
      if (formData.type === "RewardType_Draw") {
        if (formData.draw_periodicity) updateData.draw_periodicity = formData.draw_periodicity;
        if (formData.draw_points_per_participation !== undefined) updateData.draw_points_per_participation = formData.draw_points_per_participation;
        if (formData.draw_prizes_list) {
          updateData.draw_prizes_list = typeof formData.draw_prizes_list === "string" 
            ? formData.draw_prizes_list 
            : JSON.stringify(formData.draw_prizes_list);
        }
      }

      if (formData.type === "RewardType_Exchange") {
        if (formData.exchange_prizes_list) {
          updateData.exchange_prizes_list = typeof formData.exchange_prizes_list === "string"
            ? formData.exchange_prizes_list
            : JSON.stringify(formData.exchange_prizes_list);
        }
      }

      if (formData.type === "RewardType_Quiz") {
        if (formData.quiz_questions) {
          updateData.quiz_questions = typeof formData.quiz_questions === "string"
            ? formData.quiz_questions
            : JSON.stringify(formData.quiz_questions);
        }
        if (formData.quiz_points_per_correct !== undefined) updateData.quiz_points_per_correct = formData.quiz_points_per_correct;
        if (formData.quiz_max_attempts !== undefined) updateData.quiz_max_attempts = formData.quiz_max_attempts;
        if (formData.quiz_time_limit_seconds !== undefined) updateData.quiz_time_limit_seconds = formData.quiz_time_limit_seconds;
      }

      if (formData.type === "RewardType_Party") {
        if (formData.party_voting_options) {
          updateData.party_voting_options = typeof formData.party_voting_options === "string"
            ? formData.party_voting_options
            : JSON.stringify(formData.party_voting_options);
        }
        if (formData.party_points_per_vote !== undefined) updateData.party_points_per_vote = formData.party_points_per_vote;
        if (formData.party_winner_reward) updateData.party_winner_reward = formData.party_winner_reward;
        if (formData.party_voting_deadline) updateData.party_voting_deadline = formData.party_voting_deadline;
        if (formData.party_results_date) updateData.party_results_date = formData.party_results_date;
      }

      if (formData.type === "RewardType_Voucher") {
        if (formData.voucher_code) updateData.voucher_code = formData.voucher_code;
        if (formData.voucher_value_mzn !== undefined) updateData.voucher_value_mzn = formData.voucher_value_mzn;
        if (formData.voucher_type) updateData.voucher_type = formData.voucher_type;
        if (formData.voucher_category) updateData.voucher_category = formData.voucher_category;
        if (formData.voucher_description) updateData.voucher_description = formData.voucher_description;
        if (formData.voucher_terms) updateData.voucher_terms = formData.voucher_terms;
        if (formData.voucher_expiry_date) updateData.voucher_expiry_date = formData.voucher_expiry_date;
        if (formData.voucher_usage_limit !== undefined) updateData.voucher_usage_limit = formData.voucher_usage_limit;
        if (formData.voucher_min_purchase !== undefined) updateData.voucher_min_purchase = formData.voucher_min_purchase;
        if (formData.voucher_discount_type) updateData.voucher_discount_type = formData.voucher_discount_type;
        if (formData.voucher_discount_value !== undefined) updateData.voucher_discount_value = formData.voucher_discount_value;
        if (formData.voucher_single_use !== undefined) updateData.voucher_single_use = formData.voucher_single_use;
        if (formData.voucher_code_required !== undefined) updateData.voucher_code_required = formData.voucher_code_required;
      }

      if (formData.type === "RewardType_Booking") {
        if (formData.booking_discount_type) updateData.booking_discount_type = formData.booking_discount_type;
        if (formData.booking_discount_value !== undefined) updateData.booking_discount_value = formData.booking_discount_value;
        if (formData.booking_min_advance_days !== undefined) updateData.booking_min_advance_days = formData.booking_min_advance_days;
        if (formData.booking_max_advance_days !== undefined) updateData.booking_max_advance_days = formData.booking_max_advance_days;
        if (formData.booking_points_earned !== undefined) updateData.booking_points_earned = formData.booking_points_earned;
        if (formData.booking_confirmation_required !== undefined) updateData.booking_confirmation_required = formData.booking_confirmation_required;
        if (formData.booking_service_types) {
          updateData.booking_service_types = typeof formData.booking_service_types === "string"
            ? formData.booking_service_types
            : JSON.stringify(formData.booking_service_types);
        }
      }

      await campaignsService.update(campaignId, updateData);
      
      setAlertConfig({
        title: "Sucesso!",
        message: "Campanha atualizada com sucesso!",
        type: "success",
      });
      setAlertModalOpen(true);
      
      // Redirecionar após 2 segundos (apenas uma vez)
      if (!redirectRef.current) {
        redirectRef.current = true;
        setTimeout(() => {
          router.replace(`/admin/campaigns/${campaignId}`);
        }, 2000);
      }
    } catch (err: any) {
      console.error("Erro ao atualizar campanha:", err);
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao atualizar campanha. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  // Funções auxiliares para gerenciar dados específicos
  const addVotingOption = () => {
    if (newVotingOption.trim() === "") return;
    const updated = [...votingOptions, newVotingOption.trim()];
    setVotingOptions(updated);
    setFormData(prev => ({ ...prev, party_voting_options: updated }));
    setNewVotingOption("");
  };

  const removeVotingOption = (index: number) => {
    const updated = votingOptions.filter((_, i) => i !== index);
    setVotingOptions(updated);
    setFormData(prev => ({ ...prev, party_voting_options: updated.length > 0 ? updated : undefined }));
  };

  const addQuizQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q${Date.now()}`,
      question: "",
      options: ["", ""],
      correct_answer: 0,
      points: formData.quiz_points_per_correct || formData.reward_points_cost || 10,
      explanation: "",
    };
    const updated = [...quizQuestions, newQuestion];
    setQuizQuestions(updated);
    setFormData(prev => ({ ...prev, quiz_questions: updated }));
  };

  const removeQuizQuestion = (questionId: string) => {
    const updated = quizQuestions.filter(q => q.id !== questionId);
    setQuizQuestions(updated);
    setFormData(prev => ({ ...prev, quiz_questions: updated.length > 0 ? updated : undefined }));
  };

  const updateQuizQuestion = (questionId: string, field: keyof QuizQuestion, value: any) => {
    const updated = quizQuestions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    );
    setQuizQuestions(updated);
    setFormData(prev => ({ ...prev, quiz_questions: updated }));
  };

  const addOptionToQuestion = (questionId: string) => {
    const updated = quizQuestions.map(q =>
      q.id === questionId
        ? { ...q, options: [...q.options, ""] }
        : q
    );
    setQuizQuestions(updated);
    setFormData(prev => ({ ...prev, quiz_questions: updated }));
  };

  const removeOptionFromQuestion = (questionId: string, optionIndex: number) => {
    const updated = quizQuestions.map(q => {
      if (q.id === questionId) {
        const newOptions = q.options.filter((_, i) => i !== optionIndex);
        let newCorrectAnswer = q.correct_answer;
        if (optionIndex <= q.correct_answer && newCorrectAnswer > 0) {
          newCorrectAnswer--;
        }
        return { ...q, options: newOptions, correct_answer: newCorrectAnswer };
      }
      return q;
    });
    setQuizQuestions(updated);
    setFormData(prev => ({ ...prev, quiz_questions: updated }));
  };

  const updateQuestionOption = (questionId: string, optionIndex: number, value: string) => {
    const updated = quizQuestions.map(q =>
      q.id === questionId
        ? {
            ...q,
            options: q.options.map((opt, i) => i === optionIndex ? value : opt)
          }
        : q
    );
    setQuizQuestions(updated);
    setFormData(prev => ({ ...prev, quiz_questions: updated }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "establishment_id" || name === "accumulation_rate" || name === "bonus_multiplier" || 
              name === "min_purchase_amount" || name === "max_purchase_amount" || name === "total_points_limit" ||
              name === "daily_limit_per_client" || name === "transaction_limit" || name === "campaign_limit_per_client" ||
              name === "reward_value_mt" || name === "reward_points_cost" || name === "reward_stock" ||
              name === "points_expiry_days" || name === "communication_budget" ||
              name === "draw_points_per_participation" || name === "booking_discount_value" ||
              name === "booking_points_earned" || name === "booking_min_advance_days" ||
              name === "booking_max_advance_days" || name === "voucher_value_mzn" ||
              name === "voucher_usage_limit" || name === "voucher_min_purchase" ||
              name === "voucher_discount_value" || name === "party_points_per_vote" ||
              name === "quiz_points_per_correct" || name === "quiz_max_attempts" ||
              name === "quiz_time_limit_seconds"
        ? (value === "" ? (name === "establishment_id" ? 0 : undefined) : Number(value))
        : name === "is_active" || name === "voucher_single_use" || name === "voucher_code_required" ||
          name === "booking_confirmation_required"
        ? (value === "true" || value === "1")
        : value,
    }));
  };

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
    <div className="relative p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push(`/admin/campaigns/${campaign.campaign_id || campaign.id || campaign.campaign_number}`)}
          className="mb-4 text-blue-600 hover:text-blue-900 flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Editar Campanha</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Badge do tipo de campanha */}
      {formData.type && (
        <div className="mb-4 rounded-lg bg-white p-4 shadow">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {formData.type === "RewardType_Draw" ? "🎲" :
               formData.type === "RewardType_Exchange" ? "🔄" :
               formData.type === "RewardType_Booking" ? "📅" :
               formData.type === "RewardType_Voucher" ? "🎫" :
               formData.type === "RewardType_Quiz" ? "❓" :
               formData.type === "RewardType_Party" ? "🎉" :
               "⚡"}
            </span>
            <div>
              <h3 className="font-semibold text-gray-900">
                Tipo: {formData.type}
              </h3>
              <p className="text-sm text-gray-500">
                {formData.type === "RewardType_Draw" ? "Sorteio" :
                 formData.type === "RewardType_Exchange" ? "Troca" :
                 formData.type === "RewardType_Booking" ? "Oferta De Desconto por Marcacao" :
                 formData.type === "RewardType_Voucher" ? "Voucher" :
                 formData.type === "RewardType_Quiz" ? "Questões" :
                 formData.type === "RewardType_Party" ? "Votação" :
                 "Oferta Automática"}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="campaign_name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Campanha <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="campaign_name"
                name="campaign_name"
                value={formData.campaign_name}
                onChange={handleChange}
                required
                maxLength={80}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: Promoção de Verão"
              />
            </div>

            <div>
              <label htmlFor="sponsor_name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Patrocinador <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="sponsor_name"
                name="sponsor_name"
                value={formData.sponsor_name}
                onChange={handleChange}
                required
                maxLength={80}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: Loja XYZ"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Descrição da campanha..."
              />
            </div>

            <div>
              <label htmlFor="reward_value_mt" className="block text-sm font-medium text-gray-700 mb-2">
                Dinheiro a gastar para os prémios (MT)
              </label>
              <input
                type="number"
                id="reward_value_mt"
                name="reward_value_mt"
                value={formData.reward_value_mt ?? ""}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: 5000.00"
              />
            </div>

            <div>
              <label htmlFor="reward_points_cost" className="block text-sm font-medium text-gray-700 mb-2">
                Pontos correspondentes
              </label>
              <input
                type="number"
                id="reward_points_cost"
                name="reward_points_cost"
                value={formData.reward_points_cost ?? ""}
                onChange={handleChange}
                min="0"
                step="1"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: 10000"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Pontos</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="accumulation_rate" className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Acumulação (ex: 0.1 = 1 MT = 10 pts)
              </label>
              <input
                type="number"
                id="accumulation_rate"
                name="accumulation_rate"
                value={formData.accumulation_rate ?? ""}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: 0.1"
              />
              <p className="mt-1 text-xs text-gray-500">Deixe vazio para usar a taxa padrão (1 MT = 10 pts)</p>
            </div>


            <div>
              <label htmlFor="total_points_limit" className="block text-sm font-medium text-gray-700 mb-2">
                Limite Total de Pontos (Plafond)
              </label>
              <input
                type="number"
                id="total_points_limit"
                name="total_points_limit"
                value={formData.total_points_limit ?? ""}
                onChange={handleChange}
                min="100"
                step="1"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: 10000"
              />
            </div>

            <div>
              <label htmlFor="min_purchase_amount" className="block text-sm font-medium text-gray-700 mb-2">
                Valor Mínimo de Compra (MT)
              </label>
              <input
                type="number"
                id="min_purchase_amount"
                name="min_purchase_amount"
                value={formData.min_purchase_amount ?? ""}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: 100.00"
              />
            </div>

            <div>
              <label htmlFor="max_purchase_amount" className="block text-sm font-medium text-gray-700 mb-2">
                Valor Máximo de Compra (MT)
              </label>
              <input
                type="number"
                id="max_purchase_amount"
                name="max_purchase_amount"
                value={formData.max_purchase_amount ?? ""}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: 10000.00"
              />
            </div>
          </div>
        </div>

        {/* Configurações baseadas no tipo de campanha */}
        {formData.type && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configurações Específicas - {formData.type}
            </h2>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* RewardType_Draw */}
              {formData.type === "RewardType_Draw" && (
                <>
                  <div>
                    <label htmlFor="draw_periodicity" className="block text-sm font-medium text-gray-700 mb-2">
                      Periodicidade <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="draw_periodicity"
                      name="draw_periodicity"
                      value={formData.draw_periodicity ?? ""}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="" disabled>Selecione</option>
                      <option value="daily">Diária</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                      <option value="event">Por evento</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="draw_points_per_participation" className="block text-sm font-medium text-gray-700 mb-2">
                      Pontos por Participação
                    </label>
                    <input
                      type="number"
                      id="draw_points_per_participation"
                      name="draw_points_per_participation"
                      value={formData.draw_points_per_participation ?? ""}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* RewardType_Exchange */}
              {formData.type === "RewardType_Exchange" && (
                <>
                  <div>
                    <label htmlFor="reward_description" className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição da Recompensa
                    </label>
                    <textarea
                      id="reward_description"
                      name="reward_description"
                      value={formData.reward_description || ""}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="reward_points_cost" className="block text-sm font-medium text-gray-700 mb-2">
                      Custo em Pontos
                    </label>
                    <input
                      type="number"
                      id="reward_points_cost"
                      name="reward_points_cost"
                      value={formData.reward_points_cost ?? ""}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lista de Prémios (JSON)
                    </label>
                    <textarea
                      value={Array.isArray(formData.exchange_prizes_list) ? JSON.stringify(formData.exchange_prizes_list, null, 2) : (typeof formData.exchange_prizes_list === "string" ? formData.exchange_prizes_list : "")}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setFormData(prev => ({ ...prev, exchange_prizes_list: parsed }));
                        } catch {
                          setFormData(prev => ({ ...prev, exchange_prizes_list: e.target.value }));
                        }
                      }}
                      rows={4}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 font-mono text-xs"
                    />
                  </div>
                </>
              )}

              {/* RewardType_Booking */}
              {formData.type === "RewardType_Booking" && (
                <>
                  <div>
                    <label htmlFor="booking_discount_type" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Desconto <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="booking_discount_type"
                      name="booking_discount_type"
                      value={formData.booking_discount_type ?? ""}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="" disabled>Selecione</option>
                      <option value="percentual">Percentual (%)</option>
                      <option value="fixo">Valor Fixo (MT)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Tipo de desconto aplicado na marcação</p>
                  </div>
                  <div>
                    <label htmlFor="booking_discount_value" className="block text-sm font-medium text-gray-700 mb-2">
                      Valor do Desconto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="booking_discount_value"
                      name="booking_discount_value"
                      value={formData.booking_discount_value ?? ""}
                      onChange={handleChange}
                      min="0"
                      step={formData.booking_discount_type === "percentual" ? "0.1" : "0.01"}
                      required
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder={formData.booking_discount_type === "percentual" ? "Ex: 10 (10%)" : "Ex: 50.00 (50 MT)"}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.booking_discount_type === "percentual" 
                        ? "Percentual de desconto (ex: 10 para 10%)"
                        : "Valor fixo do desconto em Meticais"}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="booking_points_earned" className="block text-sm font-medium text-gray-700 mb-2">
                      Pontos Ganhos ao Marcar
                    </label>
                    <input
                      type="number"
                      id="booking_points_earned"
                      name="booking_points_earned"
                      value={formData.booking_points_earned ?? ""}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ex: 100"
                    />
                    <p className="mt-1 text-xs text-gray-500">Pontos ganhos ao realizar a marcação (opcional)</p>
                  </div>
                  <div>
                    <label htmlFor="booking_min_advance_days" className="block text-sm font-medium text-gray-700 mb-2">
                      Dias Mínimos de Antecedência
                    </label>
                    <input
                      type="number"
                      id="booking_min_advance_days"
                      name="booking_min_advance_days"
                      value={formData.booking_min_advance_days ?? ""}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ex: 1"
                    />
                    <p className="mt-1 text-xs text-gray-500">Dias mínimos antes da data do serviço para marcar</p>
                  </div>
                  <div>
                    <label htmlFor="booking_max_advance_days" className="block text-sm font-medium text-gray-700 mb-2">
                      Dias Máximos de Antecedência
                    </label>
                    <input
                      type="number"
                      id="booking_max_advance_days"
                      name="booking_max_advance_days"
                      value={formData.booking_max_advance_days ?? ""}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ex: 30"
                    />
                    <p className="mt-1 text-xs text-gray-500">Dias máximos antes da data do serviço para marcar</p>
                  </div>
                </>
              )}

              {/* RewardType_Voucher */}
              {formData.type === "RewardType_Voucher" && (
                <>
                  <div>
                    <label htmlFor="voucher_code" className="block text-sm font-medium text-gray-700 mb-2">
                      Código do Voucher
                    </label>
                    <input
                      type="text"
                      id="voucher_code"
                      name="voucher_code"
                      value={formData.voucher_code || ""}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="voucher_value_mzn" className="block text-sm font-medium text-gray-700 mb-2">
                      Valor em MZN
                    </label>
                    <input
                      type="number"
                      id="voucher_value_mzn"
                      name="voucher_value_mzn"
                      value={formData.voucher_value_mzn ?? ""}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="voucher_type" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Voucher
                    </label>
                    <select
                      id="voucher_type"
                      name="voucher_type"
                      value={formData.voucher_type || ""}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Selecione</option>
                      <option value="digital">Digital</option>
                      <option value="físico">Físico</option>
                      <option value="híbrido">Híbrido</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="voucher_category" className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <input
                      type="text"
                      id="voucher_category"
                      name="voucher_category"
                      value={formData.voucher_category || ""}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Período</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="valid_from"
                name="valid_from"
                value={formData.valid_from}
                onChange={handleChange}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="valid_until" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Término <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="valid_until"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleChange}
                required
                min={formData.valid_from}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || "Rascunho"}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="Rascunho">Rascunho</option>
                <option value="Activo">Activo</option>
                <option value="Parado">Parado</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Concluído">Concluído</option>
                <option value="Expirado">Expirado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push(`/admin/campaigns/${campaign.campaign_id || campaign.id || campaign.campaign_number}`)}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>

      {/* Modal de Alerta */}
      {alertConfig && (
        <AlertModal
          isOpen={alertModalOpen}
          onClose={() => {
            setAlertModalOpen(false);
            setAlertConfig(null);
            // Não redirecionar aqui - o setTimeout já faz isso para sucesso
            // Apenas fechar o modal
            redirectRef.current = false; // Reset para permitir novo redirecionamento se necessário
          }}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          confirmText="OK"
          autoClose={alertConfig.type === "success" ? 2000 : 0}
        />
      )}
    </div>
  );
}

