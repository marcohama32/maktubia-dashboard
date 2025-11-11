import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { authService, User } from "@/services/auth.service";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  // Agora aceita identifier em vez de email
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => { throw new Error("AuthProvider não está configurado"); },
  logout: () => {},
  loading: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false); // Não bloquear renderização inicial
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      // Verifica se está no cliente antes de acessar localStorage
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      // Inicializar verificação de forma não bloqueante
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => {
          performAuth();
        }, { timeout: 100 });
      } else {
        setTimeout(() => {
          performAuth();
        }, 50);
      }
    };

    const performAuth = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("auth_token");
        
        // Se não tem token, já pode parar aqui
        if (!token || token === "undefined" || token.trim() === "") {
          setLoading(false);
          return;
        }

        // Tem token, vamos verificar se é válido
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error: any) {
          const status = error?.response?.status;
          const isNetworkError = error.isNetworkError || error.message === "Network Error" || error.code === "ERR_NETWORK";
          
          // Não logar erros de rede (já logado no interceptor do axios)
          if (!isNetworkError) {
            console.warn("Erro ao verificar token:", status, error?.message);
          }
          
          if (status === 401) {
            // Verificar se é erro em /users/me (token inválido) ou outro endpoint (permissão)
            const url = error?.config?.url || "";
            const isMeEndpoint = url.includes("/users/me");
            
            if (isMeEndpoint) {
              // Token inválido - limpar e deslogar
              console.warn("⚠️ [AUTH] Token inválido detectado em /users/me");
              localStorage.removeItem("auth_token");
              setIsAuthenticated(false);
              setUser(null);
              // Não redirecionar aqui, deixar o interceptor do axios fazer isso
            } else {
              // Pode ser erro de permissão em outro endpoint - não deslogar
              console.warn("⚠️ [AUTH] Erro 401 em endpoint não crítico - mantendo autenticação");
              // Manter autenticação baseada no token existente
              setIsAuthenticated(true);
            }
          } else if (status === 403) {
            // Erro de permissão - não deslogar, apenas avisar
            console.warn("⚠️ [AUTH] Erro 403 - sem permissão, mas mantendo autenticação");
            // Manter autenticação - o usuário pode não ter permissão para aquele endpoint específico
            setIsAuthenticated(true);
          } else {
            // Outros erros (500, 404, rede, etc) - assume que o token pode ser válido
            // Permite que o usuário continue usando a aplicação
            // O token pode estar válido, só o endpoint que está com problema
            if (!isNetworkError) {
              console.warn(`Erro ${status} - assumindo token válido por enquanto`);
            }
            setIsAuthenticated(true);
            // Define um usuário genérico para permitir que a aplicação continue
            setUser({
              id: 0,
              name: "Usuário",
              email: undefined,
            });
            // Não removemos o token, mantemos a autenticação baseada no token existente
          }
        }
      } catch (error) {
        // Erro ao acessar localStorage ou outro erro inesperado
        console.error("Erro na inicialização da autenticação:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const response = await authService.login({ identifier, password });
      
      // Salvar o token no localStorage
      if (response.token) {
        localStorage.setItem("auth_token", response.token);
      }
      
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    // Limpar estado primeiro
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    
    // Usar window.location para garantir um redirecionamento limpo
    // Isso evita conflitos com RouteGuard e ProtectedRoute
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};