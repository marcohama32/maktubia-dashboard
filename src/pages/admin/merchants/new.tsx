import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { merchantsService, CreateMerchantDTO } from "@/services/merchants.service";
import { userService } from "@/services/user.service";
import { establishmentService } from "@/services/establishment.service";
import { isAdmin } from "@/utils/roleUtils";
import { AlertModal } from "@/components/modals/AlertModal";

export default function NewMerchantPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const redirectRef = useRef(false);
  
  // Estados para pesquisa de usuário
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Estados para pesquisa de estabelecimento
  const [establishmentSearchTerm, setEstablishmentSearchTerm] = useState<string>("");
  const [isEstablishmentDropdownOpen, setIsEstablishmentDropdownOpen] = useState(false);
  const establishmentDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | number>(0);

  const [formData, setFormData] = useState<CreateMerchantDTO>({
    user_id: 0,
    establishment_id: 0,
    can_create_campaigns: false,
    can_set_custom_points: false,
    is_active: true,
  });
  
  // Estados para seleção múltipla
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [isMultipleMode, setIsMultipleMode] = useState(false);

  // Verificar se o usuário é admin
  useEffect(() => {
    if (user && !isAdmin(user)) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (user && isAdmin(user)) {
      loadUsers();
      loadEstablishments();
    }
  }, [user]);

  // Verificar se há establishment_id na query para pré-selecionar
  useEffect(() => {
    const { establishment_id } = router.query;
    if (establishment_id && !isNaN(Number(establishment_id))) {
      const estId = Number(establishment_id);
      setSelectedEstablishmentId(estId);
      setFormData(prev => ({
        ...prev,
        establishment_id: estId,
      }));
    }
  }, [router.query]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Carregar apenas usuários com role "merchant" (não "admin" ou "user")
      const response = await userService.getAll(1, 1000, "", null);
      const allUsers = response.data || [];
      
      // Filtrar apenas usuários com role "merchant" (não "admin" ou outros)
      const merchantUsers = allUsers.filter((u: any) => {
        const role = u.role?.name || u.role_name || u.role || "";
        const roleLower = String(role).toLowerCase().trim();
        // Apenas merchants (não admins)
        return roleLower === "merchant" || roleLower === "merchante" || roleLower === "comerciante";
      });
      
      setUsers(merchantUsers);
    } catch (err: any) {
      console.error("Erro ao carregar usuários:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar usuários");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadEstablishments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await establishmentService.getAll(true);
      setEstablishments(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar estabelecimentos:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar estabelecimentos");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação: establishment_id obrigatório
    console.log("🔍 [MERCHANTS] Validando formulário antes de submeter:", {
      formDataEstablishmentId: formData.establishment_id,
      selectedEstablishmentId,
      establishmentsCount: establishments.length
    });
    
    if (!formData.establishment_id || formData.establishment_id === 0) {
      console.error("❌ [MERCHANTS] Erro: Estabelecimento não selecionado");
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, selecione um estabelecimento.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }
    
    console.log("✅ [MERCHANTS] Validação passou, estabelecimento selecionado:", {
      establishmentId: formData.establishment_id,
      establishmentName: establishments.find(e => (e.id || e.establishment_id) === formData.establishment_id)?.name
    });

    // Modo múltiplo: validar se há merchants selecionados
    if (isMultipleMode) {
      if (selectedUserIds.size === 0) {
        setAlertConfig({
          title: "Erro!",
          message: "Por favor, selecione pelo menos um merchant para alocar.",
          type: "error",
        });
        setAlertModalOpen(true);
        return;
      }
      
      // Criar múltiplos merchants
      await createMultipleMerchants();
      return;
    }

    // Modo único: validar user_id
    if (!formData.user_id || formData.user_id === 0) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, selecione um usuário.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    // Validação: verificar se o usuário selecionado tem role merchant
    const selectedUser = users.find(u => u.id === formData.user_id);
    if (selectedUser) {
      const role = selectedUser.role?.name || selectedUser.role_name || selectedUser.role || "";
      const roleLower = String(role).toLowerCase().trim();
      if (roleLower !== "merchant" && roleLower !== "merchante" && roleLower !== "comerciante") {
        setAlertConfig({
          title: "Erro!",
          message: "Apenas usuários com role 'merchant' podem ser alocados a estabelecimentos.",
          type: "error",
        });
        setAlertModalOpen(true);
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      
      // Preparar dados para envio - apenas campos válidos
      const merchantData: CreateMerchantDTO = {
        user_id: formData.user_id,
        establishment_id: formData.establishment_id,
        can_create_campaigns: formData.can_create_campaigns || false,
        can_set_custom_points: formData.can_set_custom_points || false,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
      };

      console.log("📤 [NEW MERCHANT] Enviando dados:", merchantData);
      const createdMerchant = await merchantsService.create(merchantData);
      console.log("✅ [NEW MERCHANT] Merchant criado:", createdMerchant);
      
      setAlertConfig({
        title: "Sucesso!",
        message: "Merchant criado com sucesso!",
        type: "success",
      });
      setAlertModalOpen(true);
      
      // Redirecionar após 2 segundos (apenas uma vez)
      if (!redirectRef.current) {
        redirectRef.current = true;
        setTimeout(() => {
          const merchantId = createdMerchant.merchant_id || createdMerchant.id;
          if (merchantId) {
            router.replace(`/admin/merchants/${merchantId}`);
          } else {
            router.replace("/admin/merchants");
          }
        }, 2000);
      }
    } catch (err: any) {
      console.error("❌ [NEW MERCHANT] Erro ao criar merchant:", err);
      console.error("❌ [NEW MERCHANT] Detalhes do erro:", err.response?.data);
      
      let errorMessage = err.message || "Erro ao criar merchant. Por favor, tente novamente.";
      
      // Extrair mensagem de erro mais detalhada
      const errorData = err.response?.data || {};
      if (errorData.error) {
        if (typeof errorData.error === "string") {
          errorMessage = errorData.error;
        } else if (errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      setAlertConfig({
        title: "Erro!",
        message: errorMessage,
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const createMultipleMerchants = async () => {
    try {
      setSaving(true);
      setError("");
      
      const userIdsArray = Array.from(selectedUserIds);
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Criar merchants em paralelo
      const promises = userIdsArray.map(async (userId) => {
        try {
          const merchantData: CreateMerchantDTO = {
            user_id: userId,
            establishment_id: formData.establishment_id,
            can_create_campaigns: formData.can_create_campaigns || false,
            can_set_custom_points: formData.can_set_custom_points || false,
            is_active: formData.is_active !== undefined ? formData.is_active : true,
          };

          await merchantsService.create(merchantData);
          results.success++;
        } catch (err: any) {
          results.failed++;
          const user = users.find(u => u.id === userId);
          const userName = user?.fullName || user?.username || `ID: ${userId}`;
          const errorMsg = err.response?.data?.message || err.message || "Erro desconhecido";
          results.errors.push(`${userName}: ${errorMsg}`);
        }
      });

      await Promise.all(promises);

      // Mostrar resultado
      if (results.failed === 0) {
        setAlertConfig({
          title: "Sucesso!",
          message: `${results.success} merchant(s) alocado(s) com sucesso!`,
          type: "success",
        });
        setAlertModalOpen(true);
        
        // Redirecionar para o estabelecimento após 2 segundos
        if (!redirectRef.current) {
          redirectRef.current = true;
          setTimeout(() => {
            router.replace(`/admin/establishments/${formData.establishment_id}`);
          }, 2000);
        }
      } else {
        const errorDetails = results.errors.join("\n");
        setAlertConfig({
          title: "Atenção!",
          message: `${results.success} merchant(s) alocado(s) com sucesso, mas ${results.failed} falharam:\n\n${errorDetails}`,
          type: "warning",
        });
        setAlertModalOpen(true);
      }
    } catch (err: any) {
      console.error("❌ [NEW MERCHANT] Erro ao criar múltiplos merchants:", err);
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao criar merchants. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" 
        ? (e.target as HTMLInputElement).checked
        : name === "user_id" || name === "establishment_id"
        ? (value === "" ? 0 : Number(value))
        : value,
    }));
  };

  // Filtrar usuários baseado no termo de pesquisa
  const filteredUsers = users.filter((u) => {
    if (!userSearchTerm || userSearchTerm.trim() === "") {
      // Se não houver termo de pesquisa, mostrar todos os merchants
      return true;
    }
    const searchLower = userSearchTerm.toLowerCase().trim();
    const fullName = (u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const username = (u.username || "").toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower) || username.includes(searchLower);
  });

  // Selecionar usuário
  const handleUserSelect = (userId: number) => {
    setFormData(prev => ({ ...prev, user_id: userId }));
    setUserSearchTerm("");
    setIsUserDropdownOpen(false);
  };

  // Obter nome do usuário selecionado
  const getSelectedUserName = () => {
    if (!formData.user_id || formData.user_id === 0) return "";
    const selectedUser = users.find(u => u.id === formData.user_id);
    if (!selectedUser) return "";
    return selectedUser.fullName || `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() || selectedUser.username || "";
  };

  // Filtrar estabelecimentos baseado no termo de pesquisa
  const filteredEstablishments = establishments.filter((est) => {
    if (!establishmentSearchTerm || establishmentSearchTerm.trim() === "") {
      return true;
    }
    const searchLower = establishmentSearchTerm.toLowerCase().trim();
    const name = (est.name || "").toLowerCase();
    const type = (est.type || "").toLowerCase();
    return name.includes(searchLower) || type.includes(searchLower);
  });

  // Selecionar estabelecimento
  const handleEstablishmentSelect = (establishmentId: string | number) => {
    const selectedEstablishment = establishments.find(e => (e.id || e.establishment_id) === establishmentId);
    console.log("🔍 [MERCHANTS] Selecionando estabelecimento:", {
      establishmentId,
      establishmentIdType: typeof establishmentId,
      establishment: selectedEstablishment,
      name: selectedEstablishment?.name,
      type: selectedEstablishment?.type,
      allEstablishments: establishments.length
    });
    
    // Atualizar estado imediatamente
    setSelectedEstablishmentId(establishmentId);
    
    // Converter para número se possível, senão manter como string
    const establishmentIdForForm = typeof establishmentId === 'string' && !isNaN(Number(establishmentId)) 
      ? Number(establishmentId) 
      : establishmentId;
    
    setFormData(prev => {
      const newFormData = { ...prev, establishment_id: establishmentIdForForm as any };
      console.log("✅ [MERCHANTS] Estabelecimento selecionado:", {
        establishmentId,
        establishmentIdForForm,
        establishmentName: selectedEstablishment?.name,
        formDataBefore: prev.establishment_id,
        formDataAfter: newFormData.establishment_id,
        fullFormData: newFormData
      });
      return newFormData;
    });
    setEstablishmentSearchTerm("");
    setIsEstablishmentDropdownOpen(false);
  };
  
  // Monitorar mudanças no selectedEstablishmentId
  useEffect(() => {
    if (selectedEstablishmentId && selectedEstablishmentId !== 0 && selectedEstablishmentId !== "") {
      console.log("🔄 [MERCHANTS] selectedEstablishmentId mudou:", {
        selectedEstablishmentId,
        formDataEstablishmentId: formData.establishment_id,
        establishmentsCount: establishments.length
      });
    }
  }, [selectedEstablishmentId, formData.establishment_id]);

  // Obter nome do estabelecimento selecionado
  const getSelectedEstablishmentName = () => {
    if (!selectedEstablishmentId || selectedEstablishmentId === 0 || selectedEstablishmentId === "") return "";
    const selectedEstablishment = establishments.find(e => {
      const estId = e.id || e.establishment_id;
      return estId === selectedEstablishmentId || String(estId) === String(selectedEstablishmentId);
    });
    if (!selectedEstablishment) {
      console.warn("⚠️ [MERCHANTS] Estabelecimento não encontrado para ID:", selectedEstablishmentId);
      return "";
    }
    return selectedEstablishment.name || "";
  };

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (establishmentDropdownRef.current && !establishmentDropdownRef.current.contains(event.target as Node)) {
        setIsEstablishmentDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user || !isAdmin(user)) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          Acesso negado. Apenas administradores podem criar merchants.
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="relative p-6">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando dados...</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-900 flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Merchant</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isMultipleMode}
                  onChange={(e) => {
                    setIsMultipleMode(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedUserIds(new Set());
                      setFormData(prev => ({ ...prev, user_id: 0 }));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span>Alocar múltiplos merchants</span>
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {!isMultipleMode ? (
              <div className="relative" ref={userDropdownRef}>
                <label htmlFor="user_search" className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant (Usuário) <span className="text-red-500">*</span>
                </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="user_search"
                  value={formData.user_id && formData.user_id > 0 && !isUserDropdownOpen ? getSelectedUserName() : userSearchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUserSearchTerm(value);
                    setIsUserDropdownOpen(true);
                    // Se o usuário começar a digitar, limpar a seleção
                    if (formData.user_id && formData.user_id > 0) {
                      setFormData(prev => ({ ...prev, user_id: 0 }));
                    }
                  }}
                  onFocus={() => {
                    setIsUserDropdownOpen(true);
                    // Se houver usuário selecionado, limpar para permitir nova pesquisa
                    if (formData.user_id && formData.user_id > 0) {
                      setFormData(prev => ({ ...prev, user_id: 0 }));
                      setUserSearchTerm("");
                    }
                  }}
                  placeholder={formData.user_id && formData.user_id > 0 ? getSelectedUserName() : "Pesquisar merchant por nome, email ou username..."}
                  className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
                  required={formData.user_id === 0 || !formData.user_id}
                />
                {formData.user_id && formData.user_id > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, user_id: 0 }));
                      setUserSearchTerm("");
                      setIsUserDropdownOpen(true);
                    }}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Dropdown de resultados */}
              {isUserDropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                  {filteredUsers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      {userSearchTerm && userSearchTerm.trim() !== "" ? "Nenhum merchant encontrado" : users.length === 0 ? "Nenhum merchant disponível" : "Digite para pesquisar merchants"}
                    </div>
                  ) : (
                    <>
                      {!userSearchTerm || userSearchTerm.trim() === "" ? (
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
                          {filteredUsers.length} merchant{filteredUsers.length !== 1 ? "s" : ""} disponível{filteredUsers.length !== 1 ? "is" : ""}
                        </div>
                      ) : null}
                      {filteredUsers.map((u) => {
                        const fullName = u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Sem nome";
                        const email = u.email || "";
                        const isSelected = formData.user_id === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleUserSelect(u.id)}
                            className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                              isSelected
                                ? "bg-blue-50 text-blue-900"
                                : "text-gray-900 hover:bg-gray-50"
                            }`}
                          >
                            <div className="font-medium">{fullName}</div>
                            {email && (
                              <div className="text-xs text-gray-500">{email}</div>
                            )}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
              
              <p className="mt-1 text-xs text-gray-500">
                Apenas usuários com role "merchant" podem ser alocados a estabelecimentos.
              </p>
            </div>
            ) : (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchants (Usuários) <span className="text-red-500">*</span>
                  {filteredUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      {selectedUserIds.size === filteredUsers.length ? "Desmarcar todos" : "Selecionar todos"}
                    </button>
                  )}
                </label>
                <div className="relative" ref={userDropdownRef}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setIsUserDropdownOpen(true);
                      }}
                      onFocus={() => setIsUserDropdownOpen(true)}
                      placeholder="Pesquisar merchants por nome, email ou username..."
                      className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {selectedUserIds.size > 0 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          {selectedUserIds.size} selecionado{selectedUserIds.size !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Dropdown de resultados com checkboxes */}
                  {isUserDropdownOpen && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                      {filteredUsers.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          {userSearchTerm && userSearchTerm.trim() !== "" ? "Nenhum merchant encontrado" : users.length === 0 ? "Nenhum merchant disponível" : "Digite para pesquisar merchants"}
                        </div>
                      ) : (
                        <>
                          {!userSearchTerm || userSearchTerm.trim() === "" ? (
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
                              {filteredUsers.length} merchant{filteredUsers.length !== 1 ? "s" : ""} disponível{filteredUsers.length !== 1 ? "is" : ""}
                            </div>
                          ) : null}
                          {filteredUsers.map((u) => {
                            const fullName = u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "Sem nome";
                            const email = u.email || "";
                            const isSelected = selectedUserIds.has(u.id);
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => toggleUserSelection(u.id)}
                                className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3 ${
                                  isSelected
                                    ? "bg-blue-50 text-blue-900"
                                    : "text-gray-900 hover:bg-gray-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{fullName}</div>
                                  {email && (
                                    <div className="text-xs text-gray-500">{email}</div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Selecione um ou mais merchants para alocar ao estabelecimento. Apenas usuários com role "merchant" podem ser alocados.
                </p>
                {selectedUserIds.size > 0 && (
                  <div className="mt-2 rounded-lg bg-blue-50 p-3">
                    <p className="text-sm font-medium text-blue-900">
                      {selectedUserIds.size} merchant{selectedUserIds.size !== 1 ? "s" : ""} selecionado{selectedUserIds.size !== 1 ? "s" : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Array.from(selectedUserIds).map(userId => {
                        const user = users.find(u => u.id === userId);
                        const userName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username || `ID: ${userId}`;
                        return (
                          <span
                            key={userId}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                          >
                            {userName}
                            <button
                              type="button"
                              onClick={() => toggleUserSelection(userId)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estabelecimento <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={establishmentDropdownRef}>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={
                      selectedEstablishmentId && selectedEstablishmentId !== 0 && selectedEstablishmentId !== "" && !isEstablishmentDropdownOpen
                        ? getSelectedEstablishmentName()
                        : establishmentSearchTerm
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      setEstablishmentSearchTerm(value);
                      setIsEstablishmentDropdownOpen(true);
                      if (selectedEstablishmentId && selectedEstablishmentId !== 0 && selectedEstablishmentId !== "") {
                        setSelectedEstablishmentId(0);
                        setFormData(prev => ({ ...prev, establishment_id: 0 }));
                      }
                    }}
                    onFocus={() => {
                      setIsEstablishmentDropdownOpen(true);
                    }}
                    placeholder={
                      selectedEstablishmentId && selectedEstablishmentId !== 0 && selectedEstablishmentId !== ""
                        ? getSelectedEstablishmentName()
                        : "Pesquisar estabelecimentos por nome ou tipo..."
                    }
                    className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500"
                    required={!selectedEstablishmentId || selectedEstablishmentId === 0 || selectedEstablishmentId === ""}
                  />
                  {selectedEstablishmentId && selectedEstablishmentId !== 0 && selectedEstablishmentId !== "" && (
                    <button
                      type="button"
                      onClick={() => {
                        console.log("🗑️ [MERCHANTS] Limpando seleção de estabelecimento");
                        setSelectedEstablishmentId(0);
                        setFormData(prev => ({ ...prev, establishment_id: 0 }));
                        setEstablishmentSearchTerm("");
                        setIsEstablishmentDropdownOpen(true);
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Dropdown de resultados */}
                {isEstablishmentDropdownOpen && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                    {filteredEstablishments.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        {establishmentSearchTerm && establishmentSearchTerm.trim() !== "" ? "Nenhum estabelecimento encontrado" : establishments.length === 0 ? "Nenhum estabelecimento disponível" : "Digite para pesquisar estabelecimentos"}
                      </div>
                    ) : (
                      <>
                        {!establishmentSearchTerm || establishmentSearchTerm.trim() === "" ? (
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
                            {filteredEstablishments.length} estabelecimento{filteredEstablishments.length !== 1 ? "s" : ""} disponível{filteredEstablishments.length !== 1 ? "is" : ""}
                          </div>
                        ) : null}
                        {filteredEstablishments.map((est) => {
                          const establishmentId = est.id || est.establishment_id;
                          if (!establishmentId) {
                            console.warn("⚠️ [MERCHANTS] Estabelecimento sem ID:", est);
                            return null;
                          }
                          // Comparar como string para garantir que funciona com IDs string ou número
                          const isSelected = String(selectedEstablishmentId) === String(establishmentId);
                          return (
                            <button
                              key={establishmentId}
                              type="button"
                              onClick={() => {
                                console.log("🖱️ [MERCHANTS] Clicou no estabelecimento:", {
                                  establishmentId,
                                  establishmentIdType: typeof establishmentId,
                                  establishment: est,
                                  name: est.name,
                                  type: est.type,
                                  isSelected,
                                  currentSelectedId: selectedEstablishmentId,
                                  currentSelectedIdType: typeof selectedEstablishmentId,
                                  formDataEstablishmentId: formData.establishment_id
                                });
                                handleEstablishmentSelect(establishmentId);
                              }}
                              className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                                isSelected
                                  ? "bg-blue-50 text-blue-900"
                                  : "text-gray-900 hover:bg-gray-50"
                              }`}
                            >
                              <div className="font-medium">{est.name}</div>
                              {est.type && (
                                <div className="text-xs text-gray-500">{est.type}</div>
                              )}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Selecione um estabelecimento para alocar o(s) merchant(s).
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active !== false}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Ativo
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving 
              ? (isMultipleMode ? `Alocando ${selectedUserIds.size} merchant(s)...` : "Criando...") 
              : (isMultipleMode 
                  ? `Alocar ${selectedUserIds.size > 0 ? selectedUserIds.size : ""} Merchant${selectedUserIds.size !== 1 ? "s" : ""}` 
                  : "Criar Merchant")}
          </button>
        </div>
      </form>

      {/* Modal de Alerta */}
      {alertConfig && (
        <AlertModal
          isOpen={alertModalOpen}
          onClose={() => {
            setAlertModalOpen(false);
            setAlertConfig(null);
            // Não redirecionar aqui - o setTimeout já faz isso para sucesso
            // Apenas fechar o modal
            redirectRef.current = false; // Reset para permitir novo redirecionamento se necessário
          }}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          confirmText="OK"
          autoClose={alertConfig.type === "success" ? 2000 : 0}
        />
      )}
    </div>
  );
}


