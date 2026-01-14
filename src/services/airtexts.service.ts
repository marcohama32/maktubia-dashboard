import { api } from "./api";

/**
 * Serviço Airtexts
 * Integração com API do Airtexts para envio de SMS
 */

export interface AirtextsConfig {
  apiKey: string;
  apiSecret: string;
}

export interface SendSMSRequest {
  to: string;
  from: string;
  message: string;
}

export interface SendSMSResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

export interface SendOTPRequest {
  phone: string;
  template?: string;
}

export interface SendOTPResponse {
  success: boolean;
  code?: string;
  messageId?: string;
  status?: string;
  error?: string;
}

export interface VerifyOTPRequest {
  phone: string;
  code: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  verified?: boolean;
  error?: string;
}

class AirtextsService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string = "https://api.airtexts.com";

  constructor(apiKey?: string, apiSecret?: string) {
    // Pegar credenciais do localStorage ou variáveis de ambiente
    if (typeof window !== "undefined") {
      this.apiKey = apiKey || localStorage.getItem("airtexts_api_key") || "";
      this.apiSecret = apiSecret || localStorage.getItem("airtexts_api_secret") || "";
    } else {
      this.apiKey = apiKey || process.env.NEXT_PUBLIC_AIRTEXTS_API_KEY || "";
      this.apiSecret = apiSecret || process.env.NEXT_PUBLIC_AIRTEXTS_API_SECRET || "";
    }
  }

  /**
   * Configurar credenciais do Airtexts
   */
  setCredentials(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    if (typeof window !== "undefined") {
      localStorage.setItem("airtexts_api_key", apiKey);
      localStorage.setItem("airtexts_api_secret", apiSecret);
    }
  }

  /**
   * Enviar SMS
   */
  async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
    try {
      // Sempre usar o backend como proxy (mais seguro)
      const response = await api.post("/bci/sms/send", request);
      return {
        success: response.data?.success || false,
        messageId: response.data?.data?.messageId,
        status: response.data?.data?.status,
        error: response.data?.error,
      };
    } catch (err: any) {
      console.error("Erro ao enviar SMS via Airtexts:", err);
      return {
        success: false,
        error: err.message || "Erro ao enviar SMS",
      };
    }
  }

  /**
   * Enviar SMS em lote
   */
  async sendBulkSMS(messages: SendSMSRequest[]): Promise<SendSMSResponse[]> {
    try {
      // Usar endpoint de bulk do backend
      const response = await api.post("/bci/sms/bulk", { messages });
      
      if (response.data?.success) {
        // Retornar array de resultados
        return response.data.data.results.map((r: any) => ({
          success: r.success || false,
          messageId: r.messageId,
          status: r.status,
          error: r.error,
        }));
      } else {
        // Se falhou completamente, retornar array com erro
        return messages.map(() => ({
          success: false,
          error: response.data?.error || "Erro ao enviar SMS em lote",
        }));
      }
    } catch (err: any) {
      console.error("Erro ao enviar SMS em lote via backend:", err);
      return messages.map(() => ({
        success: false,
        error: err.message || "Erro ao enviar SMS em lote",
      }));
    }
  }

  /**
   * Enviar OTP
   */
  async sendOTP(request: SendOTPRequest): Promise<SendOTPResponse> {
    try {
      // Sempre usar o backend como proxy
      const response = await api.post("/bci/otp/send", request);
      return {
        success: response.data?.success || false,
        code: response.data?.data?.code,
        messageId: response.data?.data?.messageId,
        status: response.data?.data?.status,
        error: response.data?.error,
      };
    } catch (err: any) {
      console.error("Erro ao enviar OTP via Airtexts:", err);
      return {
        success: false,
        error: err.message || "Erro ao enviar OTP",
      };
    }
  }

  /**
   * Verificar OTP
   */
  async verifyOTP(request: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    try {
      // Sempre usar o backend como proxy
      const response = await api.post("/bci/otp/verify", request);
      return {
        success: response.data?.success || false,
        verified: response.data?.data?.verified || false,
        error: response.data?.error,
      };
    } catch (err: any) {
      console.error("Erro ao verificar OTP via Airtexts:", err);
      return {
        success: false,
        verified: false,
        error: err.message || "Erro ao verificar OTP",
      };
    }
  }
}

export const airtextsService = new AirtextsService();


