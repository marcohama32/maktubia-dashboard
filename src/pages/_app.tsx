import Head from "next/head";
import React, { useEffect } from "react";
import "tailwindcss/tailwind.css";
import { AppProps } from "next/app";

// Adicionar estilos para animação do banner de notificações
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  if (!document.head.querySelector('style[data-notification-banner]')) {
    style.setAttribute('data-notification-banner', 'true');
    document.head.appendChild(style);
  }
}
import { DashboardLayout } from "@/dashboard/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteGuard } from "@/components/RouteGuard";
import { NotificationToast } from "@/components/NotificationToast";
import { NotificationPermissionBanner } from "@/components/NotificationPermissionBanner";
import { useRouter } from "next/router";

// Pages that should skip the dashboard layout
const NO_AUTH_PAGES = ["/login", "/register", "/forgot-password"];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Check if current page should skip dashboard layout
  // First try to read from exported property, then check route path
  const componentNoAuth = (Component as any).noAuth === true;
  const pathname = router?.pathname || "";
  const isNoAuthRoute = NO_AUTH_PAGES.includes(pathname);
  const noAuth = componentNoAuth || isNoAuthRoute;
  
  // Log de eventos de rota do Next.js (registrar apenas uma vez)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleRouteChangeStart = (url: string) => {
      const routeStartTime = performance.now();
      console.log(`🔄 [ROUTER] Início da mudança de rota: ${url}`);
      console.log(`   ⏱️  Tempo: ${routeStartTime.toFixed(2)}ms`);
      
      // Verificar se há dados de navegação salvos
      const navStartStr = sessionStorage.getItem("navigation_start");
      if (navStartStr) {
        try {
          const navStart = JSON.parse(navStartStr);
          const timeToRouteChange = routeStartTime - navStart.clickTime;
          console.log(`   📍 Tempo desde o clique: ${timeToRouteChange.toFixed(2)}ms`);
        } catch (err) {
          // Ignorar erro
        }
      }
      
      window.performance.mark(`route-start-${url}`);
    };
    
    const handleRouteChangeComplete = (url: string) => {
      const routeCompleteTime = performance.now();
      window.performance.mark(`route-complete-${url}`);
      
      // Verificar se há dados de navegação salvos
      const navStartStr = sessionStorage.getItem("navigation_start");
      let totalNavigationTime = 0;
      
      if (navStartStr) {
        try {
          const navStart = JSON.parse(navStartStr);
          totalNavigationTime = routeCompleteTime - navStart.clickTime;
        } catch (err) {
          // Ignorar erro
        }
      }
      
      try {
        window.performance.measure(`route-duration-${url}`, `route-start-${url}`, `route-complete-${url}`);
        const measure = window.performance.getEntriesByName(`route-duration-${url}`)[0];
        const routeDuration = measure?.duration || 0;
        
        console.log(`✅ [ROUTER] Rota completa: ${url}`);
        console.log(`   ⏱️  Duração da mudança de rota: ${routeDuration.toFixed(2)}ms`);
        
        if (totalNavigationTime > 0) {
          console.log(`   ⏱️  Tempo total desde o clique: ${totalNavigationTime.toFixed(2)}ms`);
        }
        
        // Log final de navegação quando a rota completa
        if (navStartStr) {
          try {
            const navStart = JSON.parse(navStartStr);
            console.log(`✅ [NAVEGACAO] Página carregada: ${url}`);
            console.log("   📊 Detalhes da navegação:");
            console.log(`      🎯 Link original: ${navStart.link}`);
            console.log(`      📄 Página atual: ${url}`);
            console.log(`      ⏱️  Tempo total de navegação: ${totalNavigationTime.toFixed(2)}ms`);
            
            // Limpar dados após mostrar o log
            setTimeout(() => {
              sessionStorage.removeItem("navigation_start");
            }, 100);
          } catch (err) {
            // Ignorar erro
          }
        }
      } catch (err) {
        console.log(`✅ [ROUTER] Rota completa: ${url}`);
        if (totalNavigationTime > 0) {
          console.log(`   ⏱️  Tempo total estimado: ${totalNavigationTime.toFixed(2)}ms`);
        }
      }
    };
    
    const handleRouteChangeError = (err: any, url: string) => {
      console.error(`❌ [ROUTER] Erro na rota: ${url}`, err);
    };
    
    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    router.events.on("routeChangeError", handleRouteChangeError);
    
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
      router.events.off("routeChangeError", handleRouteChangeError);
    };
  }, [router]); // Registrar apenas uma vez quando router é disponibilizado
  
  // Log inicial da página atual quando pathname muda
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const navStartStr = sessionStorage.getItem("navigation_start");
    if (navStartStr) {
      try {
        const navStart = JSON.parse(navStartStr);
        const currentTime = performance.now();
        const totalTime = currentTime - navStart.clickTime;
        
        // Só mostrar se ainda não foi mostrado pelo routeChangeComplete
        console.log(`📄 [PAGE] Página atual renderizada: ${pathname}`);
        console.log(`   ⏱️  Tempo desde o clique: ${totalTime.toFixed(2)}ms`);
      } catch (err) {
        // Ignorar erro
      }
    }
  }, [pathname]);
  
  // Interceptar erros de pushState causados por extensões do navegador (apenas uma vez)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Verificar se já foi interceptado
    if ((window.history.pushState as any).__intercepted) return;
    
    const originalPushState = window.history.pushState.bind(window.history);
    window.history.pushState = function(state: any, title: string, url?: string | URL | null) {
      try {
        return originalPushState(state, title, url);
      } catch (error: any) {
        // Se for erro de extensão do navegador, ignorar silenciosamente
        if (
          error?.message?.includes("Breaking Browser Locker") ||
          error?.message?.includes("Browser Locker Behavior") ||
          error?.stack?.includes("chrome-extension://") ||
          error?.stack?.includes("moz-extension://")
        ) {
          console.warn("Erro de navegação ignorado (extensão do navegador):", error.message);
          // Tentar usar window.location como fallback
          if (url && typeof url === "string") {
            setTimeout(() => {
              window.location.href = url;
            }, 0);
          }
          return;
        }
        throw error;
      }
    };
    (window.history.pushState as any).__intercepted = true;

    const originalReplaceState = window.history.replaceState.bind(window.history);
    window.history.replaceState = function(state: any, title: string, url?: string | URL | null) {
      try {
        return originalReplaceState(state, title, url);
      } catch (error: any) {
        // Se for erro de extensão do navegador, ignorar silenciosamente
        if (
          error?.message?.includes("Breaking Browser Locker") ||
          error?.message?.includes("Browser Locker Behavior") ||
          error?.stack?.includes("chrome-extension://") ||
          error?.stack?.includes("moz-extension://")
        ) {
          console.warn("Erro de navegação ignorado (extensão do navegador):", error.message);
          return;
        }
        throw error;
      }
    };
    (window.history.replaceState as any).__intercepted = true;
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Head>
            <title>Maktubia Points Management</title>
            <link rel="icon" href="/images/logo2.png" type="image/png" />
            <link rel="shortcut icon" href="/images/logo2.png" type="image/png" />
            <link rel="apple-touch-icon" href="/images/logo2.png" />
          </Head>
          <NotificationToast />
          <NotificationPermissionBanner />
          <RouteGuard>
            {noAuth ? (
              <Component {...pageProps} />
            ) : (
              <DashboardLayout>
                <Component {...pageProps} />
              </DashboardLayout>
            )}
          </RouteGuard>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
