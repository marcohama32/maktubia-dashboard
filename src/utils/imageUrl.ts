/**
 * Processa URLs de imagens para usar proxy em produção HTTPS
 * @param rawImageUrl URL da imagem retornada pelo backend
 * @returns URL processada (com proxy se necessário)
 */
export function processImageUrl(rawImageUrl: string): string {
  if (!rawImageUrl) {
    return "/images/logo2.png";
  }

  // Se já é URL completa (http/https), verificar se precisa proxy
  if (rawImageUrl.startsWith("http://") || rawImageUrl.startsWith("https://")) {
    // Se estiver em produção HTTPS e a URL for HTTP, usar proxy
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      rawImageUrl.startsWith("http://")
    ) {
        // Extrair o path da URL e usar proxy
        try {
          const url = new URL(rawImageUrl);
          // Construir path para o proxy
          let proxyPath = url.pathname;
          // Se começar com /api, remover
          if (proxyPath.startsWith("/api")) {
            proxyPath = proxyPath.replace("/api", "");
          }
          // Adicionar query params se houver
          return `/api/proxy${proxyPath}${url.search}`;
        } catch {
          // Se não conseguir parsear, usar como está
          return rawImageUrl;
        }
    }
    return rawImageUrl;
  }

  // Se começa com /api, processar
  if (rawImageUrl.startsWith("/api")) {
    // Se estiver em produção HTTPS, usar proxy
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:"
    ) {
      return `/api/proxy${rawImageUrl.replace("/api", "")}`;
    }
    // Em desenvolvimento, construir URL completa
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://72.60.20.31:8000";
    return `${apiBaseUrl}${rawImageUrl}`;
  }

  // Se começa com /, pode ser relativo
  if (rawImageUrl.startsWith("/")) {
    // Se estiver em produção HTTPS e parece ser upload, usar proxy
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      rawImageUrl.includes("uploads")
    ) {
      return `/api/proxy${rawImageUrl}`;
    }
    // Em desenvolvimento ou outras URLs, construir URL completa
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://72.60.20.31:8000";
    return `${apiBaseUrl}${rawImageUrl}`;
  }

  // Se não começa com nada, assumir que é relativo ao backend
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://72.60.20.31:8000";
  return `${apiBaseUrl}/${rawImageUrl}`;
}

