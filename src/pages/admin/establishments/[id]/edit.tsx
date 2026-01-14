import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant } from "@/utils/roleUtils";
import { establishmentService, Establishment } from "@/services/establishment.service";
import { API_BASE_URL } from "@/services/api";
import { processImageUrl } from "@/utils/imageUrl";
import { AlertModal } from "@/components/modals/AlertModal";

export default function EditEstablishmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    image: "",
    imageUrl: "",
    qrCode: "",
    color: "#4CAF50",
    isActive: true,
    status: "active",
  });
  const [imagePreview1, setImagePreview1] = useState<string>("");
  const [imagePreview2, setImagePreview2] = useState<string>("");
  const [imageFile1, setImageFile1] = useState<File | null>(null);
  const [imageFile2, setImageFile2] = useState<File | null>(null);
  
  // Estados para modais
  const [showImageError, setShowImageError] = useState(false);
  const [imageErrorMessage, setImageErrorMessage] = useState("");
  
  const userIsAdmin = user ? isAdmin(user) : false;
  const userIsMerchant = user ? isMerchant(user) : false;
  const canEdit = userIsAdmin || userIsMerchant;

  useEffect(() => {
    // Verificar acesso
    if (!canEdit) {
      router.push("/admin/establishments");
      return;
    }

    // Verificar se router está pronto e se id existe
    if (!router.isReady) {
      return;
    }
    
    if (id) {
      // Aceitar ID como string ou número
      const establishmentId = typeof id === 'string' ? id : String(id);
      loadEstablishment(establishmentId);
    } else {
      setError("ID não fornecido");
      setLoading(false);
    }
  }, [id, router.isReady, canEdit]);

  const loadEstablishment = async (establishmentId: string | number) => {
    try {
      setLoading(true);
      setError("");
      const data = await establishmentService.getById(establishmentId);
      
      // Determina o status correto (prioriza isActive sobre status)
      const activeStatus = data.isActive !== undefined ? data.isActive : data.status === "active";
      
      setFormData({
        name: data.name || "",
        type: data.type || "",
        description: data.description || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        image: data.image || data.imageUrl || "",
        imageUrl: data.imageUrl || "",
        qrCode: data.qrCode || data.qr_code || "",
        color: data.color || "#4CAF50",
        isActive: activeStatus,
        status: activeStatus ? "active" : "inactive",
      });

      // Carregar previews das imagens existentes
      if (data.image) {
        setImagePreview1(processImageUrl(data.image));
      }
      if (data.imageUrl) {
        setImagePreview2(processImageUrl(data.imageUrl));
      }
    } catch (err: any) {
      console.error("❌ Erro ao carregar estabelecimento:", err);
      setError(err.message || "Erro ao carregar estabelecimento");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name?.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (!id) {
      setError("ID inválido");
      return;
    }

    try {
      setSaving(true);
      
      // Prepara FormData para enviar arquivos e dados juntos
      const formDataToSend = new FormData();
      
      // Adiciona todos os campos de texto
      formDataToSend.append("name", formData.name);
      if (formData.type) formDataToSend.append("type", formData.type);
      if (formData.description) formDataToSend.append("description", formData.description);
      if (formData.address) formDataToSend.append("address", formData.address);
      if (formData.phone) formDataToSend.append("phone", formData.phone);
      if (formData.email) formDataToSend.append("email", formData.email);
      if (formData.qrCode) formDataToSend.append("qrCode", formData.qrCode);
      if (formData.color) formDataToSend.append("color", formData.color);
      formDataToSend.append("isActive", String(formData.isActive));
      if (formData.status) formDataToSend.append("status", formData.status);
      
      // Adiciona arquivos de imagem se houver
      if (imageFile1) {
        formDataToSend.append("image", imageFile1);
      } else if (formData.image && !formData.image.startsWith("blob:")) {
        // Só envia URL se não for um blob (preview local)
        formDataToSend.append("image", formData.image);
      }
      
      if (imageFile2) {
        formDataToSend.append("imageUrl", imageFile2);
      } else if (formData.imageUrl && !formData.imageUrl.startsWith("blob:")) {
        // Só envia URL se não for um blob (preview local)
        formDataToSend.append("imageUrl", formData.imageUrl);
      }

      // Envia usando fetch para poder enviar FormData
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const establishmentId = typeof id === 'string' ? id : String(id);
      const response = await fetch(`${API_BASE_URL}/establishments/${establishmentId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro ao atualizar estabelecimento" }));
        throw new Error(errorData.message || errorData.error || "Erro ao atualizar estabelecimento");
      }

      await response.json();
      
      // Redireciona para a página de detalhes após salvar
      router.push(`/admin/establishments/${establishmentId}`);
    } catch (err: any) {
      console.error("❌ Erro ao atualizar estabelecimento:", err);
      setError(err.message || "Erro ao atualizar estabelecimento");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verifica se é uma imagem
    if (!file.type.startsWith("image/")) {
      setShowImageError(true);
      setImageErrorMessage("Por favor, selecione um ficheiro de imagem válido");
      return;
    }

    // Verifica o tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setShowImageError(true);
      setImageErrorMessage("A imagem deve ter no máximo 5MB");
      return;
    }

    // Cria preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      if (imageNumber === 1) {
        setImagePreview1(previewUrl);
        setImageFile1(file);
        setFormData(prev => ({ ...prev, image: "" }));
      } else {
        setImagePreview2(previewUrl);
        setImageFile2(file);
        setFormData(prev => ({ ...prev, imageUrl: "" }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (imageNumber: 1 | 2) => {
    if (imageNumber === 1) {
      setImagePreview1("");
      setImageFile1(null);
      setFormData(prev => ({ ...prev, image: "" }));
    } else {
      setImagePreview2("");
      setImageFile2(null);
      setFormData(prev => ({ ...prev, imageUrl: "" }));
    }
  };

  if (!canEdit) {
    return null; // Será redirecionado
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-lg font-semibold text-gray-700">Carregando estabelecimento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          <svg className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Editar Estabelecimento</h1>
        <div className="w-32"></div> {/* Spacer para centralizar */}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-700 shadow-md">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="p-8">
          <div className="space-y-8">
            {/* Informações Básicas */}
            <div className="border-b-2 border-gray-100 pb-6">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Informações Básicas
              </h2>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-700">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Nome do estabelecimento"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="mb-2 block text-sm font-semibold text-gray-700">
                    Tipo
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type || ""}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="Loja">Loja</option>
                    <option value="Restaurante">Restaurante</option>
                    <option value="Café">Café</option>
                    <option value="Serviço">Serviço</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="description" className="mb-2 block text-sm font-semibold text-gray-700">
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description || ""}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Descrição do estabelecimento"
                />
              </div>
            </div>

            {/* Imagens */}
            <div className="border-b-2 border-gray-100 pb-6">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Imagens
              </h2>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Imagem 1 */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Imagem Principal
                  </label>
                  
                  <div className="flex flex-col gap-3">
                    <label
                      htmlFor="imageFile1"
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-blue-400 hover:bg-blue-50"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {imageFile1 ? imageFile1.name : "Carregar Imagem"}
                    </label>
                    <input
                      type="file"
                      id="imageFile1"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, 1)}
                      className="hidden"
                    />
                    
                    {imageFile1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(1)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Remover imagem
                      </button>
                    )}

                    <div className="text-center text-xs text-gray-500">OU</div>

                    <input
                      type="text"
                      id="image"
                      name="image"
                      value={formData.image || ""}
                      onChange={handleChange}
                      placeholder="URL ou caminho da imagem"
                      disabled={!!imageFile1}
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />
                  </div>

                  {(imagePreview1 || formData.image) && (
                    <div className="group relative overflow-hidden rounded-xl border-2 border-gray-200">
                      <img
                        src={imagePreview1 || processImageUrl(formData.image || "")}
                        alt="Preview Imagem 1"
                        className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/logo2.png";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Imagem 2 */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Imagem Secundária
                  </label>
                  
                  <div className="flex flex-col gap-3">
                    <label
                      htmlFor="imageFile2"
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-blue-400 hover:bg-blue-50"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {imageFile2 ? imageFile2.name : "Carregar Imagem"}
                    </label>
                    <input
                      type="file"
                      id="imageFile2"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, 2)}
                      className="hidden"
                    />
                    
                    {imageFile2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(2)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Remover imagem
                      </button>
                    )}

                    <div className="text-center text-xs text-gray-500">OU</div>

                    <input
                      type="text"
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl || ""}
                      onChange={handleChange}
                      placeholder="URL ou caminho da imagem"
                      disabled={!!imageFile2}
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />
                  </div>

                  {(imagePreview2 || formData.imageUrl) && (
                    <div className="group relative overflow-hidden rounded-xl border-2 border-gray-200">
                      <img
                        src={imagePreview2 || processImageUrl(formData.imageUrl || "")}
                        alt="Preview Imagem 2"
                        className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/logo2.png";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contato e Configurações */}
            <div className="border-b-2 border-gray-100 pb-6">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contato e Configurações
              </h2>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="address" className="mb-2 block text-sm font-semibold text-gray-700">
                    Endereço
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Endereço completo"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-gray-700">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="+258 84 000 0000"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label htmlFor="isActive" className="mb-2 block text-sm font-semibold text-gray-700">
                    Status
                  </label>
                  <select
                    id="isActive"
                    name="isActive"
                    value={formData.isActive ? "true" : "false"}
                    onChange={(e) => {
                      const isActive = e.target.value === "true";
                      setFormData(prev => ({ ...prev, isActive, status: isActive ? "active" : "inactive" }));
                    }}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* QR Code e Cor */}
            <div>
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Identificação
              </h2>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="qrCode" className="mb-2 block text-sm font-semibold text-gray-700">
                    Código QR
                  </label>
                  <input
                    type="text"
                    id="qrCode"
                    name="qrCode"
                    value={formData.qrCode || ""}
                    onChange={handleChange}
                    placeholder="MAKTUBIA_SHOP_001"
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="mt-1 text-xs text-gray-500">⚠️ Alterar o QR code pode afetar compras existentes</p>
                </div>

                <div>
                  <label htmlFor="color" className="mb-2 block text-sm font-semibold text-gray-700">
                    Cor do Estabelecimento
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      id="color"
                      name="color"
                      value={formData.color || "#4CAF50"}
                      onChange={handleChange}
                      className="h-14 w-20 cursor-pointer rounded-xl border-2 border-gray-200"
                    />
                    <input
                      type="text"
                      value={formData.color || "#4CAF50"}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#4CAF50"
                      className="flex-1 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-4 border-t-2 border-gray-100 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal de Erro de Imagem */}
      <AlertModal
        isOpen={showImageError}
        onClose={() => setShowImageError(false)}
        title="Erro"
        message={imageErrorMessage}
        type="error"
        confirmText="OK"
      />
    </div>
  );
}
