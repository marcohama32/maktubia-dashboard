import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { userService, UpdateUserDTO } from "@/services/user.service";

export default function EditUserPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<UpdateUserDTO>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    bi: "",
    role: "",
    isActive: true,
  });
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (id && typeof id === "string") {
      loadUser(parseInt(id));
    }
  }, [id]);

  const loadUser = async (userId: number) => {
    try {
      setLoading(true);
      setError("");
      const data = await userService.getById(userId);
      
      // Dividir o nome completo em firstName e lastName se necessário
      let firstName = data.firstName || "";
      let lastName = data.lastName || "";
      
      // Se não houver firstName/lastName mas houver name ou fullName, dividir
      if (!firstName && !lastName && (data.name || data.fullName)) {
        const fullName = data.fullName || data.name || "";
        const nameParts = fullName.trim().split(/\s+/);
        if (nameParts.length > 0) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(" ") || "";
        }
      }
      
      setFormData({
        firstName: firstName,
        lastName: lastName,
        username: data.username || "",
        email: data.email || "",
        phone: data.phone || "",
        bi: data.bi || "",
        role: typeof data.role === "string" ? data.role : (data.role?.name || ""),
        isActive: data.isActive !== false,
      });
      setPassword(""); // Não carregar senha (por segurança)

      console.log("✅ Dados do usuário carregados:", data);
    } catch (err: any) {
      console.error("❌ Erro ao carregar usuário:", err);
      setError(err.message || "Erro ao carregar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.firstName?.trim() && !formData.lastName?.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (!id || typeof id !== "string") {
      setError("ID inválido");
      return;
    }

    try {
      setSaving(true);
      
      // Preparar dados para enviar
      // O backend espera: name, username, email, phone, bi, role, isActive
      const fullName = `${formData.firstName?.trim() || ""} ${formData.lastName?.trim() || ""}`.trim();
      
      // Garantir que pelo menos name seja enviado
      if (!fullName) {
        setError("Nome é obrigatório");
        return;
      }
      
      const dataToSend: UpdateUserDTO = {
        name: fullName,
        username: formData.username?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        bi: formData.bi?.trim() || undefined,
        role: formData.role?.trim() || undefined,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
      };
      
      // Remover campos undefined ou vazios (exceto name e isActive que são obrigatórios)
      Object.keys(dataToSend).forEach(key => {
        if (key === "name" || key === "isActive") return; // Manter name e isActive
        
        const value = dataToSend[key as keyof UpdateUserDTO];
        if (value === undefined || value === "" || (typeof value === "string" && value.trim() === "")) {
          delete dataToSend[key as keyof UpdateUserDTO];
        }
      });
      
      // Só adiciona senha se foi preenchida
      if (password && password.trim().length > 0) {
        if (password.length < 6) {
          setError("A senha deve ter pelo menos 6 caracteres");
          return;
        }
        dataToSend.password = password;
      }

      console.log("📤 Dados para atualizar:", dataToSend);
      await userService.update(parseInt(id), dataToSend);
      
      // Redireciona para a página de detalhes após salvar
      router.push(`/admin/users/${id}`);
    } catch (err: any) {
      setError(err.message || "Erro ao actualizar usuário");
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
        <h1 className="text-2xl font-bold text-gray-900">Editar Usuário</h1>
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
                Primeiro Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Último Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="bi" className="block text-sm font-medium text-gray-700">
                Bilhete de Identidade (BI)
              </label>
              <input
                type="text"
                id="bi"
                name="bi"
                value={formData.bi || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Função
              </label>
              <select
                id="role"
                name="role"
                value={formData.role || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Selecione a função</option>
                <option value="admin">Administrador</option>
                <option value="user">Usuário</option>
                <option value="manager">Gestor</option>
              </select>
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

