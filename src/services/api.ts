import axios from "axios";

// Usar variável de ambiente ou fallback para desenvolvimento
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://72.60.20.31:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Log da configuração da API apenas em desenvolvimento
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("🔧 API configurada com baseURL:", API_BASE_URL);
}

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  // Log apenas em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    const fullUrl = `${config.baseURL || ""}${config.url || ""}`;
    console.log(`📤 Requisição: ${config.method?.toUpperCase()} ${fullUrl}`);
  }
  
  // Verifica se está no cliente antes de acessar localStorage
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token && token !== "undefined" && token.trim() !== "") {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      const fullUrl = `${response.config.baseURL || ""}${response.config.url || ""}`;
      console.log(`✅ Resposta: ${response.config.method?.toUpperCase()} ${fullUrl} - Status: ${response.status}`);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const fullUrl = `${error.config?.baseURL || ""}${url || ""}`;
    const method = error.config?.method?.toUpperCase() || "GET";
    
    // Não logar erros 404 de endpoints opcionais (notificações, etc)
    const isOptionalEndpoint = url === "/notifications" || url?.includes("/notifications");
    
    if (!isOptionalEndpoint || status !== 404) {
      // Log detalhado do erro apenas se não for endpoint opcional com 404
      console.error(`❌ Erro na requisição: ${method} ${fullUrl}`);
      console.error(`   Status: ${status}`);
      if (error.response?.data) {
        console.error("   Dados do erro:", error.response.data);
      }
    }
    
    if (status === 401) {
      // Se receber 401 e não for login, limpar token e redirecionar
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        // Não limpar token se já estiver na página de login
        if (currentPath !== "/login" && url !== "/users/login" && !url?.includes("/login")) {
          // Limpar token inválido
          localStorage.removeItem("auth_token");
          // Redirecionar para login apenas se não estiver já lá
          if (currentPath !== "/login") {
            window.location.href = "/login";
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);