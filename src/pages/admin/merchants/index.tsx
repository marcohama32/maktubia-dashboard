import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { merchantsService, Merchant, GetAllMerchantsParams } from "@/services/merchants.service";
import { userService } from "@/services/user.service";
import { establishmentService } from "@/services/establishment.service";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { AlertModal } from "@/components/modals/AlertModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/utils/roleUtils";

const ITEMS_PER_PAGE = 10;

function MerchantsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const userIsAdmin = isAdmin(user);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingEstablishments, setLoadingEstablishments] = useState(false);
  const [error, setError] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [establishmentFilter, setEstablishmentFilter] = useState<number | null>(null);
  const [userFilter, setUserFilter] = useState<number | null>(null);
  
  // Estados para modais
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [merchantToAction, setMerchantToAction] = useState<Merchant | null>(null);
  const [actionType, setActionType] = useState<"delete" | "grantCampaign" | "revokeCampaign" | "grantCustomPoints" | "revokeCustomPoints" | "activate" | "deactivate">("delete");
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  
  // Estados para modal de adicionar estabelecimento
  const [addEstablishmentModalOpen, setAddEstablishmentModalOpen] = useState(false);
  const [selectedUserForEstablishment, setSelectedUserForEstablishment] = useState<any>(null);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<number | null>(null);
  const [addEstablishmentLoading, setAddEstablishmentLoading] = useState(false);
  const [userEstablishments, setUserEstablishments] = useState<number[]>([]);

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withCampaigns: 0,
    withCustomPoints: 0,
  });

  useEffect(() => {
    loadUsers();
    loadEstablishments();
  }, []);

  useEffect(() => {
    // Aguardar usuários e estabelecimentos carregarem antes de carregar merchants
    if (!loadingUsers && !loadingEstablishments) {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => loadMerchants(), { timeout: 100 });
      } else {
        setTimeout(() => loadMerchants(), 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, establishmentFilter, userFilter, searchTerm, loadingUsers, loadingEstablishments]);
  
  // Resetar para página 1 quando filtros mudarem
  useEffect(() => {
    if (establishmentFilter || userFilter || searchTerm) {
      setCurrentPage(1);
    }
  }, [establishmentFilter, userFilter, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userService.getAll(1, 1000, "", null);
      setUsers(response.data || []);
    } catch (err: any) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadEstablishments = async () => {
    try {
      setLoadingEstablishments(true);
      const data = await establishmentService.getAll();
      setEstablishments(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar estabelecimentos:", err);
    } finally {
      setLoadingEstablishments(false);
    }
  };

  const loadMerchants = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Se houver filtros ativos (establishmentFilter, userFilter, searchTerm), buscar mais dados
      // para aplicar paginação no frontend após filtrar
      const hasFilters = establishmentFilter || userFilter || searchTerm;
      const params: GetAllMerchantsParams = {
        // Se houver filtros, buscar mais dados para filtrar no frontend
        // Caso contrário, usar paginação do backend
        page: hasFilters ? 1 : currentPage,
        limit: hasFilters ? 1000 : ITEMS_PER_PAGE, // Buscar mais dados se houver filtros
        is_active: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
      };
      const response = await merchantsService.getAll(params);
      
      let merchantsData = response.data || [];
      
      // A estrutura retornada é: estabelecimentos com users[] (merchants alocados)
      // Cada item tem: id (establishment_id) ou establishment_id, name, type, users[], campaigns[]
      merchantsData = merchantsData.map((establishment: any) => {
        // O id pode vir como 'id' ou 'establishment_id'
        const establishmentId = establishment.id || establishment.establishment_id;
        
        // Processar users (merchants alocados)
        // A API retorna users com: id, username, email, firstName, lastName, fullName, phone, isActive, permissions, createdAt
        const processedUsers = (establishment.users || []).map((u: any) => ({
          // IDs: user_id é o id do user, merchant_id/merchant_user_id não vêm na resposta inicial
          user_id: u.id,
          id: u.id, // Manter id também para compatibilidade
          // Dados do usuário
          username: u.username || "",
          email: u.email || "",
          firstName: u.firstName || u.first_name || "",
          lastName: u.lastName || u.last_name || "",
          fullName: u.fullName || `${u.firstName || u.first_name || ""} ${u.lastName || u.last_name || ""}`.trim() || u.username || "Sem nome",
          phone: u.phone || "",
          // Status
          isActive: u.isActive !== false && u.is_active !== false,
          is_active: u.isActive !== false && u.is_active !== false,
          // Permissões - mapear corretamente os campos que existem na resposta
          permissions: {
            // camelCase (da resposta da API)
            canCreateCampaigns: u.permissions?.canCreateCampaigns || false,
            canSetCustomPoints: u.permissions?.canSetCustomPoints || false,
            canManageMerchant: u.permissions?.canManageMerchant || false,
            canManageUsers: u.permissions?.canManageUsers || false,
            canViewReports: u.permissions?.canViewReports || false,
            // snake_case (compatibilidade)
            can_create_campaigns: u.permissions?.canCreateCampaigns || u.permissions?.can_create_campaigns || false,
            can_set_custom_points: u.permissions?.canSetCustomPoints || u.permissions?.can_set_custom_points || false,
            can_manage_merchant: u.permissions?.canManageMerchant || u.permissions?.can_manage_merchant || false,
            can_manage_users: u.permissions?.canManageUsers || u.permissions?.can_manage_users || false,
            can_view_reports: u.permissions?.canViewReports || u.permissions?.can_view_reports || false,
          },
          // Datas
          createdAt: u.createdAt || u.created_at,
          created_at: u.createdAt || u.created_at,
          // merchant_id e merchant_user_id serão buscados quando necessário (não vêm na resposta inicial)
          merchant_id: u.merchant_id || u.merchant_user_id || undefined,
          merchant_user_id: u.merchant_user_id || u.merchant_id || undefined,
        }));
        
        return {
          // IDs: usar id como establishment_id
          id: establishmentId,
          establishment_id: establishmentId,
          merchant_id: establishmentId, // Para compatibilidade
          // Dados do estabelecimento
          name: establishment.name,
          type: establishment.type,
          address: establishment.address,
          phone: establishment.phone,
          email: establishment.email,
          image: establishment.image,
          imageUrl: establishment.imageUrl || establishment.image_url,
          qrCode: establishment.qrCode || establishment.qr_code,
          color: establishment.color,
          isActive: establishment.isActive !== false && establishment.is_active !== false,
          is_active: establishment.isActive !== false && establishment.is_active !== false,
          createdAt: establishment.createdAt || establishment.created_at,
          created_at: establishment.createdAt || establishment.created_at,
          updatedAt: establishment.updatedAt || establishment.updated_at,
          updated_at: establishment.updatedAt || establishment.updated_at,
          // Users (merchants alocados)
          users: processedUsers,
          // Campanhas
          campaigns: establishment.campaigns || [],
          campaign: establishment.campaign || null,
        };
      });
      
      // Filtrar por estabelecimento
      if (establishmentFilter) {
        merchantsData = merchantsData.filter(m => {
          return m.id === establishmentFilter || 
                 m.establishment_id === establishmentFilter || 
                 m.merchant_id === establishmentFilter;
        });
      }
      
      // Filtrar por usuário
      if (userFilter) {
        merchantsData = merchantsData.filter(m => {
          if (m.users && Array.isArray(m.users)) {
            return m.users.some((u: any) => u.user_id === userFilter || u.id === userFilter);
          }
          return false;
        });
      }
      
      // Filtrar por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        merchantsData = merchantsData.filter(m => {
          const establishmentName = m.name || "";
          const establishmentType = m.type || "";
          const merchantUsers = m.users || [];
          const userNames = merchantUsers.map((u: any) => u.fullName || u.username || "").join(" ");
          const userEmails = merchantUsers.map((u: any) => u.email || "").join(" ");
          
          return (
            establishmentName.toLowerCase().includes(searchLower) ||
            establishmentType.toLowerCase().includes(searchLower) ||
            userNames.toLowerCase().includes(searchLower) ||
            userEmails.toLowerCase().includes(searchLower)
          );
        });
      }
      
      // Filtrar apenas merchants com IDs válidos antes de definir no estado
      const validMerchants = merchantsData.filter((m: any) => {
        // Garantir que tem id válido (establishment_id)
        const hasValidId = (m.id && !isNaN(m.id)) || 
                          (m.establishment_id && !isNaN(m.establishment_id));
        if (!hasValidId) {
          console.warn("Merchant sem ID válido filtrado:", m);
        }
        return hasValidId;
      });
      
      // Se houver filtros ativos, aplicar paginação no frontend (hasFilters já foi definido acima)
      let paginatedMerchants = validMerchants;
      let frontendPagination = null;
      
      if (hasFilters) {
        // Calcular paginação no frontend
        const totalItems = validMerchants.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        paginatedMerchants = validMerchants.slice(startIndex, endIndex);
        
        frontendPagination = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          total: totalItems,
          totalPages: totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        };
      }
      
      setMerchants(paginatedMerchants);
      
      // Calcular estatísticas com todos os dados (antes da paginação)
      setStats({
        total: validMerchants.length,
        active: validMerchants.filter((m: any) => (m.isActive !== false && m.is_active !== false)).length,
        inactive: validMerchants.filter((m: any) => (m.isActive === false || m.is_active === false)).length,
        withCampaigns: validMerchants.reduce((count: number, m: any) => {
          // Verificar se algum usuário tem permissão de criar campanhas
          if (m.users && Array.isArray(m.users) && m.users.length > 0) {
            return count + (m.users.some((u: any) => {
              const perms = u.permissions || {};
              return perms.canCreateCampaigns === true || perms.can_create_campaigns === true;
            }) ? 1 : 0);
          }
          return count;
        }, 0),
        withCustomPoints: validMerchants.reduce((count: number, m: any) => {
          // Verificar se algum usuário tem permissão de definir pontos personalizados
          if (m.users && Array.isArray(m.users) && m.users.length > 0) {
            return count + (m.users.some((u: any) => {
              const perms = u.permissions || {};
              return perms.canSetCustomPoints === true || perms.can_set_custom_points === true;
            }) ? 1 : 0);
          }
          return count;
        }, 0),
      });
      
      // Usar paginação do frontend se houver filtros, caso contrário usar do backend
      setPagination(hasFilters ? frontendPagination : response.pagination);
    } catch (err: any) {
      console.error("Erro ao carregar merchants:", err);
      const isNetworkError = err.isNetworkError || err.message?.includes("Servidor não disponível");
      if (!isNetworkError) {
        setError(err.message || "Erro ao carregar merchants");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (merchant: Merchant) => {
    setMerchantToAction(merchant);
    setActionType("delete");
    setConfirmModalOpen(true);
  };

  const handlePermissionClick = async (
    merchant: Merchant,
    type: "grantCampaign" | "revokeCampaign" | "grantCustomPoints" | "revokeCustomPoints",
    userId?: number
  ) => {
    // Se temos um userId específico, tentar encontrar o merchant_id real
    if (userId) {
      // Primeiro, verificar se o user já tem merchant_id nos dados do merchant
      const user = merchant.users?.find((u: any) => (u.user_id || u.id) === userId);
      if (user && (user.merchant_id || user.merchant_user_id)) {
        const merchantId = user.merchant_id || user.merchant_user_id;
        if (merchantId) {
          // Criar um merchant temporário com o merchant_id correto
          const tempMerchant: Merchant = {
            ...merchant,
            merchant_id: merchantId,
            user_id: userId,
          };
          setMerchantToAction(tempMerchant);
          setActionType(type);
          setConfirmModalOpen(true);
          return;
        }
      }
      
      // Se não encontrou nos dados locais, buscar via API
      const establishmentId = merchant.id || merchant.establishment_id || merchant.merchant_id;
      if (establishmentId) {
        try {
          // Buscar merchants do estabelecimento para encontrar o merchant_id do user específico
          const response = await merchantsService.getMerchantsByEstablishment({
            establishmentId,
            limit: 1000,
          });
          const merchants = response.data || [];
          
          // Encontrar o merchant que corresponde ao user_id
          let userMerchant: any = null;
          
          // Primeiro, verificar se retornou merchants individuais (com user_id)
          userMerchant = merchants.find((m: any) => m.user_id === userId);
          
          // Se não encontrou, verificar se retornou estabelecimentos com users
          if (!userMerchant) {
            for (const m of merchants) {
              if (m.users && Array.isArray(m.users)) {
                const foundUser = m.users.find((u: any) => (u.id || u.user_id) === userId);
                if (foundUser && (foundUser.merchant_id || foundUser.merchant_user_id)) {
                  userMerchant = {
                    merchant_id: foundUser.merchant_id || foundUser.merchant_user_id,
                    user_id: userId,
                  };
                  break;
                }
              }
            }
          }
          
          if (userMerchant) {
            const merchantId = userMerchant.merchant_id || userMerchant.id;
            if (merchantId) {
              // Criar um merchant temporário com o merchant_id correto
              const tempMerchant: Merchant = {
                ...merchant,
                merchant_id: merchantId,
                user_id: userId,
              };
              setMerchantToAction(tempMerchant);
              setActionType(type);
              setConfirmModalOpen(true);
              return;
            }
          }
        } catch (err) {
          console.error("Erro ao buscar merchant_id:", err);
        }
      }
    }
    
    // Fallback: usar o merchant como está (pode não funcionar se precisar do merchant_id real)
    setMerchantToAction(merchant);
    setActionType(type);
    setConfirmModalOpen(true);
  };

  const handleStatusChange = (merchant: Merchant, newStatus: boolean) => {
    setMerchantToAction(merchant);
    setActionType(newStatus ? "activate" : "deactivate");
    setConfirmModalOpen(true);
  };

  const handleActionConfirm = async () => {
    // O id é o establishment_id
    const merchantId = merchantToAction?.id || merchantToAction?.establishment_id || merchantToAction?.merchant_id;
    if (!merchantId) return;

    try {
      setActionLoading(merchantId);
      setConfirmModalOpen(false);
      
      let message = "";
      
      switch (actionType) {
        case "delete":
          await merchantsService.delete(merchantId);
          message = "Merchant eliminado com sucesso.";
          break;
        case "grantCampaign":
          await merchantsService.grantCampaignPermission(merchantId);
          message = "Permissão de criar campanhas concedida com sucesso.";
          break;
        case "revokeCampaign":
          await merchantsService.revokeCampaignPermission(merchantId);
          message = "Permissão de criar campanhas revogada com sucesso.";
          break;
        case "grantCustomPoints":
          await merchantsService.grantCustomPointsPermission(merchantId);
          message = "Permissão de definir pontos personalizados concedida com sucesso.";
          break;
        case "revokeCustomPoints":
          await merchantsService.revokeCustomPointsPermission(merchantId);
          message = "Permissão de definir pontos personalizados revogada com sucesso.";
          break;
        case "activate":
          await merchantsService.update(merchantId, { is_active: true });
          message = "Merchant ativado com sucesso.";
          break;
        case "deactivate":
          await merchantsService.update(merchantId, { is_active: false });
          message = "Merchant desativado com sucesso.";
          break;
      }
      
      await loadMerchants();
      
      setAlertConfig({
        title: "Sucesso!",
        message,
        type: "success",
      });
      setAlertModalOpen(true);
      setMerchantToAction(null);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao executar ação. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmModalOpen(false);
    setMerchantToAction(null);
  };

  const handleView = (id: number) => {
    if (!id || isNaN(id)) {
      console.error("ID inválido para visualizar:", id);
      return;
    }
    // O id é o establishment_id, redirecionar para detalhes do estabelecimento
    router.push(`/admin/establishments/${id}`);
  };

  const handleEdit = (merchant: Merchant) => {
    // O id é o establishment_id
    const merchantId = merchant.id || merchant.establishment_id || merchant.merchant_id;
    if (!merchantId || isNaN(merchantId)) {
      console.error("Merchant ID inválido para editar:", merchant);
      setAlertConfig({
        title: "Erro!",
        message: "ID do merchant inválido. Não é possível editar.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }
    // Redirecionar para a página de detalhes do estabelecimento ou criar novo merchant
    router.push(`/admin/establishments/${merchantId}`);
  };

  const handleViewCampaigns = (merchant: Merchant) => {
    // O id é o establishment_id
    const establishmentId = merchant.id || merchant.establishment_id || merchant.merchant_id;
    if (!establishmentId || isNaN(establishmentId)) {
      console.error("ID inválido para ver campanhas:", merchant);
      setAlertConfig({
        title: "Erro!",
        message: "ID do estabelecimento inválido. Não é possível ver campanhas.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }
    router.push(`/admin/campaigns?establishment=${establishmentId}`);
  };

  const handleAddUser = (merchant: Merchant) => {
    // O id é o establishment_id
    const establishmentId = merchant.id || merchant.establishment_id || merchant.merchant_id;
    if (!establishmentId || isNaN(establishmentId)) {
      console.error("Merchant ID inválido para adicionar usuário:", merchant);
      setAlertConfig({
        title: "Erro!",
        message: "ID do estabelecimento inválido. Não é possível adicionar usuário.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }
    // Redirecionar para criar novo merchant com establishment_id pré-selecionado
    router.push(`/admin/merchants/new?establishment_id=${establishmentId}`);
  };

  const handleAddEstablishmentToMerchant = (merchant: Merchant) => {
    // Se há usuários, usar o primeiro para adicionar estabelecimento
    const merchantUsers: any[] = merchant.users || [];
    if (merchantUsers.length > 0) {
      const firstUser = merchantUsers[0];
      handleAddEstablishment(firstUser);
    } else {
      // Se não há usuários, redirecionar para criar novo merchant
      // O usuário poderá selecionar um estabelecimento na página de criação
      router.push("/admin/merchants/new");
    }
  };

  const handleCreate = () => {
    router.push("/admin/merchants/new");
  };

  const handleAddEstablishment = async (user: any) => {
    setSelectedUserForEstablishment(user);
    setSelectedEstablishmentId(null);
    
    // Buscar estabelecimentos que o user já tem
    try {
      const userId = user.user_id || user.id;
      if (userId) {
        const response = await merchantsService.getMerchantsByUser({
          userId,
          limit: 1000,
        });
        const userMerchants = response.data || [];
        // Extrair IDs dos estabelecimentos
        const establishmentIds = userMerchants
          .map((m: any) => m.id || m.establishment_id || m.merchant_id)
          .filter((id: any) => id && !isNaN(id));
        setUserEstablishments(establishmentIds);
      } else {
        setUserEstablishments([]);
      }
    } catch (err) {
      console.error("Erro ao buscar estabelecimentos do user:", err);
      setUserEstablishments([]);
    }
    
    setAddEstablishmentModalOpen(true);
  };

  const handleAddEstablishmentConfirm = async () => {
    if (!selectedUserForEstablishment || !selectedEstablishmentId) {
      setAlertConfig({
        title: "Erro!",
        message: "Por favor, selecione um estabelecimento.",
        type: "error",
      });
      setAlertModalOpen(true);
      return;
    }

    try {
      setAddEstablishmentLoading(true);
      setAddEstablishmentModalOpen(false);

      const userId = selectedUserForEstablishment.user_id || selectedUserForEstablishment.id;
      
      await merchantsService.create({
        user_id: userId,
        establishment_id: selectedEstablishmentId,
        can_create_campaigns: false,
        can_set_custom_points: false,
        is_active: true,
      });

      await loadMerchants();

      setAlertConfig({
        title: "Sucesso!",
        message: "Estabelecimento adicionado ao merchant com sucesso.",
        type: "success",
      });
      setAlertModalOpen(true);
      
      setSelectedUserForEstablishment(null);
      setSelectedEstablishmentId(null);
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao adicionar estabelecimento. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setAddEstablishmentLoading(false);
    }
  };

  const handleAddEstablishmentCancel = () => {
    setAddEstablishmentModalOpen(false);
    setSelectedUserForEstablishment(null);
    setSelectedEstablishmentId(null);
    setUserEstablishments([]);
  };

  const getActionMessage = () => {
    if (!merchantToAction) return "";
    
    // Nova estrutura: merchant tem name, type, users[]
    // Se tem users[], usar o primeiro usuário
    let userName = "";
    if (merchantToAction.users && Array.isArray(merchantToAction.users) && merchantToAction.users.length > 0) {
      const firstUser = merchantToAction.users[0];
      // Tentar vários formatos de nome
      userName = firstUser.fullName || 
                 `${firstUser.firstName || firstUser.first_name || ""} ${firstUser.lastName || firstUser.last_name || ""}`.trim() || 
                 firstUser.username || 
                 (firstUser.user_id ? `ID: ${firstUser.user_id}` : "");
    } else if (merchantToAction.user_id) {
      // Estrutura antiga ou fallback - buscar na lista de usuários
      const user = users.find(u => u.id === merchantToAction.user_id);
      if (user) {
        userName = user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || `ID: ${user.id}`;
      } else {
        userName = `ID: ${merchantToAction.user_id}`;
      }
    } else if (merchantToAction.user) {
      // Usar dados do user diretamente
      userName = merchantToAction.user.fullName || merchantToAction.user.username || (merchantToAction.user.id ? `ID: ${merchantToAction.user.id}` : "");
    }
    
    // Obter nome do estabelecimento - usar name primeiro (nova estrutura)
    const establishmentName = merchantToAction.name || 
                               merchantToAction.establishment?.name || 
                               establishments.find(e => e.id === merchantToAction.establishment_id)?.name ||
                               (merchantToAction.establishment_id ? `ID: ${merchantToAction.establishment_id}` : "Sem estabelecimento");
    
    // Construir mensagem base
    let message = "";
    switch (actionType) {
      case "delete":
        message = `Tem certeza que deseja eliminar este merchant?\n\nEstabelecimento: ${establishmentName}`;
        if (userName) {
          message += `\nUsuário: ${userName}`;
        }
        message += "\n\nEsta ação não pode ser desfeita.";
        break;
      case "grantCampaign":
        message = `Conceder permissão de criar campanhas?\n\nEstabelecimento: ${establishmentName}`;
        if (userName) {
          message += `\nUsuário: ${userName}`;
        }
        break;
      case "revokeCampaign":
        message = `Revogar permissão de criar campanhas?\n\nEstabelecimento: ${establishmentName}`;
        if (userName) {
          message += `\nUsuário: ${userName}`;
        }
        break;
      case "grantCustomPoints":
        message = `Conceder permissão de definir pontos personalizados?\n\nEstabelecimento: ${establishmentName}`;
        if (userName) {
          message += `\nUsuário: ${userName}`;
        }
        break;
      case "revokeCustomPoints":
        message = `Revogar permissão de definir pontos personalizados?\n\nEstabelecimento: ${establishmentName}`;
        if (userName) {
          message += `\nUsuário: ${userName}`;
        }
        break;
      case "activate":
        message = `Ativar merchant?\n\nEstabelecimento: ${establishmentName}`;
        if (userName) {
          message += `\nUsuário: ${userName}`;
        }
        break;
      case "deactivate":
        message = `Desativar merchant?\n\nEstabelecimento: ${establishmentName}`;
        if (userName) {
          message += `\nUsuário: ${userName}`;
        }
        break;
      default:
        return "";
    }
    
    return message;
  };

  const getActionTitle = () => {
    switch (actionType) {
      case "delete":
        return "Confirmar Eliminação";
      case "grantCampaign":
        return "Conceder Permissão de Campanhas";
      case "revokeCampaign":
        return "Revogar Permissão de Campanhas";
      case "grantCustomPoints":
        return "Conceder Permissão de Pontos Personalizados";
      case "revokeCustomPoints":
        return "Revogar Permissão de Pontos Personalizados";
      case "activate":
        return "Ativar Merchant";
      case "deactivate":
        return "Desativar Merchant";
      default:
        return "Confirmar Ação";
    }
  };

  return (
    <div className="relative p-6">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando merchants...</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Merchants</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/admin/establishments/new")}
            className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            + Estabelecimento
          </button>
          <button
            onClick={handleCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + Novo Merchant
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Total</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Ativos</p>
          <p className="mt-2 text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Inativos</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Com Campanhas</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{stats.withCampaigns}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium text-gray-500">Pontos Personalizados</p>
          <p className="mt-2 text-2xl font-bold text-purple-600">{stats.withCustomPoints}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por usuário, email ou estabelecimento..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="establishment" className="block text-sm font-medium text-gray-700 mb-2">
              Estabelecimento
            </label>
            <select
              id="establishment"
              value={establishmentFilter || ""}
              onChange={(e) => {
                setEstablishmentFilter(e.target.value ? Number(e.target.value) : null);
                setCurrentPage(1);
              }}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              disabled={loadingEstablishments}
            >
              <option value="">Todos</option>
              {establishments.map((est) => (
                <option key={est.id || `est-${est.id}`} value={est.id}>
                  {est.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-2">
              Usuário
            </label>
            <select
              id="user"
              value={userFilter || ""}
              onChange={(e) => {
                setUserFilter(e.target.value ? Number(e.target.value) : null);
                setCurrentPage(1);
              }}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              disabled={loadingUsers}
            >
              <option value="">Todos</option>
              {users.map((user) => (
                <option key={user.id || `user-${user.id}`} value={user.id}>
                  {user.fullName || user.username || `ID: ${user.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Tabela de Merchants */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estabelecimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissões
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {merchants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {loading ? "Carregando..." : "Nenhum merchant encontrado"}
                  </td>
                </tr>
              ) : (
                merchants.map((merchant) => {
                  // Nova estrutura: merchant tem name, type, users[], campaigns[]
                  const merchantName = merchant.name || merchant.establishment?.name || establishments.find(e => e.id === merchant.establishment_id)?.name || `ID: ${merchant.merchant_id || merchant.establishment_id}`;
                  const merchantType = merchant.type || merchant.establishment?.type || establishments.find(e => e.id === merchant.establishment_id)?.type;
                  // Garantir que merchantUsers seja um array
                  let merchantUsers: any[] = merchant.users || [];
                  
                  // Se não tem users ou está vazio, tentar buscar na estrutura antiga ou popular
                  if (merchantUsers.length === 0) {
                    // Tentar usar estrutura antiga (user_id)
                    if (merchant.user_id) {
                      const user = users.find(u => u.id === merchant.user_id);
                      if (user) {
                        merchantUsers = [{
                          merchant_user_id: merchant.merchant_id,
                          user_id: user.id,
                          username: user.username,
                          email: user.email,
                          firstName: user.firstName,
                          lastName: user.lastName,
                          fullName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Sem nome",
                          phone: user.phone,
                          permissions: {
                            can_create_campaigns: merchant.can_create_campaigns || false,
                            can_set_custom_points: merchant.can_set_custom_points || false,
                          },
                        }];
                      }
                    }
                  }
                  
                  // Garantir que merchant tem ID válido antes de renderizar
                  // O id é o establishment_id
                  const merchantId = merchant.id || merchant.establishment_id || merchant.merchant_id;
                  if (!merchantId || isNaN(merchantId)) {
                    console.warn("Merchant sem ID válido, pulando renderização:", merchant);
                    return null;
                  }
                  
                  // Verificar se o usuário é admin para habilitar botões
                  const canEdit = userIsAdmin && merchantId && !isNaN(merchantId);
                  
                  return (
                    <tr key={merchantId} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full">
                            {merchantUsers.length > 0 ? (
                              <div className="space-y-2">
                                {merchantUsers.map((u: any, index: number) => {
                                  const fullName = u.fullName || 
                                                   `${u.firstName || u.first_name || ""} ${u.lastName || u.last_name || ""}`.trim() || 
                                                   u.username || 
                                                   (u.user_id ? `ID: ${u.user_id}` : "Sem nome");
                                  return (
                                    <div key={u.merchant_user_id || u.user_id || index} className="border-l-2 border-blue-200 pl-2 py-1">
                                      <div className="text-sm font-medium text-gray-900">{fullName}</div>
                                      {u.email && (
                                        <div className="text-xs text-gray-500">{u.email}</div>
                                      )}
                                      {u.phone && (
                                        <div className="text-xs text-gray-400">{u.phone}</div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Sem usuários</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Usar o merchantId já calculado
                                    if (merchantId && !isNaN(merchantId)) {
                                      handleAddUser(merchant);
                                    } else {
                                      console.error("Merchant ID inválido para adicionar usuário:", merchant);
                                    }
                                  }}
                                  disabled={!canEdit || !merchantId}
                                  className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Adicionar usuário"
                                >
                                  + Adicionar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          {merchantName ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="text-sm text-gray-900">
                                  {merchantName}
                                </div>
                                {merchantType && (
                                  <div className="text-xs text-gray-500">
                                    {merchantType}
                                  </div>
                                )}
                                {merchant.campaigns !== undefined && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const establishmentId = merchant.establishment_id || merchant.merchant_id;
                                      if (establishmentId && !isNaN(establishmentId)) {
                                        handleViewCampaigns(merchant);
                                      } else {
                                        console.error("ID inválido para ver campanhas:", merchant);
                                      }
                                    }}
                                    disabled={!canEdit || !merchantId}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Ver campanhas deste estabelecimento"
                                  >
                                    {merchant.campaigns?.length || 0} campanha{(merchant.campaigns?.length || 0) !== 1 ? "s" : ""}
                                  </button>
                                )}
                              </div>
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (merchantId && !isNaN(merchantId)) {
                                      handleAddEstablishmentToMerchant(merchant);
                                    }
                                  }}
                                  disabled={!canEdit || addEstablishmentLoading}
                                  className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Adicionar estabelecimento"
                                >
                                  + Adicionar
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Sem estabelecimento</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (merchantId && !isNaN(merchantId)) {
                                    handleAddEstablishmentToMerchant(merchant);
                                  } else {
                                    console.error("Merchant ID inválido para adicionar estabelecimento:", merchant);
                                  }
                                }}
                                disabled={!canEdit || !merchantId}
                                className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Adicionar estabelecimento"
                              >
                                + Adicionar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {merchantUsers.length > 0 ? (
                          merchantUsers.map((user: any, index: number) => {
                            const fullName = user.fullName || 
                                             `${user.firstName || user.first_name || ""} ${user.lastName || user.last_name || ""}`.trim() || 
                                             user.username || 
                                             (user.user_id ? `ID: ${user.user_id}` : "Sem nome");
                            return (
                              <div key={user.merchant_user_id || user.user_id || index} className="border-l-2 border-purple-200 pl-2 py-1 bg-gray-50 rounded">
                                <div className="text-xs font-medium text-gray-700 mb-1">{fullName}</div>
                                <div className="flex flex-wrap gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const hasPermission = user.permissions?.canCreateCampaigns || user.permissions?.can_create_campaigns || false;
                                      handlePermissionClick(
                                        merchant,
                                        hasPermission ? "revokeCampaign" : "grantCampaign",
                                        user.user_id || user.id
                                      );
                                    }}
                                    disabled={!canEdit || actionLoading === merchantId}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                      (user.permissions?.canCreateCampaigns || user.permissions?.can_create_campaigns) === true
                                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title={`${fullName}: ${(user.permissions?.canCreateCampaigns || user.permissions?.can_create_campaigns) === true ? "Revogar" : "Conceder"} permissão de campanhas`}
                                  >
                                    {(user.permissions?.canCreateCampaigns || user.permissions?.can_create_campaigns) === true ? "✓" : "✗"} Campanhas
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const hasPermission = user.permissions?.canSetCustomPoints || user.permissions?.can_set_custom_points || false;
                                      handlePermissionClick(
                                        merchant,
                                        hasPermission ? "revokeCustomPoints" : "grantCustomPoints",
                                        user.user_id || user.id
                                      );
                                    }}
                                    disabled={!canEdit || actionLoading === merchantId}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                      (user.permissions?.canSetCustomPoints || user.permissions?.can_set_custom_points) === true
                                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title={`${fullName}: ${(user.permissions?.canSetCustomPoints || user.permissions?.can_set_custom_points) === true ? "Revogar" : "Conceder"} permissão de pontos`}
                                  >
                                    {(user.permissions?.canSetCustomPoints || user.permissions?.can_set_custom_points) === true ? "✓" : "✗"} Pontos
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const hasPermission = merchant.can_create_campaigns === true;
                                handlePermissionClick(
                                  merchant,
                                  hasPermission ? "revokeCampaign" : "grantCampaign"
                                );
                              }}
                              disabled={!canEdit || actionLoading === merchantId}
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                                merchant.can_create_campaigns === true
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={merchant.can_create_campaigns === true ? "Revogar permissão" : "Conceder permissão"}
                            >
                              {merchant.can_create_campaigns === true ? "✓" : "✗"} Campanhas
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const hasPermission = merchant.can_set_custom_points === true;
                                handlePermissionClick(
                                  merchant,
                                  hasPermission ? "revokeCustomPoints" : "grantCustomPoints"
                                );
                              }}
                              disabled={!canEdit || actionLoading === merchantId}
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                                merchant.can_set_custom_points === true
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={merchant.can_set_custom_points === true ? "Revogar permissão" : "Conceder permissão"}
                            >
                              {merchant.can_set_custom_points === true ? "✓" : "✗"} Pontos
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        onClick={() => handleStatusChange(merchant, !merchant.is_active)}
                        disabled={!canEdit || actionLoading === merchantId}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                          merchant.is_active !== false
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        } disabled:opacity-50`}
                        title={merchant.is_active !== false ? "Desativar" : "Ativar"}
                      >
                        {merchant.is_active !== false ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {merchant.created_at
                        ? new Date(merchant.created_at).toLocaleDateString("pt-MZ")
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            if (merchantId && !isNaN(merchantId)) {
                              handleView(merchantId);
                            } else {
                              console.error("Merchant ID inválido:", merchant);
                            }
                          }}
                          disabled={!canEdit || !merchantId}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Ver detalhes"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(merchant)}
                          disabled={!canEdit || !merchantId}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Editar"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(merchant)}
                          disabled={!canEdit || actionLoading === merchantId || deleteLoading}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={`page-${page}`}
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
                }
                return null;
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage >= pagination.totalPages}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próxima
            </button>
          </div>

          <div className="text-sm text-gray-500">
            Mostrando {pagination.page} de {pagination.totalPages} páginas ({pagination.total} merchants)
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {merchantToAction && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleActionConfirm}
          title={getActionTitle()}
          message={getActionMessage()}
          confirmText={actionType === "delete" ? "Sim, Eliminar" : "Sim, Confirmar"}
          cancelText="Cancelar"
          type={actionType === "delete" ? "danger" : "warning"}
          isLoading={actionLoading === (merchantToAction?.merchant_id || merchantToAction?.establishment_id || merchantToAction?.id)}
        />
      )}

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => {
          setAlertModalOpen(false);
          setAlertConfig(null);
        }}
        title={alertConfig?.title || ""}
        message={alertConfig?.message || ""}
        type={alertConfig?.type || "info"}
        confirmText="OK"
        autoClose={alertConfig?.type === "success" ? 3000 : 0}
      />

      {/* Modal para adicionar estabelecimento */}
      {addEstablishmentModalOpen && selectedUserForEstablishment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Adicionar Estabelecimento
            </h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Merchant: <span className="font-medium text-gray-900">
                  {selectedUserForEstablishment.fullName || 
                   `${selectedUserForEstablishment.firstName || selectedUserForEstablishment.first_name || ""} ${selectedUserForEstablishment.lastName || selectedUserForEstablishment.last_name || ""}`.trim() || 
                   selectedUserForEstablishment.username || 
                   `ID: ${selectedUserForEstablishment.user_id || selectedUserForEstablishment.id}`}
                </span>
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="establishment-select" className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Estabelecimento <span className="text-red-500">*</span>
              </label>
              <select
                id="establishment-select"
                value={selectedEstablishmentId || ""}
                onChange={(e) => setSelectedEstablishmentId(e.target.value ? Number(e.target.value) : null)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                disabled={addEstablishmentLoading || loadingEstablishments}
              >
                <option value="">Selecione um estabelecimento...</option>
                {establishments
                  .filter(est => {
                    // Filtrar estabelecimentos que o merchant já tem
                    return est.id && !userEstablishments.includes(est.id);
                  })
                  .map((est) => (
                    <option key={est.id || `est-${est.id}`} value={est.id}>
                      {est.name} {est.type ? `(${est.type})` : ""}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleAddEstablishmentCancel}
                disabled={addEstablishmentLoading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddEstablishmentConfirm}
                disabled={!selectedEstablishmentId || addEstablishmentLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addEstablishmentLoading ? "Adicionando..." : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MerchantsPage() {
  return (
    <ProtectedRoute requireAdmin={true} redirectTo="/">
      <MerchantsPageContent />
    </ProtectedRoute>
  );
}
