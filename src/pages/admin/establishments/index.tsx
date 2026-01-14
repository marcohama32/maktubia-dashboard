import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { isUser, isAdmin, isMerchant } from "@/utils/roleUtils";
import { establishmentService, Establishment } from "@/services/establishment.service";
import { QRCodeSVG } from "qrcode.react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { processImageUrl } from "@/utils/imageUrl";

const ITEMS_PER_PAGE = 12;

export default function EstablishmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userIsClient = user ? isUser(user) && !isAdmin(user) && !isMerchant(user) : false;
  const userIsAdmin = user ? isAdmin(user) : false;
  const userIsMerchant = user ? isMerchant(user) : false;
  const canEditDelete = userIsAdmin || userIsMerchant;
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<number, number>>({});
  
  // Estados para modais
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [establishmentToDelete, setEstablishmentToDelete] = useState<Establishment | null>(null);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  useEffect(() => {
    // Carregar dados de forma assíncrona após a primeira renderização completa
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => loadEstablishments(), { timeout: 100 });
    } else {
      setTimeout(() => loadEstablishments(), 50);
    }
  }, []);

  const loadEstablishments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await establishmentService.getAll();
      
      // Filtrar estabelecimentos com ID válido (aceita IDs numéricos ou strings não vazias)
      const validEstablishments = data.filter((est) => {
        // Aceitar ID se for número válido OU string não vazia
        const hasValidId = est && est.id != null && (
          (!isNaN(Number(est.id)) && Number(est.id) > 0) || // ID numérico válido
          (typeof est.id === 'string' && est.id.trim().length > 0) // ID string não vazio
        );
        if (!hasValidId) {
          console.warn("⚠️ Estabelecimento sem ID válido ignorado:", {
            name: est?.name,
            type: est?.type,
            id: est?.id,
            allKeys: Object.keys(est || {})
          });
        }
        return hasValidId;
      });
      
      // Log informativo se houver estabelecimentos inválidos
      const invalidCount = data.length - validEstablishments.length;
      if (invalidCount > 0) {
        console.warn(`⚠️ ${invalidCount} estabelecimento(s) sem ID válido foram ignorados de ${data.length} total`);
      }
      
      setEstablishments(validEstablishments);
    } catch (err: any) {
      console.error("Erro ao carregar estabelecimentos:", err);
      const errorMessage = err.message || "Erro ao carregar estabelecimentos";
      setError(errorMessage);
      
      // Se for erro 500, sugere verificar o backend
      if (err.message?.includes("servidor") || err.message?.includes("500")) {
        console.warn("Erro 500: Verifique se o backend está funcionando e se o endpoint /api/establishments existe");
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrar estabelecimentos por termo de pesquisa
  const filteredEstablishments = useMemo(() => {
    if (!searchTerm.trim()) {
      return establishments;
    }
    
    const term = searchTerm.toLowerCase();
    return establishments.filter((establishment) =>
      establishment.name.toLowerCase().includes(term) ||
      establishment.email?.toLowerCase().includes(term) ||
      establishment.phone?.toLowerCase().includes(term) ||
      establishment.address?.toLowerCase().includes(term) ||
      establishment.description?.toLowerCase().includes(term)
    );
  }, [establishments, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredEstablishments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEstablishments = filteredEstablishments.slice(startIndex, endIndex);

  // Resetar página quando pesquisa mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDeleteClick = (establishment: Establishment) => {
    setEstablishmentToDelete(establishment);
    setConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!establishmentToDelete) return;

    try {
      setDeleteLoading(true);
      setConfirmModalOpen(false);
      
      await establishmentService.delete(establishmentToDelete.id);
      await loadEstablishments();
      
      // Mostrar modal de sucesso
      setAlertConfig({
        title: "Sucesso!",
        message: `O estabelecimento "${establishmentToDelete.name || "sem nome"}" foi eliminado com sucesso.`,
        type: "success",
      });
      setAlertModalOpen(true);
      setEstablishmentToDelete(null);
    } catch (err: any) {
      // Mostrar modal de erro
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao eliminar estabelecimento. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmModalOpen(false);
    setEstablishmentToDelete(null);
  };

  const handleEdit = (id: number | string) => {
    if (!id || (typeof id === 'number' && isNaN(id)) || (typeof id === 'string' && id.trim().length === 0)) {
      console.error("ID inválido para edição:", id);
      return;
    }
    router.push(`/admin/establishments/${id}/edit`);
  };

  const handleView = (id: number | string) => {
    if (!id || (typeof id === 'number' && isNaN(id)) || (typeof id === 'string' && id.trim().length === 0)) {
      console.error("ID inválido para visualização:", id);
      return;
    }
    router.push(`/admin/establishments/${id}`);
  };

  const handleCreate = () => {
    router.push("/admin/establishments/new");
  };


  // Função para obter todas as imagens de um estabelecimento
  const getImages = (establishment: Establishment): string[] => {
    const images: string[] = [];
    const processedUrls = new Set<string>();

    // Verifica arrays de imagens
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
    
    // Verifica campos individuais de imagem - trata image e imageUrl como imagens separadas
    // Primeiro adiciona image
    if (establishment.image) {
      const processed = processImageUrl(establishment.image);
      if (processed !== "/images/logo2.png" && !processedUrls.has(processed)) {
        images.push(processed);
        processedUrls.add(processed);
      }
    }
    
    // Depois adiciona imageUrl (mesmo que possa ser igual a image)
    if (establishment.imageUrl) {
      const processed = processImageUrl(establishment.imageUrl);
      if (processed !== "/images/logo2.png" && !processedUrls.has(processed)) {
        images.push(processed);
        processedUrls.add(processed);
      }
    }
    
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
    
    if (images.length === 0) {
      return ["/images/logo2.png"];
    }
    
    return images;
  };

  // Função para obter a imagem atual baseada no índice
  const getCurrentImage = (establishment: Establishment): string => {
    const images = getImages(establishment);
    // Usar o ID como está (número ou string)
    const establishmentId = establishment.id;
    const index = currentImageIndex[establishmentId] || 0;
    return images[index] || images[0] || "/images/logo2.png";
  };

  // Função para navegar para a próxima imagem
  const nextImage = (establishmentId: number | string) => {
    const establishment = establishments.find(e => {
      // Comparar IDs diretamente (pode ser número ou string)
      return e.id === establishmentId || String(e.id) === String(establishmentId);
    });
    if (!establishment) return;
    
    const images = getImages(establishment);
    if (images.length <= 1) return;
    
    const currentIndex = currentImageIndex[establishmentId] || 0;
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentImageIndex(prev => ({ ...prev, [establishmentId]: nextIndex }));
  };

  // Função para navegar para a imagem anterior
  const prevImage = (establishmentId: number | string) => {
    const establishment = establishments.find(e => {
      // Comparar IDs diretamente (pode ser número ou string)
      return e.id === establishmentId || String(e.id) === String(establishmentId);
    });
    if (!establishment) return;
    
    const images = getImages(establishment);
    if (images.length <= 1) return;
    
    const currentIndex = currentImageIndex[establishmentId] || 0;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(prev => ({ ...prev, [establishmentId]: prevIndex }));
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Loading Overlay - apenas quando ainda não há dados */}
      {loading && establishments.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-95 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            <p className="text-lg font-semibold text-gray-700">Carregando estabelecimentos...</p>
          </div>
        </div>
      )}
      
      {/* Loading indicator quando há dados mas está recarregando */}
      {loading && establishments.length > 0 && (
        <div className="mb-4 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
            <span className="text-sm font-medium text-gray-600">Atualizando...</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estabelecimentos</h1>
            <p className="mt-1 text-sm text-gray-500">
              {filteredEstablishments.length} {filteredEstablishments.length === 1 ? 'estabelecimento encontrado' : 'estabelecimentos encontrados'}
            </p>
          </div>
          {canEditDelete && (
            <button
              onClick={handleCreate}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Estabelecimento
            </button>
          )}
        </div>

        {/* Barra de pesquisa melhorada */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Pesquisar por nome, endereço, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-12 pr-4 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border-l-4 border-red-500 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Renderizar conteúdo imediatamente - sempre mostrar estrutura */}
      {filteredEstablishments.length > 0 ? (
        <>
          {/* Grid de Cards */}
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedEstablishments.map((establishment) => {
              // Validação de segurança (os dados já foram filtrados, mas manter por segurança)
              if (!establishment) {
                console.warn("⚠️ Estabelecimento nulo encontrado no map");
                return null;
              }
              
              if (!establishment.id) {
                console.warn("⚠️ Estabelecimento sem ID:", establishment);
                return null;
              }
              
              // Aceitar IDs numéricos ou strings não vazias
              let establishmentId: number | string;
              const numId = Number(establishment.id);
              if (!isNaN(numId) && numId > 0) {
                // ID é um número válido
                establishmentId = numId;
              } else if (typeof establishment.id === 'string' && establishment.id.trim().length > 0) {
                // ID é uma string não vazia (ex: "MAKTUBIA_SHOP_010")
                establishmentId = establishment.id;
              } else {
                console.warn("⚠️ Estabelecimento com ID inválido:", establishment.id, establishment);
                return null;
              }
              
              const images = getImages(establishment);
              const currentImage = getCurrentImage(establishment);
              const hasMultipleImages = images.length > 1;
              
              // Usar establishmentId normalizado
              const normalizedEstablishment = { ...establishment, id: establishmentId };
              
              return (
                <div
                  key={establishmentId}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-lg shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gray-300/50"
                >
                  {/* Imagem */}
                  <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={currentImage}
                      alt={establishment.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/logo2.png";
                      }}
                    />
                    {/* Overlay gradiente sutil */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                    
                    {/* Badge de Status */}
                    <div className="absolute right-3 top-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm ${
                          (establishment.status === "active" || establishment.isActive)
                            ? "bg-green-500/90 text-white"
                            : "bg-red-500/90 text-white"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          (establishment.status === "active" || establishment.isActive)
                            ? "bg-green-200"
                            : "bg-red-200"
                        }`}></span>
                        {(establishment.status === "active" || establishment.isActive) ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    
                    {/* Badge de Tipo */}
                    {establishment.type && (
                      <div className="absolute left-3 top-3">
                        <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-md backdrop-blur-sm">
                          {establishment.type}
                        </span>
                      </div>
                    )}
                    
                    {/* Botões de navegação de imagens */}
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage(establishmentId);
                          }}
                          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-gray-700 shadow-lg backdrop-blur-sm opacity-0 transition-all duration-200 hover:bg-white hover:scale-110 group-hover:opacity-100"
                          title="Imagem anterior"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage(establishmentId);
                          }}
                          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-gray-700 shadow-lg backdrop-blur-sm opacity-0 transition-all duration-200 hover:bg-white hover:scale-110 group-hover:opacity-100"
                          title="Próxima imagem"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
                          {((currentImageIndex[establishmentId] || 0) + 1)} / {images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="p-5">
                    <h3 className="mb-2 break-words text-xl font-bold text-gray-900">
                      {establishment.name}
                    </h3>
                    
                    {establishment.description && (
                      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600">
                        {establishment.description}
                      </p>
                    )}

                    <div className="mb-5 space-y-2.5">
                      {establishment.address && (
                        <div className="flex items-start gap-2.5 rounded-lg bg-gray-50 p-2.5 text-sm text-gray-700">
                          <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="break-words leading-relaxed">{establishment.address}</span>
                        </div>
                      )}
                      
                      {establishment.phone && (
                        <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 p-2.5 text-sm text-gray-700">
                          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="font-medium">{establishment.phone}</span>
                        </div>
                      )}
                      
                      {establishment.email && (
                        <div className="flex items-center gap-2.5 rounded-lg bg-gray-50 p-2.5 text-sm text-gray-700">
                          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="break-all font-medium">{establishment.email}</span>
                        </div>
                      )}

                      {/* QR Code */}
                      {(establishment.qrCode || establishment.qr_code) && (
                        <div className="flex items-start justify-between gap-3 rounded-lg border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white p-3">
                          <div className="flex min-w-0 flex-1 items-start gap-2.5">
                            <div className="shrink-0 rounded-lg bg-blue-50 p-2">
                              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                            </div>
                            <span className="min-w-0 break-words font-mono text-xs font-semibold text-gray-600">
                              {establishment.qrCode || establishment.qr_code}
                            </span>
                          </div>
                          <div className="shrink-0 rounded-lg border-2 border-gray-200 bg-white p-1.5 shadow-sm">
                            <QRCodeSVG
                              value={establishment.qrCode || establishment.qr_code || ""}
                              size={40}
                              level="M"
                              includeMargin={false}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="border-t border-gray-100 pt-3">
                      {canEditDelete ? (
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleView(establishmentId)}
                            className="group flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-700 hover:shadow-md"
                            title="Ver Detalhes"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="hidden sm:inline">Ver</span>
                          </button>
                          <button
                            onClick={() => handleEdit(establishmentId)}
                            className="group flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
                            title="Editar"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(normalizedEstablishment)}
                            disabled={deleteLoading}
                            className="group flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-red-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Eliminar"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden sm:inline">Eliminar</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleView(establishmentId)}
                          className="group flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-700 hover:shadow-md"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver Detalhes
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>
                
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-xl px-4 py-2.5 font-semibold transition-all duration-200 ${
                            currentPage === page
                              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                              : "border-2 border-gray-200 bg-white text-gray-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={`ellipsis-${page}`} className="px-2 text-gray-400">...</span>;
                    } else {
                      return null;
                    }
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-2.5 font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-700"
                >
                  Próxima
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Info de paginação */}
              <div className="rounded-xl bg-white px-6 py-3 shadow-sm">
                <p className="text-sm font-medium text-gray-600">
                  Mostrando <span className="font-bold text-gray-900">{startIndex + 1}</span> - <span className="font-bold text-gray-900">{Math.min(endIndex, filteredEstablishments.length)}</span> de <span className="font-bold text-gray-900">{filteredEstablishments.length}</span> estabelecimentos
                </p>
              </div>
            </div>
          )}
        </>
      ) : filteredEstablishments.length === 0 && !loading ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-lg">
          <div className="mx-auto max-w-md">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-gray-100 p-4">
                <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              {searchTerm ? "Nenhum resultado encontrado" : "Nenhum estabelecimento cadastrado"}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? `Não encontramos estabelecimentos que correspondam a "${searchTerm}"` 
                : "Comece adicionando seu primeiro estabelecimento"}
            </p>
            {canEditDelete && !searchTerm && (
              <button
                onClick={handleCreate}
                className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/30"
              >
                Criar Primeiro Estabelecimento
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Modal de Confirmação */}
      {establishmentToDelete && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Confirmar Eliminação"
          message={`Tem certeza que deseja eliminar o estabelecimento "${establishmentToDelete.name || "sem nome"}"?\n\nID: #${establishmentToDelete.id}\nTipo: ${establishmentToDelete.type || "-"}\nEndereço: ${establishmentToDelete.address || "-"}\nEmail: ${establishmentToDelete.email || "-"}\nTelefone: ${establishmentToDelete.phone || "-"}\n\nEsta ação não pode ser desfeita.`}
          confirmText="Sim, Eliminar"
          cancelText="Cancelar"
          type="danger"
          isLoading={deleteLoading}
        />
      )}

      {/* Modal de Alerta */}
      {alertConfig && (
        <AlertModal
          isOpen={alertModalOpen}
          onClose={() => {
            setAlertModalOpen(false);
            setAlertConfig(null);
          }}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          confirmText="OK"
          autoClose={alertConfig.type === "success" ? 3000 : 0}
        />
      )}
    </div>
  );
}

