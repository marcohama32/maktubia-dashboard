import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { airtextsService } from "@/services/airtexts.service";

const BCI_COLORS = {
  primary: "#FF6B35",
  secondary: "#FF8C42",
  accent: "#FFD600",
  success: "#009639",
  dark: "#1A1A1A",
  white: "#FFFFFF",
};

export default function BCISettings() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string>("");
  const [apiSecret, setApiSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Carregar credenciais salvas
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("airtexts_api_key") || "";
      const savedSecret = localStorage.getItem("airtexts_api_secret") || "";
      setApiKey(savedKey);
      setApiSecret(savedSecret);
    }
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      airtextsService.setCredentials(apiKey, apiSecret);
      alert("Credenciais do Airtexts salvas com sucesso!");
    } catch (err: any) {
      alert(`Erro ao salvar credenciais: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMS = async () => {
    if (!apiKey || !apiSecret) {
      alert("Por favor, configure as credenciais do Airtexts primeiro");
      return;
    }

    try {
      setLoading(true);
      setTestResult(null);

      const testPhone = "+258841234567"; // Número de teste
      const result = await airtextsService.sendSMS({
        to: testPhone,
        from: "BCI",
        message: "Teste de SMS do sistema BCI. Se você recebeu esta mensagem, a integração está funcionando! 🎉",
      });

      if (result.success) {
        setTestResult({
          success: true,
          message: "SMS de teste enviado com sucesso!",
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || "Erro ao enviar SMS de teste",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Erro ao enviar SMS de teste",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div
        className="w-full py-6 px-8 shadow-lg"
        style={{
          backgroundColor: BCI_COLORS.primary,
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
              <h1 className="text-3xl font-bold text-white">Configurações BCI</h1>
              <p className="text-white/90 mt-1">Configure a integração com Airtexts para envio de SMS</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Integração Airtexts</h2>
            <p className="text-gray-600">
              Configure suas credenciais da API do Airtexts para enviar notificações SMS aos vencedores das campanhas.
            </p>
            <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Como obter suas credenciais:</strong>
              </p>
              <ol className="list-decimal list-inside mt-2 text-sm text-blue-700 space-y-1">
                <li>Acesse <a href="https://dashboard.airtexts.com" target="_blank" rel="noopener noreferrer" className="underline">dashboard.airtexts.com</a></li>
                <li>Faça login na sua conta</li>
                <li>Vá para a seção de API Keys</li>
                <li>Copie sua API Key e API Secret</li>
                <li>Cole abaixo e salve</li>
              </ol>
            </div>
          </div>

          {/* Formulário de Credenciais */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                API Key *
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 font-mono text-sm"
                style={{
                  focusRingColor: BCI_COLORS.primary,
                  borderColor: apiKey ? `${BCI_COLORS.primary}40` : undefined,
                }}
                placeholder="Sua API Key do Airtexts"
              />
              <p className="mt-2 text-xs text-gray-500">Sua chave de API do Airtexts</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                API Secret *
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 font-mono text-sm"
                style={{
                  focusRingColor: BCI_COLORS.primary,
                  borderColor: apiSecret ? `${BCI_COLORS.primary}40` : undefined,
                }}
                placeholder="Sua API Secret do Airtexts"
              />
              <p className="mt-2 text-xs text-gray-500">Sua chave secreta da API do Airtexts (mantida em segurança)</p>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleTestSMS}
                disabled={!apiKey || !apiSecret || loading}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                style={{ backgroundColor: BCI_COLORS.accent, color: BCI_COLORS.dark }}
              >
                {loading ? "Testando..." : "Testar SMS"}
              </button>
              <button
                onClick={handleSave}
                disabled={!apiKey || !apiSecret || saving}
                className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                style={{ backgroundColor: saving ? BCI_COLORS.secondary : BCI_COLORS.primary }}
              >
                {saving ? "Salvando..." : "Salvar Credenciais"}
              </button>
            </div>

            {/* Resultado do Teste */}
            {testResult && (
              <div
                className={`mt-6 p-4 rounded-xl border-2 ${
                  testResult.success
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <p className="font-semibold">{testResult.message}</p>
                </div>
              </div>
            )}

            {/* Informações de Segurança */}
            <div className="mt-8 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Segurança:</strong> As credenciais são armazenadas localmente no navegador. Para produção, recomenda-se usar variáveis de ambiente no backend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

