import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { airtextsService } from "@/services/airtexts.service";

const BCI_COLORS = {
  primary: "#FF6B35", // Laranja vibrante (cor principal do logo)
  secondary: "#FF8C42", // Laranja claro
  accent: "#FFD600", // Dourado
  success: "#009639", // Verde
  dark: "#1A1A1A", // Preto/escuro
  white: "#FFFFFF", // Branco
};

interface BCWinner {
  position: number;
  customerName: string;
  customerPhone: string;
  customerAccount: string;
  transactionCount: number;
  totalAmount: number;
  prize: string;
  notified: boolean;
  notifiedAt?: string;
}

interface BCICampaign {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "completed";
  prizePlaces: number;
  prizes: Array<{ position: number; description: string; value: string }>;
  totalParticipants: number;
  totalTransactions: number;
  totalAmount: number;
  winners?: BCWinner[];
}

export default function BCICampaignDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState<BCICampaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    if (id) {
      loadCampaign();
    }
  }, [id]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      // TODO: Implementar chamada à API
      // Mock data
      const mockCampaign: BCICampaign = {
        id: id as string,
        name: "Campanha POS Premium",
        description: "Clientes que mais transacionam em POS ganham prêmios",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        status: "active",
        prizePlaces: 3,
        prizes: [
          { position: 1, description: "1º Lugar", value: "50.000 MZN" },
          { position: 2, description: "2º Lugar", value: "30.000 MZN" },
          { position: 3, description: "3º Lugar", value: "20.000 MZN" },
        ],
        totalParticipants: 1250,
        totalTransactions: 15420,
        totalAmount: 2500000,
        winners: [
          {
            position: 1,
            customerName: "João Silva",
            customerPhone: "+258841234567",
            customerAccount: "1234567890",
            transactionCount: 8,
            totalAmount: 14100,
            prize: "50.000 MZN",
            notified: true,
            notifiedAt: "2026-01-31T10:30:00",
          },
          {
            position: 2,
            customerName: "Carlos Mendes",
            customerPhone: "+258845678901",
            customerAccount: "5678901234",
            transactionCount: 6,
            totalAmount: 25000,
            prize: "30.000 MZN",
            notified: true,
            notifiedAt: "2026-01-31T10:31:00",
          },
          {
            position: 3,
            customerName: "Pedro Costa",
            customerPhone: "+258843456789",
            customerAccount: "3456789012",
            transactionCount: 5,
            totalAmount: 16300,
            prize: "20.000 MZN",
            notified: false,
          },
        ],
      };
      setCampaign(mockCampaign);
    } catch (err: any) {
      console.error("Erro ao carregar campanha:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyWinners = async () => {
    if (!campaign?.winners || campaign.winners.length === 0) {
      alert("Não há vencedores para notificar");
      return;
    }

    try {
      setNotifying(true);

      // Preparar mensagens SMS para vencedores não notificados
      const winnersToNotify = campaign.winners.filter((w) => !w.notified);
      
      if (winnersToNotify.length === 0) {
        alert("Todos os vencedores já foram notificados!");
        setNotifying(false);
        return;
      }

      const smsMessages = winnersToNotify.map((winner) => {
        const positionText = winner.position === 1 ? "1º lugar" : winner.position === 2 ? "2º lugar" : `${winner.position}º lugar`;
        
        const message = `🎉 Parabéns! Você ganhou o ${positionText} na campanha "${campaign.name}"!

Prêmio: ${winner.prize}
Transações: ${winner.transactionCount}
Valor Total: ${formatCurrency(winner.totalAmount)}

Em breve entraremos em contato para entregar seu prêmio.

Banco BCI - É daqui`;

        return {
          to: winner.customerPhone,
          from: "BCI",
          message: message,
        };
      });

      // Enviar SMS para todos os vencedores
      const results = await airtextsService.sendBulkSMS(smsMessages);

      // Verificar resultados e atualizar status
      const updatedWinners = campaign.winners.map((w) => {
        const index = winnersToNotify.findIndex((wn) => wn.position === w.position);
        if (index >= 0 && results[index]?.success) {
          return {
            ...w,
            notified: true,
            notifiedAt: new Date().toISOString(),
          };
        }
        return w;
      });

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      setCampaign({
        ...campaign,
        winners: updatedWinners,
      });

      if (successCount > 0) {
        alert(
          `✅ ${successCount} vencedor(es) notificado(s) com sucesso!${failedCount > 0 ? `\n⚠️ ${failedCount} notificação(ões) falharam. Verifique as configurações do Airtexts.` : ""}`
        );
      } else {
        alert(`❌ Erro ao enviar notificações. Verifique as configurações do Airtexts.`);
      }
    } catch (err: any) {
      alert(`Erro ao enviar notificações: ${err.message}`);
      console.error("Erro ao notificar vencedores:", err);
    } finally {
      setNotifying(false);
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
      month: "long",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-MZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8fafc" }}>
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" style={{ color: BCI_COLORS.primary }}></div>
          <p className="mt-4 text-gray-600">Carregando campanha...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8fafc" }}>
        <div className="text-center">
          <p className="text-gray-600">Campanha não encontrada</p>
          <Link href="/admin/bci" className="mt-4 inline-block px-6 py-2 rounded-lg font-medium text-white" style={{ backgroundColor: BCI_COLORS.primary }}>
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div
        className="w-full py-6 px-8 shadow-lg"
        style={{
          backgroundColor: BCI_COLORS.primary, // Laranja vibrante do logo
        }}
      >
        <div className="max-w-7xl mx-auto">
          <Link href="/admin/bci" className="inline-flex items-center text-white hover:text-gray-200 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
          <p className="text-white/90 mt-1">{campaign.description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Informações da Campanha */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Informações da Campanha</h2>
            <p className="text-sm text-gray-500 mt-1">Detalhes gerais e estatísticas</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data de Início</p>
              <p className="text-xl font-bold text-gray-900">{formatDate(campaign.startDate)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data de Término</p>
              <p className="text-xl font-bold text-gray-900">{formatDate(campaign.endDate)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br border border-gray-100" style={{ background: `linear-gradient(135deg, ${BCI_COLORS.primary}08 0%, ${BCI_COLORS.primary}03 100%)` }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Participantes</p>
              <p className="text-xl font-bold" style={{ color: BCI_COLORS.primary }}>
                {campaign.totalParticipants.toLocaleString("pt-MZ")}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br border border-gray-100" style={{ background: `linear-gradient(135deg, ${BCI_COLORS.primary}08 0%, ${BCI_COLORS.primary}03 100%)` }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transações</p>
              <p className="text-xl font-bold" style={{ color: BCI_COLORS.primary }}>
                {campaign.totalTransactions.toLocaleString("pt-MZ")}
              </p>
            </div>
          </div>
        </div>

        {/* Prêmios */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Prêmios</h2>
            <p className="text-sm text-gray-500 mt-1">Valores e recompensas para os vencedores</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {campaign.prizes.map((prize) => (
              <div
                key={prize.position}
                className="group p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                style={{
                  borderColor: prize.position === 1 ? `${BCI_COLORS.accent}60` : prize.position === 2 ? "#C0C0C0" : "#CD7F32",
                  backgroundColor: prize.position === 1 ? `${BCI_COLORS.accent}08` : prize.position === 2 ? "#FAFAFA" : "#FFFBF0",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{prize.description}</span>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                    style={{
                      backgroundColor: prize.position === 1 ? BCI_COLORS.accent : prize.position === 2 ? "#E5E5E5" : "#E8A87C",
                    }}
                  >
                    <span className="text-2xl">
                      {prize.position === 1 && "🥇"}
                      {prize.position === 2 && "🥈"}
                      {prize.position === 3 && "🥉"}
                    </span>
                  </div>
                </div>
                <p className="text-3xl font-bold" style={{ color: BCI_COLORS.primary }}>
                  {prize.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Vencedores */}
        {campaign.winners && campaign.winners.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Vencedores</h2>
                <p className="text-sm text-gray-500 mt-1">Clientes premiados na campanha</p>
              </div>
              {campaign.winners.some((w) => !w.notified) && (
                <button
                  onClick={handleNotifyWinners}
                  disabled={notifying}
                  className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  style={{ backgroundColor: notifying ? BCI_COLORS.secondary : BCI_COLORS.success }}
                >
                  {notifying ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    "Notificar Todos por SMS"
                  )}
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Posição</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Telefone</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Conta</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Transações</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Valor Total</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Prêmio</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {campaign.winners.map((winner) => (
                    <tr key={winner.position} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
                            winner.position === 1
                              ? "bg-gradient-to-br from-yellow-100 to-yellow-50 text-yellow-800 border-2 border-yellow-200"
                              : winner.position === 2
                              ? "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-800 border-2 border-gray-200"
                              : "bg-gradient-to-br from-orange-100 to-orange-50 text-orange-800 border-2 border-orange-200"
                          }`}
                        >
                          {winner.position}º
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{winner.customerName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{winner.customerPhone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 font-mono">{winner.customerAccount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{winner.transactionCount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold" style={{ color: BCI_COLORS.primary }}>{formatCurrency(winner.totalAmount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold" style={{ color: BCI_COLORS.primary }}>
                          {winner.prize}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {winner.notified ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Notificado
                            {winner.notifiedAt && (
                              <span className="ml-1.5 text-xs opacity-75">({formatDateTime(winner.notifiedAt)})</span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm">
                            Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/bci/upload"
            className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{ backgroundColor: BCI_COLORS.primary }}
          >
            Upload de Transações
          </Link>
        </div>
      </div>
    </div>
  );
}

