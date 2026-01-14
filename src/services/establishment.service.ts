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
  users?: Array<{
    id: number;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone?: string;
    isActive?: boolean;
    permissions?: {
      canCreateCampaigns?: boolean;
      can_create_campaigns?: boolean;
      canSetCustomPoints?: boolean;
      can_set_custom_points?: boolean;
      canManageMerchant?: boolean;
      canManageUsers?: boolean;
      canViewReports?: boolean;
    };
    createdAt?: string;
    merchant_id?: number;
  }>;
  metrics?: EstablishmentMetrics;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  createdBy?: any;
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
      // Carregar todos os estabelecimentos fazendo requisições paginadas
      let allEstablishments: any[] = [];
      let page = 1;
      const limit = 100; // Limite por página (ajustar conforme necessário)
      let hasMore = true;
      
      while (hasMore) {
        // Construir URL com parâmetros de paginação
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        // Adicionar filtro de status se necessário
        if (!includeInactive) {
          params.append('is_active', 'true');
        }
        
        const url = `/establishments?${params.toString()}`;
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
        
        // Adicionar estabelecimentos da página atual ao array total
        allEstablishments = [...allEstablishments, ...establishments];
        
        // Verificar se há mais páginas
        const pagination = response.data?.pagination;
        if (pagination) {
          // Usar totalPages se disponível para ser mais eficiente
          if (pagination.totalPages !== undefined) {
            hasMore = page < pagination.totalPages;
          } else {
            hasMore = pagination.hasNextPage === true;
          }
          page++;
        } else {
          // Se não houver informação de paginação, verificar se retornou menos que o limite
          hasMore = establishments.length === limit;
          page++;
        }
        
        // Limite de segurança para evitar loop infinito
        if (page > 1000) {
          console.warn("⚠️ Limite de páginas atingido. Parando carregamento.");
          break;
        }
        
        // Se não retornou nenhum estabelecimento, parar
        if (establishments.length === 0) {
          hasMore = false;
        }
      }
      
      let establishments = allEstablishments;
      
      // Normalizar IDs - aceitar números ou strings não vazias
      const normalized = establishments.map((est: any) => {
        // O backend retorna id diretamente, mas vamos garantir que está normalizado
        let finalId = null;
        
        // Prioridade 1: est.id (campo principal)
        if (est.id != null && est.id !== undefined && est.id !== "") {
          const numId = Number(est.id);
          if (!isNaN(numId) && numId > 0) {
            finalId = numId;
          } else if (typeof est.id === "string" && est.id.trim().length > 0) {
            finalId = est.id;
          }
        }
        
        // Prioridade 2: est_id (campo alternativo do backend)
        if (!finalId && est.est_id != null && est.est_id !== undefined && est.est_id !== "") {
          const numId = Number(est.est_id);
          if (!isNaN(numId) && numId > 0) {
            finalId = numId;
          } else if (typeof est.est_id === "string" && est.est_id.trim().length > 0) {
            finalId = est.est_id;
          }
        }
        
        // Prioridade 3: establishment_id
        if (!finalId && est.establishment_id != null && est.establishment_id !== undefined && est.establishment_id !== "") {
          const numId = Number(est.establishment_id);
          if (!isNaN(numId) && numId > 0) {
            finalId = numId;
          } else if (typeof est.establishment_id === "string" && est.establishment_id.trim().length > 0) {
            finalId = est.establishment_id;
          }
        }
        
        // Prioridade 4: _id (MongoDB/ObjectId)
        if (!finalId && est._id != null && est._id !== undefined && est._id !== "") {
          if (typeof est._id === "string") {
            const numId = parseInt(est._id, 10);
            if (!isNaN(numId) && numId > 0) {
              finalId = numId;
            } else if (est._id.trim().length > 0) {
              finalId = est._id;
            }
          } else {
            const numId = Number(est._id);
            if (!isNaN(numId) && numId > 0) {
              finalId = numId;
            }
          }
        }
        
        // Se encontrou ID válido, retornar com id normalizado
        if (finalId != null) {
          return { ...est, id: finalId };
        }
        
        // Se não encontrou ID válido, logar e retornar como está
        console.warn("⚠️ Estabelecimento sem ID válido:", {
          name: est.name,
          type: est.type,
          keys: Object.keys(est),
          id: est.id,
          est_id: est.est_id,
          _id: est._id,
          establishment_id: est.establishment_id
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

  async getById(id: number | string): Promise<Establishment> {
    try {
      // Validar ID antes de fazer a requisição
      // Aceitar números ou strings não vazias
      if (!id || id === "" || (typeof id === 'number' && (isNaN(id) || id <= 0))) {
        console.error("ID inválido para getById:", id);
        throw new Error("ID inválido para buscar estabelecimento");
      }
      
      // Converter para string para a URL (aceita números e strings)
      const idString = String(id);
      const response = await api.get(`/establishments/${idString}`);
      
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
      
      // Detectar erros de rede
      const isNetworkError = err.isNetworkError || err.message === "Network Error" || err.code === "ERR_NETWORK";
      if (isNetworkError) {
        message = "Servidor não disponível. Verifique se o backend está rodando em http://localhost:8000";
      } else if (_status === 500) {
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
      
      // Log apenas se não for erro de rede (para reduzir console noise)
      if (!isNetworkError) {
        console.error("Erro ao buscar estabelecimento:", {
          status: _status,
          data,
          error: err
        });
      }
      
      const error = new Error(message);
      // Preservar flag de erro de rede
      if (isNetworkError) {
        (error as any).isNetworkError = true;
      }
      throw error;
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

  async delete(id: number | string): Promise<void> {
    try {
      // Validar ID antes de fazer a requisição
      // Aceita tanto números quanto strings (ex: "EST_1768143137208_hliai")
      if (!id || (typeof id === 'string' && id.trim() === '') || (typeof id === 'number' && (isNaN(id) || id <= 0))) {
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

