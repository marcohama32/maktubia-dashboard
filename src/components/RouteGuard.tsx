import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant, isUser, getUserRole } from "@/utils/roleUtils";

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

// Rotas que requerem admin (apenas merchants não podem acessar)
const ADMIN_ONLY_ROUTES = [
  "/admin/merchants",
  "/admin/friends",
];

// Rotas que admin e merchants podem acessar
const ADMIN_AND_MERCHANT_ROUTES = [
  "/admin/users",
];

// Rotas que requerem merchant
const MERCHANT_ROUTES = [
  "/merchant/dashboard",
  "/merchant/campaigns",
];

// Rotas que permitem admin, merchant e clientes (com restrições)
const SHARED_ROUTES = [
  "/admin/customers",
  "/admin/redemptions",
  "/admin/points",
  "/admin/transfers",
  "/admin/documentation",
  "/admin/purchases",
  "/admin/establishments",
  "/admin/campaigns", // Clientes podem ver campanhas públicas
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
  const accessGrantedRef = useRef(false); // Ref para rastrear se o acesso foi concedido

  useEffect(() => {
    const pathname = router.pathname;
    
    // Debug: início da verificação
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("🚀 [RouteGuard] Iniciando verificação:", {
        pathname,
        hasAccess,
        isAuthenticated,
        authLoading,
        user: user?.email || user?.username || "N/A",
        redirecting: redirectingRef.current,
      });
    }
    
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Resetar accessGrantedRef no início de cada verificação
    accessGrantedRef.current = false;
    
    // Se já está redirecionando, não fazer nada
    if (redirectingRef.current) {
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("⏸️ [RouteGuard] Já está redirecionando, ignorando verificação");
      }
      return;
    }
    
    // Se já tem acesso concedido para esta rota e o usuário está autenticado, verificar se ainda tem permissão
    // Não retornar imediatamente para garantir que a verificação de permissões seja feita
    // MAS: Se o acesso já foi concedido e o usuário está autenticado, pular verificações de token/timeout
    const accessAlreadyGranted = hasAccess && isAuthenticated && user;
    if (accessAlreadyGranted) {
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("✅ [RouteGuard] Acesso já concedido, mas verificando permissões novamente para garantir");
      }
      // Limpar qualquer timeout pendente quando o acesso já foi concedido
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Não retornar aqui - continuar para verificar permissões, mas pular verificações de autenticação
    }
    
    // Aguardar autenticação carregar completamente
    if (authLoading) {
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("⏳ [RouteGuard] Aguardando autenticação carregar...");
      }
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
    // Mas apenas se o usuário não estiver autenticado
    if (typeof window !== "undefined" && !isAuthenticated && !user) {
      const token = localStorage.getItem("auth_token");
      
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("🔑 [RouteGuard] Verificando token:", {
          pathname,
          hasToken: !!token,
          tokenValue: token ? "***" : "vazio",
          isAuthenticated,
          hasUser: !!user,
        });
      }
      
      // Se não tem token, redirecionar para login imediatamente
      if (!token || token === "undefined" || token.trim() === "") {
        if (pathname !== "/login" && !isRedirecting && !redirectingRef.current) {
          if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
            console.log("❌ [RouteGuard] Sem token e não autenticado, redirecionando para login");
          }
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
    // IMPORTANTE: Não executar esta lógica se o acesso já foi concedido e o usuário está autenticado
    if ((!isAuthenticated || !user) && !accessAlreadyGranted) {
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("⚠️ [RouteGuard] Usuário não autenticado ou não carregado:", {
          pathname,
          isAuthenticated,
          hasUser: !!user,
          hasAccess,
        });
      }
      
      // Se já está na rota de login, permitir acesso
      if (pathname === "/login") {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }
      
      // Se já tem acesso concedido (pode ter sido concedido em uma execução anterior), não redirecionar
      if (hasAccess) {
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("✅ [RouteGuard] Acesso já concedido anteriormente, não redirecionando");
        }
        return;
      }
      
      // Verificar se é uma rota que clientes podem acessar antes de redirecionar
      const clientAccessibleRoutesList = [
        "/admin/campaigns",
        "/admin/transfers",
        "/admin/establishments",
        "/admin/purchases",
        "/admin/documentation",
      ];
      const isClientAccessibleRoute = clientAccessibleRoutesList.some(route => pathname.startsWith(route));
      const isSharedRouteCheck = SHARED_ROUTES.some(route => pathname.startsWith(route));
      
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("🔍 [RouteGuard] Verificando rotas acessíveis:", {
          pathname,
          isClientAccessibleRoute,
          isSharedRouteCheck,
        });
      }
      
      // Se é uma rota acessível para clientes ou compartilhada, aguardar mais tempo para autenticação
      if (isClientAccessibleRoute || isSharedRouteCheck) {
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("⏳ [RouteGuard] Rota acessível para clientes, aguardando 3s para autenticação...");
        }
        // Aguardar mais tempo para o AuthProvider verificar (clientes podem demorar mais)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          const currentPath = router.pathname;
          
          // Verificar se o acesso já foi concedido usando a ref (sempre atualizada)
          if (accessGrantedRef.current) {
            if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
              console.log("✅ [RouteGuard] Timeout de 3s executado, mas acesso já foi concedido (via ref) - ignorando");
            }
            return;
          }
          
          // Verificar também o estado atual de hasAccess
          if (hasAccess) {
            if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
              console.log("✅ [RouteGuard] Timeout de 3s executado, mas acesso já foi concedido (via state) - ignorando");
            }
            return;
          }
          
          // Debug
          if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
            console.log("⏰ [RouteGuard] Timeout de 3s executado:", {
              currentPath,
              pathname,
              isAuthenticated,
              hasUser: !!user,
              hasAccess,
              accessGrantedRef: accessGrantedRef.current,
              redirecting: redirectingRef.current,
            });
          }
          
          // Verificar novamente se está autenticado agora
          if (isAuthenticated && user) {
            if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
              console.log("✅ [RouteGuard] Usuário autenticado durante timeout, não redirecionando");
            }
            return;
          }
          
          if (!isAuthenticated && !user && !hasAccess && currentPath === pathname && currentPath !== "/login" && !redirectingRef.current) {
            if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
              console.log("❌ [RouteGuard] Redirecionando para login após timeout (rota acessível para clientes)");
            }
            redirectingRef.current = true;
            setIsRedirecting(true);
            router.replace("/login").catch(() => {
              window.location.href = "/login";
            }).finally(() => {
              timeoutRef.current = setTimeout(() => {
                setIsRedirecting(false);
                redirectingRef.current = false;
              }, 2000);
            });
          }
          if (!hasAccess && (!isAuthenticated || !user)) {
            setHasAccess(false);
            setIsChecking(false);
          }
        }, 3000); // Aguardar 3 segundos para clientes
        return;
      }
      
      // Se já passou tempo suficiente e ainda não está autenticado, redirecionar
      // Mas apenas se não estiver em uma rota pública
      const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
      if (!isPublicRoute) {
        // Limpar timeout anterior se existir
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          // Verificar novamente antes de redirecionar (pode ter autenticado entretanto)
          // E também verificar se o acesso já foi concedido ou se a rota mudou
          const currentPath = router.pathname;
          const currentHasAccess = hasAccess; // Capturar valor atual de hasAccess
          
          // Verificar se é uma rota acessível para clientes antes de redirecionar
          const clientAccessibleRoutesList = [
            "/admin/campaigns",
            "/admin/transfers",
            "/admin/establishments",
            "/admin/purchases",
            "/admin/documentation",
          ];
          const isClientAccessibleRoute = clientAccessibleRoutesList.some(route => currentPath.startsWith(route));
          const isSharedRouteCheck = SHARED_ROUTES.some(route => currentPath.startsWith(route));
          
          // Se é uma rota acessível para clientes ou compartilhada, não redirecionar ainda
          // O usuário pode estar carregando - deixar a verificação de rotas compartilhadas decidir
          if (isClientAccessibleRoute || isSharedRouteCheck) {
            // Debug
            if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
              console.log("✅ [RouteGuard] Rota acessível para clientes, não redirecionando - deixando verificação de rotas compartilhadas processar");
            }
            // Não redirecionar - deixar a verificação de rotas compartilhadas processar
            return;
          }
          
          // Só redirecionar se:
          // 1. Ainda não está autenticado
          // 2. O acesso não foi concedido
          // 3. Ainda está na mesma rota (não mudou durante o timeout)
          // 4. Não está redirecionando
          // 5. Não é uma rota acessível para clientes
          if (!isAuthenticated && !user && !currentHasAccess && currentPath === pathname && currentPath !== "/login" && !redirectingRef.current && !isClientAccessibleRoute && !isSharedRouteCheck) {
            if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
              console.log("❌ [RouteGuard] Redirecionando para login após timeout (rota não acessível para clientes)");
            }
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
          // Só atualizar hasAccess se ainda não foi concedido e ainda não está autenticado
          if (!currentHasAccess && !isAuthenticated && !user) {
            setHasAccess(false);
            setIsChecking(false);
          }
        }, 2000); // Aguardar 2 segundos para o AuthProvider verificar o token
      }
      
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
    const userIsUser = isUser(user) || (userRole === "user" && !userIsAdmin && !userIsMerchant);
    
    // Debug
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("👤 [RouteGuard] Informações do usuário:", {
        pathname,
        userRole,
        userIsAdmin,
        userIsMerchant,
        userIsUser,
        user: user?.email || user?.username || "N/A",
      });
    }

    // Verificação especial para a rota raiz (/) - permitir todos os usuários autenticados
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
      // Admin e usuários comuns podem acessar / (dashboard)
      if (userIsAdmin || userIsUser) {
        setHasAccess(true);
        setIsChecking(false);
        // Debug
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("✅ [RouteGuard] Acesso concedido para /", {
            userRole,
            userIsAdmin,
            userIsUser,
          });
        }
        return;
      }
    }

    // Verificação para rotas específicas
    const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route));
    const isAdminAndMerchantRoute = ADMIN_AND_MERCHANT_ROUTES.some(route => pathname.startsWith(route));
    const isAdminRoute = isAdminOnlyRoute || isAdminAndMerchantRoute; // Para compatibilidade
    const isMerchantRoute = MERCHANT_ROUTES.some(route => pathname.startsWith(route));
    const isSharedRoute = SHARED_ROUTES.some(route => pathname.startsWith(route));
    
    // Debug: verificar classificação da rota
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      if (pathname.startsWith("/admin/users")) {
        console.log("🔍 [RouteGuard] Classificação da rota /admin/users:", {
          pathname,
          isAdminOnlyRoute,
          isAdminAndMerchantRoute,
          isAdminRoute,
          isMerchantRoute,
          isSharedRoute,
          userIsAdmin,
          userIsMerchant,
          userRole,
        });
      }
    }
    
    // Rotas que clientes podem acessar (visualização apenas)
    const CLIENT_ACCESSIBLE_ROUTES = [
      "/admin/campaigns", // Campanhas públicas
      "/admin/transfers", // Suas transferências
      "/admin/establishments", // Visualizar estabelecimentos
      "/admin/purchases", // Suas compras
      "/admin/documentation", // Guia de uso
    ];
    const isClientAccessibleRoute = CLIENT_ACCESSIBLE_ROUTES.some(route => pathname.startsWith(route));
    
    // Inicializar accessGranted
    let accessGranted: boolean | undefined = undefined;
    
    // Se for cliente e tentar acessar rota administrativa não permitida
    if (userIsUser && !userIsAdmin && !userIsMerchant) {
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("👤 [RouteGuard] Cliente detectado, verificando acesso:", {
          pathname,
          isClientAccessibleRoute,
          isSharedRoute,
          isAdminOnlyRoute,
          isAdminAndMerchantRoute,
          isMerchantRoute,
        });
      }
      
      // Permitir acesso a rotas específicas para clientes (incluindo rotas compartilhadas permitidas)
      if (isClientAccessibleRoute || isSharedRoute || pathname === "/") {
        // Verificar se é uma rota compartilhada permitida para clientes
        if (isSharedRoute) {
          // Debug
          if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
            console.log("✅ [RouteGuard] Cliente acessando rota compartilhada, verificando permissões abaixo");
          }
          // A verificação de rotas compartilhadas será feita mais abaixo
          // Por enquanto, apenas não bloquear aqui
        } else if (isClientAccessibleRoute || pathname === "/") {
          // Permitir acesso imediatamente para rotas específicas
          accessGranted = true;
          accessGrantedRef.current = true;
          setHasAccess(true);
          setIsChecking(false);
          // Limpar qualquer timeout pendente que possa redirecionar
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          // Debug
          if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
            console.log("✅ [RouteGuard] Acesso concedido - cliente acessando rota permitida:", {
              pathname,
              userRole,
              user: user?.email || user?.username || "N/A",
              isClientAccessibleRoute,
              isSharedRoute,
            });
          }
          return;
        }
      } else if (isAdminOnlyRoute || isAdminAndMerchantRoute || isMerchantRoute) {
        // Debug
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("❌ [RouteGuard] Acesso negado - cliente tentando acessar rota administrativa:", {
            pathname,
            userRole,
            user: user?.email || user?.username || "N/A",
          });
        }
        // Redirecionar cliente para dashboard
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
    }

    // Debug: logar informações de verificação
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("🔍 [RouteGuard] Verificando acesso:", {
        pathname,
        userRole,
        userIsAdmin,
        userIsMerchant,
        userIsUser,
        user: user?.email || user?.username || "N/A",
        accessGranted,
        isAdminOnlyRoute,
        isAdminAndMerchantRoute,
        isMerchantRoute,
        isSharedRoute,
      });
    }

    // Verificar se é rota de admin apenas (apenas admin pode acessar)
    if (isAdminOnlyRoute) {
      if (userIsAdmin) {
        accessGranted = true;
        accessGrantedRef.current = true;
        setHasAccess(true);
        setIsChecking(false);
        // Debug
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("✅ [RouteGuard] Acesso concedido - é admin para rota de admin apenas");
        }
        return;
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

    // Verificar se é rota que admin e merchants podem acessar
    if (isAdminAndMerchantRoute) {
      // Debug detalhado
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("🔍 [RouteGuard] Verificando rota admin/merchant:", {
          pathname,
          isAdminAndMerchantRoute,
          userIsAdmin,
          userIsMerchant,
          userRole,
          user: user?.email || user?.username || "N/A",
        });
      }
      
      if (userIsAdmin || userIsMerchant) {
        accessGranted = true;
        accessGrantedRef.current = true;
        setHasAccess(true);
        setIsChecking(false);
        // Limpar qualquer timeout pendente
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        // Debug
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("✅ [RouteGuard] Acesso concedido - admin ou merchant para rota compartilhada");
        }
        return;
      } else {
        // Debug
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("❌ [RouteGuard] Acesso negado - não é admin nem merchant:", {
            userIsAdmin,
            userIsMerchant,
            userRole,
            user: user?.email || user?.username || "N/A",
          });
        }
        // Redirecionar para dashboard
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
    }

    // Verificar se é rota de merchant (variável já definida acima)
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

    // Verificar se é rota compartilhada (variável já definida acima)
    // Mas apenas se o acesso ainda não foi concedido
    if (isSharedRoute) {
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("🔍 [RouteGuard] Verificando rota compartilhada:", {
          pathname,
          userIsUser,
          userIsAdmin,
          userIsMerchant,
          accessGranted,
        });
      }
      
      // Rotas compartilhadas que clientes podem acessar
      const clientAccessibleSharedRoutes = [
        "/admin/customers",
        "/admin/redemptions",
        "/admin/points",
        "/admin/transfers",
        "/admin/documentation",
        "/admin/purchases",
        "/admin/establishments",
        "/admin/campaigns", // Clientes podem ver campanhas públicas
      ];
      const isClientAccessibleSharedRoute = clientAccessibleSharedRoutes.some(route => pathname.startsWith(route));
      
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("🔍 [RouteGuard] Verificação de rota compartilhada:", {
          pathname,
          isClientAccessibleSharedRoute,
          userIsUser,
          userIsAdmin,
          userIsMerchant,
        });
      }
      
      // Clientes podem acessar algumas rotas compartilhadas (visualização apenas)
      if (userIsUser && !userIsAdmin && !userIsMerchant) {
        if (isClientAccessibleSharedRoute) {
          accessGranted = true;
          accessGrantedRef.current = true; // Marcar na ref que o acesso foi concedido
          setHasAccess(true);
          setIsChecking(false);
          // Limpar qualquer timeout pendente ANTES de conceder acesso
          if (timeoutRef.current) {
            if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
              console.log("🧹 [RouteGuard] Limpando timeout pendente antes de conceder acesso ao cliente");
            }
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          // Debug
          if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
            console.log("✅ [RouteGuard] Acesso concedido - cliente acessando rota compartilhada permitida");
          }
          return;
        } else {
          accessGranted = false;
          // Debug
          if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
            console.log("❌ [RouteGuard] Acesso negado - cliente tentando acessar rota compartilhada não permitida");
          }
        }
      } else {
        // Admin e merchant podem acessar todas as rotas compartilhadas
        accessGranted = userIsAdmin || userIsMerchant;
        if (accessGranted) {
          accessGrantedRef.current = true;
          setHasAccess(true);
          setIsChecking(false);
          // Limpar qualquer timeout pendente
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          // Debug
          if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
            console.log("✅ [RouteGuard] Acesso concedido - admin/merchant acessando rota compartilhada");
          }
          return;
        }
      }
      
      if (!accessGranted) {
        // Debug
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("❌ [RouteGuard] Acesso negado - não tem permissão para rota compartilhada, redirecionando para /");
        }
        if (!redirectingRef.current) {
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
        console.log("✅ [RouteGuard] Acesso concedido - rota compartilhada");
      }
      
      // Se accessGranted foi definido como true, garantir que hasAccess também seja true
      if (accessGranted) {
        accessGrantedRef.current = true;
        setHasAccess(true);
        setIsChecking(false);
        // Limpar qualquer timeout pendente
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }
    }

    // Se não é nenhuma rota específica, permitir acesso (pode ser rota pública ou dashboard)
    if (!isAdminOnlyRoute && !isAdminAndMerchantRoute && !isMerchantRoute && !isSharedRoute) {
      accessGranted = true;
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("✅ [RouteGuard] Acesso concedido - rota não específica");
      }
    }

    // Se accessGranted ainda não foi definido, definir como false por padrão
    if (accessGranted === undefined) {
      accessGranted = false;
    }

    // Debug final
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("🏁 [RouteGuard] Finalizando verificação:", {
        pathname,
        accessGranted,
        userRole,
        userIsAdmin,
        userIsMerchant,
        userIsUser,
        isAdminOnlyRoute,
        isAdminAndMerchantRoute,
        isMerchantRoute,
        isSharedRoute,
        hasAccessAntes: hasAccess,
        isAuthenticated,
        hasUser: !!user,
      });
    }

    // Se accessGranted é true, garantir que hasAccess seja true e limpar timeouts
    if (accessGranted) {
      accessGrantedRef.current = true;
      setHasAccess(true);
      setIsChecking(false);
      
      // Limpar qualquer timeout pendente quando o acesso é concedido
      if (timeoutRef.current) {
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.log("🧹 [RouteGuard] Limpando timeout pendente - acesso concedido");
        }
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("✅ [RouteGuard] Acesso final concedido e timeouts limpos");
      }
    } else {
      setHasAccess(false);
      setIsChecking(false);
      
      // Debug
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("❌ [RouteGuard] Acesso negado no final da verificação");
      }
    }
    
    // Cleanup: limpar timeout quando o componente for desmontado ou dependências mudarem
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname, router.asPath, user, isAuthenticated, authLoading]);

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

