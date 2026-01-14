import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { campaignsService } from "@/services/campaigns.service";
import { AlertModal } from "@/components/modals/AlertModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getUserRole } from "@/utils/roleUtils";

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

interface Participation {
  participationId: number;
  campaignId: string | number;
  reservationCode: string | null;
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
}

function ParticipationsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  
  // Estados para modais
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Verificar se é cliente
  const userRole = getUserRole(user);
  const isClient = userRole === 'user' || userRole === 'cliente';

  useEffect(() => {
    if (!isClient) {
      router.push("/");
      return;
    }
    
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => loadParticipations(), { timeout: 100 });
    } else {
      setTimeout(() => loadParticipations(), 50);
    }
  }, [isClient, router]);

  const loadParticipations = async () => {
    try {
      setLoading(true);
      setError("");
      
      const data = await campaignsService.getMyParticipations();
      setParticipations(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar participações:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar participações");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string | null) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setAlertConfig({
      title: "Copiado!",
      message: "Código copiado para a área de transferência",
      type: "success",
    });
    setAlertModalOpen(true);
  };

  const handleViewCode = (code: string | null) => {
    if (!code) return;
    setSelectedCode(code);
    setShowCodeModal(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("pt-BR");
    } catch {
      return dateString;
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="relative p-6">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-gray-600">Carregando...</div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Minhas Participações</h1>
            <p className="mt-1 text-sm text-gray-500">
              Visualize todas as campanhas que você participou
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Lista de Participações */}
      <div className="space-y-4">
        {participations.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma participação encontrada</h3>
            <p className="mt-2 text-sm text-gray-500">
              Você ainda não participou de nenhuma campanha. Explore as campanhas disponíveis para começar!
            </p>
            <button
              onClick={() => router.back()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar
            </button>
          </div>
        ) : (
          participations.map((participation) => {
            const expired = isExpired(participation.expiresAt);
            const used = participation.status === 'used';
            const valid = participation.isValid && !expired && !used;

            return (
              <div
                key={participation.participationId}
                className={`rounded-lg border-2 p-6 shadow transition-all ${
                  used
                    ? "border-gray-300 bg-gray-50"
                    : expired
                    ? "border-red-300 bg-red-50"
                    : valid
                    ? "border-green-300 bg-green-50"
                    : "border-yellow-300 bg-yellow-50"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {participation.campaign.description || "Campanha"}
                          </h3>
                          {participation.campaign.type && (
                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {translateCampaignType(participation.campaign.type)}
                            </span>
                          )}
                        </div>
                        {participation.establishment && (
                          <p className="mt-1 text-sm text-gray-600">
                            <span className="font-medium">📍 Estabelecimento:</span> {participation.establishment.name}
                            {participation.establishment.type && (
                              <span className="text-gray-500"> ({participation.establishment.type})</span>
                            )}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>
                            <span className="font-medium">Criado em:</span> {formatDate(participation.createdAt)}
                          </span>
                          {participation.expiresAt && (
                            <span>
                              <span className="font-medium">Expira em:</span> {formatDate(participation.expiresAt)}
                            </span>
                          )}
                          {participation.usedAt && (
                            <span>
                              <span className="font-medium">Usado em:</span> {formatDate(participation.usedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            used
                              ? "bg-gray-200 text-gray-700"
                              : expired
                              ? "bg-red-200 text-red-700"
                              : valid
                              ? "bg-green-200 text-green-700"
                              : "bg-yellow-200 text-yellow-700"
                          }`}
                        >
                          {used ? "Usado" : expired ? "Expirado" : valid ? "Válido" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mostrar código de reserva apenas se existir */}
                  {participation.reservationCode && (
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                      <div className="bg-white rounded-lg border-2 border-gray-300 p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">Código de Reserva</p>
                        <p className="text-lg font-bold text-gray-900 font-mono tracking-wider">
                          {participation.reservationCode}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => participation.reservationCode && handleViewCode(participation.reservationCode)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          title="Ver código"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => participation.reservationCode && handleCopyCode(participation.reservationCode)}
                          disabled={used || expired || !participation.reservationCode}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                          title="Copiar código"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Mostrar mensagem para campanhas sem código */}
                  {!participation.reservationCode && (
                    <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-3 text-center">
                      <p className="text-sm font-medium text-blue-800">
                        Participação registrada
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Esta campanha não gera código de reserva
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Código */}
      {showCodeModal && selectedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Código de Reserva</h2>
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setSelectedCode(null);
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
                Use este código no estabelecimento para aproveitar a campanha.
              </p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Código de Reserva</p>
                <p className="text-3xl font-bold text-blue-700 font-mono tracking-wider">
                  {selectedCode}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleCopyCode(selectedCode);
                }}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Copiar Código
              </button>
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setSelectedCode(null);
                }}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
}

export default function ParticipationsPage() {
  return (
    <ProtectedRoute requireClient={true} redirectTo="/merchant/campaigns/public">
      <ParticipationsPageContent />
    </ProtectedRoute>
  );
}

