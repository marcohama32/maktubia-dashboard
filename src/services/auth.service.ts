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
      
      // Verificar se o token está em diferentes campos e estruturas
      const token = 
        response.data?.token || 
        response.data?.accessToken || 
        response.data?.access_token ||
        response.data?.authorization?.token ||
        response.data?.authorization?.accessToken ||
        response.data?.authorization?.access_token ||
        response.data?.data?.token ||
        response.data?.data?.accessToken ||
        response.data?.data?.access_token ||
        response.data?.authorization?.bearer ||
        response.data?.authorization?.bearerToken;
      
      // Também verificar o objeto authorization completo
      if (!token && response.data?.authorization) {
        console.log("🔍 Explorando objeto authorization:", response.data.authorization);
        console.log("🔍 Chaves de authorization:", Object.keys(response.data.authorization));
      }
      
      if (!token) {
        throw new Error("Token não encontrado na resposta do servidor");
      }
      
      // Extrair user da resposta (pode estar em data ou diretamente)
      let user = response.data?.user || response.data?.data?.user || response.data?.data || {};
      
      // Garantir que o user tenha a estrutura correta mesmo se vier vazio
      if (!user || Object.keys(user).length === 0) {
        user = {};
      }
      
      // Retornar com o token correto
      return {
        token: token,
        user: user
      };
    } catch (err: any) {
      // Normaliza a mensagem de erro para facilitar o tratamento na UI
      const status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao efectuar o login";
      if (data) {
        // Se a API retornar { message } ou { errors }, tenta extrair
        message = data.message || data.error || JSON.stringify(data) || message;
      } else if (err?.message) {
        message = err.message;
      }

      const finalError = new Error(message);
      // @ts-ignore attach status for more context if needed
      finalError.status = status;

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
      
      // O backend pode retornar { success: true, data: {...} } ou diretamente {...}
      const userData = response.data?.data || response.data || {};
      
      return userData as User;
    } catch (error: any) {
      // Se o endpoint /users/me não existir ou der erro 500/404,
      // tenta usar o token do localStorage para construir um usuário básico
      // Se é erro 404 ou 500, assume que o token é válido mas o endpoint tem problema
      const _status = error?.response?.status;
      if (_status === 500 || _status === 404) {
        console.warn(`Endpoint /users/me retornou ${_status}, assumindo token válido`);
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
  }
};