import { api } from "./api";

/**
 * Serviço BCI
 * Gerencia campanhas e processamento de transações do BCI
 */

export interface BCICampaign {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive" | "completed";
  prizePlaces: number;
  prizes: Array<{ position: number; description: string; value: string }>;
  totalParticipants?: number;
  totalTransactions?: number;
  totalAmount?: number;
  winners?: BCWinner[];
}

export interface BCWinner {
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

export interface Transaction {
  customerName: string;
  customerPhone: string;
  customerAccount: string;
  transactionDate: string;
  transactionType: "POS" | "ATM" | "ONLINE";
  amount: number;
  merchantName?: string;
  location?: string;
}

export interface ProcessTransactionsRequest {
  campaignId: string;
  transactions: Transaction[];
}

export interface ProcessTransactionsResponse {
  success: boolean;
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
  winners?: BCWinner[];
  message?: string;
}

export interface NotifyWinnersRequest {
  campaignId: string;
  winnerIds?: string[];
}

class BCIService {
  /**
   * Listar todas as campanhas BCI
   */
  async getCampaigns(): Promise<BCICampaign[]> {
    try {
      const response = await api.get("/bci/campaigns");
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return response.data?.data || [];
    } catch (err: any) {
      console.error("Erro ao buscar campanhas BCI:", err);
      throw err;
    }
  }

  /**
   * Obter detalhes de uma campanha
   */
  async getCampaignById(id: string): Promise<BCICampaign> {
    try {
      const response = await api.get(`/bci/campaigns/${id}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return response.data?.data || response.data;
    } catch (err: any) {
      console.error("Erro ao buscar campanha BCI:", err);
      throw err;
    }
  }

  /**
   * Criar nova campanha
   */
  async createCampaign(campaign: Omit<BCICampaign, "id">): Promise<BCICampaign> {
    try {
      const response = await api.post("/bci/campaigns", campaign);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return response.data?.data || response.data;
    } catch (err: any) {
      console.error("Erro ao criar campanha BCI:", err);
      throw err;
    }
  }

  /**
   * Processar transações e selecionar vencedores
   */
  async processTransactions(request: ProcessTransactionsRequest): Promise<ProcessTransactionsResponse> {
    try {
      const response = await api.post("/bci/transactions/process", request);
      if (response.data?.success) {
        return response.data;
      }
      return response.data;
    } catch (err: any) {
      console.error("Erro ao processar transações:", err);
      throw err;
    }
  }

  /**
   * Notificar vencedores por SMS
   */
  async notifyWinners(request: NotifyWinnersRequest): Promise<{ success: boolean; message: string; notified: number }> {
    try {
      const response = await api.post("/bci/winners/notify", request);
      if (response.data?.success) {
        return response.data;
      }
      return response.data;
    } catch (err: any) {
      console.error("Erro ao notificar vencedores:", err);
      throw err;
    }
  }

  /**
   * Upload e processar CSV de transações
   */
  async uploadCSV(campaignId: string, file: File): Promise<ProcessTransactionsResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("campaignId", campaignId);

      const response = await api.post("/bci/transactions/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        return response.data;
      }
      return response.data;
    } catch (err: any) {
      console.error("Erro ao fazer upload de CSV:", err);
      throw err;
    }
  }
}

export const bciService = new BCIService();

