import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const BCI_COLORS = {
  primary: "#FF6B35", // Laranja vibrante (cor principal do logo)
  secondary: "#FF8C42", // Laranja claro
  accent: "#FFD600", // Dourado
  success: "#009639", // Verde
  dark: "#1A1A1A", // Preto/escuro
  white: "#FFFFFF", // Branco
};

export default function NewBCICampaign() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    prizePlaces: 3,
    prizes: [
      { position: 1, description: "1º Lugar", value: "" },
      { position: 2, description: "2º Lugar", value: "" },
      { position: 3, description: "3º Lugar", value: "" },
    ],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      // TODO: Implementar chamada à API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Redirecionar para a lista de campanhas
      router.push("/admin/bci");
    } catch (err: any) {
      alert(`Erro ao criar campanha: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrizeChange = (index: number, field: string, value: string) => {
    const updatedPrizes = [...formData.prizes];
    updatedPrizes[index] = { ...updatedPrizes[index], [field]: value };
    setFormData({ ...formData, prizes: updatedPrizes });
  };

  const addPrizePlace = () => {
    if (formData.prizePlaces < 10) {
      const newPosition = formData.prizePlaces + 1;
      setFormData({
        ...formData,
        prizePlaces: newPosition,
        prizes: [
          ...formData.prizes,
          { position: newPosition, description: `${newPosition}º Lugar`, value: "" },
        ],
      });
    }
  };

  const removePrizePlace = () => {
    if (formData.prizePlaces > 1) {
      setFormData({
        ...formData,
        prizePlaces: formData.prizePlaces - 1,
        prizes: formData.prizes.slice(0, -1),
      });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div
        className="w-full py-6 px-8 shadow-lg"
        style={{
          backgroundColor: BCI_COLORS.primary, // Laranja vibrante do logo
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/bci" className="text-white hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Nova Campanha BCI</h1>
              <p className="text-white/90 mt-1">Crie uma nova campanha promocional</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Nome da Campanha */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Nome da Campanha *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
              style={{ 
                focusRingColor: BCI_COLORS.primary,
                borderColor: formData.name ? `${BCI_COLORS.primary}40` : undefined
              }}
              placeholder="Ex: Campanha POS Premium"
            />
            <p className="mt-2 text-xs text-gray-500">Escolha um nome claro e descritivo para a campanha</p>
          </div>

          {/* Descrição */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Descrição *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
              style={{ 
                focusRingColor: BCI_COLORS.primary,
                borderColor: formData.description ? `${BCI_COLORS.primary}40` : undefined
              }}
              placeholder="Descreva detalhadamente a campanha, seus objetivos e como os clientes podem participar..."
            />
            <p className="mt-2 text-xs text-gray-500">Forneça informações claras sobre a campanha e seus benefícios</p>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Data de Início *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900"
                  style={{ 
                    focusRingColor: BCI_COLORS.primary,
                    borderColor: formData.startDate ? `${BCI_COLORS.primary}40` : undefined
                  }}
                />
                <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Data de Término *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900"
                  style={{ 
                    focusRingColor: BCI_COLORS.primary,
                    borderColor: formData.endDate ? `${BCI_COLORS.primary}40` : undefined
                  }}
                />
                <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Prêmios */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                  Prêmios
                </label>
                <p className="text-xs text-gray-500">{formData.prizePlaces} lugar{formData.prizePlaces > 1 ? "es" : ""} definido{formData.prizePlaces > 1 ? "s" : ""}</p>
              </div>
              <div className="flex gap-2">
                {formData.prizePlaces < 10 && (
                  <button
                    type="button"
                    onClick={addPrizePlace}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    style={{ backgroundColor: BCI_COLORS.success }}
                  >
                    + Adicionar
                  </button>
                )}
                {formData.prizePlaces > 1 && (
                  <button
                    type="button"
                    onClick={removePrizePlace}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    style={{ backgroundColor: BCI_COLORS.secondary }}
                  >
                    - Remover
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {formData.prizes.map((prize, index) => (
                <div
                  key={prize.position}
                  className="group p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg"
                  style={{
                    borderColor: prize.position === 1 ? `${BCI_COLORS.accent}60` : prize.position === 2 ? "#C0C0C0" : "#CD7F32",
                    backgroundColor: prize.position === 1 ? `${BCI_COLORS.accent}08` : prize.position === 2 ? "#FAFAFA" : "#FFFBF0",
                  }}
                >
                  <div className="flex items-center gap-5">
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center font-bold text-xl shadow-md"
                      style={{
                        backgroundColor: prize.position === 1 ? BCI_COLORS.accent : prize.position === 2 ? "#E5E5E5" : "#E8A87C",
                        color: prize.position === 1 ? BCI_COLORS.dark : "#333"
                      }}
                    >
                      {prize.position === 1 && "🥇"}
                      {prize.position === 2 && "🥈"}
                      {prize.position === 3 && "🥉"}
                      {prize.position > 3 && `${prize.position}º`}
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        {prize.description}
                      </label>
                      <input
                        type="text"
                        required
                        value={prize.value}
                        onChange={(e) => handlePrizeChange(index, "value", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 font-medium"
                        style={{ 
                          focusRingColor: BCI_COLORS.primary,
                          borderColor: prize.value ? `${BCI_COLORS.primary}40` : undefined
                        }}
                        placeholder="Ex: 50.000 MZN ou Prêmio Especial"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <Link
              href="/admin/bci"
              className="px-8 py-3.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              style={{ backgroundColor: loading ? BCI_COLORS.secondary : BCI_COLORS.primary }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Criando...
                </span>
              ) : (
                "Criar Campanha"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

