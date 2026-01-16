import Link from "next/link";
import React, { useState } from "react";
import { getSidebarData, iconMap, SidebarItem } from "./data";
import { useRouter } from "next/router";
import { useCallback, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant, isUser, getUserRole } from "@/utils/roleUtils";

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
  
  // Ícones que aceitam className
  const iconsWithClassName = [
    "PurchaseIcon",
    "PointsIcon",
    "PointsManagementIcon",
    "RedemptionIcon",
    "TransferIcon"
  ];
  
  if (iconsWithClassName.includes(iconName)) {
    return <Icon className="w-6 h-6" />;
  }
  
  return <Icon />;
};

export function SidebarItems() {
  const router = useRouter();
  const { pathname } = router;
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Função para verificar se o link está ativo (incluindo filhos)
  const isActive = useCallback((item: SidebarItem) => {
    // Normalizar paths para comparação
    const normalizedPathname = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    const normalizedLink = item.link === "/" ? "/" : item.link.replace(/\/$/, "");
    
    // Verificar se o item atual está ativo
    if (normalizedPathname === normalizedLink && item.link !== "#") {
      return true;
    }
    
    // Verificar se algum filho está ativo
    if (item.children) {
      return item.children.some(child => {
        const normalizedChildLink = child.link === "/" ? "/" : child.link.replace(/\/$/, "");
        return normalizedPathname === normalizedChildLink;
      });
    }
    
    return false;
  }, [pathname]);
  
  // Expandir automaticamente itens com filhos ativos
  useEffect(() => {
    const data = getSidebarData();
    const newExpanded = new Set<string>();
    
    data.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => {
          const normalizedPathname = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
          const normalizedChildLink = child.link === "/" ? "/" : child.link.replace(/\/$/, "");
          return normalizedPathname === normalizedChildLink;
        });
        
        if (hasActiveChild) {
          newExpanded.add(item.title);
        }
      }
    });
    
    setExpandedItems(newExpanded);
  }, [pathname]);
  
  // Toggle expand/collapse
  const toggleExpand = useCallback((title: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  }, []);
  
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
    
    // Verificar se o usuário é admin, merchant ou cliente
    const userRole = getUserRole(user);
    const userIsAdmin = isAdmin(user);
    const userIsMerchant = isMerchant(user);
    const userIsUser = isUser(user);
    
    // Debug: logar informações do usuário
    if (typeof window !== "undefined") {
      console.log("🔍 [SIDEBAR] Filtrando itens do menu:", {
        user: user?.username || user?.email || "N/A",
        roleRaw: user?.role,
        roleNormalized: userRole,
        isAdmin: userIsAdmin,
        isMerchant: userIsMerchant,
        isUser: userIsUser,
        totalItems: data.length,
      });
    }
    
    const filtered = data.filter(item => {
      // Clientes (usuários comuns) só veem itens específicos
      if (userIsUser && !userIsAdmin && !userIsMerchant) {
        // Dashboard - sim
        if (item.link === "/" && item.title === "Dashboard") {
          return true;
        }
        // Campanhas - sim (campanhas públicas)
        if (item.link === "/admin/campaigns" && item.title === "Campanhas") {
          return true;
        }
        // Pontos > Transferências - sim
        if (item.link === "/admin/transfers" || (item.children && item.children.some(c => c.link === "/admin/transfers"))) {
          return true;
        }
        // Estabelecimentos - sim (apenas visualização)
        if (item.link === "/admin/establishments") {
          return true;
        }
        // Compras - sim (suas compras)
        if (item.link === "/admin/purchases") {
          return true;
        }
        // Guia de Uso - sim
        if (item.link === "/admin/documentation") {
          return true;
        }
        // Sair - sim
        if (item.link === "/logout") {
          return true;
        }
        // Todos os outros itens são ocultos para clientes
        return false;
      }
      
      // Apenas admin pode ver Merchants
      if (item.link === "/admin/merchants") {
        const shouldShow = userIsAdmin;
        if (typeof window !== "undefined") {
          console.log(`  ${shouldShow ? "✅" : "❌"} ${item.title} (${item.link}): ${shouldShow ? "VISÍVEL" : "OCULTO"} - isAdmin=${userIsAdmin}, role="${userRole}"`);
        }
        return shouldShow;
      }
      
      // Admin e merchants podem ver Usuários
      if (item.link === "/admin/users") {
        const shouldShow = userIsAdmin || userIsMerchant;
        if (typeof window !== "undefined") {
          console.log(`  ${shouldShow ? "✅" : "❌"} ${item.title} (${item.link}): ${shouldShow ? "VISÍVEL" : "OCULTO"} - isAdmin=${userIsAdmin}, isMerchant=${userIsMerchant}, role="${userRole}"`);
        }
        return shouldShow;
      }
      
      // Merchants não devem ver "Dashboard" (apenas "Meu Dashboard")
      if (item.link === "/" && item.title === "Dashboard") {
        const shouldShow = !userIsMerchant; // Merchants não veem, apenas admins e clientes
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

      // Admin, merchants e clientes podem ver "Campanhas"
      if (item.link === "/admin/campaigns" && item.title === "Campanhas") {
        const shouldShow = userIsAdmin || userIsUser || userIsMerchant; // Admin, clientes e merchants veem
        if (typeof window !== "undefined") {
          console.log(`  ${shouldShow ? "✅" : "❌"} ${item.title} (${item.link}): ${shouldShow ? "VISÍVEL" : "OCULTO"} - isAdmin=${userIsAdmin}, isMerchant=${userIsMerchant}, isUser=${userIsUser}, role="${userRole}"`);
        }
        return shouldShow;
      }
      
      // BCI apenas para admin
      if (item.link === "/admin/bci") {
        return userIsAdmin;
      }
      
      // Outros itens podem ser visíveis para admin e merchant
      // (o controle de acesso específico será feito nas páginas)
      return true;
    });
    
    // Filtrar também os filhos de itens com submenu
    const filteredWithChildren = filtered.map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => {
            // Para clientes, mostrar Meus Pontos e Transferências no submenu de Pontos
            if (userIsUser && !userIsAdmin && !userIsMerchant) {
              if (child.link === "/client/points" || child.link === "/admin/transfers") {
                return true;
              }
              // Ocultar Gestão Pontos e Resgates para clientes
              if (child.link === "/admin/points" || child.link === "/admin/redemptions") {
                return false;
              }
            }
            // Para admin e merchant, ocultar "Meus Pontos" (apenas para clientes)
            if ((userIsAdmin || userIsMerchant) && child.link === "/client/points") {
              return false;
            }
            // Aplicar mesma lógica de filtro aos filhos
            if (child.link === "/admin/merchants") {
              return userIsAdmin; // Apenas admin vê merchants
            }
            if (child.link === "/admin/users") {
              return userIsAdmin || userIsMerchant; // Admin e merchants veem usuários
            }
            return true;
          })
        };
      }
      return item;
    });
    
    if (typeof window !== "undefined") {
      console.log(`  📊 Total de itens filtrados: ${filtered.length}/${data.length}`);
    }
    
    return filteredWithChildren;
  }, [user]);
  
  // Função para logar cliques em links (não interfere com navegação client-side do Next.js)
  const handleLinkClick = useCallback((link: string, title: string, e?: React.MouseEvent) => {
    if (typeof window === "undefined") return;
    
    // Se for um link "#" (submenu parent), não navegar
    if (link === "#") {
      e?.preventDefault();
      return;
    }
    
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

  const renderMenuItem = (item: SidebarItem, isChild: boolean = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.title);
    const itemIsActive = isActive(item);
    const indentClass = isChild ? "ml-8" : "";
    
    return (
      <li key={item.title} className={indentClass}>
        {hasChildren ? (
          <>
            <div
              className={`${style.link} ${itemIsActive ? style.active : ""}`}
              onClick={() => toggleExpand(item.title)}
            >
              <span>
                <IconRenderer iconName={item.icon} />
              </span>
              <span className={style.title}>{item.title}</span>
              <span className="ml-auto">
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
            {isExpanded && hasChildren && (
              <ul className="ml-4">
                {item.children!.map((child) => renderMenuItem(child, true))}
              </ul>
            )}
          </>
        ) : (
          <Link 
            href={item.link}
            className={`${style.link} ${itemIsActive ? style.active : ""}`}
            onClick={(e) => handleLinkClick(item.link, item.title, e)}
          >
            <span>
              <IconRenderer iconName={item.icon} />
            </span>
            <span className={style.title}>{item.title}</span>
          </Link>
        )}
      </li>
    );
  };

  return (
    <ul>
      {filteredMenuItems.map((item) => renderMenuItem(item))}
    </ul>
  );
}
