import { useState, useEffect } from "react";
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
}

export default function BCICampaignsList() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<BCICampaign[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      // TODO: Implementar chamada à API usando bciService
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
    } catch (err: any) {
      console.error("Erro ao carregar campanhas:", err);
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
              <h1 className="text-3xl font-bold text-white">Campanhas BCI</h1>
              <p className="text-white/90 mt-1">Gerencie todas as campanhas promocionais</p>
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
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
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
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campanha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prêmios</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participantes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transações</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                          <div className="text-sm text-gray-500">{campaign.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(campaign.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{campaign.prizePlaces} lugares</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{campaign.totalParticipants.toLocaleString("pt-MZ")}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{campaign.totalTransactions.toLocaleString("pt-MZ")}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(campaign.totalAmount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/admin/bci/campaigns/${campaign.id}`}
                          className="px-3 py-1 rounded-lg transition-colors"
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

