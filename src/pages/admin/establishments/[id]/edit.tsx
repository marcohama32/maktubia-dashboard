import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { establishmentService, UpdateEstablishmentDTO } from "@/services/establishment.service";
import { API_BASE_URL } from "@/services/api";
import { processImageUrl } from "@/utils/imageUrl";

export default function EditEstablishmentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<UpdateEstablishmentDTO>({
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

  useEffect(() => {
    // Verificar se router está pronto e se id existe
    if (!router.isReady) {
      return; // Aguardar router estar pronto
    }
    
    if (id && typeof id === "string" && id !== "undefined") {
      const numericId = parseInt(id);
      if (!isNaN(numericId) && numericId > 0) {
        loadEstablishment(numericId);
      } else {
        setError("ID inválido");
        setLoading(false);
      }
    } else if (!id || id === "undefined") {
      setError("ID não fornecido");
      setLoading(false);
    }
  }, [id, router.isReady]);

  const loadEstablishment = async (establishmentId: number) => {
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
        image: data.image || "",
        imageUrl: data.imageUrl || "",
        qrCode: data.qrCode || "",
        color: data.color || "#4CAF50",
        isActive: activeStatus,
        status: activeStatus ? "active" : "inactive",
      });
      
      console.log("✅ Dados do estabelecimento carregados:", data);
      console.log("📝 FormData atualizado:", formData);
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

    if (!id || typeof id !== "string") {
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
      } else if (formData.image) {
        formDataToSend.append("image", formData.image);
      }
      
      if (imageFile2) {
        formDataToSend.append("imageUrl", imageFile2);
      } else if (formData.imageUrl) {
        formDataToSend.append("imageUrl", formData.imageUrl);
      }

      // Envia usando fetch para poder enviar FormData
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const response = await fetch(`${API_BASE_URL}/establishments/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro ao actualizar estabelecimento" }));
        throw new Error(errorData.message || errorData.error || "Erro ao actualizar estabelecimento");
      }

      await response.json();
      
      // Redireciona para a página de detalhes após salvar
      router.push(`/admin/establishments/${id}`);
    } catch (err: any) {
      console.error("❌ Erro ao actualizar estabelecimento:", err);
      setError(err.message || "Erro ao actualizar estabelecimento");
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

  // Função para processar URLs de imagens

  // Função para lidar com upload de arquivo
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verifica se é uma imagem
    if (!file.type.startsWith("image/")) {
      alert("Por favor, seleccione um ficheiro de imagem válido");
      return;
    }

    // Verifica o tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB");
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

  // Função para remover preview de arquivo
  const handleRemoveImage = (imageNumber: 1 | 2) => {
    if (imageNumber === 1) {
      setImagePreview1("");
      setImageFile1(null);
    } else {
      setImagePreview2("");
      setImageFile2(null);
    }
  };

  // Função para fazer upload da imagem - não usada, enviamos diretamente no FormData

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Editar Estabelecimento</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              value={formData.type || ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Selecione o tipo</option>
              <option value="Loja">Loja</option>
              <option value="Restaurante">Restaurante</option>
              <option value="Café">Café</option>
              <option value="Serviço">Serviço</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description || ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Endereço
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                Imagem 1 (image)
              </label>
              
              {/* Upload de arquivo */}
              <div className="mb-2">
                <label htmlFor="imageFile1" className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="ml-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remover
                  </button>
                )}
              </div>

              {/* OU URL */}
              <div className="mb-2 text-center text-xs text-gray-500">OU</div>

              {/* Campo de URL */}
              <input
                type="text"
                id="image"
                name="image"
                value={formData.image || ""}
                onChange={handleChange}
                placeholder="assets/images/loja1.jpeg"
                disabled={!!imageFile1}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">Caminho da primeira imagem</p>
              
              {/* Preview */}
              {(imagePreview1 || formData.image) && (
                <div className="group relative mt-2 overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={imagePreview1 || processImageUrl(formData.image || "")}
                    alt="Preview Imagem 1"
                    className="h-32 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/logo2.png";
                    }}
                  />
                  <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-40">
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.getElementById("imageFile1") as HTMLInputElement;
                        if (fileInput) {
                          fileInput.value = "";
                          fileInput.click();
                        }
                      }}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 opacity-0 shadow-xl transition-all duration-200 hover:bg-gray-100 group-hover:opacity-100"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Ver Outra
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                Imagem 2 (imageUrl)
              </label>
              
              {/* Upload de arquivo */}
              <div className="mb-2">
                <label htmlFor="imageFile2" className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="ml-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remover
                  </button>
                )}
              </div>

              {/* OU URL */}
              <div className="mb-2 text-center text-xs text-gray-500">OU</div>

              {/* Campo de URL */}
              <input
                type="text"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl || ""}
                onChange={handleChange}
                placeholder="assets/images/loja2.jpeg"
                disabled={!!imageFile2}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">Caminho da segunda imagem</p>
              
              {/* Preview */}
              {(imagePreview2 || formData.imageUrl) && (
                <div className="group relative mt-2 overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={imagePreview2 || processImageUrl(formData.imageUrl || "")}
                    alt="Preview Imagem 2"
                    className="h-32 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/logo2.png";
                    }}
                  />
                  <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-40">
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.getElementById("imageFile2") as HTMLInputElement;
                        if (fileInput) {
                          fileInput.value = "";
                          fileInput.click();
                        }
                      }}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 opacity-0 shadow-xl transition-all duration-200 hover:bg-gray-100 group-hover:opacity-100"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Ver Outra
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="qrCode" className="block text-sm font-medium text-gray-700">
                Código QR
              </label>
              <input
                type="text"
                id="qrCode"
                name="qrCode"
                value={formData.qrCode || ""}
                onChange={handleChange}
                placeholder="MAKTUBIA_SHOP_001"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                Cor
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color || "#4CAF50"}
                  onChange={handleChange}
                  className="h-10 w-20 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.color || "#4CAF50"}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#4CAF50"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {saving ? "A guardar..." : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

