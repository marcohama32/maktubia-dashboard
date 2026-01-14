import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { airtextsService } from "@/services/airtexts.service";
import { AlertModal } from "@/components/modals/AlertModal";

const BCI_COLORS = {
  primary: "#FF6B35", // Laranja vibrante (cor principal do logo)
  secondary: "#FF8C42", // Laranja claro
  accent: "#FFD600", // Dourado
  success: "#009639", // Verde
  dark: "#1A1A1A", // Preto/escuro
  white: "#FFFFFF", // Branco
};

interface Transaction {
  customerName: string;
  customerPhone: string;
  customerAccount: string;
  transactionDate: string;
  transactionType: "POS" | "ATM" | "ONLINE";
  amount: number;
  merchantName?: string;
  location?: string;
}

interface ProcessedResult {
  totalTransactions: number;
  uniqueCustomers: number;
  totalAmount: number;
  topCustomers: Array<{
    customerName: string;
    customerPhone: string;
    customerAccount: string;
    transactionCount: number;
    totalAmount: number;
  }>;
}

export default function BCICSVUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [campaignId, setCampaignId] = useState<string>("");
  
  // Handler para mudança de campanha
  const handleCampaignChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    console.log("🔍 [BCI UPLOAD] handleCampaignChange chamado!");
    console.log("🔍 [BCI UPLOAD] Valor recebido:", newValue);
    console.log("🔍 [BCI UPLOAD] Estado ANTES:", { campaignId });
    
    setCampaignId(newValue);
    
    console.log("🔍 [BCI UPLOAD] setCampaignId chamado com:", newValue);
  }, [campaignId]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedResult, setProcessedResult] = useState<ProcessedResult | null>(null);
  const [error, setError] = useState<string>("");
  const [preview, setPreview] = useState<Transaction[]>([]);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Computed: verificar se o botão deve estar habilitado
  const isButtonEnabled = !!(file && campaignId && campaignId.trim() !== "" && !processing);

  // Debug: rastrear mudanças no campaignId
  useEffect(() => {
    console.log("🔍 [BCI UPLOAD] campaignId mudou:", {
      campaignId,
      type: typeof campaignId,
      length: campaignId?.length,
      trimmed: campaignId?.trim(),
      isEmpty: !campaignId || campaignId.trim() === "",
    });
  }, [campaignId]);

  // Debug: rastrear mudanças no isButtonEnabled
  useEffect(() => {
    console.log("🔍 [BCI UPLOAD] isButtonEnabled mudou:", {
      isButtonEnabled,
      hasFile: !!file,
      fileName: file?.name,
      campaignId,
      campaignIdTrimmed: campaignId?.trim(),
      processing,
    });
  }, [isButtonEnabled, file, campaignId, processing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    console.log("🔍 [BCI UPLOAD] Arquivo selecionado:", selectedFile?.name);
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        setError("Por favor, selecione um arquivo CSV válido");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError("");
      setPreview([]); // Limpar preview anterior
      parseCSV(selectedFile);
    } else {
      setFile(null);
      setPreview([]);
    }
  };

  const parseCSV = async (csvFile: File) => {
    try {
      const text = await csvFile.text();
      const lines = text.split("\n").filter((line) => line.trim());
      
      if (lines.length < 2) {
        setError("O arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados");
        setFile(null); // Limpar file se inválido
        return;
      }

      // Parse header - tentar diferentes delimitadores
      let headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      
      // Se não funcionar com vírgula, tentar ponto e vírgula
      if (headers.length < 3) {
        headers = lines[0].split(";").map((h) => h.trim().toLowerCase());
      }
      
      // Parse data
      const transactions: Transaction[] = [];
      for (let i = 1; i < Math.min(lines.length, 11); i++) {
        // Preview apenas primeiras 10 linhas
        let values = lines[i].split(",").map((v) => v.trim());
        
        // Se não funcionar com vírgula, tentar ponto e vírgula
        if (values.length < 3) {
          values = lines[i].split(";").map((v) => v.trim());
        }
        
        if (values.length === headers.length) {
          const transaction: any = {};
          headers.forEach((header, index) => {
            transaction[header] = values[index];
          });
          
          // Normalizar campos
          transactions.push({
            customerName: transaction.nome || transaction["nome do cliente"] || transaction.customer || "",
            customerPhone: transaction.telefone || transaction.phone || transaction["número de telefone"] || "",
            customerAccount: transaction.conta || transaction.account || transaction["número de conta"] || "",
            transactionDate: transaction.data || transaction.date || transaction["data da transação"] || "",
            transactionType: (transaction.tipo || transaction.type || transaction["tipo de transação"] || "POS").toUpperCase() as "POS" | "ATM" | "ONLINE",
            amount: parseFloat((transaction.valor || transaction.amount || transaction.montante || "0").replace(",", ".")),
            merchantName: transaction.merchant || transaction["nome do comerciante"] || "",
            location: transaction.localização || transaction.location || transaction.local || "",
          });
        }
      }
      
      if (transactions.length === 0) {
        setError("Nenhuma transação válida encontrada no arquivo. Verifique o formato do CSV.");
        setPreview([]);
        return;
      }
      
      setPreview(transactions);
      setError(""); // Limpar erros se parse foi bem-sucedido
      console.log("✅ [BCI UPLOAD] CSV parseado com sucesso:", {
        totalLinhas: lines.length,
        previewLinhas: transactions.length,
        file: csvFile.name,
      });
    } catch (err: any) {
      setError(`Erro ao processar CSV: ${err.message}`);
      setFile(null); // Limpar file em caso de erro
    }
  };

  const processTransactions = async () => {
    if (!file || !campaignId) {
      setError("Por favor, selecione um arquivo e uma campanha");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      // TODO: Implementar chamada à API
      // Por enquanto, simular processamento
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      
      const transactions: Transaction[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values.length === headers.length) {
          const transaction: any = {};
          headers.forEach((header, index) => {
            transaction[header] = values[index];
          });
          
          transactions.push({
            customerName: transaction.nome || transaction["nome do cliente"] || transaction.customer || "",
            customerPhone: transaction.telefone || transaction.phone || transaction["número de telefone"] || "",
            customerAccount: transaction.conta || transaction.account || transaction["número de conta"] || "",
            transactionDate: transaction.data || transaction.date || transaction["data da transação"] || "",
            transactionType: (transaction.tipo || transaction.type || transaction["tipo de transação"] || "POS").toUpperCase() as "POS" | "ATM" | "ONLINE",
            amount: parseFloat(transaction.valor || transaction.amount || transaction.montante || "0"),
            merchantName: transaction.merchant || transaction["nome do comerciante"] || "",
            location: transaction.localização || transaction.location || transaction.local || "",
          });
        }
      }

      // Agrupar por cliente e calcular totais
      const customerMap = new Map<string, { name: string; phone: string; account: string; count: number; total: number }>();
      
      transactions.forEach((t) => {
        const key = t.customerAccount || t.customerPhone;
        if (key) {
          const existing = customerMap.get(key);
          if (existing) {
            existing.count += 1;
            existing.total += t.amount;
          } else {
            customerMap.set(key, {
              name: t.customerName,
              phone: t.customerPhone,
              account: t.customerAccount,
              count: 1,
              total: t.amount,
            });
          }
        }
      });

      // Ordenar por total (maior para menor)
      const topCustomers = Array.from(customerMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
        .map((c) => ({
          customerName: c.name,
          customerPhone: c.phone,
          customerAccount: c.account,
          transactionCount: c.count,
          totalAmount: c.total,
        }));

      setProcessedResult({
        totalTransactions: transactions.length,
        uniqueCustomers: customerMap.size,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        topCustomers,
      });
    } catch (err: any) {
      setError(`Erro ao processar transações: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-MZ", {
      style: "currency",
      currency: "MZN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleSelectWinnersAndNotify = async () => {
    if (!processedResult || !campaignId || processedResult.topCustomers.length === 0) {
      setError("Por favor, processe as transações primeiro");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      // TODO: Buscar informações da campanha para saber quantos prêmios há
      // Por enquanto, assumir que há prêmios para os top 3
      const numberOfPrizes = 3; // Isso deve vir da campanha
      const winners = processedResult.topCustomers.slice(0, numberOfPrizes);

      // Preparar mensagens SMS para cada vencedor
      const smsMessages = winners.map((winner, index) => {
        const position = index + 1;
        const prizeText = position === 1 ? "1º lugar" : position === 2 ? "2º lugar" : "3º lugar";
        
        const message = `🎉 Parabéns! Você ganhou o ${prizeText} na campanha BCI! 
        
Você realizou ${winner.transactionCount} transações no valor total de ${formatCurrency(winner.totalAmount)}.

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

      // Verificar resultados
      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      if (successCount > 0) {
        setAlertModal({
          isOpen: true,
          title: "Notificações enviadas",
          message: `✅ ${successCount} vencedor(es) notificado(s) com sucesso!${failedCount > 0 ? `\n\n⚠️ ${failedCount} notificação(ões) falharam. Verifique as configurações do Airtexts.` : ""}`,
          type: failedCount > 0 ? "warning" : "success",
        });
        
        // Redirecionar para a página de detalhes da campanha após fechar a modal
        setTimeout(() => {
          if (failedCount === 0) {
            router.push(`/admin/bci/campaigns/${campaignId}`);
          }
        }, 2000);
      } else {
        setAlertModal({
          isOpen: true,
          title: "Erro ao enviar notificações",
          message: "Não foi possível enviar as notificações. Verifique as configurações do Airtexts.",
          type: "error",
        });
      }
    } catch (err: any) {
      setError(`Erro ao notificar vencedores: ${err.message}`);
      console.error("Erro ao notificar vencedores:", err);
    } finally {
      setProcessing(false);
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
              <h1 className="text-3xl font-bold text-white">Upload de Transações CSV</h1>
              <p className="text-white/90 mt-1">Carregue e processe transações para seleção de vencedores</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Link para download do CSV de teste */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">📥 Arquivo CSV de Teste</h3>
              <p className="text-sm text-gray-600">
                Baixe um arquivo CSV de exemplo com dados de transações para testar o sistema.
              </p>
            </div>
            <a
              href="/bci-transacoes-teste.csv"
              download="bci-transacoes-teste.csv"
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              style={{ backgroundColor: BCI_COLORS.primary }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Baixar CSV de Teste
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          {/* Seleção de Campanha */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Selecionar Campanha *
            </label>
            <div className="relative">
              <select
                id="campaign-select"
                value={campaignId}
                onChange={(e) => {
                  const val = e.target.value;
                  console.log("🔍 [BCI UPLOAD] ========== onChange INLINE ==========");
                  console.log("🔍 [BCI UPLOAD] Valor selecionado:", val);
                  console.log("🔍 [BCI UPLOAD] Estado ANTES:", { campaignId });
                  setCampaignId(val);
                  console.log("🔍 [BCI UPLOAD] setCampaignId executado com:", val);
                }}
                onMouseDown={(e) => {
                  console.log("🔍 [BCI UPLOAD] onMouseDown no select");
                }}
                onFocus={(e) => {
                  console.log("🔍 [BCI UPLOAD] onFocus no select");
                }}
                className="w-full px-5 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 appearance-none bg-white cursor-pointer"
                style={{ 
                  focusRingColor: BCI_COLORS.primary,
                  borderColor: campaignId ? `${BCI_COLORS.primary}40` : undefined
                }}
              >
                <option value="">Selecione uma campanha</option>
                <option value="1">Campanha POS Premium</option>
                <option value="2">Campanha ATM Champions</option>
              </select>
              <div 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none"
                style={{ zIndex: -1 }}
              >
                <svg 
                  className="w-5 h-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">Escolha a campanha para a qual deseja processar as transações</p>
          </div>

          {/* Upload de Arquivo */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Arquivo CSV de Transações *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-gray-300 border-dashed rounded-xl hover:border-gray-400 transition-all duration-200 hover:bg-gray-50">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md font-medium focus-within:outline-none"
                    style={{ color: BCI_COLORS.primary }}
                  >
                    <span>Clique para fazer upload</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".csv"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">ou arraste e solte</p>
                </div>
                <p className="text-xs text-gray-500">CSV até 10MB</p>
                {file && (
                  <p className="text-sm font-medium text-gray-900 mt-2">{file.name}</p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pré-visualização (primeiras 10 linhas)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conta</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((t, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-gray-900">{t.customerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{t.customerPhone}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{t.customerAccount}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{t.transactionDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{t.transactionType}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Botão de Processar */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <Link
              href="/admin/bci"
              className="px-8 py-3.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Cancelar
            </Link>
            <button
              onClick={() => {
                console.log("🔍 [BCI UPLOAD] Botão clicado - Estado:", {
                  hasFile: !!file,
                  fileName: file?.name,
                  campaignId,
                  campaignIdType: typeof campaignId,
                  campaignIdLength: campaignId?.length,
                  processing,
                  disabled: !file || !campaignId || processing || campaignId === "",
                });
                // Validação no clique
                if (!file) {
                  setAlertModal({
                    isOpen: true,
                    title: "Arquivo não selecionado",
                    message: "Por favor, selecione um arquivo CSV primeiro para processar as transações.",
                    type: "warning",
                  });
                  return;
                }
                
                if (!campaignId || campaignId.trim() === "") {
                  setAlertModal({
                    isOpen: true,
                    title: "Campanha não selecionada",
                    message: "Por favor, selecione uma campanha primeiro para processar as transações.",
                    type: "warning",
                  });
                  return;
                }
                
                if (processing) {
                  return;
                }
                processTransactions();
              }}
              disabled={processing}
              className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              style={{ backgroundColor: processing ? BCI_COLORS.secondary : BCI_COLORS.primary }}
              title={processing ? "Processando..." : "Processar transações"}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </span>
              ) : (
                "Processar Transações"
              )}
            </button>
          </div>

          {/* Resultado do Processamento */}
          {processedResult && (
            <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: `${BCI_COLORS.success}10`, border: `2px solid ${BCI_COLORS.success}` }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: BCI_COLORS.success }}>
                Processamento Concluído!
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Total de Transações</p>
                  <p className="text-2xl font-bold" style={{ color: BCI_COLORS.primary }}>
                    {processedResult.totalTransactions.toLocaleString("pt-MZ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Clientes Únicos</p>
                  <p className="text-2xl font-bold" style={{ color: BCI_COLORS.primary }}>
                    {processedResult.uniqueCustomers.toLocaleString("pt-MZ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold" style={{ color: BCI_COLORS.primary }}>
                    {formatCurrency(processedResult.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Top 10 Clientes</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posição</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transações</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {processedResult.topCustomers.map((customer, idx) => (
                        <tr key={idx} className={idx < 3 ? "font-semibold" : ""}>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                idx === 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : idx === 1
                                  ? "bg-gray-100 text-gray-800"
                                  : idx === 2
                                  ? "bg-orange-100 text-orange-800"
                                  : "text-gray-500"
                              }`}
                            >
                              {idx + 1}º
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{customer.customerName}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{customer.customerPhone}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{customer.transactionCount}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(customer.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={handleSelectWinnersAndNotify}
                  disabled={!processedResult || processedResult.topCustomers.length === 0 || processing}
                  className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  style={{ backgroundColor: processing ? BCI_COLORS.secondary : BCI_COLORS.success }}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </span>
                  ) : (
                    "Selecionar Vencedores e Notificar por SMS"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal de Alerta */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => {
          setAlertModal({
            ...alertModal,
            isOpen: false,
          });
        }}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="OK"
        autoClose={alertModal.type === "success" ? 3000 : 0}
      />
    </div>
  );
}

