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

  const [formData, setFormData] = useState<UpdateCampaignDTO>({
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
  });

  useEffect(() => {
    if (id) {
      loadCampaign(id as string);
    }
    if (user) {
      loadEstablishments();
    }
  }, [id, user]);

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
      
      // Preencher formulário com dados da campanha
      const formDataToSet: UpdateCampaignDTO = {
        campaign_name: data.campaign_name || data.name || "",
        sponsor_name: data.sponsor_name || "",
        valid_from: formatDateForInput(data.valid_from || data.start_date),
        valid_until: formatDateForInput(data.valid_until || data.end_date),
        description: data.description || data.reward_description || "",
        accumulation_rate: data.accumulation_rate ?? undefined,
        bonus_multiplier: data.bonus_multiplier ?? undefined,
        min_purchase_amount: data.min_purchase_amount ?? undefined,
        max_purchase_amount: data.max_purchase_amount ?? undefined,
        total_points_limit: data.total_points_limit ?? undefined,
        status: (data.status as any) || (data.is_active ? "Activo" : "Rascunho"),
        is_active: data.is_active !== false,
        // Campos legados para compatibilidade
        name: data.campaign_name || data.name,
        start_date: formatDateForInput(data.valid_from || data.start_date),
        end_date: formatDateForInput(data.valid_until || data.end_date),
      };
      
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
    if (!isAdmin(user) && establishmentId && !canCreateCampaign(establishmentId)) {
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
      const updateData: UpdateCampaignDTO = {
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
      };

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "establishment_id" || name === "accumulation_rate" || name === "bonus_multiplier" || 
              name === "min_purchase_amount" || name === "max_purchase_amount" || name === "total_points_limit" ||
              name === "daily_limit_per_client" || name === "transaction_limit" || name === "campaign_limit_per_client" ||
              name === "reward_value_mt" || name === "reward_points_cost" || name === "reward_stock" ||
              name === "points_expiry_days" || name === "communication_budget"
        ? (value === "" ? (name === "establishment_id" ? 0 : undefined) : Number(value))
        : name === "is_active"
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

