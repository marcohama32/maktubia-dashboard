import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { campaignsService, CreateCampaignDTO } from "@/services/campaigns.service";
import { establishmentService } from "@/services/establishment.service";
import { merchantsService } from "@/services/merchants.service";
import { isAdmin, isMerchant } from "@/utils/roleUtils";
import { AlertModal } from "@/components/modals/AlertModal";

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  const [formData, setFormData] = useState<CreateCampaignDTO & { 
    type?: string; 
    conversion_rate?: number; 
    reward_description?: string; 
    reward_points_cost?: number; 
    vip_only?: boolean;
    // Campos específicos por tipo de campanha
    auto_points_amount?: number;
    auto_points_condition?: string;
    draw_participation_condition?: string;
    draw_min_spend?: number;
    draw_chances_per_purchase?: number;
    draw_prize_description?: string;
    draw_date?: string;
    draw_winners_count?: number;
    exchange_min_points_required?: number;
    quiz_questions?: any;
    quiz_points_per_correct?: number;
    quiz_max_attempts?: number;
    quiz_time_limit_seconds?: number;
    referral_min_referrals?: number;
    referral_points_per_referral?: number;
    referral_bonus_points?: number;
    referral_requires_first_purchase?: boolean;
    referral_code?: string;
    challenge_objective?: string;
    challenge_target_value?: number;
    challenge_target_type?: string;
    challenge_reward_points?: number;
    challenge_bonus_reward?: string;
    challenge_progress_tracking?: boolean;
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
  }>({
    establishment_id: 0,
    // Campos obrigatórios do schema
    campaign_name: "",
    sponsor_name: "",
    valid_from: "",
    valid_until: "",
    // Campos opcionais
    description: "",
    type: undefined, // Tipo de campanha
    accumulation_rate: undefined,
    bonus_multiplier: undefined,
    min_purchase_amount: undefined,
    max_purchase_amount: undefined,
    total_points_limit: undefined,
    conversion_rate: undefined,
    reward_description: undefined,
    reward_points_cost: undefined,
    vip_only: false,
    status: "Rascunho",
    is_active: true,
    // Campos específicos por tipo (inicializados como undefined)
    auto_points_amount: undefined,
    auto_points_condition: undefined,
    draw_participation_condition: undefined,
    draw_min_spend: undefined,
    draw_chances_per_purchase: undefined,
    draw_prize_description: undefined,
    draw_date: undefined,
    draw_winners_count: undefined,
    exchange_min_points_required: undefined,
    quiz_questions: undefined,
    quiz_points_per_correct: undefined,
    quiz_max_attempts: undefined,
    quiz_time_limit_seconds: undefined,
    referral_min_referrals: undefined,
    referral_points_per_referral: undefined,
    referral_bonus_points: undefined,
    referral_requires_first_purchase: false,
    referral_code: undefined,
    challenge_objective: undefined,
    challenge_target_value: undefined,
    challenge_target_type: undefined,
    challenge_reward_points: undefined,
    challenge_bonus_reward: undefined,
    challenge_progress_tracking: false,
    party_voting_options: undefined,
    party_points_per_vote: undefined,
    party_winner_reward: undefined,
    party_voting_deadline: undefined,
    party_results_date: undefined,
    voucher_code: undefined,
    voucher_value_mzn: undefined,
    voucher_type: undefined,
    voucher_category: undefined,
    voucher_description: undefined,
    voucher_terms: undefined,
    voucher_expiry_date: undefined,
    voucher_usage_limit: undefined,
    voucher_min_purchase: undefined,
    voucher_discount_type: undefined,
    voucher_discount_value: undefined,
    voucher_single_use: false,
    voucher_code_required: false,
  });
  
  // Tipos de campanha disponíveis (conforme backend)
  const campaignTypes = [
    {
      value: "RewardType_Auto",
      label: "Oferta Automática",
      description: "Ganha pontos automaticamente ao aderir à campanha",
      icon: "⚡",
      fields: ["accumulation_rate", "total_points_limit"],
      color: "blue",
    },
    {
      value: "RewardType_Draw",
      label: "Sorteio",
      description: "Cada compra acima de um valor dá uma chance de ganhar prémios",
      icon: "🎲",
      fields: ["min_purchase_amount", "reward_description", "reward_points_cost"],
      color: "purple",
    },
    {
      value: "RewardType_Exchange",
      label: "Troca",
      description: "Troca pontos por produtos, serviços ou descontos",
      icon: "🔄",
      fields: ["reward_description", "reward_points_cost", "reward_stock"],
      color: "green",
    },
    {
      value: "RewardType_Quiz",
      label: "Questões",
      description: "Responde perguntas no app e ganha pontos por cada resposta certa",
      icon: "❓",
      fields: ["reward_points_cost", "total_points_limit"],
      color: "yellow",
    },
    {
      value: "RewardType_Referral",
      label: "Indicação",
      description: "Convida amigos a registarem-se e ganha pontos por cada um",
      icon: "👥",
      fields: ["reward_points_cost", "total_points_limit"],
      color: "indigo",
    },
    {
      value: "RewardType_Challenge",
      label: "Desafio",
      description: "Completa desafios e ganha pontos e prémios especiais",
      icon: "🏆",
      fields: ["reward_description", "reward_points_cost", "total_points_limit"],
      color: "orange",
    },
    {
      value: "RewardType_Party",
      label: "Votação",
      description: "Vota e participa em eventos sociais, ganha pontos por participar",
      icon: "🎉",
      fields: ["reward_points_cost", "total_points_limit"],
      color: "pink",
    },
    {
      value: "RewardType_Voucher",
      label: "Voucher",
      description: "Cupons e vouchers com desconto ou valor fixo",
      icon: "🎫",
      fields: ["voucher_code", "voucher_value_mzn", "voucher_type", "voucher_category"],
      color: "teal",
    },
  ];
  
  // Handler para selecionar tipo de campanha
  const handleSelectCampaignType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type: type as any,
    }));
    setShowTypeSelection(false);
    // Limpar opções de votação se mudar de tipo
    if (type !== "RewardType_Party") {
      setVotingOptions([]);
      setFormData(prev => ({ ...prev, party_voting_options: undefined }));
    }
    // Limpar questões do quiz se mudar de tipo
    if (type !== "RewardType_Quiz") {
      setQuizQuestions([]);
      setFormData(prev => ({ ...prev, quiz_questions: undefined }));
      setEditingQuestionId(null);
    }
  };
  
  // Funções para gerenciar opções de votação
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
  
  const updateVotingOption = (index: number, value: string) => {
    const updated = [...votingOptions];
    updated[index] = value;
    setVotingOptions(updated);
    setFormData(prev => ({ ...prev, party_voting_options: updated }));
  };
  
  // Funções para gerenciar questões do quiz
  const addQuizQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q${Date.now()}`,
      question: "",
      options: ["", ""], // Mínimo 2 opções
      correct_answer: 0,
      points: formData.quiz_points_per_correct || formData.reward_points_cost || 10,
      explanation: "",
    };
    const updated = [...quizQuestions, newQuestion];
    setQuizQuestions(updated);
    setFormData(prev => ({ ...prev, quiz_questions: updated }));
    setEditingQuestionId(newQuestion.id);
  };
  
  const removeQuizQuestion = (questionId: string) => {
    const updated = quizQuestions.filter(q => q.id !== questionId);
    setQuizQuestions(updated);
    setFormData(prev => ({ ...prev, quiz_questions: updated.length > 0 ? updated : undefined }));
    if (editingQuestionId === questionId) {
      setEditingQuestionId(null);
    }
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
        // Ajustar correct_answer se necessário
        let newCorrectAnswer = q.correct_answer;
        if (optionIndex <= q.correct_answer && newCorrectAnswer > 0) {
          newCorrectAnswer--;
        } else if (optionIndex < q.correct_answer) {
          // Não precisa ajustar
        }
        return {
          ...q,
          options: newOptions,
          correct_answer: newCorrectAnswer,
        };
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
  
  // Funções para drag and drop (reordenar questões)
  const handleDragStart = (e: React.DragEvent, questionId: string) => {
    e.stopPropagation();
    setDraggedQuestionId(questionId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", questionId);
    // Adicionar classe ao elemento sendo arrastado
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };
  
  const handleDragOver = (e: React.DragEvent, questionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    
    // Adicionar feedback visual na zona de drop
    if (e.currentTarget instanceof HTMLElement && draggedQuestionId && draggedQuestionId !== questionId) {
      e.currentTarget.classList.add("border-blue-400", "bg-blue-100");
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Remover feedback visual
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove("border-blue-400", "bg-blue-100");
    }
  };
  
  const handleDrop = (e: React.DragEvent, targetQuestionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remover feedback visual
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove("border-blue-400", "bg-blue-100");
    }
    
    const sourceQuestionId = e.dataTransfer.getData("text/plain") || draggedQuestionId;
    
    if (!sourceQuestionId || sourceQuestionId === targetQuestionId) {
      setDraggedQuestionId(null);
      return;
    }
    
    const draggedIndex = quizQuestions.findIndex(q => q.id === sourceQuestionId);
    const targetIndex = quizQuestions.findIndex(q => q.id === targetQuestionId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedQuestionId(null);
      return;
    }
    
    const updated = [...quizQuestions];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, removed);
    
    setQuizQuestions(updated);
    setFormData(prev => ({ ...prev, quiz_questions: updated }));
    setDraggedQuestionId(null);
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    // Restaurar opacidade
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedQuestionId(null);
  };
  
  // Funções para drag and drop de opções dentro de uma questão
  const handleOptionDragStart = (e: React.DragEvent, questionId: string, optionIndex: number) => {
    e.stopPropagation();
    setDraggedOption({ questionId, optionIndex });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ questionId, optionIndex }));
    // Adicionar classe ao elemento sendo arrastado
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };
  
  const handleOptionDragOver = (e: React.DragEvent, questionId: string, optionIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    
    // Adicionar feedback visual na zona de drop
    if (e.currentTarget instanceof HTMLElement && draggedOption && 
        draggedOption.questionId === questionId && draggedOption.optionIndex !== optionIndex) {
      e.currentTarget.classList.add("border-blue-400", "bg-blue-100");
    }
  };
  
  const handleOptionDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Remover feedback visual
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove("border-blue-400", "bg-blue-100");
    }
  };
  
  const handleOptionDrop = (e: React.DragEvent, questionId: string, targetOptionIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remover feedback visual
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove("border-blue-400", "bg-blue-100");
    }
    
    let sourceOption: { questionId: string; optionIndex: number } | null = null;
    
    try {
      const data = e.dataTransfer.getData("text/plain");
      if (data) {
        sourceOption = JSON.parse(data);
      }
    } catch {
      sourceOption = draggedOption;
    }
    
    if (!sourceOption || sourceOption.questionId !== questionId) {
      setDraggedOption(null);
      return;
    }
    
    if (sourceOption.optionIndex === targetOptionIndex) {
      setDraggedOption(null);
      return;
    }
    
    const question = quizQuestions.find(q => q.id === questionId);
    if (!question) {
      setDraggedOption(null);
      return;
    }
    
    const updated = [...quizQuestions];
    const questionIndex = updated.findIndex(q => q.id === questionId);
    const questionOptions = [...updated[questionIndex].options];
    
    // Mover a opção
    const [removed] = questionOptions.splice(sourceOption.optionIndex, 1);
    questionOptions.splice(targetOptionIndex, 0, removed);
    
    // Ajustar correct_answer se necessário
    let newCorrectAnswer = updated[questionIndex].correct_answer;
    if (sourceOption.optionIndex === newCorrectAnswer) {
      // A opção correta foi movida
      newCorrectAnswer = targetOptionIndex;
    } else if (sourceOption.optionIndex < newCorrectAnswer && targetOptionIndex >= newCorrectAnswer) {
      // Movida para frente, antes da resposta correta
      newCorrectAnswer--;
    } else if (sourceOption.optionIndex > newCorrectAnswer && targetOptionIndex <= newCorrectAnswer) {
      // Movida para trás, depois da resposta correta
      newCorrectAnswer++;
    }
    
    updated[questionIndex] = {
      ...updated[questionIndex],
      options: questionOptions,
      correct_answer: newCorrectAnswer,
    };
    
    setQuizQuestions(updated);
    setFormData(prev => ({ ...prev, quiz_questions: updated }));
    setDraggedOption(null);
  };
  
  const handleOptionDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    // Restaurar opacidade
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedOption(null);
  };
  
  // Estados para upload de arquivos
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  // Estado para controlar se está na tela de seleção de tipo ou no formulário
  const [showTypeSelection, setShowTypeSelection] = useState(true);
  
  // Estado para gerenciar opções de votação (RewardType_Party)
  const [votingOptions, setVotingOptions] = useState<string[]>([]);
  const [newVotingOption, setNewVotingOption] = useState<string>("");
  
  // Estado para gerenciar questões do quiz (RewardType_Quiz)
  interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
    points?: number;
    explanation?: string;
  }
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null);
  const [draggedOption, setDraggedOption] = useState<{ questionId: string; optionIndex: number } | null>(null);

  useEffect(() => {
    if (user) {
      loadEstablishments();
    }
  }, [user]);

  const loadEstablishments = async () => {
    try {
      setLoading(true);
      setError("");
      
      let establishmentsData: any[] = [];
      
      // Se for admin, carregar todos os estabelecimentos
      if (isAdmin(user)) {
        console.log("🔍 [NEW CAMPAIGN] Usuário é admin - carregando todos os estabelecimentos");
        establishmentsData = await establishmentService.getAll(true);
      } 
      // Se for merchant, carregar apenas estabelecimentos do merchant com permissão
      else if (isMerchant(user)) {
        console.log("🔍 [NEW CAMPAIGN] Usuário é merchant - carregando estabelecimentos do merchant");
        const response = await merchantsService.getMyEstablishments();
        // Filtrar apenas estabelecimentos com permissão de criar campanhas
        establishmentsData = (response.data || []).filter((e: any) => 
          e.merchant_permissions?.can_create_campaigns === true
        );
        console.log("✅ [NEW CAMPAIGN] Estabelecimentos com permissão:", establishmentsData.length);
      } 
      // Se não tiver role definido, tentar carregar como merchant primeiro
      else {
        console.log("🔍 [NEW CAMPAIGN] Role não definido - tentando carregar como merchant");
        try {
          const response = await merchantsService.getMyEstablishments();
          // Filtrar apenas estabelecimentos com permissão de criar campanhas
          establishmentsData = (response.data || []).filter((e: any) => 
            e.merchant_permissions?.can_create_campaigns === true
          );
        } catch (merchantErr) {
          // Se falhar, tentar como admin
          console.log("🔍 [NEW CAMPAIGN] Falhou como merchant - tentando como admin");
          establishmentsData = await establishmentService.getAll(true);
        }
      }
      
      console.log("✅ [NEW CAMPAIGN] Estabelecimentos carregados:", establishmentsData.length);
      
      // Se for merchant e não houver estabelecimentos com permissão, mostrar mensagem
      if ((isMerchant(user) || !isAdmin(user)) && establishmentsData.length === 0) {
        setError("Você não tem permissão para criar campanhas em nenhum estabelecimento. Entre em contato com o administrador.");
      }
      
      setEstablishments(establishmentsData);
    } catch (err: any) {
      console.error("❌ [NEW CAMPAIGN] Erro ao carregar estabelecimentos:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar estabelecimentos");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Função auxiliar para verificar se pode criar campanha no estabelecimento
  const canCreateCampaign = (establishmentId: number): boolean => {
    // Admin pode criar em qualquer estabelecimento
    if (isAdmin(user)) {
      return true;
    }
    
    // Merchant precisa verificar permissão
    const establishment = establishments.find(e => e.id === establishmentId);
    return establishment?.merchant_permissions?.can_create_campaigns === true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.establishment_id || formData.establishment_id === 0) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, selecione um estabelecimento.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    // Validar permissão para criar campanha (apenas para merchants)
    if (!isAdmin(user) && !canCreateCampaign(formData.establishment_id)) {
      setAlertConfig({
        title: "Erro!",
        message: "Você não tem permissão para criar campanhas neste estabelecimento. Entre em contato com o administrador.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    if (!formData.campaign_name || !formData.valid_from || !formData.valid_until) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, preencha todos os campos obrigatórios (nome da campanha, data de início e data de término).",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    // Validar tipo de campanha
    if (!formData.type) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, selecione o tipo de campanha.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    // Validações específicas por tipo
    if (formData.type === "RewardType_Draw" && !formData.min_purchase_amount) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, informe o valor mínimo de compra para campanhas de sorteio.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }
    
    if (formData.type === "RewardType_Party") {
      if (!formData.party_voting_options || !Array.isArray(formData.party_voting_options) || formData.party_voting_options.length < 2) {
        setAlertConfig({
          title: "Erro!",
          message: "Por favor, adicione pelo menos 2 opções de votação para campanhas de votação.",
          type: "error",
        });
        setAlertModalOpen(true);
        return;
      }
      if (!formData.party_points_per_vote || formData.party_points_per_vote <= 0) {
        setAlertConfig({
          title: "Erro!",
          message: "Por favor, informe os pontos por voto (deve ser maior que 0).",
          type: "error",
        });
        setAlertModalOpen(true);
        return;
      }
    }
    
    if (formData.type === "RewardType_Voucher") {
      if (!formData.voucher_code || formData.voucher_code.trim() === "") {
        setAlertConfig({
          title: "Erro!",
          message: "Por favor, informe o código único do voucher.",
          type: "error",
        });
        setAlertModalOpen(true);
        return;
      }
      if (!formData.voucher_value_mzn || formData.voucher_value_mzn <= 0) {
        setAlertConfig({
          title: "Erro!",
          message: "Por favor, informe o valor do voucher em MZN (deve ser maior que 0).",
          type: "error",
        });
        setAlertModalOpen(true);
        return;
      }
      if (!formData.voucher_type) {
        setAlertConfig({
          title: "Erro!",
          message: "Por favor, selecione o tipo de voucher (digital, físico ou híbrido).",
          type: "error",
        });
        setAlertModalOpen(true);
        return;
      }
      if (!formData.voucher_category || formData.voucher_category.trim() === "") {
        setAlertConfig({
          title: "Erro!",
          message: "Por favor, informe a categoria do voucher.",
          type: "error",
        });
        setAlertModalOpen(true);
        return;
      }
    }
    
    if (formData.type === "RewardType_Quiz") {
      if (!formData.quiz_questions || !Array.isArray(formData.quiz_questions) || formData.quiz_questions.length === 0) {
        setAlertConfig({
          title: "Erro!",
          message: "Por favor, adicione pelo menos uma questão para campanhas de quiz.",
          type: "error",
        });
        setAlertModalOpen(true);
        return;
      }
      // Validar cada questão
      for (let i = 0; i < formData.quiz_questions.length; i++) {
        const q = formData.quiz_questions[i];
        if (!q.question || q.question.trim() === "") {
          setAlertConfig({
            title: "Erro!",
            message: `Questão ${i + 1}: Por favor, preencha o texto da pergunta.`,
            type: "error",
          });
          setAlertModalOpen(true);
          return;
        }
        if (!q.options || q.options.length < 2) {
          setAlertConfig({
            title: "Erro!",
            message: `Questão ${i + 1}: Adicione pelo menos 2 opções de resposta.`,
            type: "error",
          });
          setAlertModalOpen(true);
          return;
        }
        const hasEmptyOptions = q.options.some((opt: string) => !opt || opt.trim() === "");
        if (hasEmptyOptions) {
          setAlertConfig({
            title: "Erro!",
            message: `Questão ${i + 1}: Todas as opções devem ser preenchidas.`,
            type: "error",
          });
          setAlertModalOpen(true);
          return;
        }
        if (q.correct_answer < 0 || q.correct_answer >= q.options.length) {
          setAlertConfig({
            title: "Erro!",
            message: `Questão ${i + 1}: Selecione uma resposta correta válida.`,
            type: "error",
          });
          setAlertModalOpen(true);
          return;
        }
      }
    }
    
    if ((formData.type === "RewardType_Exchange" || formData.type === "RewardType_Challenge") && !formData.reward_description) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, informe a descrição da recompensa para este tipo de campanha.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }
    
    if ((formData.type === "RewardType_Exchange" || formData.type === "RewardType_Draw" || formData.type === "RewardType_Challenge") && !formData.reward_points_cost) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, informe o custo em pontos da recompensa para este tipo de campanha.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    try {
      setSaving(true);
      setError("");
      
      // Preparar dados para envio - usar campos do schema da API
      // Campos obrigatórios: establishment_id, campaign_name, valid_from, valid_until
      // IMPORTANTE: NÃO enviar campaign_id - ele é gerado automaticamente pelo banco
      const campaignData: any = {
        // Campos obrigatórios
        establishment_id: Number(formData.establishment_id), // Garantir que é número
        campaign_name: formData.campaign_name,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        // Campos opcionais
        ...(formData.sponsor_name && formData.sponsor_name.trim() !== "" && { sponsor_name: formData.sponsor_name }),
        
        // Campos opcionais (apenas se tiverem valor)
        ...(formData.description && { description: formData.description }),
        ...(formData.accumulation_rate !== undefined && formData.accumulation_rate !== null && { accumulation_rate: formData.accumulation_rate }),
        ...(formData.bonus_multiplier !== undefined && formData.bonus_multiplier !== null && { bonus_multiplier: formData.bonus_multiplier }),
        ...(formData.min_purchase_amount !== undefined && formData.min_purchase_amount !== null && { min_purchase_amount: formData.min_purchase_amount }),
        ...(formData.max_purchase_amount !== undefined && formData.max_purchase_amount !== null && { max_purchase_amount: formData.max_purchase_amount }),
        ...(formData.total_points_limit !== undefined && formData.total_points_limit !== null && { total_points_limit: formData.total_points_limit }),
        ...(formData.reward_description && { reward_description: formData.reward_description }),
        ...(formData.reward_points_cost !== undefined && formData.reward_points_cost !== null && { reward_points_cost: formData.reward_points_cost }),
        ...(formData.vip_only !== undefined && { vip_only: formData.vip_only }),
        
        // Status com default
        status: formData.status || "Rascunho",
        
        // Tipo de campanha
        type: formData.type,
        
        // Taxa de conversão (para points_per_spend)
        ...(formData.conversion_rate !== undefined && formData.conversion_rate !== null && { conversion_rate: formData.conversion_rate }),
        
        // ============================================
        // Campos específicos por tipo de campanha
        // ============================================
        
        // 1️⃣ RewardType_Auto (Oferta Automática)
        ...(formData.type === "RewardType_Auto" && {
          ...(formData.auto_points_amount !== undefined && formData.auto_points_amount !== null && { auto_points_amount: formData.auto_points_amount }),
          ...(formData.auto_points_condition && { auto_points_condition: formData.auto_points_condition }),
        }),
        
        // 2️⃣ RewardType_Draw (Sorteio)
        ...(formData.type === "RewardType_Draw" && {
          ...(formData.draw_participation_condition && { draw_participation_condition: formData.draw_participation_condition }),
          ...(formData.draw_min_spend !== undefined && formData.draw_min_spend !== null && { draw_min_spend: formData.draw_min_spend }),
          ...(formData.draw_chances_per_purchase !== undefined && formData.draw_chances_per_purchase !== null && { draw_chances_per_purchase: formData.draw_chances_per_purchase }),
          ...(formData.draw_prize_description && { draw_prize_description: formData.draw_prize_description }),
          ...(formData.draw_date && { draw_date: formData.draw_date }),
          ...(formData.draw_winners_count !== undefined && formData.draw_winners_count !== null && { draw_winners_count: formData.draw_winners_count }),
        }),
        
        // 3️⃣ RewardType_Exchange (Troca)
        ...(formData.type === "RewardType_Exchange" && {
          ...(formData.exchange_min_points_required !== undefined && formData.exchange_min_points_required !== null && { exchange_min_points_required: formData.exchange_min_points_required }),
        }),
        
        // 4️⃣ RewardType_Quiz (Questões)
        ...(formData.type === "RewardType_Quiz" && {
          ...(formData.quiz_questions && { quiz_questions: typeof formData.quiz_questions === "string" ? formData.quiz_questions : JSON.stringify(formData.quiz_questions) }),
          ...(formData.quiz_points_per_correct !== undefined && formData.quiz_points_per_correct !== null && { quiz_points_per_correct: formData.quiz_points_per_correct }),
          ...(formData.quiz_max_attempts !== undefined && formData.quiz_max_attempts !== null && { quiz_max_attempts: formData.quiz_max_attempts }),
          ...(formData.quiz_time_limit_seconds !== undefined && formData.quiz_time_limit_seconds !== null && { quiz_time_limit_seconds: formData.quiz_time_limit_seconds }),
        }),
        
        // 5️⃣ RewardType_Referral (Indicação)
        ...(formData.type === "RewardType_Referral" && {
          ...(formData.referral_min_referrals !== undefined && formData.referral_min_referrals !== null && { referral_min_referrals: formData.referral_min_referrals }),
          ...(formData.referral_points_per_referral !== undefined && formData.referral_points_per_referral !== null && { referral_points_per_referral: formData.referral_points_per_referral }),
          ...(formData.referral_bonus_points !== undefined && formData.referral_bonus_points !== null && { referral_bonus_points: formData.referral_bonus_points }),
          ...(formData.referral_requires_first_purchase !== undefined && { referral_requires_first_purchase: formData.referral_requires_first_purchase }),
          ...(formData.referral_code && { referral_code: formData.referral_code }),
        }),
        
        // 6️⃣ RewardType_Challenge (Desafio)
        ...(formData.type === "RewardType_Challenge" && {
          ...(formData.challenge_objective && { challenge_objective: formData.challenge_objective }),
          ...(formData.challenge_target_value !== undefined && formData.challenge_target_value !== null && { challenge_target_value: formData.challenge_target_value }),
          ...(formData.challenge_target_type && { challenge_target_type: formData.challenge_target_type }),
          ...(formData.challenge_reward_points !== undefined && formData.challenge_reward_points !== null && { challenge_reward_points: formData.challenge_reward_points }),
          ...(formData.challenge_bonus_reward && { challenge_bonus_reward: formData.challenge_bonus_reward }),
          ...(formData.challenge_progress_tracking !== undefined && { challenge_progress_tracking: formData.challenge_progress_tracking }),
        }),
        
        // 7️⃣ RewardType_Party (Votação)
        ...(formData.type === "RewardType_Party" && {
          ...(formData.party_voting_options && Array.isArray(formData.party_voting_options) && formData.party_voting_options.length > 0 && { party_voting_options: JSON.stringify(formData.party_voting_options) }),
          ...(formData.party_points_per_vote !== undefined && formData.party_points_per_vote !== null && { party_points_per_vote: formData.party_points_per_vote }),
          ...(formData.party_winner_reward && { party_winner_reward: formData.party_winner_reward }),
          ...(formData.party_voting_deadline && { party_voting_deadline: formData.party_voting_deadline }),
          ...(formData.party_results_date && { party_results_date: formData.party_results_date }),
        }),
        
        // 8️⃣ RewardType_Voucher (Voucher)
        ...(formData.type === "RewardType_Voucher" && {
          ...(formData.voucher_code && { voucher_code: formData.voucher_code }),
          ...(formData.voucher_value_mzn !== undefined && formData.voucher_value_mzn !== null && { voucher_value_mzn: formData.voucher_value_mzn }),
          ...(formData.voucher_type && { voucher_type: formData.voucher_type }),
          ...(formData.voucher_category && { voucher_category: formData.voucher_category }),
          ...(formData.voucher_description && { voucher_description: formData.voucher_description }),
          ...(formData.voucher_terms && { voucher_terms: formData.voucher_terms }),
          ...(formData.voucher_expiry_date && { voucher_expiry_date: formData.voucher_expiry_date }),
          ...(formData.voucher_usage_limit !== undefined && formData.voucher_usage_limit !== null && { voucher_usage_limit: formData.voucher_usage_limit }),
          ...(formData.voucher_min_purchase !== undefined && formData.voucher_min_purchase !== null && { voucher_min_purchase: formData.voucher_min_purchase }),
          ...(formData.voucher_discount_type && { voucher_discount_type: formData.voucher_discount_type }),
          ...(formData.voucher_discount_value !== undefined && formData.voucher_discount_value !== null && { voucher_discount_value: formData.voucher_discount_value }),
          ...(formData.voucher_single_use !== undefined && { voucher_single_use: formData.voucher_single_use }),
          ...(formData.voucher_code_required !== undefined && { voucher_code_required: formData.voucher_code_required }),
        }),
        
        // Mapear campos genéricos para campos específicos quando necessário
        // RewardType_Draw: min_purchase_amount -> draw_min_spend
        ...(formData.type === "RewardType_Draw" && formData.min_purchase_amount !== undefined && formData.min_purchase_amount !== null && !formData.draw_min_spend && { draw_min_spend: formData.min_purchase_amount }),
        // RewardType_Draw: reward_description -> draw_prize_description
        ...(formData.type === "RewardType_Draw" && formData.reward_description && !formData.draw_prize_description && { draw_prize_description: formData.reward_description }),
        // RewardType_Exchange: reward_points_cost -> exchange_min_points_required
        ...(formData.type === "RewardType_Exchange" && formData.reward_points_cost !== undefined && formData.reward_points_cost !== null && !formData.exchange_min_points_required && { exchange_min_points_required: formData.reward_points_cost }),
        // RewardType_Quiz: reward_points_cost -> quiz_points_per_correct
        ...(formData.type === "RewardType_Quiz" && formData.reward_points_cost !== undefined && formData.reward_points_cost !== null && !formData.quiz_points_per_correct && { quiz_points_per_correct: formData.reward_points_cost }),
        // RewardType_Referral: reward_points_cost -> referral_points_per_referral
        ...(formData.type === "RewardType_Referral" && formData.reward_points_cost !== undefined && formData.reward_points_cost !== null && !formData.referral_points_per_referral && { referral_points_per_referral: formData.reward_points_cost }),
        // RewardType_Challenge: reward_description -> challenge_objective, reward_points_cost -> challenge_reward_points
        ...(formData.type === "RewardType_Challenge" && formData.reward_description && !formData.challenge_objective && { challenge_objective: formData.reward_description }),
        ...(formData.type === "RewardType_Challenge" && formData.reward_points_cost !== undefined && formData.reward_points_cost !== null && !formData.challenge_reward_points && { challenge_reward_points: formData.reward_points_cost }),
        // RewardType_Party: reward_points_cost -> party_points_per_vote (fallback se não tiver party_points_per_vote)
        ...(formData.type === "RewardType_Party" && formData.party_points_per_vote === undefined && formData.reward_points_cost !== undefined && formData.reward_points_cost !== null && { party_points_per_vote: formData.reward_points_cost }),
        
        // Campos de compatibilidade (para garantir que o backend aceite)
        name: formData.campaign_name,
        start_date: formData.valid_from,
        end_date: formData.valid_until,
        
        // Adicionar arquivo de imagem se houver
        // Nota: QR code é gerado automaticamente pelo backend
        ...(imageFile && { image: imageFile }),
      };
      
      // Garantir que NÃO estamos enviando campaign_id (deve ser gerado pelo banco)
      if (campaignData.campaign_id !== undefined) {
        delete campaignData.campaign_id;
      }
      if (campaignData.id !== undefined) {
        delete campaignData.id;
      }

      console.log("📤 [NEW CAMPAIGN] Enviando dados:", campaignData);
      console.log("📤 [NEW CAMPAIGN] Dados após remoção de undefined:", JSON.stringify(campaignData, null, 2));
      const createdCampaign = await campaignsService.create(campaignData);
      console.log("✅ [NEW CAMPAIGN] Campanha criada:", createdCampaign);
      
      setAlertConfig({
        title: "Sucesso!",
        message: "Campanha criada com sucesso!",
        type: "success",
      });
      setAlertModalOpen(true);
      
      // Redirecionar após 2 segundos (tempo suficiente para o modal aparecer)
      const campaignId = createdCampaign.campaign_id || createdCampaign.id || createdCampaign.campaign_number;
      setTimeout(() => {
        if (campaignId) {
          router.push(`/admin/campaigns/${campaignId}`);
        } else {
          router.push("/admin/campaigns");
        }
      }, 2000);
    } catch (err: any) {
      console.error("❌ [NEW CAMPAIGN] Erro ao criar campanha:", err);
      console.error("❌ [NEW CAMPAIGN] Detalhes do erro:", err.response?.data);
      console.error("❌ [NEW CAMPAIGN] Response completa:", err.response);
      
      // Extrair mensagem de erro mais detalhada
      let errorMessage = err.message || "Erro ao criar campanha. Por favor, tente novamente.";
      
      // Se houver detalhes sobre campos faltando, mostrar
      const errorData = err.response?.data || {};
      if (errorData.details) {
        const details = errorData.details;
        console.log("📋 [NEW CAMPAIGN] Detalhes do erro do backend:", details);
        
        if (typeof details === "object" && details !== null) {
          // Tentar extrair informações sobre campos faltando
          const missingFields: string[] = [];
          
          // Verificar se details tem propriedades que indicam campos faltando
          Object.keys(details).forEach(key => {
            const value = details[key];
            if (value !== null && value !== undefined && value !== "") {
              // Se o valor é uma mensagem de erro, adicionar
              if (typeof value === "string" && value.length > 0) {
                missingFields.push(`${key}: ${value}`);
              } else if (typeof value === "object") {
                // Se é um objeto, pode conter mais informações
                missingFields.push(`${key}: ${JSON.stringify(value)}`);
              } else {
                missingFields.push(key);
              }
            }
          });
          
          if (missingFields.length > 0) {
            errorMessage = `Campos obrigatórios faltando ou inválidos:\n${missingFields.join("\n")}`;
          } else {
            // Se não encontrou campos específicos, mostrar o objeto completo
            errorMessage = `Erro de validação:\n${JSON.stringify(details, null, 2)}`;
          }
        } else if (typeof details === "string") {
          errorMessage = details;
        }
      }
      
      // Se a mensagem contém quebras de linha, substituir por espaços para exibição no modal
      errorMessage = errorMessage.replace(/\n/g, " ");
      
      setAlertConfig({
        title: "Erro!",
        message: errorMessage,
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Se mudou o tipo de campanha, limpar campos específicos que não se aplicam
    if (name === "type") {
      setFormData(prev => {
        const newData: any = {
          ...prev,
          type: value,
        };
        
        // Limpar campos que não se aplicam ao novo tipo
        const selectedType = campaignTypes.find(t => t.value === value);
        if (selectedType) {
          // Se o novo tipo não usa conversion_rate, limpar
          if (!selectedType.fields.includes("conversion_rate")) {
            newData.conversion_rate = undefined;
          }
          // Se o novo tipo não usa min_purchase_amount, limpar
          if (!selectedType.fields.includes("min_purchase_amount")) {
            newData.min_purchase_amount = undefined;
          }
          // Se o novo tipo não usa accumulation_rate, limpar
          if (!selectedType.fields.includes("accumulation_rate")) {
            newData.accumulation_rate = undefined;
          }
        }
        
        return newData;
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === "establishment_id" || name === "accumulation_rate" || name === "bonus_multiplier" || 
              name === "min_purchase_amount" || name === "max_purchase_amount" || name === "total_points_limit" ||
              name === "daily_limit_per_client" || name === "transaction_limit" || name === "campaign_limit_per_client" ||
              name === "reward_value_mt" || name === "reward_points_cost" || name === "reward_stock" ||
              name === "points_expiry_days" || name === "communication_budget" || name === "conversion_rate" ||
              name === "party_points_per_vote" || name === "quiz_points_per_correct" || name === "quiz_max_attempts" ||
              name === "quiz_time_limit_seconds" || name === "referral_min_referrals" || name === "referral_points_per_referral" ||
              name === "referral_bonus_points" || name === "challenge_target_value" || name === "challenge_reward_points" ||
              name === "draw_chances_per_purchase" || name === "draw_winners_count" || name === "auto_points_amount" ||
              name === "exchange_min_points_required"
        ? (value === "" ? (name === "establishment_id" ? 0 : undefined) : Number(value))
        : name === "is_active" || name === "new_customers_only" || name === "vip_only" || 
          name === "notify_push" || name === "notify_sms" || name === "notify_email" || name === "notify_whatsapp"
        ? (value === "true" || value === "1")
        : value,
    }));
  };

  // Handler para upload de imagem
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler para remover imagem
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData(prev => ({ ...prev, image: undefined, image_url: undefined }));
  };

  return (
    <div className="relative p-6">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando estabelecimentos...</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => router.push("/admin/campaigns")}
          className="mb-4 text-blue-600 hover:text-blue-900 flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nova Campanha</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Tela de seleção de tipo de campanha */}
      {showTypeSelection ? (
        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Selecione o Tipo de Campanha</h2>
            <p className="text-sm text-gray-500 mb-6">
              Escolha o tipo de campanha que deseja criar. Cada tipo tem configurações específicas.
            </p>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {campaignTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleSelectCampaignType(type.value)}
                  className={`group relative rounded-lg border-2 p-6 text-left transition-all hover:shadow-lg ${
                    type.color === "blue"
                      ? "border-blue-200 hover:border-blue-500 hover:bg-blue-50"
                      : type.color === "purple"
                      ? "border-purple-200 hover:border-purple-500 hover:bg-purple-50"
                      : type.color === "green"
                      ? "border-green-200 hover:border-green-500 hover:bg-green-50"
                      : type.color === "yellow"
                      ? "border-yellow-200 hover:border-yellow-500 hover:bg-yellow-50"
                      : type.color === "indigo"
                      ? "border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50"
                      : type.color === "orange"
                      ? "border-orange-200 hover:border-orange-500 hover:bg-orange-50"
                      : "border-pink-200 hover:border-pink-500 hover:bg-pink-50"
                  }`}
                >
                  <div className="mb-3 text-4xl">{type.icon}</div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                    <span>Criar campanha</span>
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Botão para voltar à seleção de tipo */}
          <div className="rounded-lg bg-white p-4 shadow">
            <button
              type="button"
              onClick={() => {
                setShowTypeSelection(true);
                setFormData(prev => ({
                  ...prev,
                  type: undefined,
                }));
              }}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para seleção de tipo
            </button>
          </div>
          
          {/* Badge do tipo selecionado */}
          {formData.type && (
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {campaignTypes.find(t => t.value === formData.type)?.icon}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {campaignTypes.find(t => t.value === formData.type)?.label}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {campaignTypes.find(t => t.value === formData.type)?.description}
                  </p>
                </div>
              </div>
            </div>
          )}
          
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="establishment_id" className="block text-sm font-medium text-gray-700 mb-2">
                Estabelecimento <span className="text-red-500">*</span>
              </label>
              <select
                id="establishment_id"
                name="establishment_id"
                value={formData.establishment_id && formData.establishment_id > 0 ? String(formData.establishment_id) : ""}
                onChange={handleChange}
                required
                disabled={establishments.length === 0}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {establishments.length === 0 
                    ? "Nenhum estabelecimento disponível" 
                    : "Selecione um estabelecimento"}
                </option>
                {establishments.map((est) => {
                  const hasPermission = isAdmin(user) || est.merchant_permissions?.can_create_campaigns === true;
                  return (
                  <option key={est.id} value={String(est.id)}>
                    {est.name} {est.type ? `(${est.type})` : ""}
                      {!isAdmin(user) && hasPermission && " ✓"}
                  </option>
                  );
                })}
              </select>
              {!isAdmin(user) && establishments.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Apenas estabelecimentos onde você tem permissão para criar campanhas são exibidos.
                </p>
              )}
              {establishments.length === 0 && !isAdmin(user) && (
                <p className="mt-1 text-xs text-red-500">
                  Você não tem permissão para criar campanhas em nenhum estabelecimento. Entre em contato com o administrador.
                </p>
              )}
            </div>

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
                Nome do Patrocinador
              </label>
              <input
                type="text"
                id="sponsor_name"
                name="sponsor_name"
                value={formData.sponsor_name || ""}
                onChange={handleChange}
                maxLength={80}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: Loja XYZ (opcional)"
              />
            </div>

            <div>
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

          </div>
        </div>

        {/* Configurações baseadas no tipo de campanha */}
        {formData.type && (
        <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configurações - {campaignTypes.find(t => t.value === formData.type)?.label}
            </h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Taxa de Acumulação (para RewardType_Auto) */}
              {formData.type === "RewardType_Auto" && (
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
              )}

              {/* Limite Total de Pontos (para RewardType_Auto, RewardType_Quiz, RewardType_Referral, RewardType_Challenge, RewardType_Party, RewardType_Voucher) */}
              {(formData.type === "RewardType_Auto" || formData.type === "RewardType_Quiz" || 
                formData.type === "RewardType_Referral" || formData.type === "RewardType_Challenge" || 
                formData.type === "RewardType_Party" || formData.type === "RewardType_Voucher") && (
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
                  <p className="mt-1 text-xs text-gray-500">Limite total de pontos que podem ser distribuídos</p>
            </div>
              )}

              {/* Valor Mínimo de Compra (para RewardType_Draw) */}
              {formData.type === "RewardType_Draw" && (
            <div>
              <label htmlFor="min_purchase_amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Mínimo de Compra (MT) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="min_purchase_amount"
                name="min_purchase_amount"
                value={formData.min_purchase_amount ?? ""}
                onChange={handleChange}
                min="0"
                step="0.01"
                    required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: 100.00"
              />
                  <p className="mt-1 text-xs text-gray-500">Valor mínimo que o cliente deve gastar para participar no sorteio</p>
            </div>
              )}

              {/* Descrição da Recompensa (para RewardType_Exchange, RewardType_Draw, RewardType_Challenge) */}
              {(formData.type === "RewardType_Exchange" || formData.type === "RewardType_Draw" || formData.type === "RewardType_Challenge") && (
                <div>
                  <label htmlFor="reward_description" className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição da Recompensa <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reward_description"
                    name="reward_description"
                    value={formData.reward_description || ""}
                    onChange={handleChange}
                    rows={3}
                    required={formData.type === "RewardType_Exchange" || formData.type === "RewardType_Challenge"}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder={
                      formData.type === "RewardType_Exchange" 
                        ? "Ex: Produto X, Serviço Y, Desconto de 20%"
                        : formData.type === "RewardType_Draw"
                        ? "Ex: Prémio do sorteio"
                        : "Ex: Descrição do desafio e prémio"
                    }
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.type === "RewardType_Exchange" 
                      ? "Descreva o que pode ser trocado por pontos"
                      : formData.type === "RewardType_Draw"
                      ? "Descreva os prémios disponíveis no sorteio"
                      : "Descreva o desafio e os prémios especiais"}
                  </p>
                </div>
              )}

              {/* Custo em Pontos da Recompensa (para RewardType_Exchange, RewardType_Draw, RewardType_Challenge) */}
              {(formData.type === "RewardType_Exchange" || formData.type === "RewardType_Draw" || formData.type === "RewardType_Challenge") && (
                <div>
                  <label htmlFor="reward_points_cost" className="block text-sm font-medium text-gray-700 mb-2">
                    Custo em Pontos da Recompensa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="reward_points_cost"
                    name="reward_points_cost"
                    value={formData.reward_points_cost ?? ""}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ex: 1000"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.type === "RewardType_Exchange" 
                      ? "Quantos pontos são necessários para trocar"
                      : formData.type === "RewardType_Draw"
                      ? "Custo em pontos para participar no sorteio"
                      : "Pontos necessários para completar o desafio"}
                  </p>
                </div>
              )}

              {/* Estoque da Recompensa (para RewardType_Exchange) */}
              {formData.type === "RewardType_Exchange" && (
                <div>
                  <label htmlFor="reward_stock" className="block text-sm font-medium text-gray-700 mb-2">
                    Estoque Disponível
                  </label>
                  <input
                    type="number"
                    id="reward_stock"
                    name="reward_stock"
                    value={formData.reward_stock ?? ""}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ex: 100"
                  />
                  <p className="mt-1 text-xs text-gray-500">Quantidade disponível para troca (deixe vazio para ilimitado)</p>
                </div>
              )}

              {/* Custo em Pontos (para RewardType_Quiz, RewardType_Referral) */}
              {(formData.type === "RewardType_Quiz" || formData.type === "RewardType_Referral") && (
                <div>
                  <label htmlFor="reward_points_cost" className="block text-sm font-medium text-gray-700 mb-2">
                    Pontos por Participação
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
                    placeholder={
                      formData.type === "RewardType_Quiz" 
                        ? "Ex: 10 (pontos por resposta certa)"
                        : "Ex: 50 (pontos por indicação)"
                    }
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.type === "RewardType_Quiz" 
                      ? "Pontos padrão por resposta correta (pode ser sobrescrito por questão)"
                      : "Pontos ganhos por cada amigo indicado que se registar"}
                  </p>
                </div>
              )}

              {/* Questões do Quiz (RewardType_Quiz) */}
              {formData.type === "RewardType_Quiz" && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Questões do Quiz <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Lista de questões */}
                  {quizQuestions.length > 0 && (
                    <div className="mb-4 space-y-4">
                      {quizQuestions.map((q, index) => (
                        <div
                          key={q.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, q.id)}
                          onDragOver={(e) => handleDragOver(e, q.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, q.id)}
                          onDragEnd={handleDragEnd}
                          className={`rounded-lg border-2 p-4 transition-all ${
                            draggedQuestionId === q.id
                              ? "border-blue-500 bg-blue-50 opacity-50"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300 cursor-move"
                          }`}
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Ícone de arrastar */}
                              <div className="flex flex-col gap-1 text-gray-400">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900">Questão {index + 1}</h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeQuizQuestion(q.id)}
                              className="rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
                            >
                              Remover Questão
                            </button>
                          </div>
                          
                          {/* Pergunta */}
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pergunta <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={q.question}
                              onChange={(e) => updateQuizQuestion(q.id, "question", e.target.value)}
                              rows={2}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Digite a pergunta..."
                            />
                          </div>
                          
                          {/* Opções de Resposta */}
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Opções de Resposta <span className="text-red-500">*</span> (mín. 2)
                            </label>
                            <div className="space-y-2">
                              {q.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  draggable
                                  onDragStart={(e) => handleOptionDragStart(e, q.id, optIndex)}
                                  onDragOver={(e) => handleOptionDragOver(e, q.id, optIndex)}
                                  onDragLeave={handleOptionDragLeave}
                                  onDrop={(e) => handleOptionDrop(e, q.id, optIndex)}
                                  onDragEnd={handleOptionDragEnd}
                                  className={`flex items-center gap-2 rounded-lg border p-2 transition-all ${
                                    draggedOption?.questionId === q.id && draggedOption?.optionIndex === optIndex
                                      ? "border-blue-500 bg-blue-50 opacity-50"
                                      : "border-gray-200 bg-white hover:border-gray-300 cursor-move"
                                  }`}
                                >
                                  {/* Ícone de arrastar */}
                                  <div className="flex flex-col gap-1 text-gray-400">
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                                    </svg>
                                  </div>
                                  <input
                                    type="radio"
                                    name={`correct-${q.id}`}
                                    checked={q.correct_answer === optIndex}
                                    onChange={() => updateQuizQuestion(q.id, "correct_answer", optIndex)}
                                    className="h-4 w-4 text-blue-600"
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => updateQuestionOption(q.id, optIndex, e.target.value)}
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                                    placeholder={`Opção ${optIndex + 1}`}
                                  />
                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOptionFromQuestion(q.id, optIndex)}
                                      className="rounded-md bg-red-100 px-2 py-1 text-sm text-red-700 hover:bg-red-200"
                                    >
                                      ✕
                                    </button>
                                  )}
                                  {q.correct_answer === optIndex && (
                                    <span className="text-sm font-medium text-green-600">✓ Resposta Correta</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => addOptionToQuestion(q.id)}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                              + Adicionar Opção
                            </button>
                          </div>
                          
                          {/* Pontos e Explicação */}
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Pontos</label>
                              <input
                                type="number"
                                value={q.points || formData.reward_points_cost || 10}
                                onChange={(e) => updateQuizQuestion(q.id, "points", Number(e.target.value))}
                                min="1"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                              />
                              <p className="mt-1 text-xs text-gray-500">Pontos por resposta correta</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Explicação (opcional)</label>
                              <textarea
                                value={q.explanation || ""}
                                onChange={(e) => updateQuizQuestion(q.id, "explanation", e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Explicação da resposta correta..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Botão para adicionar questão */}
                  <button
                    type="button"
                    onClick={addQuizQuestion}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    + Adicionar Questão
                  </button>
                  
                  {quizQuestions.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      💡 Adicione pelo menos uma questão ao quiz. Cada questão deve ter pelo menos 2 opções de resposta.
                    </p>
                  )}
                  {quizQuestions.length > 0 && (
                    <p className="mt-2 text-xs text-green-600">
                      ✅ {quizQuestions.length} questão(ões) adicionada(s).
                    </p>
                  )}
                </div>
              )}

              {/* Campos específicos para RewardType_Party (Votação) */}
              {formData.type === "RewardType_Party" && (
                <>
                  <div>
                    <label htmlFor="party_points_per_vote" className="block text-sm font-medium text-gray-700 mb-2">
                      Pontos por Voto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="party_points_per_vote"
                      name="party_points_per_vote"
                      value={formData.party_points_per_vote ?? ""}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      required
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ex: 5"
                    />
                    <p className="mt-1 text-xs text-gray-500">Pontos ganhos por cada voto ou participação</p>
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="party_voting_options" className="block text-sm font-medium text-gray-700 mb-2">
                      Opções de Votação <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Lista de opções existentes */}
                    {votingOptions.length > 0 && (
                      <div className="mb-4 space-y-2">
                        {votingOptions.map((option, index) => (
                          <div key={index} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <span className="flex-1 text-sm font-medium text-gray-700">
                              {index + 1}. {option}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeVotingOption(index)}
                              className="rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Adicionar nova opção */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newVotingOption}
                        onChange={(e) => setNewVotingOption(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addVotingOption();
                          }
                        }}
                        placeholder="Digite uma opção de votação..."
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={addVotingOption}
                        disabled={newVotingOption.trim() === ""}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Adicionar
                      </button>
                    </div>
                    
                    {votingOptions.length === 0 && (
                      <p className="mt-2 text-xs text-gray-500">
                        💡 Adicione pelo menos 2 opções de votação. Pressione Enter ou clique em "Adicionar" para incluir uma opção.
                      </p>
                    )}
                    {votingOptions.length > 0 && votingOptions.length < 2 && (
                      <p className="mt-2 text-xs text-yellow-600">
                        ⚠️ Adicione pelo menos mais {2 - votingOptions.length} opção(ões) para continuar.
                      </p>
                    )}
                    {votingOptions.length >= 2 && (
                      <p className="mt-2 text-xs text-green-600">
                        ✅ {votingOptions.length} opção(ões) adicionada(s). Você pode adicionar mais opções se desejar.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="party_winner_reward" className="block text-sm font-medium text-gray-700 mb-2">
                      Recompensa do Vencedor
                    </label>
                    <textarea
                      id="party_winner_reward"
                      name="party_winner_reward"
                      value={formData.party_winner_reward || ""}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ex: Prémio especial para o vencedor"
                    />
                    <p className="mt-1 text-xs text-gray-500">Descrição da recompensa para o vencedor da votação</p>
                  </div>

                  <div>
                    <label htmlFor="party_voting_deadline" className="block text-sm font-medium text-gray-700 mb-2">
                      Prazo de Votação
                    </label>
                    <input
                      type="datetime-local"
                      id="party_voting_deadline"
                      name="party_voting_deadline"
                      value={formData.party_voting_deadline || ""}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Data e hora limite para votação</p>
                  </div>

                  <div>
                    <label htmlFor="party_results_date" className="block text-sm font-medium text-gray-700 mb-2">
                      Data dos Resultados
                    </label>
                    <input
                      type="datetime-local"
                      id="party_results_date"
                      name="party_results_date"
                      value={formData.party_results_date || ""}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Data e hora para divulgação dos resultados</p>
                  </div>
                </>
              )}

              {/* Campos específicos para RewardType_Voucher (Voucher) */}
              {formData.type === "RewardType_Voucher" && (
                <>
                  <div>
                    <label htmlFor="voucher_code" className="block text-sm font-medium text-gray-700 mb-2">
                      Código Único do Voucher <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="voucher_code"
                      name="voucher_code"
                      value={formData.voucher_code || ""}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ex: VOUCHER2025"
                    />
                    <p className="mt-1 text-xs text-gray-500">Código único identificador do voucher</p>
                  </div>

                  <div>
                    <label htmlFor="voucher_value_mzn" className="block text-sm font-medium text-gray-700 mb-2">
                      Valor em MZN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="voucher_value_mzn"
                      name="voucher_value_mzn"
                      value={formData.voucher_value_mzn ?? ""}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ex: 100.00"
                    />
                    <p className="mt-1 text-xs text-gray-500">Valor do voucher em Meticais</p>
                  </div>

                  <div>
                    <label htmlFor="voucher_type" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Voucher <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="voucher_type"
                      name="voucher_type"
                      value={formData.voucher_type || ""}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="digital">Digital</option>
                      <option value="físico">Físico</option>
                      <option value="híbrido">Híbrido</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Tipo de voucher: digital, físico ou híbrido</p>
                  </div>

                  <div>
                    <label htmlFor="voucher_category" className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="voucher_category"
                      name="voucher_category"
                      value={formData.voucher_category || ""}
                      onChange={handleChange}
                      required
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ex: Alimentação, Vestuário, etc."
                    />
                    <p className="mt-1 text-xs text-gray-500">Categoria do voucher (alimentação, vestuário, etc.)</p>
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="voucher_description" className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      id="voucher_description"
                      name="voucher_description"
                      value={formData.voucher_description || ""}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Descrição do voucher..."
                    />
                    <p className="mt-1 text-xs text-gray-500">Descrição detalhada do voucher</p>
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="voucher_terms" className="block text-sm font-medium text-gray-700 mb-2">
                      Termos e Condições
                    </label>
                    <textarea
                      id="voucher_terms"
                      name="voucher_terms"
                      value={formData.voucher_terms || ""}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Termos e condições de uso do voucher..."
                    />
                    <p className="mt-1 text-xs text-gray-500">Termos e condições de uso do voucher</p>
                  </div>

                  <div>
                    <label htmlFor="voucher_expiry_date" className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Expiração
                    </label>
                    <input
                      type="date"
                      id="voucher_expiry_date"
                      name="voucher_expiry_date"
                      value={formData.voucher_expiry_date || ""}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Data de expiração do voucher</p>
                  </div>

                  <div>
                    <label htmlFor="voucher_usage_limit" className="block text-sm font-medium text-gray-700 mb-2">
                      Limite de Uso
                    </label>
                    <input
                      type="number"
                      id="voucher_usage_limit"
                      name="voucher_usage_limit"
                      value={formData.voucher_usage_limit ?? ""}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ex: 100"
                    />
                    <p className="mt-1 text-xs text-gray-500">Número máximo de vezes que o voucher pode ser usado</p>
                  </div>

                  <div>
                    <label htmlFor="voucher_min_purchase" className="block text-sm font-medium text-gray-700 mb-2">
                      Compra Mínima (MT)
                    </label>
                    <input
                      type="number"
                      id="voucher_min_purchase"
                      name="voucher_min_purchase"
                      value={formData.voucher_min_purchase ?? ""}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ex: 50.00"
                    />
                    <p className="mt-1 text-xs text-gray-500">Valor mínimo de compra para usar o voucher</p>
                  </div>

                  <div>
                    <label htmlFor="voucher_discount_type" className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Desconto
                    </label>
                    <select
                      id="voucher_discount_type"
                      name="voucher_discount_type"
                      value={formData.voucher_discount_type || ""}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="percentual">Percentual (%)</option>
                      <option value="fixo">Fixo (MT)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Tipo de desconto: percentual ou valor fixo</p>
                  </div>

                  <div>
                    <label htmlFor="voucher_discount_value" className="block text-sm font-medium text-gray-700 mb-2">
                      Valor do Desconto
                    </label>
                    <input
                      type="number"
                      id="voucher_discount_value"
                      name="voucher_discount_value"
                      value={formData.voucher_discount_value ?? ""}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder={formData.voucher_discount_type === "percentual" ? "Ex: 10 (10%)" : "Ex: 50.00 (MT)"}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.voucher_discount_type === "percentual" 
                        ? "Percentual de desconto (ex: 10 = 10%)"
                        : "Valor fixo do desconto em Meticais"}
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="voucher_single_use"
                        name="voucher_single_use"
                        checked={formData.voucher_single_use || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, voucher_single_use: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Uso Único</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500">Se marcado, o voucher só pode ser usado uma vez</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="voucher_code_required"
                        name="voucher_code_required"
                        checked={formData.voucher_code_required || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, voucher_code_required: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Código Obrigatório</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500">Se marcado, o código do voucher é obrigatório para uso</p>
                  </div>
                </>
              )}

              {/* Valor Máximo de Compra (apenas para tipos que envolvem compras) */}
              {(formData.type === "RewardType_Auto" || formData.type === "RewardType_Draw" || 
                formData.type === "RewardType_Exchange" || formData.type === "RewardType_Challenge" ||
                formData.type === "RewardType_Voucher") && (
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
                  <p className="mt-1 text-xs text-gray-500">Valor máximo que será considerado para a campanha (opcional)</p>
            </div>
              )}

              {/* Multiplicador de Bônus (apenas para tipos que envolvem compras) */}
              {(formData.type === "RewardType_Auto" || formData.type === "RewardType_Draw" || 
                formData.type === "RewardType_Exchange" || formData.type === "RewardType_Challenge" ||
                formData.type === "RewardType_Voucher") && (
                <div>
                  <label htmlFor="bonus_multiplier" className="block text-sm font-medium text-gray-700 mb-2">
                    Multiplicador de Bônus
                  </label>
                  <input
                    type="number"
                    id="bonus_multiplier"
                    name="bonus_multiplier"
                    value={formData.bonus_multiplier ?? ""}
                    onChange={handleChange}
                    min="1"
                    step="0.1"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ex: 2.0"
                  />
                  <p className="mt-1 text-xs text-gray-500">Multiplicador para pontos bônus (ex: 2.0 = dobra os pontos)</p>
          </div>
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
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagem da Campanha</h2>
          
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
              Imagem da Campanha
            </label>
            
            {/* Upload de arquivo */}
            <div className="mb-2">
              <label htmlFor="imageFile" className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {imageFile ? imageFile.name : "Carregar Imagem"}
              </label>
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              {imageFile && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="ml-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remover
                </button>
              )}
            </div>

            {/* Preview */}
            {imagePreview && (
              <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={imagePreview}
                  alt="Preview Imagem"
                  className="h-32 w-full object-cover"
                />
              </div>
            )}
            
            <p className="mt-2 text-xs text-gray-500">
              💡 O QR code será gerado automaticamente pelo sistema após a criação da campanha.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin/campaigns")}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Criando..." : "Criar Campanha"}
          </button>
        </div>
      </form>
      )}

      {/* Modal de Alerta */}
      {alertConfig && (
        <AlertModal
          isOpen={alertModalOpen}
          onClose={() => {
            setAlertModalOpen(false);
            setAlertConfig(null);
            // Não redirecionar aqui - o setTimeout já faz isso para sucesso
            // Apenas fechar o modal
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

