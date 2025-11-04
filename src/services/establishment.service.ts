import { api } from "./api";

export interface EstablishmentMetrics {
  totalPurchases?: number;
  confirmedPurchases?: number;
  pendingPurchases?: number;
  totalRevenue?: number;
  totalPointsGiven?: number;
  totalPointsSpent?: number;
  uniqueCustomers?: number;
}

export interface Establishment {
  id: number;
  name: string;
  type?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  image?: string;
  imageUrl?: string;
  images?: string[];
  imageUrls?: string[];
  photo?: string;
  image_url?: string;
  photo_url?: string;
  qrCode?: string;
  qr_code?: string;
  color?: string;
  isActive?: boolean;
  status?: "active" | "inactive";
  campaign?: any;
  campaigns?: any[];
  metrics?: EstablishmentMetrics;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEstablishmentDTO {
  name: string;
  type?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  image?: string;
  imageUrl?: string;
  photo?: string;
  image_url?: string;
  photo_url?: string;
  qrCode?: string;
  qr_code?: string;
  color?: string;
  isActive?: boolean;
  status?: "active" | "inactive";
}

export interface UpdateEstablishmentDTO extends Partial<CreateEstablishmentDTO> {}

export const establishmentService = {
  async getAll(includeInactive: boolean = true): Promise<Establishment[]> {
    try {
      // Buscar todos os estabelecimentos sem parâmetros adicionais
      // O backend deve retornar todos os estabelecimentos por padrão
      const url = "/establishments";
      console.log("🔍 EstablishmentService.getAll - Fazendo requisição para:", url);
      console.log("🔍 EstablishmentService.getAll - baseURL:", api.defaults.baseURL);
      console.log("🔍 EstablishmentService.getAll - URL completa:", `${api.defaults.baseURL}${url}`);
      const response = await api.get(url);
      
      // O backend retorna os dados no formato:
      // { success: true, data: [{...}, {...}], pagination: {...}, meta: {...} }
      
      let establishments: any[] = [];
      
      // Verificar primeiro o formato esperado: { success: true, data: [...] }
      if (response.data?.success === true && Array.isArray(response.data.data)) {
        establishments = response.data.data;
      } 
      // Fallback: formato direto como array
      else if (Array.isArray(response.data)) {
        establishments = response.data;
      } 
      // Fallback: formato com wrapper { data: [...] }
      else if (response.data?.data && Array.isArray(response.data.data)) {
        establishments = response.data.data;
      } 
      // Fallback: formato com nome { establishments: [...] }
      else if (response.data?.establishments && Array.isArray(response.data.establishments)) {
        establishments = response.data.establishments;
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        throw new Error("Formato de resposta inesperado do backend");
      }
      
      // Normalizar IDs - garantir que todos tenham 'id' como número
      const normalized = establishments.map((est: any) => {
        // Se já tem id válido, normalizar para número
        if (est.id != null && est.id !== undefined && est.id !== "") {
          const id = Number(est.id);
          if (!isNaN(id) && id > 0) {
            return { ...est, id: id };
          }
        }
        
        // Tentar _id (MongoDB/ObjectId) como fallback
        if (est._id != null && est._id !== undefined && est._id !== "") {
          if (typeof est._id === "string") {
            const id = parseInt(est._id, 10);
            if (!isNaN(id) && id > 0) {
              return { ...est, id: id };
            }
          } else {
            const id = Number(est._id);
            if (!isNaN(id) && id > 0) {
              return { ...est, id: id };
            }
          }
        }
        
        // Tentar establishment_id como fallback
        if (est.establishment_id != null && est.establishment_id !== undefined && est.establishment_id !== "") {
          const id = Number(est.establishment_id);
          if (!isNaN(id) && id > 0) {
            return { ...est, id: id };
          }
        }
        
        // Se não encontrou ID válido, logar e retornar como está
        // (mas isso não deveria acontecer com a estrutura atual da API)
        console.warn("⚠️ Estabelecimento sem ID válido:", {
          name: est.name,
          type: est.type,
          keys: Object.keys(est)
        });
        
        return est;
      });
      
      return normalized;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      const requestUrl = `${api.defaults.baseURL}/establishments`;
      let message = "Erro ao buscar estabelecimentos";
      
      // Log detalhado do erro
      console.error("❌ Erro detalhado ao buscar estabelecimentos:", {
        status: _status,
        statusText: err?.response?.statusText,
        url: requestUrl,
        data,
        error: err?.message,
        fullError: err
      });
      
      if (_status === 500) {
        message = "Erro no servidor (500). O backend retornou um erro interno.";
        if (data?.message) {
          message += ` Detalhes do servidor: ${data.message}`;
        } else if (data?.error) {
          message += ` Detalhes do servidor: ${data.error}`;
        } else if (data?.detail) {
          message += ` Detalhes do servidor: ${data.detail}`;
        }
        message += ` URL chamada: ${requestUrl}`;
      } else if (_status === 404) {
        message = `Endpoint não encontrado (404). Verifique se o backend está configurado correctamente. URL: ${requestUrl}`;
      } else if (_status === 401) {
        message = "Não autorizado (401). Por favor, faça login novamente.";
      } else if (_status === 403) {
        message = "Acesso negado (403). Você não tem permissão para aceder a este recurso.";
      } else if (data) {
        message = data.message || data.error || data.detail || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      throw new Error(message);
    }
  },

  async getById(id: number): Promise<Establishment> {
    try {
      // Validar ID antes de fazer a requisição
      if (!id || isNaN(id) || id <= 0) {
        console.error("ID inválido para getById:", id);
        throw new Error("ID inválido para buscar estabelecimento");
      }
      
      const response = await api.get(`/establishments/${id}`);
      
      // O backend pode retornar os dados em diferentes formatos:
      // - Direto: {...}
      // - Em wrapper: { data: {...} }
      // - Em wrapper com success: { success: true, data: {...} }
      
      let establishment: Establishment;
      
      if (response.data?.data && typeof response.data.data === "object") {
        // Formato: { data: {...} } ou { success: true, data: {...} }
        establishment = response.data.data;
      } else if (response.data && typeof response.data === "object" && "id" in response.data) {
        // Formato direto: {...}
        establishment = response.data;
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        throw new Error("Formato de resposta inesperado do backend");
      }
      
      return establishment;
    } catch (err: any) {
      const _status = err?.response?.status;
      const data = err?.response?.data;
      let message = "Erro ao buscar estabelecimento";
      
      if (_status === 500) {
        message = "Erro no servidor. Por favor, verifique o backend ou contacte o administrador.";
        if (data?.message) {
          message += ` Detalhes: ${data.message}`;
        }
      } else if (_status === 404) {
        message = "Estabelecimento não encontrado.";
      } else if (_status === 401) {
        message = "Não autorizado. Por favor, faça login novamente.";
      } else if (data) {
        message = data.message || data.error || data.detail || message;
      } else if (err?.message) {
        message = err.message;
      }
      
      console.error("Erro ao buscar estabelecimento:", {
        status: _status,
        data,
        error: err
      });
      
      throw new Error(message);
    }
  },

  async create(data: CreateEstablishmentDTO): Promise<Establishment> {
    try {
      const response = await api.post("/establishments", data);
      
      // O backend pode retornar: { success: true, data: {...} } ou objeto direto
      let establishment: Establishment;
      if (response.data?.success && response.data?.data && typeof response.data.data === "object") {
        establishment = response.data.data;
      } else if (response.data?.data && typeof response.data.data === "object") {
        establishment = response.data.data;
      } else if (response.data && typeof response.data === "object" && "id" in response.data) {
        establishment = response.data;
      } else {
        // Fallback: assume que é o objeto direto
        establishment = response.data;
      }
      
      return establishment;
    } catch (err: any) {
      const data = err?.response?.data;
      let message = "Erro ao criar estabelecimento";
      if (data) {
        message = data.message || data.error || JSON.stringify(data) || message;
      } else if (err?.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  async update(id: number, data: UpdateEstablishmentDTO): Promise<Establishment> {
    try {
      // Validar ID antes de fazer a requisição
      if (!id || isNaN(id) || id <= 0) {
        console.error("ID inválido para update:", id);
        throw new Error("ID inválido para atualizar estabelecimento");
      }
      
      const response = await api.put<any>(`/establishments/${id}`, data);
      
      // O backend pode retornar os dados em diferentes formatos
      // - Direto: {...}
      // - Em wrapper: { data: {...} }
      // - Em wrapper com success: { success: true, data: {...} }
      
      let establishment: Establishment;
      
      if (response.data?.data && typeof response.data.data === "object") {
        // Formato: { data: {...} } ou { success: true, data: {...} }
        establishment = response.data.data;
      } else if (response.data && typeof response.data === "object" && "id" in response.data) {
        // Formato direto: {...}
        establishment = response.data;
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        throw new Error("Formato de resposta inesperado do backend");
      }
      
      return establishment;
    } catch (err: any) {
      const data = err?.response?.data;
      let message = "Erro ao atualizar estabelecimento";
      if (data) {
        message = data.message || data.error || JSON.stringify(data) || message;
      } else if (err?.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  async delete(id: number): Promise<void> {
    try {
      // Validar ID antes de fazer a requisição
      if (!id || isNaN(id) || id <= 0) {
        console.error("ID inválido para delete:", id);
        throw new Error("ID inválido para eliminar estabelecimento");
      }
      
      await api.delete(`/establishments/${id}`);
    } catch (err: any) {
      const data = err?.response?.data;
      let message = "Erro ao eliminar estabelecimento";
      if (data) {
        message = data.message || data.error || JSON.stringify(data) || message;
      } else if (err?.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },
};

