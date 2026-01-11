import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant, getUserRole } from "@/utils/roleUtils";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "merchant" | "user")[];
  requireAdmin?: boolean;
  requireMerchant?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAdmin = false,
  requireMerchant = false,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const redirectingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Se já está redirecionando, não fazer nada
    if (redirectingRef.current) {
      return;
    }
    
    // Aguardar autenticação carregar
    if (authLoading) {
      setIsChecking(true);
      return;
    }

    // Se não está autenticado, redirecionar para login
    // Mas apenas se não estiver em uma rota pública (RouteGuard já cuida disso)
    if (!isAuthenticated || !user) {
      const currentPath = router.pathname;
      const isPublicRoute = currentPath === "/login" || currentPath === "/register" || currentPath === "/forgot-password";
      
      // Se já está na rota de login, permitir acesso (RouteGuard já cuida disso)
      if (currentPath === "/login") {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }
      
      // Se não é rota pública e não está redirecionando, redirecionar
      if (!isPublicRoute && !redirectingRef.current) {
        redirectingRef.current = true;
        router.replace("/login").catch(() => {
          window.location.href = "/login";
        }).finally(() => {
          // Resetar redirectingRef após um tempo
          timeoutRef.current = setTimeout(() => {
            redirectingRef.current = false;
          }, 2000);
        });
      }
      setIsChecking(false);
      return;
    }

    // Verificar permissões
    const userRole = getUserRole(user);
    const userIsAdmin = isAdmin(user);
    const userIsMerchant = isMerchant(user);

    // Permitir acesso para todas as roles (admin, merchant, cliente, etc.)
    // A verificação de acesso específico por rota será feita abaixo

    let accessGranted = false;

    // Verificar se requer admin
    if (requireAdmin) {
      accessGranted = userIsAdmin;
    }
    // Verificar se requer merchant
    else if (requireMerchant) {
      accessGranted = userIsMerchant;
    }
    // Verificar allowedRoles
    else if (allowedRoles && allowedRoles.length > 0) {
      accessGranted = allowedRoles.some((role) => {
        if (role === "admin") return userIsAdmin;
        if (role === "merchant") return userIsMerchant;
        if (role === "user") return !userIsAdmin && !userIsMerchant;
        return false;
      });
    }
    // Se não especificou nenhuma restrição, permitir acesso
    else {
      accessGranted = true;
    }

    setHasAccess(accessGranted);
    setIsChecking(false);

    // Se não tem acesso, redirecionar
    if (!accessGranted && !redirectingRef.current) {
      const redirectPath = redirectTo || (userIsMerchant ? "/merchant/dashboard" : "/");
      if (router.pathname !== redirectPath) {
        redirectingRef.current = true;
        router.replace(redirectPath).catch(() => {
          window.location.href = redirectPath;
        }).finally(() => {
          // Resetar redirectingRef após um tempo
          timeoutRef.current = setTimeout(() => {
            redirectingRef.current = false;
          }, 2000);
        });
      }
    }
    
    // Cleanup: limpar timeout quando o componente for desmontado ou dependências mudarem
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [user, isAuthenticated, authLoading, requireAdmin, requireMerchant, allowedRoles, redirectTo, router.pathname, router.asPath]);

  // Mostrar loading enquanto verifica
  if (authLoading || isChecking) {
    return (
      <div className="relative p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Verificando permissões...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se não está autenticado, não renderizar nada (será redirecionado)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Se não tem acesso, mostrar mensagem de acesso negado
  if (!hasAccess) {
    return (
      <div className="relative p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Acesso negado.</p>
            <p className="text-sm text-gray-400">
              Você não tem permissão para acessar esta página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar conteúdo se tiver acesso
  return <>{children}</>;
}


