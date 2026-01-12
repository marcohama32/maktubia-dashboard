"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { discountReservationCampaignsService, CreateDiscountReservationCampaignDTO } from "@/services/discountReservationCampaigns.service";
import { establishmentService } from "@/services/establishment.service";
import { AlertModal } from "@/components/modals/AlertModal";

export default function NewDiscountReservationCampaignPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loadingEstablishments, setLoadingEstablishments] = useState(true);

  const [formData, setFormData] = useState<CreateDiscountReservationCampaignDTO>({
    tipo_beneficio: "desconto_percentual",
    consumo_minimo: 0,
    data_inicial: "",
    data_final: "",
    limite_utilizacao_cliente: 1,
    percentual_desconto: undefined,
    establishment_id: 0,
    campaign_name: "",
  });

  useEffect(() => {
    loadEstablishments();
  }, []);

  const loadEstablishments = async () => {
    try {
      setLoadingEstablishments(true);
      const establishmentsList = await establishmentService.getAll();
      setEstablishments(establishmentsList || []);
    } catch (err: any) {
      console.error("Erro ao carregar estabelecimentos:", err);
      setError("Erro ao carregar estabelecimentos");
    } finally {
      setLoadingEstablishments(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? undefined : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validações básicas
    if (!formData.campaign_name || formData.campaign_name.trim() === "") {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, informe o nome da campanha.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    if (!formData.establishment_id || formData.establishment_id === 0) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, selecione um estabelecimento.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    if (!formData.consumo_minimo || formData.consumo_minimo <= 0) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, informe o consumo mínimo (deve ser maior que zero).",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    if (!formData.data_inicial || !formData.data_final) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, informe as datas de início e fim.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    if (new Date(formData.data_final) <= new Date(formData.data_inicial)) {
      setAlertConfig({
        title: "Erro!",
        message: "A data final deve ser posterior à data inicial.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    if (!formData.limite_utilizacao_cliente || formData.limite_utilizacao_cliente <= 0) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, informe o limite de utilização por cliente.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    if (!formData.percentual_desconto || formData.percentual_desconto <= 0 || formData.percentual_desconto > 100) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, informe o percentual de desconto (0-100%).",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    try {
      setSaving(true);
      
      // Preparar dados para envio (apenas campos principais)
      const campaignData: CreateDiscountReservationCampaignDTO = {
        tipo_beneficio: formData.tipo_beneficio,
        consumo_minimo: formData.consumo_minimo,
        data_inicial: formData.data_inicial,
        data_final: formData.data_final,
        limite_utilizacao_cliente: formData.limite_utilizacao_cliente,
        percentual_desconto: formData.percentual_desconto,
        establishment_id: formData.establishment_id,
        campaign_name: formData.campaign_name,
      };

      console.log("📤 [NEW DISCOUNT RESERVATION CAMPAIGN] Enviando dados:", campaignData);
      const createdCampaign = await discountReservationCampaignsService.create(campaignData);
      console.log("✅ [NEW DISCOUNT RESERVATION CAMPAIGN] Campanha criada:", createdCampaign);
      
      setAlertConfig({
        title: "Sucesso!",
        message: "Campanha criada com sucesso!",
        type: "success",
      });
      setAlertModalOpen(true);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push(`/admin/campaigns/discount-reservation/${createdCampaign.id}`);
      }, 2000);
    } catch (err: any) {
      console.error("❌ [NEW DISCOUNT RESERVATION CAMPAIGN] Erro ao criar campanha:", err);
      
      let errorMessage = err.message || "Erro ao criar campanha. Por favor, tente novamente.";
      setError(errorMessage);
      
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Nova Campanha de Desconto por Marcação</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
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
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Campanha Oferta de Desconto por marcacao"
                />
              </div>

              <div>
                <label htmlFor="establishment_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Estabelecimento <span className="text-red-500">*</span>
                </label>
                <select
                  id="establishment_id"
                  name="establishment_id"
                  value={formData.establishment_id}
                  onChange={handleChange}
                  required
                  disabled={loadingEstablishments}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value={0}>Selecione um estabelecimento</option>
                  {establishments.map((est) => (
                    <option key={est.id || est.establishment_id} value={est.id || est.establishment_id}>
                      {est.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tipo_beneficio" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Benefício <span className="text-red-500">*</span>
                </label>
                <select
                  id="tipo_beneficio"
                  name="tipo_beneficio"
                  value={formData.tipo_beneficio}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="desconto_percentual">Desconto Percentual (%)</option>
                </select>
              </div>

              <div>
                <label htmlFor="consumo_minimo" className="block text-sm font-medium text-gray-700 mb-2">
                  Consumo Mínimo (MZN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="consumo_minimo"
                  name="consumo_minimo"
                  value={formData.consumo_minimo || ""}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="2000"
                />
              </div>

              <div>
                <label htmlFor="percentual_desconto" className="block text-sm font-medium text-gray-700 mb-2">
                  Percentual de Desconto (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="percentual_desconto"
                  name="percentual_desconto"
                  value={formData.percentual_desconto || ""}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="43"
                />
              </div>

              <div>
                <label htmlFor="data_inicial" className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="data_inicial"
                  name="data_inicial"
                  value={formData.data_inicial}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="data_final" className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fim <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="data_final"
                  name="data_final"
                  value={formData.data_final}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="limite_utilizacao_cliente" className="block text-sm font-medium text-gray-700 mb-2">
                  Limite por Cliente <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="limite_utilizacao_cliente"
                  name="limite_utilizacao_cliente"
                  value={formData.limite_utilizacao_cliente || ""}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Criando..." : "Criar Campanha"}
            </button>
          </div>
        </form>
      </div>

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        title={alertConfig?.title || ""}
        message={alertConfig?.message || ""}
        type={alertConfig?.type || "info"}
      />
    </div>
  );
}

