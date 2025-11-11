import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { userService, CreateUserDTO } from "@/services/user.service";
import { roleService, Role } from "@/services/role.service";
import {
  validateMozambiquePhone,
  validateDocumentNumber,
  formatDocumentNumber,
  formatMozambiquePhone,
  MOZAMBIQUE_DOCUMENT_TYPES,
  DocumentType,
} from "@/utils/mozambiqueValidators";

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [documentError, setDocumentError] = useState<string>("");
  const [formData, setFormData] = useState<CreateUserDTO & { documentType: DocumentType; documentNumber: string }>({
    name: "",
    username: "",
    email: "",
    phone: "",
    bi: "",
    documentType: "BI",
    documentNumber: "",
    password: "",
    role: "",
    isActive: true,
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      setError("");
      
      // Buscar todas as roles ativas do backend
      const response = await roleService.getAll(1, 100, "", true);
      const allRoles = response.data || [];
      
      // Filtrar apenas as 3 roles do sistema de pontos: admin, merchant, user
      const systemRoles = allRoles.filter((role: Role) => {
        const roleName = (role.name || "").toLowerCase().trim();
        return roleName === "admin" || roleName === "merchant" || roleName === "user";
      });
      
      // Se não encontrou as roles no backend, usar roles padrão do sistema
      if (systemRoles.length === 0) {
        console.warn("⚠️ Roles do sistema não encontradas no backend, usando roles padrão");
        setRoles([
          { id: 1, name: "admin", description: "Administrador do sistema com acesso total" },
          { id: 2, name: "merchant", description: "Merchant (gerencia estabelecimentos e campanhas)" },
          { id: 3, name: "user", description: "Cliente padrão do sistema de pontos" },
        ]);
      } else {
        setRoles(systemRoles);
      }
    } catch (err: any) {
      console.error("Erro ao carregar roles:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      
      // Se houver erro de rede ou não encontrar roles, usar roles padrão do sistema
      if (isNetworkError || err.message?.includes("não encontrada")) {
        console.warn("⚠️ Usando roles padrão do sistema devido a erro ao buscar do backend");
        setRoles([
          { id: 1, name: "admin", description: "Administrador do sistema com acesso total" },
          { id: 2, name: "merchant", description: "Merchant (gerencia estabelecimentos e campanhas)" },
          { id: 3, name: "user", description: "Cliente padrão do sistema de pontos" },
        ]);
      } else if (!isNetworkError) {
        setError(err.message || "Erro ao carregar roles");
      }
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPhoneError("");
    setDocumentError("");

    if (!formData.username || !formData.username.trim()) {
      setError("Username é obrigatório");
      return;
    }

    if (!formData.name || !formData.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (!formData.password || formData.password.trim().length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (!formData.role || !formData.role.trim()) {
      setError("Função (role) é obrigatória");
      return;
    }

    // Validar telefone
    if (formData.phone) {
      const phoneValidation = validateMozambiquePhone(formData.phone);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error || "Telefone inválido");
        return;
      }
    }

    // Validar documento
    if (formData.documentNumber) {
      const documentValidation = validateDocumentNumber(formData.documentType, formData.documentNumber);
      if (!documentValidation.isValid) {
        setDocumentError(documentValidation.error || "Documento inválido");
        return;
      }
    }

    try {
      setLoading(true);
      
      // Preparar dados para envio - enviar tipo_documento e numero_documento ao backend
      const userData: CreateUserDTO & { tipo_documento?: string; numero_documento?: string } = {
        name: formData.name,
        username: formData.username,
        email: formData.email || undefined,
        phone: formData.phone ? formatMozambiquePhone(formData.phone) : undefined,
        password: formData.password,
        role: formData.role || undefined,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        // Enviar tipo_documento e numero_documento (novos campos do backend)
        tipo_documento: formData.documentType && formData.documentNumber ? formData.documentType : undefined,
        numero_documento: formData.documentNumber 
          ? formatDocumentNumber(formData.documentType, formData.documentNumber).replace(/\s+/g, "")
          : undefined,
        // Manter bi para compatibilidade (se não houver tipo_documento/numero_documento)
        bi: !formData.documentType && !formData.documentNumber && formData.bi 
          ? formData.bi 
          : (formData.documentType === "BI" && formData.documentNumber 
            ? formatDocumentNumber("BI", formData.documentNumber).replace(/\s+/g, "")
            : undefined),
      };
      
      // Remover campos undefined para não enviar ao backend
      Object.keys(userData).forEach(key => {
        const value = userData[key as keyof typeof userData];
        if (value === undefined) {
          delete userData[key as keyof typeof userData];
        }
      });
      
      console.log("📤 [NEW USER] Dados finais para envio:", userData);
      
      await userService.create(userData);
      
      // Redireciona para a lista de usuários
      router.push("/admin/users");
    } catch (err: any) {
      setError(err.message || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Limpar erros quando o usuário começar a digitar
    if (name === "phone") {
      setPhoneError("");
    }
    if (name === "documentNumber" || name === "documentType") {
      setDocumentError("");
    }
    
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };
      
      // Se mudou o tipo de documento, limpar o número do documento
      if (name === "documentType") {
        newData.documentNumber = "";
      }
      
      return newData;
    });
  };

  const handlePhoneBlur = () => {
    if (formData.phone) {
      const validation = validateMozambiquePhone(formData.phone);
      if (!validation.isValid) {
        setPhoneError(validation.error || "Telefone inválido");
      } else {
        // Formatar telefone quando válido
        setFormData(prev => ({
          ...prev,
          phone: formatMozambiquePhone(prev.phone),
        }));
      }
    }
  };

  const handleDocumentBlur = () => {
    if (formData.documentNumber) {
      const validation = validateDocumentNumber(formData.documentType, formData.documentNumber);
      if (!validation.isValid) {
        setDocumentError(validation.error || "Documento inválido");
      } else {
        // Formatar documento quando válido
        setFormData(prev => ({
          ...prev,
          documentNumber: formatDocumentNumber(prev.documentType, prev.documentNumber),
        }));
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Usuário</h1>
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
              value={formData.name || ""}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                value={formData.username || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                onBlur={handlePhoneBlur}
                placeholder="+258841234567 ou 841234567"
                className={`mt-1 block w-full rounded-md border ${
                  phoneError ? "border-red-300" : "border-gray-300"
                } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
              />
              {phoneError && (
                <p className="mt-1 text-xs text-red-600">{phoneError}</p>
              )}
              {!phoneError && formData.phone && (
                <p className="mt-1 text-xs text-gray-500">
                  Formato: +258XXXXXXXX ou 8XXXXXXXX (operadoras: 82-88)
                </p>
              )}
            </div>

            <div>
              <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
                Tipo de Documento
              </label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                {MOZAMBIQUE_DOCUMENT_TYPES.map((docType) => (
                  <option key={docType.value} value={docType.value}>
                    {docType.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700">
              Número do Documento
            </label>
            <input
              type="text"
              id="documentNumber"
              name="documentNumber"
              value={formData.documentNumber || ""}
              onChange={handleChange}
              onBlur={handleDocumentBlur}
              placeholder={
                formData.documentType === "BI"
                  ? "13 dígitos (ex: 1234567890123)"
                  : formData.documentType === "NUIT"
                  ? "9 dígitos (ex: 123456789)"
                  : formData.documentType === "Passaporte"
                  ? "6-9 caracteres alfanuméricos"
                  : formData.documentType === "Carta de Condução"
                  ? "8-10 caracteres alfanuméricos"
                  : "Número do documento"
              }
              className={`mt-1 block w-full rounded-md border ${
                documentError ? "border-red-300" : "border-gray-300"
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
            />
            {documentError && (
              <p className="mt-1 text-xs text-red-600">{documentError}</p>
            )}
            {!documentError && formData.documentType && (
              <p className="mt-1 text-xs text-gray-500">
                {formData.documentType === "BI"
                  ? "BI: 13 dígitos numéricos"
                  : formData.documentType === "NUIT"
                  ? "NUIT: 9 dígitos numéricos"
                  : formData.documentType === "Passaporte"
                  ? "Passaporte: 6-9 caracteres alfanuméricos"
                  : formData.documentType === "Carta de Condução"
                  ? "Carta de Condução: 8-10 caracteres alfanuméricos"
                  : "Digite o número do documento"}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password || ""}
                onChange={handleChange}
                minLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Mínimo de 6 caracteres</p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Função <span className="text-red-500">*</span>
              </label>
              {loadingRoles ? (
                <div className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm bg-gray-50">
                  <span className="text-sm text-gray-500">Carregando roles...</span>
                </div>
              ) : (
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">Selecione a função</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name} {role.description ? `- ${role.description}` : ""}
                    </option>
                  ))}
                </select>
              )}
              {roles.length === 0 && !loadingRoles && (
                <p className="mt-1 text-xs text-gray-500">
                  Nenhuma role disponível. Verifique se o backend está rodando.
                </p>
              )}
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
                setFormData(prev => ({ ...prev, isActive }));
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
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "A guardar..." : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

