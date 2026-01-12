import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Cores oficiais do BCI Moçambique (baseado no logo)
const BCI_COLORS = {
  primary: "#FF6B35", // Laranja vibrante (cor principal do logo)
  secondary: "#FF8C42", // Laranja claro
  accent: "#FFD600", // Dourado
  success: "#009639", // Verde
  dark: "#1A1A1A", // Preto/escuro
  white: "#FFFFFF", // Branco
};

interface BCICampaign {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "completed";
  prizePlaces: number;
  totalParticipants: number;
  totalTransactions: number;
  totalAmount: number;
  winners?: BCWinner[];
}

interface BCWinner {
  position: number;
  customerName: string;
  customerPhone: string;
  customerAccount: string;
  transactionCount: number;
  totalAmount: number;
  prize: string;
  notified: boolean;
}

export default function BCIDashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<BCICampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalParticipants: 0,
    totalTransactions: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      // TODO: Implementar chamada à API
      // Por enquanto, dados mockados
      const mockCampaigns: BCICampaign[] = [
        {
          id: "1",
          name: "Campanha POS Premium",
          description: "Clientes que mais transacionam em POS ganham prêmios",
          startDate: "2026-01-01",
          endDate: "2026-01-31",
          status: "active",
          prizePlaces: 3,
          totalParticipants: 1250,
          totalTransactions: 15420,
          totalAmount: 2500000,
        },
        {
          id: "2",
          name: "Campanha ATM Champions",
          description: "Maiores valores transacionados em ATM",
          startDate: "2026-01-15",
          endDate: "2026-02-15",
          status: "active",
          prizePlaces: 5,
          totalParticipants: 890,
          totalTransactions: 8230,
          totalAmount: 1800000,
        },
      ];
      setCampaigns(mockCampaigns);
      setStats({
        totalCampaigns: mockCampaigns.length,
        activeCampaigns: mockCampaigns.filter((c) => c.status === "active").length,
        totalParticipants: mockCampaigns.reduce((sum, c) => sum + c.totalParticipants, 0),
        totalTransactions: mockCampaigns.reduce((sum, c) => sum + c.totalTransactions, 0),
        totalAmount: mockCampaigns.reduce((sum, c) => sum + c.totalAmount, 0),
      });
    } catch (err: any) {
      console.error("Erro ao carregar campanhas BCI:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-MZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
    };
    const labels = {
      active: "Ativa",
      inactive: "Inativa",
      completed: "Concluída",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header com cores BCI */}
      <div
        className="w-full py-6 px-8 shadow-lg"
        style={{
          backgroundColor: BCI_COLORS.primary, // Laranja vibrante do logo
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: BCI_COLORS.dark }}
            >
              BCI
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard BCI</h1>
              <p className="text-white/90 mt-1">Banco Comercial e de Investimentos</p>
            </div>
          </div>
          <Link
            href="/admin/bci/campaigns/new"
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
            style={{ backgroundColor: BCI_COLORS.accent, color: BCI_COLORS.dark }}
          >
            + Nova Campanha
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-t-4 transform hover:-translate-y-1 overflow-hidden" style={{ borderTopColor: BCI_COLORS.primary }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 flex-shrink-0" style={{ backgroundColor: `${BCI_COLORS.primary}15` }}>
                <svg className="w-7 h-7" style={{ color: BCI_COLORS.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Total de Campanhas</p>
              <p className="text-3xl lg:text-4xl font-bold mb-1 break-words leading-tight" style={{ color: BCI_COLORS.primary }}>
                {stats.totalCampaigns}
              </p>
              <p className="text-xs text-gray-400 truncate">Campanhas ativas</p>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-t-4 transform hover:-translate-y-1 overflow-hidden" style={{ borderTopColor: BCI_COLORS.success }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 flex-shrink-0" style={{ backgroundColor: `${BCI_COLORS.success}15` }}>
                <svg className="w-7 h-7" style={{ color: BCI_COLORS.success }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Campanhas Ativas</p>
              <p className="text-3xl lg:text-4xl font-bold mb-1 break-words leading-tight" style={{ color: BCI_COLORS.success }}>
                {stats.activeCampaigns}
              </p>
              <p className="text-xs text-gray-400 truncate">Em andamento</p>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-t-4 transform hover:-translate-y-1 overflow-hidden" style={{ borderTopColor: BCI_COLORS.secondary }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 flex-shrink-0" style={{ backgroundColor: `${BCI_COLORS.secondary}15` }}>
                <svg className="w-7 h-7" style={{ color: BCI_COLORS.secondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Participantes</p>
              <p className="text-3xl lg:text-4xl font-bold mb-1 break-words leading-tight" style={{ color: BCI_COLORS.secondary }}>
                {stats.totalParticipants.toLocaleString("pt-MZ")}
              </p>
              <p className="text-xs text-gray-400 truncate">Clientes únicos</p>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-t-4 transform hover:-translate-y-1 overflow-hidden" style={{ borderTopColor: BCI_COLORS.accent }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 flex-shrink-0" style={{ backgroundColor: `${BCI_COLORS.accent}15` }}>
                <svg className="w-7 h-7" style={{ color: BCI_COLORS.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Transações</p>
              <p className="text-3xl lg:text-4xl font-bold mb-1 break-words leading-tight" style={{ color: BCI_COLORS.accent }}>
                {stats.totalTransactions.toLocaleString("pt-MZ")}
              </p>
              <p className="text-xs text-gray-400 truncate">Total processadas</p>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-t-4 transform hover:-translate-y-1 overflow-hidden" style={{ borderTopColor: BCI_COLORS.dark }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 flex-shrink-0" style={{ backgroundColor: `${BCI_COLORS.dark}15` }}>
                <svg className="w-7 h-7" style={{ color: BCI_COLORS.dark }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Valor Total</p>
              <p className="text-xl lg:text-2xl font-bold mb-1 break-words leading-tight" style={{ color: BCI_COLORS.dark }}>
                {formatCurrency(stats.totalAmount)}
              </p>
              <p className="text-xs text-gray-400 truncate">MZN transacionados</p>
            </div>
          </div>
        </div>

        {/* Tabela de Campanhas */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Campanhas BCI</h2>
              <p className="text-sm text-gray-500 mt-1">Gerencie todas as campanhas promocionais</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/bci/campaigns"
                className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                style={{ backgroundColor: `${BCI_COLORS.primary}10`, color: BCI_COLORS.primary }}
              >
                Ver Todas
              </Link>
              <Link
                href="/admin/bci/upload"
                className="px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ backgroundColor: BCI_COLORS.primary }}
              >
                Upload CSV
              </Link>
              <Link
                href="/admin/bci/settings"
                className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md border-2"
                style={{ borderColor: BCI_COLORS.accent, color: BCI_COLORS.dark, backgroundColor: `${BCI_COLORS.accent}10` }}
              >
                ⚙️ Configurações
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" style={{ color: BCI_COLORS.primary }}></div>
              <p className="mt-4 text-gray-600">Carregando campanhas...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-4 text-gray-600">Nenhuma campanha encontrada</p>
              <Link
                href="/admin/bci/campaigns/new"
                className="mt-4 inline-block px-6 py-2 rounded-lg font-medium text-white"
                style={{ backgroundColor: BCI_COLORS.primary }}
              >
                Criar Primeira Campanha
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Campanha</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Período</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Participantes</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Transações</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Valor Total</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-8 py-5">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 mb-1">{campaign.name}</div>
                          <div className="text-xs text-gray-500">{campaign.description}</div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm text-gray-600">
                        {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                      </td>
                      <td className="px-8 py-5">{getStatusBadge(campaign.status)}</td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-semibold text-gray-900">{campaign.totalParticipants.toLocaleString("pt-MZ")}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-semibold text-gray-900">{campaign.totalTransactions.toLocaleString("pt-MZ")}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold" style={{ color: BCI_COLORS.primary }}>{formatCurrency(campaign.totalAmount)}</span>
                      </td>
                      <td className="px-8 py-5">
                        <Link
                          href={`/admin/bci/campaigns/${campaign.id}`}
                          className="inline-block px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                          style={{ backgroundColor: `${BCI_COLORS.primary}10`, color: BCI_COLORS.primary }}
                        >
                          Ver Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

