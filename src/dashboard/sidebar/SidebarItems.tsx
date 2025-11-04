import Link from "next/link";
import { data } from "./data";
import { useRouter } from "next/router";
import { useCallback } from "react";

const style = {
  title: "font-normal mx-4 text-sm",
  active:
    "bg-gradient-to-r border-r-4 border-blue-500 border-r-4 border-blue-500 from-white to-blue-100 text-blue-500",
  link: "duration-200 flex font-thin items-center justify-start my-2 p-4 transition-colors text-gray-500 uppercase w-full lg:hover:text-blue-500 cursor-pointer",
};

export function SidebarItems() {
  const router = useRouter();
  const { pathname } = router;
  
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
      {data.map((item) => (
        <li key={item.title}>
          <Link 
            href={item.link}
            className={`${style.link} 
            ${isActive(item.link) && style.active}`}
            onClick={() => handleLinkClick(item.link, item.title)}
          >
            <span>{item.icon}</span>
            <span className={style.title}>{item.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
