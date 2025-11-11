import Link from "next/link";
import React from "react";
import { getSidebarData, iconMap } from "./data";
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant, getUserRole } from "@/utils/roleUtils";

const style = {
  title: "font-normal mx-4 text-sm",
  active:
    "bg-gradient-to-r border-r-4 border-blue-500 border-r-4 border-blue-500 from-white to-blue-100 text-blue-500",
  link: "duration-200 flex font-thin items-center justify-start my-2 p-4 transition-colors text-gray-500 uppercase w-full lg:hover:text-blue-500 cursor-pointer",
};

// Componente helper para renderizar ícones de forma segura
const IconRenderer: React.FC<{ iconName: string }> = ({ iconName }) => {
  const Icon = iconMap[iconName as keyof typeof iconMap];
  
  if (!Icon) {
    return null;
  }
  
  // PurchaseIcon aceita className, outros não
  if (iconName === "PurchaseIcon") {
    return <Icon className="w-6 h-6" />;
  }
  
  return <Icon />;
};

export function SidebarItems() {
  const router = useRouter();
  const { pathname } = router;
  const { user } = useAuth();
  
  // Filtrar itens do menu baseado no role do usuário
  const filteredMenuItems = useMemo(() => {
    const data = getSidebarData();
    
    // Durante SSR, mostrar todos os itens (o filtro será aplicado no cliente)
    if (typeof window === "undefined") {
      return data;
    }
    
    // Se não há usuário ainda, mostrar todos os itens temporariamente
    if (!user) {
      return data;
    }
    
    // Verificar se o usuário é admin ou merchant
    const userRole = getUserRole(user);
    const userIsAdmin = isAdmin(user);
    const userIsMerchant = isMerchant(user);
    
    // Debug: logar informações do usuário
    if (typeof window !== "undefined") {
      console.log("🔍 [SIDEBAR] Filtrando itens do menu:", {
        user: user?.username || user?.email || "N/A",
        roleRaw: user?.role,
        roleNormalized: userRole,
        isAdmin: userIsAdmin,
        isMerchant: userIsMerchant,
        totalItems: data.length,
      });
    }
    
    const filtered = data.filter(item => {
      // Apenas admin pode ver Merchants
      if (item.link === "/admin/merchants") {
        const shouldShow = userIsAdmin;
        if (typeof window !== "undefined") {
          console.log(`  ${shouldShow ? "✅" : "❌"} ${item.title} (${item.link}): ${shouldShow ? "VISÍVEL" : "OCULTO"} - isAdmin=${userIsAdmin}, role="${userRole}"`);
        }
        return shouldShow;
      }
      
      // Apenas admin pode ver Usuários
      if (item.link === "/admin/users") {
        const shouldShow = userIsAdmin;
        if (typeof window !== "undefined") {
          console.log(`  ${shouldShow ? "✅" : "❌"} ${item.title} (${item.link}): ${shouldShow ? "VISÍVEL" : "OCULTO"} - isAdmin=${userIsAdmin}, role="${userRole}"`);
        }
        return shouldShow;
      }
      
      // Merchants não devem ver "Dashboard" (apenas "Meu Dashboard")
      if (item.link === "/" && item.title === "Dashboard") {
        const shouldShow = !userIsMerchant; // Merchants não veem, apenas admins
        if (typeof window !== "undefined") {
          console.log(`  ${shouldShow ? "✅" : "❌"} ${item.title} (${item.link}): ${shouldShow ? "VISÍVEL" : "OCULTO"} - isMerchant=${userIsMerchant}, role="${userRole}"`);
        }
        return shouldShow;
      }
      
      // Admin não deve ver "Meu Dashboard" (apenas merchants)
      if (item.link === "/merchant/dashboard" || item.title === "Meu Dashboard") {
        const shouldShow = userIsMerchant && !userIsAdmin;
        if (typeof window !== "undefined") {
          console.log(`  ${shouldShow ? "✅" : "❌"} ${item.title} (${item.link}): ${shouldShow ? "VISÍVEL" : "OCULTO"} - isMerchant=${userIsMerchant}, isAdmin=${userIsAdmin}, role="${userRole}"`);
        }
        return shouldShow;
      }

      // Campanhas Públicas e Minhas Campanhas apenas para merchants
      if (item.link === "/merchant/campaigns/public" || item.link === "/merchant/campaigns/my") {
        const shouldShow = userIsMerchant && !userIsAdmin;
        if (typeof window !== "undefined") {
          console.log(`  ${shouldShow ? "✅" : "❌"} ${item.title} (${item.link}): ${shouldShow ? "VISÍVEL" : "OCULTO"} - isMerchant=${userIsMerchant}, isAdmin=${userIsAdmin}, role="${userRole}"`);
        }
        return shouldShow;
      }

      // Admin não deve ver "Campanhas Públicas" e "Minhas Campanhas" (apenas "Campanhas")
      if (item.link === "/admin/campaigns" && item.title === "Campanhas") {
        const shouldShow = userIsAdmin || !userIsMerchant; // Admin vê, merchant não vê
        if (typeof window !== "undefined") {
          console.log(`  ${shouldShow ? "✅" : "❌"} ${item.title} (${item.link}): ${shouldShow ? "VISÍVEL" : "OCULTO"} - isAdmin=${userIsAdmin}, isMerchant=${userIsMerchant}, role="${userRole}"`);
        }
        return shouldShow;
      }
      
      // Outros itens podem ser visíveis para admin e merchant
      // (o controle de acesso específico será feito nas páginas)
      return true;
    });
    
    if (typeof window !== "undefined") {
      console.log(`  📊 Total de itens filtrados: ${filtered.length}/${data.length}`);
    }
    
    return filtered;
  }, [user]);
  
  // Função para logar cliques em links (não interfere com navegação client-side do Next.js)
  const handleLinkClick = useCallback((link: string, title: string) => {
    if (typeof window === "undefined") return;
    
    // Normalizar paths para comparação (tratar "/" e pathname corretamente)
    const normalizedPathname = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    const normalizedLink = link === "/" ? "/" : link.replace(/\/$/, "");
    
    // Se já está na mesma página, não fazer log
    if (normalizedPathname === normalizedLink) {
      return;
    }
    
    const clickTime = performance.now();
    const timestamp = new Date().toISOString();
    
    // Salvar informações da navegação no sessionStorage
    sessionStorage.setItem("navigation_start", JSON.stringify({
      link,
      title,
      clickTime,
      timestamp,
    }));
    
    console.log(`🖱️ [NAVEGACAO] Link clicado: "${title}" → ${link}`);
    console.log(`   📅 Timestamp: ${timestamp}`);
    console.log(`   ⏱️  Tempo do clique: ${clickTime.toFixed(2)}ms`);
    
    // Marcar início da navegação
    window.performance.mark(`nav-start-${link}`);
  }, [pathname]);

  // Função para verificar se o link está ativo
  const isActive = useCallback((link: string) => {
    // Normalizar paths para comparação
    const normalizedPathname = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    const normalizedLink = link === "/" ? "/" : link.replace(/\/$/, "");
    return normalizedPathname === normalizedLink;
  }, [pathname]);

  return (
    <ul>
      {filteredMenuItems.map((item) => (
        <li key={item.title}>
          <Link 
            href={item.link}
            className={`${style.link} 
            ${isActive(item.link) && style.active}`}
            onClick={() => handleLinkClick(item.link, item.title)}
          >
            <span>
              <IconRenderer iconName={item.icon} />
            </span>
            <span className={style.title}>{item.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
