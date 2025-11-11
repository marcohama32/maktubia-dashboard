import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { customerService, UpdateCustomerDTO } from "@/services/customer.service";
import {
  validateMozambiquePhone,
  validateDocumentNumber,
  formatDocumentNumber,
  formatMozambiquePhone,
  MOZAMBIQUE_DOCUMENT_TYPES,
  DocumentType,
} from "@/utils/mozambiqueValidators";

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [documentError, setDocumentError] = useState<string>("");
  const [formData, setFormData] = useState<UpdateCustomerDTO & { documentType: DocumentType; documentNumber: string }>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    bi: "",
    documentType: "BI",
    documentNumber: "",
    isActive: true,
  });
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (id && typeof id === "string") {
      loadCustomer(parseInt(id));
    }
  }, [id]);

  const loadCustomer = async (customerId: number) => {
    try {
      setLoading(true);
      setError("");
      const data = await customerService.getById(customerId);
      
      // Detectar tipo de documento - priorizar tipo_documento do backend, senão inferir do formato
      let documentType: DocumentType = "BI";
      let documentNumber = (data as any).numero_documento || data.bi || "";
      
      // Se o backend retornou tipo_documento, usar ele
      if ((data as any).tipo_documento) {
        documentType = (data as any).tipo_documento as DocumentType;
      } else if (documentNumber) {
        // Se não houver tipo_documento, inferir do formato do número
        // Se BI tem 13 dígitos, é BI
        if (/^\d{13}$/.test(documentNumber.replace(/\s+/g, ""))) {
          documentType = "BI";
        } else if (/^\d{9}$/.test(documentNumber.replace(/\s+/g, ""))) {
          // Se tem 9 dígitos, pode ser NUIT
          documentType = "NUIT";
        } else if (/^[A-Z0-9]{6,9}$/i.test(documentNumber.replace(/\s+/g, ""))) {
          // Se tem 6-9 caracteres alfanuméricos, pode ser Passaporte
          documentType = "Passaporte";
        } else if (/^[A-Z0-9]{8,10}$/i.test(documentNumber.replace(/\s+/g, ""))) {
          // Se tem 8-10 caracteres alfanuméricos, pode ser Carta de Condução
          documentType = "Carta de Condução";
        } else {
          documentType = "Outro";
        }
      }
      
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        username: data.username || "",
        email: data.email || "",
        phone: data.phone || "",
        bi: data.bi || "",
        documentType: documentType,
        documentNumber: documentNumber,
        isActive: data.isActive !== false,
      });
      setPassword(""); // Não carregar senha (por segurança)
    } catch (err: any) {
      console.error("Erro ao carregar cliente:", err);
      setError(err.message || "Erro ao carregar cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPhoneError("");
    setDocumentError("");

    if (!formData.firstName?.trim() && !formData.lastName?.trim()) {
      setError("Nome (primeiro nome ou último nome) é obrigatório");
      return;
    }

    if (!id || typeof id !== "string") {
      setError("ID inválido");
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
      setSaving(true);
      
      const dataToSend: UpdateCustomerDTO & { tipo_documento?: string; numero_documento?: string } = {
        ...formData,
        phone: formData.phone ? formatMozambiquePhone(formData.phone) : undefined,
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
      
      // Só adiciona senha se foi preenchida
      if (password && password.trim().length > 0) {
        if (password.length < 6) {
          setError("A senha deve ter pelo menos 6 caracteres");
          return;
        }
        dataToSend.password = password;
      }

      await customerService.update(parseInt(id), dataToSend);
      
      // Redireciona para a página de detalhes após salvar
      router.push(`/admin/customers/${id}`);
    } catch (err: any) {
      setError(err.message || "Erro ao actualizar cliente");
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Primeiro Nome
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Último Nome
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Nova Senha (deixe em branco para manter a atual)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Deixe em branco para manter a senha atual. Mínimo de 6 caracteres se alterar.</p>
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

