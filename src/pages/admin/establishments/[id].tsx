import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { establishmentService, Establishment } from "@/services/establishment.service";
import { merchantsService, Merchant } from "@/services/merchants.service";
import { processImageUrl } from "@/utils/imageUrl";
import { QRCodeSVG } from "qrcode.react";

export default function EstablishmentDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      setCurrentImageIndex(0); // Reset index when establishment changes
      setIsAutoPlay(true); // Reset autoplay when establishment changes
      // Carregar dados de forma assíncrona após a primeira renderização completa
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => loadEstablishment(Number(id)), { timeout: 100 });
      } else {
        setTimeout(() => loadEstablishment(Number(id)), 50);
      }
    }
  }, [id]);

  // Verificar se há aviso para mostrar sobre merchant
  useEffect(() => {
    const { show_merchant_warning } = router.query;
    if (show_merchant_warning === "true" && establishment && merchants.length === 0) {
      // Mostrar aviso após carregar merchants
      setTimeout(() => {
        alert("⚠️ ATENÇÃO: Este estabelecimento não possui merchants alocados. Por favor, aloque pelo menos um merchant para que o estabelecimento possa ser gerenciado.");
      }, 1000);
    }
  }, [establishment, merchants, router.query]);

  // Função para baixar QR code como PNG
  const downloadQRCode = async () => {
    if (!qrCodeRef.current || !establishment) {
      return;
    }

    const qrCodeValue = establishment.qrCode || establishment.qr_code || "";
    if (!qrCodeValue) return;

    try {
      // Criar canvas temporário
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Tamanho maior para melhor qualidade de impressão
      const size = 800;
      canvas.width = size;
      canvas.height = size;

      // Preencher fundo branco
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);

      // Criar QR code SVG
      const qrSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      qrSvg.setAttribute("width", size.toString());
      qrSvg.setAttribute("height", size.toString());
      qrSvg.setAttribute("viewBox", `0 0 ${size} ${size}`);

      // Gerar QR code diretamente no canvas usando uma biblioteca ou API
      // Alternativa: usar API online ou biblioteca de QR code
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrCodeValue)}&ecc=H`;

      // Carregar imagem do QR code
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);

        // Adicionar texto embaixo (opcional)
        ctx.fillStyle = "#000000";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(establishment.name, size / 2, size - 20);

        // Baixar imagem
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `QRCode_${establishment.name.replace(/[^a-z0-9]/gi, "_")}_${qrCodeValue}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, "image/png");
      };

      img.onerror = () => {
        // Fallback: baixar SVG convertido
        const svgElement = qrCodeRef.current?.querySelector("svg");
        if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
          const svgUrl = URL.createObjectURL(svgBlob);
          const img = new Image();
          img.onload = () => {
            canvas.width = size;
            canvas.height = size;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `QRCode_${establishment.name.replace(/[^a-z0-9]/gi, "_")}_${qrCodeValue}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            }, "image/png");
            URL.revokeObjectURL(svgUrl);
          };
          img.src = svgUrl;
        }
      };

      img.src = qrCodeUrl;
    } catch (error) {
      console.error("Erro ao baixar QR code:", error);
      alert("Erro ao baixar QR code. Por favor, tente novamente.");
    }
  };


  // Função para obter todas as imagens do estabelecimento
  const getImages = (establishment: Establishment | null): string[] => {
    if (!establishment) {
      return ["/images/logo2.png"];
    }
    
    const images: string[] = [];
    const processedUrls = new Set<string>(); // Para evitar duplicatas
    
    // Verifica se há arrays de imagens
    if (establishment.images && Array.isArray(establishment.images)) {
      establishment.images.forEach(img => {
        const processed = processImageUrl(img);
        if (processed !== "/images/logo2.png" && !processedUrls.has(processed)) {
          images.push(processed);
          processedUrls.add(processed);
        }
      });
    }
    if (establishment.imageUrls && Array.isArray(establishment.imageUrls)) {
      establishment.imageUrls.forEach(img => {
        const processed = processImageUrl(img);
        if (processed !== "/images/logo2.png" && !processedUrls.has(processed)) {
          images.push(processed);
          processedUrls.add(processed);
        }
      });
    }
    
    // Verifica campos individuais de imagem
    // SEMPRE adiciona image e imageUrl como imagens separadas para permitir navegação
    let processedImage = "";
    if (establishment.image) {
      processedImage = processImageUrl(establishment.image);
      if (processedImage !== "/images/logo2.png") {
        images.push(processedImage);
        processedUrls.add(processedImage);
      }
    }
    
    // SEMPRE adiciona imageUrl como segunda imagem (mesmo que seja igual a image)
    if (establishment.imageUrl) {
      const processed = processImageUrl(establishment.imageUrl);
      if (processed !== "/images/logo2.png") {
        // SEMPRE adiciona imageUrl, mesmo que seja igual a image (para permitir navegação no carrossel)
        images.push(processed);
        processedUrls.add(processed);
      }
    }
    
    // Verifica outros campos individuais
    const otherImageFields = [
      establishment.photo,
      establishment.image_url,
      establishment.photo_url,
    ].filter(Boolean) as string[];
    
    otherImageFields.forEach(img => {
      const processed = processImageUrl(img);
      if (processed !== "/images/logo2.png" && !processedUrls.has(processed)) {
        images.push(processed);
        processedUrls.add(processed);
      }
    });
    
    // Se não encontrou nenhuma imagem, retorna imagem padrão
    if (images.length === 0) {
      return ["/images/logo2.png"];
    }
    
    return images;
  };

  // Auto-play carousel
  useEffect(() => {
    if (!establishment || !isAutoPlay) {
      return;
    }
    
    const images = getImages(establishment);
    
    if (images.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const images = getImages(establishment);
        return (prev + 1) % images.length;
      });
    }, 3000); // Muda a imagem a cada 3 segundos

    return () => {
      clearInterval(interval);
    };
  }, [establishment, isAutoPlay]);

  const loadEstablishment = async (establishmentId: number) => {
    try {
      setLoading(true);
      setError("");
      const data = await establishmentService.getById(establishmentId);
      setEstablishment(data);
      
      // Se a API retornar users no estabelecimento, usar diretamente
      if (data.users && Array.isArray(data.users) && data.users.length > 0) {
        console.log("✅ [ESTABLISHMENT] Usando users da resposta da API:", data.users.length);
        // Converter users para formato de merchants
        const merchantsFromUsers = data.users.map((user: any) => ({
          merchant_id: user.merchant_id || user.id,
          user_id: user.id,
          establishment_id: establishmentId,
          can_create_campaigns: user.permissions?.canCreateCampaigns || user.permissions?.can_create_campaigns || false,
          can_set_custom_points: user.permissions?.canSetCustomPoints || user.permissions?.can_set_custom_points || false,
          is_active: user.isActive !== false,
          user: user,
          users: [user],
        }));
        setMerchants(merchantsFromUsers);
      } else {
        // Se não houver users na resposta, carregar via API separada
        console.log("⚠️ [ESTABLISHMENT] Nenhum user na resposta, carregando via API separada");
        loadMerchants(establishmentId);
      }
    } catch (err: any) {
      console.error("❌ Erro ao carregar estabelecimento:", err);
      setError(err.message || "Erro ao carregar estabelecimento");
    } finally {
      setLoading(false);
    }
  };

  const loadMerchants = async (establishmentId: number) => {
    try {
      setLoadingMerchants(true);
      const response = await merchantsService.getMerchantsByEstablishment({
        establishmentId,
        limit: 100,
      });
      setMerchants(response.data || []);
    } catch (err: any) {
      console.error("❌ Erro ao carregar merchants:", err);
      // Não bloquear a página se falhar ao carregar merchants
    } finally {
      setLoadingMerchants(false);
    }
  };

  // Função para obter a primeira imagem (para compatibilidade)
  const getImageUrl = (establishment: Establishment | null): string => {
    const images = getImages(establishment);
    return images[0];
  };

  if (error) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Voltar
        </button>
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Voltar
        </button>
        <div className="py-12 text-center">
          <p className="text-gray-500">Estabelecimento não encontrado</p>
        </div>
      </div>
    );
  }

  const images = getImages(establishment);
  const mainImage = getImageUrl(establishment);
  const status = establishment.isActive !== undefined ? establishment.isActive : establishment.status === "active";

  return (
    <div className="relative p-6">
      {/* Loading Overlay */}
      {loading && !establishment && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando estabelecimento...</p>
          </div>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (establishment?.id && !isNaN(Number(establishment.id))) {
                router.push(`/admin/establishments/${establishment.id}/edit`);
              } else {
                console.warn("Não é possível editar: estabelecimento sem ID válido");
              }
            }}
            disabled={!establishment?.id || isNaN(Number(establishment?.id))}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Editar
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-lg">
        {/* Imagens */}
        <div className="relative">
          {images.length === 1 ? (
            // Uma única imagem - mostra em tamanho grande
            <div className="relative h-64 w-full bg-gray-200">
              <img
                src={images[0]}
                alt={establishment.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/logo2.png";
                }}
              />
              <div className="absolute right-4 top-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    status
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {status ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
                 ) : images.length > 1 ? (
                   // Múltiplas imagens - carrossel automático
                   (
            <div className="relative h-96 w-full overflow-hidden bg-gray-200">
              <div 
                className="flex h-full transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              >
                {images.map((img, index) => (
                  <div key={index} className="relative h-full min-w-full shrink-0">
                    <img
                      src={img}
                      alt={`${establishment.name} - Imagem ${index + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/logo2.png";
                      }}
                    />
                  </div>
                ))}
              </div>
              
              <div className="absolute right-4 top-4 z-20">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    status
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {status ? "Ativo" : "Inativo"}
                </span>
              </div>
              
              {/* Botão seta esquerda - sempre visível */}
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         setIsAutoPlay(false);
                         setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                       }}
                className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-3 text-gray-800 shadow-lg transition-all hover:scale-110 hover:bg-gray-100"
                title="Imagem anterior"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Botão seta direita - sempre visível */}
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         setIsAutoPlay(false);
                         setCurrentImageIndex((prev) => (prev + 1) % images.length);
                       }}
                className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-3 text-gray-800 shadow-lg transition-all hover:scale-110 hover:bg-gray-100"
                title="Próxima imagem"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* Indicador de imagem atual com dots */}
              <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
                <div className="flex items-center gap-2 rounded-full bg-black bg-opacity-70 px-4 py-2">
                  <div className="flex gap-1.5">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAutoPlay(false);
                          setCurrentImageIndex(index);
                        }}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? "w-6 bg-white"
                            : "w-2 bg-white bg-opacity-50 hover:bg-opacity-75"
                        }`}
                        title={`Imagem ${index + 1}`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-xs font-medium text-white">
                    {currentImageIndex + 1} / {images.length}
                  </span>
                </div>
              </div>
              
              {/* Botão play/pause */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAutoPlay(!isAutoPlay);
                }}
                className="absolute left-4 top-4 z-20 rounded-full bg-black bg-opacity-50 p-2 text-white transition-all hover:bg-opacity-70"
                title={isAutoPlay ? "Pausar carrossel" : "Reproduzir carrossel"}
              >
                {isAutoPlay ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                     </button>
                   </div>
                   )
                 ) : (
            // Nenhuma imagem - mostra placeholder
            <div className="relative flex h-64 w-full items-center justify-center bg-gray-200">
              <img
                src="/images/logo2.png"
                alt={establishment.name}
                className="h-full w-full object-cover opacity-50"
              />
              <div className="absolute right-4 top-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    status
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {status ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="p-6">
          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">{establishment.name}</h1>
            {establishment.type && (
              <p className="text-lg text-gray-600">Tipo: {establishment.type}</p>
            )}
          </div>

          {/* QR Code Section */}
          {(establishment.qrCode || establishment.qr_code) && (
            <div className="mb-6 rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">QR Code do Estabelecimento</h2>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                  <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Código para Imprimir
                </span>
              </div>
              
              <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
                <div className="shrink-0 rounded-lg border-2 border-gray-300 bg-white p-4 shadow-lg" ref={qrCodeRef}>
                  <QRCodeSVG
                    value={establishment.qrCode || establishment.qr_code || ""}
                    size={250}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                
                <div className="flex-1">
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Código QR</p>
                    <p className="break-all rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-mono text-lg font-semibold text-gray-900 shadow-sm">
                      {establishment.qrCode || establishment.qr_code}
                    </p>
                  </div>
                  
                  {/* Descrição do Fluxo */}
                  <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="mb-2 text-sm font-semibold text-gray-700">Como funciona:</p>
                    <ol className="list-inside list-decimal space-y-2 text-xs text-gray-600">
                      <li>Baixe e imprima este QR code</li>
                      <li>Cole o QR code em local visível no estabelecimento</li>
                      <li>Clientes escaneiam o QR code após fazerem compras</li>
                      <li>Clientes fazem upload do recibo da compra</li>
                      <li>Compra é submetida para aprovação dos gestores</li>
                      <li>Após aprovação, o cliente recebe pontos automaticamente</li>
                    </ol>
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={downloadQRCode}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-green-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Baixar QR Code (PNG)
                    </button>
                    <button
                      onClick={() => {
                        const qrCodeText = establishment.qrCode || establishment.qr_code || "";
                        navigator.clipboard.writeText(qrCodeText);
                        alert("QR Code copiado para a área de transferência!");
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-md transition-colors hover:bg-blue-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar Código
                    </button>
                  </div>
                  
                  <p className="mt-3 text-xs italic text-gray-500">
                    💡 Dica: Imprima o QR code em alta qualidade e cole em local visível para facilitar o acesso dos clientes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {establishment.description && (
            <div className="mb-6">
              <h2 className="mb-3 text-xl font-semibold text-gray-900">Descrição</h2>
              <p className="leading-relaxed text-gray-700">{establishment.description}</p>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {establishment.address && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Endereço</h3>
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-900">{establishment.address}</p>
                </div>
              </div>
            )}

            {establishment.phone && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Telefone</h3>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <p className="text-gray-900">{establishment.phone}</p>
                </div>
              </div>
            )}

            {establishment.email && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Email</h3>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-900">{establishment.email}</p>
                </div>
              </div>
            )}

            {establishment.color && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Cor</h3>
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: establishment.color }}
                  ></div>
                  <p className="text-gray-900">{establishment.color}</p>
                </div>
              </div>
            )}
          </div>

          {/* Campanhas */}
          {establishment.campaigns && establishment.campaigns.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-xl font-semibold text-gray-900">Campanhas</h2>
              <div className="space-y-3">
                {establishment.campaigns.map((campaign: any, index: number) => (
                  <div key={campaign.id || index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900">{campaign.type || "Campanha"}</h3>
                      {campaign.isActive && (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          Ativa
                        </span>
                      )}
                    </div>
                    {campaign.description && (
                      <p className="mb-2 text-gray-700">{campaign.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      {campaign.conversionRate && (
                        <div>
                          <span className="text-gray-500">Taxa de conversão: </span>
                          <span className="font-semibold text-gray-900">{(campaign.conversionRate * 100).toFixed(0)}%</span>
                        </div>
                      )}
                      {campaign.minSpend && (
                        <div>
                          <span className="text-gray-500">Gasto mínimo: </span>
                          <span className="font-semibold text-gray-900">{campaign.minSpend} MZN</span>
                        </div>
                      )}
                      {campaign.validUntil && (
                        <div>
                          <span className="text-gray-500">Válida até: </span>
                          <span className="font-semibold text-gray-900">
                            {new Date(campaign.validUntil).toLocaleDateString("pt-MZ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Merchants Alocados */}
          <div className="mb-6 border-t border-gray-200 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Merchants Alocados</h2>
              <button
                onClick={() => router.push(`/admin/merchants/new?establishment_id=${establishment.id}`)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                + Alocar Merchant
              </button>
            </div>
            {loadingMerchants ? (
              <div className="py-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-500">Carregando merchants...</p>
              </div>
            ) : merchants.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-yellow-300 bg-yellow-50 p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="mt-4 text-sm font-semibold text-yellow-900">⚠️ ATENÇÃO: Nenhum merchant alocado</p>
                <p className="mt-2 text-sm text-yellow-700">
                  Este estabelecimento não possui merchants alocados. É necessário alocar pelo menos um merchant para que o estabelecimento possa ser gerenciado e campanhas possam ser criadas.
                </p>
                <button
                  onClick={() => router.push(`/admin/merchants/new?establishment_id=${establishment.id}`)}
                  className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  + Alocar Primeiro Merchant
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {merchants.map((merchant, index) => {
                  // Extrair informações do usuário (pode estar em users[] ou user)
                  const merchantUser = merchant.users && merchant.users.length > 0 
                    ? merchant.users[0] 
                    : merchant.user;
                  
                  const userName = merchantUser?.fullName || 
                    `${merchantUser?.firstName || ""} ${merchantUser?.lastName || ""}`.trim() || 
                    merchantUser?.username || 
                    "Usuário desconhecido";
                  
                  const userEmail = merchantUser?.email || "";
                  const userPhone = merchantUser?.phone || "";
                  // Verificar permissões - pode estar em permissions (camelCase ou snake_case)
                  const merchantUserPermissions = (merchantUser as any)?.permissions;
                  const canCreateCampaigns = merchant.can_create_campaigns || 
                    merchantUserPermissions?.canCreateCampaigns ||
                    merchantUserPermissions?.can_create_campaigns || 
                    false;
                  const canSetCustomPoints = merchant.can_set_custom_points || 
                    merchantUserPermissions?.canSetCustomPoints ||
                    merchantUserPermissions?.can_set_custom_points || 
                    false;
                  
                  return (
                    <div key={merchant.merchant_id || merchant.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{userName}</h3>
                          {userEmail && (
                            <p className="mt-1 text-sm text-gray-500">{userEmail}</p>
                          )}
                          {userPhone && (
                            <p className="mt-1 text-xs text-gray-400">{userPhone}</p>
                          )}
                        </div>
                        {(merchant.is_active !== false && merchantUser?.isActive !== false) ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                            Inativo
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          {canCreateCampaigns ? (
                            <span className="inline-flex items-center gap-1 text-green-700">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Pode criar campanhas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-500">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Não pode criar campanhas
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {canSetCustomPoints ? (
                            <span className="inline-flex items-center gap-1 text-green-700">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Pode definir pontos personalizados
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-500">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Não pode definir pontos personalizados
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            const merchantId = merchant.merchant_id || merchant.id || merchantUser?.id;
                            if (merchantId) {
                              router.push(`/admin/merchants/${merchantId}`);
                            } else {
                              console.warn("Merchant ID não encontrado:", merchant);
                            }
                          }}
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Ver Detalhes
                        </button>
                        {merchantUser?.id && (
                          <button
                            onClick={() => router.push(`/admin/users/${merchantUser.id}`)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            title="Ver usuário"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Métricas */}
          {establishment.metrics && (
            <div className="mb-6 border-t border-gray-200 pt-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Métricas</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {establishment.metrics.totalPurchases !== undefined && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">Total de Compras</div>
                    <div className="text-2xl font-bold text-gray-900">{establishment.metrics.totalPurchases}</div>
                  </div>
                )}
                {establishment.metrics.confirmedPurchases !== undefined && (
                  <div className="rounded-lg bg-green-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">Compras Confirmadas</div>
                    <div className="text-2xl font-bold text-green-700">{establishment.metrics.confirmedPurchases}</div>
                  </div>
                )}
                {establishment.metrics.pendingPurchases !== undefined && (
                  <div className="rounded-lg bg-yellow-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">Compras Pendentes</div>
                    <div className="text-2xl font-bold text-yellow-700">{establishment.metrics.pendingPurchases}</div>
                  </div>
                )}
                {establishment.metrics.totalRevenue !== undefined && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">Receita Total</div>
                    <div className="text-2xl font-bold text-blue-700">{establishment.metrics.totalRevenue.toLocaleString("pt-MZ")} MZN</div>
                  </div>
                )}
                {establishment.metrics.totalPointsGiven !== undefined && (
                  <div className="rounded-lg bg-purple-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">Pontos Dados</div>
                    <div className="text-2xl font-bold text-purple-700">{establishment.metrics.totalPointsGiven.toLocaleString("pt-MZ")}</div>
                  </div>
                )}
                {establishment.metrics.totalPointsSpent !== undefined && (
                  <div className="rounded-lg bg-orange-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">Pontos Gastos</div>
                    <div className="text-2xl font-bold text-orange-700">{establishment.metrics.totalPointsSpent.toLocaleString("pt-MZ")}</div>
                  </div>
                )}
                {establishment.metrics.uniqueCustomers !== undefined && (
                  <div className="rounded-lg bg-indigo-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">Clientes Únicos</div>
                    <div className="text-2xl font-bold text-indigo-700">{establishment.metrics.uniqueCustomers}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informações adicionais */}
          {((establishment.createdAt || establishment.created_at) || (establishment.updatedAt || establishment.updated_at)) && (
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 gap-4 text-sm text-gray-500 md:grid-cols-2">
                {(establishment.createdAt || establishment.created_at) && (
                  <div>
                    <span className="font-semibold">Criado em: </span>
                    {new Date(establishment.createdAt || establishment.created_at || "").toLocaleDateString("pt-MZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                )}
                {(establishment.updatedAt || establishment.updated_at) && (
                  <div>
                    <span className="font-semibold">Atualizado em: </span>
                    {new Date(establishment.updatedAt || establishment.updated_at || "").toLocaleDateString("pt-MZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

