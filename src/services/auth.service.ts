import { api } from "./api";

// A API do backend usa um identificador (por exemplo username, BI, telefone) em vez de email.
export interface LoginCredentials {
  identifier: string; // pode ser username, BI (Bilhete de Identidade), telefone etc.
  password: string;
}

export interface User {
  id: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  bi?: string | null;
  role?: string | { id?: number; name?: string; description?: string; [key: string]: any };
  isActive?: boolean;
  lastLogin?: string | null;
  points?: number;
  level?: string;
  permissions?: any;
  [key: string]: any; // Permite campos adicionais do backend
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // O backend espera 'username' e 'password'
    // O username pode ser: username, email, BI ou telefone
    const payload = {
      username: credentials.identifier,
      password: credentials.password,
    };

    try {
      const response = await api.post("/users/login", payload);
      
      // Nova estrutura do backend: { success: true, data: { user: {...}, token: "..." } }
      const responseData = response.data?.data || {};
      const token = 
        responseData.token ||
        response.data?.token || 
        response.data?.data?.token ||
        response.data?.authorization?.value?.replace("Bearer ", "") ||
        response.data?.authorization?.token;
      
      if (!token) {
        throw new Error("Token não encontrado na resposta do servidor");
      }
      
      // Extrair user da nova estrutura
      const user = responseData.user || response.data?.user || response.data?.data?.user || {};
      
      // Retornar com o token correto
      return {
        token: token,
        user: user
      };
    } catch (err: any) {
      // Normaliza a mensagem de erro para facilitar o tratamento na UI
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao efectuar o login";
      
      // Detectar erros de rede
      if (err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK") {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (data) {
        // Tentar extrair mensagem de diferentes estruturas possíveis
        // Estrutura 1: { error: { message: "...", ... } }
        if (data.error && typeof data.error === "object") {
          // Se error.message é uma string JSON aninhada, tentar parsear
          if (typeof data.error.message === "string" && data.error.message.startsWith("{")) {
            try {
              const parsed = JSON.parse(data.error.message);
              message = parsed.error || parsed.message || data.error.message;
            } catch {
              message = data.error.message;
            }
          } else {
            message = data.error.message || data.error.error || data.error;
          }
        }
        // Estrutura 2: { message: "..." }
        else if (data.message) {
          // Se message é uma string JSON aninhada, tentar parsear
          if (typeof data.message === "string" && data.message.startsWith("{")) {
            try {
              const parsed = JSON.parse(data.message);
              message = parsed.error || parsed.message || data.message;
            } catch {
              message = data.message;
            }
          } else {
            message = data.message;
          }
        }
        // Estrutura 3: { error: "..." } (string direta)
        else if (data.error) {
          message = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        }
        // Fallback: tentar extrair de qualquer lugar
        else {
          message = data.error || data.errors || JSON.stringify(data);
        }
      } else if (err?.message) {
        message = err.message;
      }

      const finalError = new Error(message);
      // @ts-ignore attach status for more context if needed
      finalError.status = _status;

      // Tenta ler header Retry-After (pode ser em segundos ou em formato de data)
      const headers = err?.response?.headers;
      const retryHeader = headers?.["retry-after"] || headers?.["Retry-After"];
      if (retryHeader) {
        let ms: number | null = null;
        // se for número em segundos
        if (/^\d+$/.test(String(retryHeader).trim())) {
          ms = parseInt(String(retryHeader).trim(), 10) * 1000;
        } else {
          // tenta parsear como data HTTP
          const then = Date.parse(String(retryHeader));
          if (!isNaN(then)) ms = then - Date.now();
        }
        if (ms && ms > 0) {
          // @ts-ignore attach retryAfter ms
          finalError.retryAfter = ms;
        }
      }

      throw finalError;
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<any>("/users/me");
      
      // Nova estrutura do backend: { success: true, data: { id, username, profile, wallet, friends, ... } }
      const userData = response.data?.data || response.data || {};
      
      // Normalizar para o formato esperado pelo frontend
      return {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: userData.fullName,
        phone: userData.phone,
        bi: userData.bi,
        isActive: userData.isActive,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        profile: userData.profile,
        wallet: userData.wallet,
        role: userData.role,
        permissions: userData.permissions,
        friends: userData.friends,
        friend_requests: userData.friend_requests,
        recent_transfers: userData.recent_transfers,
        recent_transactions: userData.recent_transactions,
        recent_purchases: userData.recent_purchases,
        statistics: userData.statistics,
        // Dados de pontos do wallet
        points: userData.wallet?.points || userData.profile?.points || 0,
        level: userData.profile?.level || "bronze",
        balance: userData.wallet?.balance || 0,
        ...userData
      } as User;
    } catch (error: any) {
      // Detectar erros de rede
      const isNetworkError = error.isNetworkError || error.message === "Network Error" || error.code === "ERR_NETWORK";
      
      // Se o endpoint /users/me não existir ou der erro 500/404,
      // tenta usar o token do localStorage para construir um usuário básico
      // Se é erro 404 ou 500, assume que o token é válido mas o endpoint tem problema
      const _status = error?.response?.status;
      if (isNetworkError || _status === 500 || _status === 404) {
        if (isNetworkError) {
          // Não logar erro de rede para reduzir console noise (já logado no interceptor)
        } else {
          console.warn(`Endpoint /users/me retornou ${_status}, assumindo token válido`);
        }
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("auth_token");
          if (token && token !== "undefined") {
            // Token existe, assumimos que está autenticado
            // Retorna um usuário genérico baseado no token
            return {
              id: 0,
              name: "Usuário",
              email: undefined,
            } as User;
          }
        }
      }
      
      // Para erro 401/403, re-lança o erro para que o AuthContext remova o token
      // Para outros erros também re-lança, mas o AuthContext tratará apropriadamente
      throw error;
    }
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  },

  /**
   * Solicitar recuperação de senha
   * POST /auth/forgot-password
   */
  async forgotPassword(emailOrPhone: { email?: string; phone?: string }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post("/auth/forgot-password", emailOrPhone);
      return {
        success: response.data?.success || true,
        message: response.data?.message || "Se o usuário existir e tiver telefone cadastrado, um código OTP será enviado",
      };
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao solicitar recuperação de senha";
      
      if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  /**
   * Redefinir senha com código OTP
   * POST /auth/reset-password
   */
  async resetPassword(phone: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post("/auth/reset-password", {
        phone,
        code,
        newPassword,
      });
      return {
        success: response.data?.success || true,
        message: response.data?.message || "Senha alterada com sucesso",
      };
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao redefinir senha";
      
      if (_status === 400) {
        message = data?.message || data?.error || "Código OTP inválido ou expirado";
      } else if (data?.message || data?.error) {
        message = data.message || data.error || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },
};