import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant, isUser, getUserRole } from "@/utils/roleUtils";

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

// Rotas que requerem admin
const ADMIN_ROUTES = [
  "/admin/merchants",
  "/admin/users",
  "/admin/campaigns",
  "/admin/friends",
  "/admin/customers", // Apenas admin pode ver clientes
  "/admin/establishments", // Apenas admin pode ver estabelecimentos
  "/admin/bci", // Dashboard BCI - apenas admin
];

// Rotas que requerem merchant
const MERCHANT_ROUTES = [
  "/merchant/dashboard",
  "/merchant/campaigns",
];

// Rotas que permitem admin, merchant e clientes (cada um vê seus próprios dados)
const SHARED_ROUTES = [
  "/admin/redemptions",
  "/admin/points",
  "/admin/transfers",
  "/admin/purchases",
];

// Rotas que permitem todas as roles (incluindo clientes)
const USER_ROUTES = [
  "/admin/documentation", // Guia de uso limitado para clientes
  "/campaigns", // Campanhas - clientes podem ver todas as campanhas
];

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const pathname = router.pathname;
    
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Se já está redirecionando, não fazer nada
    if (isRedirecting || redirectingRef.current) {
      return;
    }
    
    // Aguardar autenticação carregar completamente
    if (authLoading) {
      setIsChecking(true);
      return;
    }

    // Verificar se é rota pública
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    
    if (isPublicRoute) {
      setHasAccess(true);
      setIsChecking(false);
      return;
    }

    // Verificar token no localStorage primeiro (mais rápido)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      
      // Se não tem token, redirecionar para login imediatamente
      if (!token || token === "undefined" || token.trim() === "") {
        if (pathname !== "/login" && !isRedirecting && !redirectingRef.current) {
          redirectingRef.current = true;
          setIsRedirecting(true);
          router.replace("/login").catch(() => {
            // Se o router falhar, usar window.location como fallback
            window.location.href = "/login";
          }).finally(() => {
            // Resetar isRedirecting após um tempo para permitir novas verificações se necessário
            timeoutRef.current = setTimeout(() => {
              setIsRedirecting(false);
              redirectingRef.current = false;
            }, 2000);
          });
        }
        setHasAccess(false);
        setIsChecking(false);
        return;
      }
    }

    // Se não está autenticado mas tem token, aguardar um pouco para o AuthProvider verificar
    if (!isAuthenticated || !user) {
      // Se já está na rota de login, permitir acesso
      if (pathname === "/login") {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }
      
      // Se já passou tempo suficiente e ainda não está autenticado, redirecionar
      timeoutRef.current = setTimeout(() => {
        if (!isAuthenticated && pathname !== "/login" && !isRedirecting && !redirectingRef.current) {
          redirectingRef.current = true;
          setIsRedirecting(true);
          router.replace("/login").catch(() => {
            // Se o router falhar, usar window.location como fallback
            window.location.href = "/login";
          }).finally(() => {
            // Resetar isRedirecting após um tempo para permitir novas verificações se necessário
            timeoutRef.current = setTimeout(() => {
              setIsRedirecting(false);
              redirectingRef.current = false;
            }, 2000);
          });
        }
        setHasAccess(false);
        setIsChecking(false);
      }, 1000); // Aguardar 1 segundo para o AuthProvider verificar o token
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }

    // Verificar permissões baseadas na rota
    const userRole = getUserRole(user);
    const userIsAdmin = isAdmin(user);
    const userIsMerchant = isMerchant(user);
    const userIsUser = isUser(user); // Cliente (role user/cliente/customer)

    // Permitir acesso para todas as roles (admin, merchant, cliente, etc.)
    // A verificação de acesso específico por rota será feita abaixo

    // Debug: logar informações de verificação
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("🔍 [RouteGuard] Verificando acesso:", {
        pathname,
        userRole,
        userIsAdmin,
        userIsMerchant,
        user: user?.email || user?.username || "N/A",
      });
    }

    // Verificação especial para a rota raiz (/)
    // Se for merchant, redirecionar para /merchant/dashboard
    // Se for admin, permitir acesso (dashboard admin)
    // Se for cliente, permitir acesso (pode ter seu próprio dashboard no futuro)
    if (pathname === "/") {
      if (userIsMerchant && !userIsAdmin) {
        // Debug
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("🔄 [RouteGuard] Merchant acessando /, redirecionando para /merchant/dashboard");
        }
        // Redirecionar merchant para seu dashboard
        if (!isRedirecting && !redirectingRef.current) {
          redirectingRef.current = true;
          setIsRedirecting(true);
          router.replace("/merchant/dashboard").catch(() => {
            window.location.href = "/merchant/dashboard";
          }).finally(() => {
            // Resetar isRedirecting após um tempo
            timeoutRef.current = setTimeout(() => {
              setIsRedirecting(false);
              redirectingRef.current = false;
            }, 2000);
          });
        }
        setHasAccess(false);
        setIsChecking(false);
        return;
      }
      // Admin pode acessar / (dashboard admin)
      if (userIsAdmin) {
        setHasAccess(true);
        setIsChecking(false);
        // Debug
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("✅ [RouteGuard] Admin acessando /, permitindo acesso");
        }
        return;
      }
      
      // Cliente pode acessar / (dashboard cliente)
      if (userIsUser) {
        setHasAccess(true);
        setIsChecking(false);
        // Debug
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("✅ [RouteGuard] Cliente acessando /, permitindo acesso");
        }
        return;
      }
    }

    let accessGranted = false;

    // Verificar se é rota de admin
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));
    if (isAdminRoute) {
      if (userIsAdmin) {
        accessGranted = true;
        // Debug
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("✅ [RouteGuard] Acesso concedido - é admin para rota de admin");
        }
      } else {
        // Debug
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("❌ [RouteGuard] Acesso negado - não é admin, redirecionando para /merchant/dashboard");
        }
        // Redirecionar merchant para seu dashboard
        if (!isRedirecting && !redirectingRef.current) {
          redirectingRef.current = true;
          setIsRedirecting(true);
          router.replace("/merchant/dashboard").catch(() => {
            window.location.href = "/merchant/dashboard";
          }).finally(() => {
            // Resetar isRedirecting após um tempo
            timeoutRef.current = setTimeout(() => {
              setIsRedirecting(false);
              redirectingRef.current = false;
            }, 2000);
          });
        }
        setHasAccess(false);
        setIsChecking(false);
        return;
      }
    }

    // Verificar se é rota de merchant
    const isMerchantRoute = MERCHANT_ROUTES.some(route => pathname.startsWith(route));
    if (isMerchantRoute) {
      accessGranted = userIsMerchant;
      if (!accessGranted) {
        // Debug
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("❌ [RouteGuard] Acesso negado - não é merchant, redirecionando para /");
        }
        // Redirecionar admin para dashboard
        if (!isRedirecting && !redirectingRef.current) {
          redirectingRef.current = true;
          setIsRedirecting(true);
          router.replace("/").catch(() => {
            window.location.href = "/";
          }).finally(() => {
            // Resetar isRedirecting após um tempo
            timeoutRef.current = setTimeout(() => {
              setIsRedirecting(false);
              redirectingRef.current = false;
            }, 2000);
          });
        }
        setHasAccess(false);
        setIsChecking(false);
        return;
      }
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("✅ [RouteGuard] Acesso concedido - é merchant");
      }
    }

    // Verificar se é rota compartilhada (admin, merchant e clientes - cada um vê seus próprios dados)
    const isSharedRoute = SHARED_ROUTES.some(route => pathname.startsWith(route));
    if (isSharedRoute) {
      // Permitir acesso para todas as roles (admin, merchant e clientes)
      // Cada role verá apenas seus próprios dados na página
      accessGranted = userIsAdmin || userIsMerchant || userIsUser;
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("✅ [RouteGuard] Acesso concedido - rota compartilhada (admin, merchant e clientes)");
      }
    }

    // Verificar se é rota de usuário (clientes podem acessar)
    const isUserRoute = USER_ROUTES.some(route => pathname.startsWith(route));
    if (isUserRoute) {
      // Permitir acesso para todas as roles, mas com conteúdo limitado para clientes
      accessGranted = true;
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("✅ [RouteGuard] Acesso concedido - rota de usuário");
      }
    }

    // Se não é nenhuma rota específica, verificar se cliente pode acessar
    if (!isAdminRoute && !isMerchantRoute && !isSharedRoute && !isUserRoute) {
      // Clientes só podem acessar dashboard (/) e rotas de usuário
      if (userIsUser && pathname !== "/") {
        // Cliente tentando acessar rota não permitida - redirecionar
        if (!isRedirecting && !redirectingRef.current) {
          redirectingRef.current = true;
          setIsRedirecting(true);
          router.replace("/").catch(() => {
            window.location.href = "/";
          }).finally(() => {
            timeoutRef.current = setTimeout(() => {
              setIsRedirecting(false);
              redirectingRef.current = false;
            }, 2000);
          });
        }
        setHasAccess(false);
        setIsChecking(false);
        return;
      }
      accessGranted = true;
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("✅ [RouteGuard] Acesso concedido - rota não específica");
      }
    }

    setHasAccess(accessGranted);
    setIsChecking(false);
    
    // Cleanup: limpar timeout quando o componente for desmontado ou dependências mudarem
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname, router.asPath, user, isAuthenticated, authLoading, isRedirecting]);

  // Mostrar loading enquanto verifica
  if (authLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não tem acesso, não renderizar nada (já foi redirecionado)
  if (!hasAccess) {
    return null;
  }

  // Renderizar conteúdo se tiver acesso
  return <>{children}</>;
}

