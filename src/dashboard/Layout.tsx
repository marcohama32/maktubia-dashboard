import React from "react";
import { useRouter } from "next/router";
import { TopBar } from "./TopBar";
import { Overlay } from "./Overlay";
import { Sidebar } from "./sidebar/Sidebar";
import { DashboardProvider, useDashboardContext } from "./Provider";
import { useAuth } from "@/contexts/AuthContext";

interface ChildrenProps {
  children: React.ReactNode;
}

const style = {
  open: "lg:w-full",
  close: "lg:pl-4 lg:lg:w-[calc(100%-16rem)]",
  mainContainer: "flex flex-col w-full h-screen pl-0 lg:space-y-4",
  container: "bg-gray-100 h-screen overflow-hidden relative lg:p-4",
  main: "h-screen overflow-auto pb-36 pt-8 px-2 md:pb-8 md:pt-4 lg:pt-0",
};

const Content = (props: ChildrenProps) => {
  const { sidebarOpen } = useDashboardContext();
  
  // Log de renderização do layout
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    
    const renderTime = performance.now();
    console.log("🎨 [LAYOUT] Conteúdo renderizado");
    console.log(`   ⏱️  Tempo de renderização: ${renderTime.toFixed(2)}ms`);
  }, []);
  
  return (
    <div className={style.container}>
      <div className="flex items-start">
        <Overlay />
        <Sidebar mobileOrientation="end" />
        <div
          className={`${style.mainContainer} 
             ${sidebarOpen ? style.open : style.close}`}
        >
          <TopBar />
          <main className={style.main}>{props.children}</main>
        </div>
      </div>
    </div>
  );
};

export function DashboardLayout(props: ChildrenProps) {
  return (
    <DashboardProvider>
      <ProtectedContent>{props.children}</ProtectedContent>
    </DashboardProvider>
  );
}

const ProtectedContent = ({ children }: ChildrenProps) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [shouldRedirect, setShouldRedirect] = React.useState(false);

  // Aguarda a montagem do componente antes de verificar autenticação
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Verifica se tem token no localStorage antes de redirecionar
  React.useEffect(() => {
    // Só verifica após a montagem
    if (!mounted) return;

    // Verifica token primeiro (sem esperar loading)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      
      // Se não tem token e não está autenticado, redirecionar (mas não bloquear renderização)
      if (!token || token === "undefined" || token.trim() === "") {
        if (!isAuthenticated) {
          setShouldRedirect(true);
          // Redirecionar de forma não bloqueante
          setTimeout(() => {
            const safeRedirect = async (url: string) => {
              try {
                await router.replace(url);
              } catch (err) {
                try {
                  window.location.href = url;
                } catch (err2) {
                  console.warn("Safe redirect failed", err, err2);
                }
              }
            };
            void safeRedirect("/login");
          }, 200);
        }
      }
    }
  }, [isAuthenticated, mounted, router]);

  // Se não está autenticado e não tem token, redirecionar sem bloquear
  if (shouldRedirect && !isAuthenticated) {
    return null; // Retorna null enquanto redireciona
  }

  // Renderizar o conteúdo imediatamente - não bloquear pela autenticação
  // A verificação de autenticação acontece em background
  return <Content>{children}</Content>;
};
