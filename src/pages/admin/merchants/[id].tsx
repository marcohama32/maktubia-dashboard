import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { merchantsService, Merchant } from "@/services/merchants.service";
import { establishmentService, Establishment } from "@/services/establishment.service";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/utils/roleUtils";
import { AlertModal } from "@/components/modals/AlertModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";

export default function MerchantDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"delete" | "grantCampaign" | "revokeCampaign" | "grantCustomPoints" | "revokeCustomPoints" | "activate" | "deactivate">("delete");

  useEffect(() => {
    if (user && !isAdmin(user)) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (id && user && isAdmin(user)) {
      // Carregar dados de forma assíncrona após a primeira renderização completa
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => loadMerchant(Number(id)), { timeout: 100 });
      } else {
        setTimeout(() => loadMerchant(Number(id)), 50);
      }
    }
  }, [id, user]);

  const loadMerchant = async (merchantId: number) => {
    try {
      setLoading(true);
      setError("");
      const data = await merchantsService.getById(merchantId);
      setMerchant(data);
      
      // Carregar estabelecimento se houver establishment_id
      if (data.establishment_id) {
        try {
          const estData = await establishmentService.getById(data.establishment_id);
          setEstablishment(estData);
        } catch (err) {
          console.error("Erro ao carregar estabelecimento:", err);
        }
      }
    } catch (err: any) {
      console.error("❌ Erro ao carregar merchant:", err);
      setError(err.message || "Erro ao carregar merchant");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (type: typeof actionType) => {
    setActionType(type);
    setConfirmModalOpen(true);
  };

  const handleActionConfirm = async () => {
    if (!merchant?.merchant_id) return;

    try {
      setActionLoading(true);
      let message = "";

      switch (actionType) {
        case "delete":
          await merchantsService.delete(merchant.merchant_id);
          message = "Merchant deletado com sucesso!";
          setAlertConfig({
            title: "Sucesso!",
            message,
            type: "success",
          });
          setAlertModalOpen(true);
          setTimeout(() => {
            router.push("/admin/merchants");
          }, 2000);
          break;

        case "grantCampaign":
          await merchantsService.grantCampaignPermission(merchant.merchant_id);
          message = "Permissão de criar campanhas concedida!";
          await loadMerchant(merchant.merchant_id);
          break;

        case "revokeCampaign":
          await merchantsService.revokeCampaignPermission(merchant.merchant_id);
          message = "Permissão de criar campanhas revogada!";
          await loadMerchant(merchant.merchant_id);
          break;

        case "grantCustomPoints":
          await merchantsService.grantCustomPointsPermission(merchant.merchant_id);
          message = "Permissão de definir pontos personalizados concedida!";
          await loadMerchant(merchant.merchant_id);
          break;

        case "revokeCustomPoints":
          await merchantsService.revokeCustomPointsPermission(merchant.merchant_id);
          message = "Permissão de definir pontos personalizados revogada!";
          await loadMerchant(merchant.merchant_id);
          break;

        case "activate":
          await merchantsService.update(merchant.merchant_id, { is_active: true });
          message = "Merchant ativado com sucesso!";
          await loadMerchant(merchant.merchant_id);
          break;

        case "deactivate":
          await merchantsService.update(merchant.merchant_id, { is_active: false });
          message = "Merchant desativado com sucesso!";
          await loadMerchant(merchant.merchant_id);
          break;
      }

      if (message) {
        setAlertConfig({
          title: "Sucesso!",
          message,
          type: "success",
        });
        setAlertModalOpen(true);
      }
    } catch (err: any) {
      setAlertConfig({
        title: "Erro!",
        message: err.message || "Erro ao executar ação. Por favor, tente novamente.",
        type: "error",
      });
      setAlertModalOpen(true);
    } finally {
      setActionLoading(false);
      setConfirmModalOpen(false);
    }
  };

  const handleActionCancel = () => {
    setConfirmModalOpen(false);
  };

  if (!user || !isAdmin(user)) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          Acesso negado. Apenas administradores podem ver detalhes de merchants.
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

  if (error && !merchant) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="relative p-6">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="font-medium text-gray-600">Carregando merchant...</p>
            </div>
          </div>
        )}
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
        <div className="py-12 text-center">
          <p className="text-gray-500">Merchant não encontrado</p>
        </div>
      </div>
    );
  }

  // Extrair informações do usuário (pode estar em users[] ou user)
  const merchantUser = merchant.users && merchant.users.length > 0 
    ? merchant.users[0] 
    : merchant.user;
  
  const userName = merchantUser?.fullName || 
    `${merchantUser?.firstName || ""} ${merchantUser?.lastName || ""}`.trim() || 
    merchantUser?.username || 
    "Usuário desconhecido";
  
  const userEmail = merchantUser?.email || "";
  const userPhone = merchantUser?.phone || "";
  
  const canCreateCampaigns = merchant.can_create_campaigns || 
    (merchantUser?.permissions?.can_create_campaigns) || 
    false;
  const canSetCustomPoints = merchant.can_set_custom_points || 
    (merchantUser?.permissions?.can_set_custom_points) || 
    false;
  
  const isActive = merchant.is_active !== false;

  return (
    <div className="relative p-6">
      {/* Loading Overlay */}
      {loading && !merchant && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando merchant...</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/merchants/${merchant.merchant_id}/edit`)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Editar
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="border-b-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <span className="text-2xl font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold text-gray-900">{userName}</h1>
              {userEmail && (
                <p className="truncate text-sm text-gray-600">{userEmail}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isActive ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="p-6">
          {/* Informações do Usuário */}
          <div className="mb-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Informações do Merchant</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 text-sm text-gray-500">Nome Completo</div>
                <div className="text-lg font-semibold text-gray-900">{userName}</div>
              </div>
              {userEmail && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-1 text-sm text-gray-500">Email</div>
                  <div className="text-lg font-semibold text-gray-900">{userEmail}</div>
                </div>
              )}
              {userPhone && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-1 text-sm text-gray-500">Telefone</div>
                  <div className="text-lg font-semibold text-gray-900">{userPhone}</div>
                </div>
              )}
              {merchantUser?.username && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-1 text-sm text-gray-500">Username</div>
                  <div className="text-lg font-semibold text-gray-900">{merchantUser.username}</div>
                </div>
              )}
            </div>
          </div>

          {/* Estabelecimento */}
          {establishment && (
            <div className="mb-6 border-t border-gray-200 pt-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Estabelecimento</h2>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{establishment.name}</h3>
                    {establishment.type && (
                      <p className="text-sm text-gray-600">Tipo: {establishment.type}</p>
                    )}
                    {establishment.address && (
                      <p className="text-sm text-gray-600">Endereço: {establishment.address}</p>
                    )}
                  </div>
                  <button
                    onClick={() => router.push(`/admin/establishments/${establishment.id}`)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Ações */}
          <div className="mb-6 border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Ações</h2>
            <div className="flex flex-wrap gap-3">
              {isActive ? (
                <button
                  onClick={() => handleAction("deactivate")}
                  disabled={actionLoading}
                  className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-700 disabled:opacity-50"
                >
                  Desativar Merchant
                </button>
              ) : (
                <button
                  onClick={() => handleAction("activate")}
                  disabled={actionLoading}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  Ativar Merchant
                </button>
              )}
              <button
                onClick={() => handleAction("delete")}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                Deletar Merchant
              </button>
            </div>
          </div>

          {/* Datas */}
          {((merchant.created_at) || (merchant.updated_at)) && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Datas</h2>
              <div className="grid grid-cols-1 gap-4 text-sm text-gray-500 md:grid-cols-2">
                {merchant.created_at && (
                  <div>
                    <span className="font-semibold">Criado em: </span>
                    {new Date(merchant.created_at).toLocaleDateString("pt-MZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                )}
                {merchant.updated_at && (
                  <div>
                    <span className="font-semibold">Atualizado em: </span>
                    {new Date(merchant.updated_at).toLocaleDateString("pt-MZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
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
          autoClose={alertConfig.type === "success" ? 2000 : 0}
        />
      )}

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={handleActionCancel}
        onConfirm={handleActionConfirm}
        title={
          actionType === "delete" ? "Confirmar Exclusão" :
          actionType === "grantCampaign" ? "Conceder Permissão" :
          actionType === "revokeCampaign" ? "Revogar Permissão" :
          actionType === "grantCustomPoints" ? "Conceder Permissão" :
          actionType === "revokeCustomPoints" ? "Revogar Permissão" :
          actionType === "activate" ? "Ativar Merchant" :
          "Desativar Merchant"
        }
        message={
          actionType === "delete" ? `Tem certeza que deseja deletar o merchant "${userName}"? Esta ação não pode ser desfeita.` :
          actionType === "grantCampaign" ? `Tem certeza que deseja conceder permissão para criar campanhas ao merchant "${userName}"?` :
          actionType === "revokeCampaign" ? `Tem certeza que deseja revogar a permissão de criar campanhas do merchant "${userName}"?` :
          actionType === "grantCustomPoints" ? `Tem certeza que deseja conceder permissão para definir pontos personalizados ao merchant "${userName}"?` :
          actionType === "revokeCustomPoints" ? `Tem certeza que deseja revogar a permissão de definir pontos personalizados do merchant "${userName}"?` :
          actionType === "activate" ? `Tem certeza que deseja ativar o merchant "${userName}"?` :
          `Tem certeza que deseja desativar o merchant "${userName}"?`
        }
        confirmText={actionLoading ? "Processando..." : "Confirmar"}
        cancelText="Cancelar"
        type={actionType === "delete" ? "danger" : "warning"}
      />
    </div>
  );
}

