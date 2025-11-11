import axios from "axios";

// Em produção (Vercel HTTPS), usar proxy para evitar Mixed Content
// Em desenvolvimento, usar API direta
const getApiBaseUrl = () => {
  // Se estiver em produção (HTTPS) e a API configurada for HTTP, usar proxy
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    (process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("http://") ||
      !process.env.NEXT_PUBLIC_API_BASE_URL)
  ) {
    // Usar proxy via Vercel rewrites (/api/proxy -> http://72.60.20.31:8000/api)
    return "/api/proxy";
  }
  // Caso contrário, usar API direta
  // Em desenvolvimento, FORÇAR localhost mesmo se .env.local estiver configurado
  if (process.env.NODE_ENV === "development" || 
      (typeof window !== "undefined" && window.location.hostname === "localhost")) {
    return "http://localhost:8000/api";
  }
  // Em produção, usar API remota ou a configurada no .env
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://72.60.20.31:8000/api";
};

export const API_BASE_URL = getApiBaseUrl();

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
  // Log apenas em desenvolvimento (mas não para requisições que sabemos que vão falhar)
  // Verificar se já tivemos erros de rede recentemente
  if (process.env.NODE_ENV === "development") {
    const hasRecentNetworkError = (window as any).__networkErrorLogged;
    if (!hasRecentNetworkError) {
      const fullUrl = `${config.baseURL || ""}${config.url || ""}`;
      console.log(`📤 Requisição: ${config.method?.toUpperCase()} ${fullUrl}`);
    }
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
    const _status = error.response?.status;
    const url = error.config?.url;
    const fullUrl = `${error.config?.baseURL || ""}${url || ""}`;
    const method = error.config?.method?.toUpperCase() || "GET";
    
    // Detectar erros de rede (backend não disponível)
    const isNetworkError = !error.response && (
      error.message === "Network Error" || 
      error.code === "ERR_NETWORK" ||
      error.message?.includes("ERR_CONNECTION_REFUSED") ||
      error.message?.includes("Failed to fetch")
    );
    
    // Não logar erros 404 de endpoints opcionais (notificações, etc)
    const isOptionalEndpoint = url === "/notifications" || url?.includes("/notifications");
    
    // Endpoints com fallback silencioso - não logar erros 500
    const isRolesEndpoint = url === "/roles" || url?.includes("/roles");
    const isServerError = _status === 500 || _status === 502 || _status === 503 || _status === 504;
    const shouldSuppressLog = isRolesEndpoint && isServerError;
    
    // Para erros de rede, não logar nada (apenas marcar o erro)
    // Os logs nativos do navegador (net::ERR_CONNECTION_REFUSED) não podem ser suprimidos
    if (isNetworkError) {
      // Marcar que tivemos erro de rede para suprimir logs futuros de requisição
      if (typeof window !== "undefined") {
        (window as any).__networkErrorLogged = true;
        // Reset após 10 segundos para permitir logs futuros se o backend voltar
        setTimeout(() => {
          (window as any).__networkErrorLogged = false;
        }, 10000);
      }
      // Adicionar flag de erro de rede no objeto de erro para serviços detectarem
      // Não logar nada aqui - apenas deixar que o navegador mostre os logs nativos
      error.isNetworkError = true;
      error.networkErrorMessage = "Servidor não disponível. Verifique se o backend está rodando.";
    } else if (!shouldSuppressLog && (!isOptionalEndpoint || _status !== 404)) {
      // Log detalhado do erro apenas se não for endpoint opcional com 404 ou endpoint com fallback silencioso
      console.error(`❌ Erro na requisição: ${method} ${fullUrl}`);
      console.error(`   Status: ${_status}`);
      if (error.response?.data) {
        console.error("   Dados do erro:", error.response.data);
      }
    }
    
    if (_status === 401) {
      // Se receber 401 e não for login, verificar se é um erro de autenticação real
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        // Não limpar token se já estiver na página de login
        if (currentPath !== "/login" && url !== "/users/login" && !url?.includes("/login")) {
          // Log para debug
          console.warn("⚠️ [API] Erro 401 recebido:", {
            url: fullUrl,
            currentPath,
            errorData: error.response?.data,
          });
          
          // Verificar se é um erro de permissão (403) ou autenticação (401)
          // Se for 401 em /users/me, pode ser token inválido
          // Se for 401 em outros endpoints, pode ser falta de permissão
          const isMeEndpoint = url === "/users/me" || url?.includes("/users/me");
          
          if (isMeEndpoint) {
            // Token inválido - limpar e redirecionar
            console.warn("⚠️ [API] Token inválido detectado em /users/me - limpando token");
            localStorage.removeItem("auth_token");
            if (currentPath !== "/login") {
              window.location.href = "/login";
            }
          } else {
            // Pode ser erro de permissão - não limpar token automaticamente
            // Deixar o componente tratar o erro
            console.warn("⚠️ [API] Erro 401 em endpoint não crítico - mantendo token");
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);