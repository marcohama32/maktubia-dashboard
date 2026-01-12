import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { establishmentService, Establishment } from "@/services/establishment.service";
import { QRCodeSVG } from "qrcode.react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { processImageUrl } from "@/utils/imageUrl";

const ITEMS_PER_PAGE = 12;

export default function EstablishmentsPage() {
  const router = useRouter();
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
      
      // Filtrar estabelecimentos com ID válido (a normalização já foi feita no serviço)
      const validEstablishments = data.filter((est) => {
        const hasValidId = est && est.id != null && !isNaN(Number(est.id)) && Number(est.id) > 0;
        if (!hasValidId) {
          console.warn("⚠️ Estabelecimento sem ID válido ignorado:", {
            name: est?.name,
            type: est?.type,
            id: est?.id
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

  const handleEdit = (id: number) => {
    if (!id || isNaN(id)) {
      console.error("ID inválido para edição:", id);
      return;
    }
    router.push(`/admin/establishments/${id}/edit`);
  };

  const handleView = (id: number) => {
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
    const index = currentImageIndex[establishment.id] || 0;
    return images[index] || images[0] || "/images/logo2.png";
  };

  // Função para navegar para a próxima imagem
  const nextImage = (establishmentId: number) => {
    const establishment = establishments.find(e => e.id === establishmentId);
    if (!establishment) return;
    
    const images = getImages(establishment);
    if (images.length <= 1) return;
    
    const currentIndex = currentImageIndex[establishmentId] || 0;
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentImageIndex(prev => ({ ...prev, [establishmentId]: nextIndex }));
  };

  // Função para navegar para a imagem anterior
  const prevImage = (establishmentId: number) => {
    const establishment = establishments.find(e => e.id === establishmentId);
    if (!establishment) return;
    
    const images = getImages(establishment);
    if (images.length <= 1) return;
    
    const currentIndex = currentImageIndex[establishmentId] || 0;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(prev => ({ ...prev, [establishmentId]: prevIndex }));
  };

  return (
    <div className="relative p-6">
      {/* Loading Overlay - apenas quando ainda não há dados */}
      {loading && establishments.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando estabelecimentos...</p>
          </div>
        </div>
      )}
      
      {/* Loading indicator quando há dados mas está recarregando */}
      {loading && establishments.length > 0 && (
        <div className="mb-4 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span className="text-sm">Atualizando...</span>
          </div>
        </div>
      )}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Estabelecimentos</h1>
        <button
          onClick={handleCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + Novo Estabelecimento
        </button>
      </div>

      {/* Barra de pesquisa */}
      <div className="mb-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Pesquisar estabelecimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Renderizar conteúdo imediatamente - sempre mostrar estrutura */}
      {filteredEstablishments.length > 0 ? (
        <>
          {/* Grid de Cards */}
          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedEstablishments.map((establishment) => {
              // Validação de segurança (os dados já foram filtrados, mas manter por segurança)
              if (!establishment || !establishment.id || isNaN(Number(establishment.id))) {
                return null;
              }
              
              const images = getImages(establishment);
              const currentImage = getCurrentImage(establishment);
              const hasMultipleImages = images.length > 1;
              
              return (
                <div
                  key={establishment.id}
                  className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-xl"
                >
                  {/* Imagem */}
                  <div className="group relative h-48 w-full bg-gray-200">
                    <img
                      src={currentImage}
                      alt={establishment.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/logo2.png";
                      }}
                    />
                    <div className="absolute right-2 top-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          (establishment.status === "active" || establishment.isActive)
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {(establishment.status === "active" || establishment.isActive) ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    
                    {/* Botões de navegação de imagens */}
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage(establishment.id);
                          }}
                          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white opacity-0 transition-opacity hover:bg-opacity-70 group-hover:opacity-100"
                          title="Imagem anterior"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage(establishment.id);
                          }}
                          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white opacity-0 transition-opacity hover:bg-opacity-70 group-hover:opacity-100"
                          title="Próxima imagem"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black bg-opacity-50 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                          {((currentImageIndex[establishment.id] || 0) + 1)} / {images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="p-4">
                    <h3 className="mb-2 truncate text-lg font-semibold text-gray-900">
                      {establishment.name}
                    </h3>
                    
                    {establishment.description && (
                      <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                        {establishment.description}
                      </p>
                    )}

                    <div className="mb-4 space-y-2">
                      {establishment.address && (
                        <div className="flex items-start text-sm text-gray-500">
                          <svg className="mr-2 mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{establishment.address}</span>
                        </div>
                      )}
                      
                      {establishment.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="mr-2 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{establishment.phone}</span>
                        </div>
                      )}
                      
                      {establishment.email && (
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="mr-2 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{establishment.email}</span>
                        </div>
                      )}

                      {/* QR Code */}
                      {(establishment.qrCode || establishment.qr_code) && (
                        <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            <span className="max-w-[120px] truncate font-mono text-xs text-gray-500">
                              {establishment.qrCode || establishment.qr_code}
                            </span>
                          </div>
                          <div className="shrink-0 rounded border border-gray-200 bg-white p-1">
                            <QRCodeSVG
                              value={establishment.qrCode || establishment.qr_code || ""}
                              size={48}
                              level="M"
                              includeMargin={false}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex flex-col gap-2 border-t border-gray-200 pt-2">
                      <button
                        onClick={() => handleView(establishment.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm text-white transition-colors hover:bg-green-700"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver Detalhes
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (establishment?.id) {
                              handleEdit(establishment.id);
                            }
                          }}
                          className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                        >
                          Editar
                        </button>
                              <button
                                onClick={() => handleDeleteClick(establishment)}
                                disabled={deleteLoading}
                                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                              >
                                Eliminar
                              </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              
              <div className="flex items-center gap-1">
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
                        className={`rounded-lg px-4 py-2 ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={`ellipsis-${page}`} className="px-2">...</span>;
                  } else {
                    return null;
                  }
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          )}

          {/* Info de paginação */}
          <div className="mt-4 text-center text-sm text-gray-500">
            Mostrando {startIndex + 1} - {Math.min(endIndex, filteredEstablishments.length)} de {filteredEstablishments.length} estabelecimentos
          </div>
        </>
      ) : filteredEstablishments.length === 0 && !loading ? (
        <div className="rounded-lg bg-white py-12 text-center shadow">
          <p className="text-lg text-gray-500">
            {searchTerm ? "Nenhum estabelecimento encontrado com essa pesquisa" : "Nenhum estabelecimento encontrado"}
          </p>
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

