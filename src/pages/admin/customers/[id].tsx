import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { customerService, Customer } from "@/services/customer.service";

export default function CustomerDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (id) {
      // Carregar dados de forma assíncrona após a primeira renderização completa
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => loadCustomer(Number(id)), { timeout: 100 });
      } else {
        setTimeout(() => loadCustomer(Number(id)), 50);
      }
    }
  }, [id]);

  const loadCustomer = async (customerId: number) => {
    try {
      setLoading(true);
      setError("");
      const data = await customerService.getById(customerId);
      setCustomer(data);
    } catch (err: any) {
      console.error("Erro ao carregar cliente:", err);
      setError(err.message || "Erro ao carregar cliente");
    } finally {
      setLoading(false);
    }
  };

  const status = customer?.isActive !== false;

  return (
    <div className="relative p-6">
      {/* Loading Overlay */}
      {loading && !customer && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="font-medium text-gray-600">Carregando cliente...</p>
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
          {customer && (
            <button
              onClick={() => router.push(`/admin/customers/${customer.id}/edit`)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {!customer && !loading && (
        <div className="rounded-lg bg-white p-6 text-center shadow-lg">
          <p className="text-gray-500">Cliente não encontrado.</p>
        </div>
      )}

      {customer && (
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          {/* Header com linha fina */}
          <div className="border-b-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                  <span className="text-2xl font-bold text-white">
                    {(customer?.fullName || customer?.name || customer?.username || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-bold text-gray-900">
                  {customer?.fullName || customer?.name || customer?.username || "Sem nome"}
                </h1>
                {(customer?.firstName || customer?.lastName) && (
                  <p className="truncate text-sm text-gray-600">
                    {customer?.firstName} {customer?.lastName}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {customer?.level && (
                  <span className="inline-flex rounded-full border border-purple-300 bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                    {customer.level}
                  </span>
                )}
                {customer?.points !== undefined && (
                  <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                    {customer.points.toLocaleString("pt-MZ")} pts
                  </span>
                )}
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    status
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {status ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          </div>

        {/* Informações */}
        <div className="p-6">
          {/* Informações básicas */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {customer.username && (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 text-sm text-gray-500">Username</div>
                <div className="text-lg font-semibold text-gray-900">{customer.username}</div>
              </div>
            )}
            {customer.points !== undefined && (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 text-sm text-gray-500">Pontos</div>
                <div className="text-lg font-semibold text-gray-900">
                  {customer.points.toLocaleString("pt-MZ")}
                  {customer.pointsToNextLevel !== undefined && customer.pointsToNextLevel > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (Próximo: {customer.pointsToNextLevel.toLocaleString("pt-MZ")})
                    </span>
                  )}
                </div>
              </div>
            )}
            {customer.balance !== undefined && (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 text-sm text-gray-500">Saldo</div>
                <div className="text-lg font-semibold text-gray-900">
                  {customer.balance.toLocaleString("pt-MZ")} MZN
                </div>
              </div>
            )}
          </div>

          <div className="mb-6 border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Informações de Contacto</h2>
            <div className="space-y-3">
              {customer.email && (
                <div className="flex items-center text-gray-700">
                  <svg className="mr-3 h-5 w-5 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center text-gray-700">
                  <svg className="mr-3 h-5 w-5 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.bi && (
                <div className="flex items-center text-gray-700">
                  <svg className="mr-3 h-5 w-5 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <span>{customer.bi}</span>
                </div>
              )}
            </div>
          </div>

          {customer.metrics && (
            <div className="mb-6 border-t border-gray-200 pt-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Métricas</h2>
              <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {customer.metrics.totalPurchases !== undefined && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">Total de Compras</div>
                    <div className="text-2xl font-bold text-blue-700">{customer.metrics.totalPurchases}</div>
                  </div>
                )}
                {customer.metrics.totalSpent !== undefined && (
                  <div className="rounded-lg bg-green-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">Total Gasto</div>
                    <div className="text-2xl font-bold text-green-700">{customer.metrics.totalSpent.toLocaleString("pt-MZ")} MZN</div>
                  </div>
                )}
                {customer.metrics.uniqueEstablishmentsVisited !== undefined && (
                  <div className="rounded-lg bg-purple-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">Estabelecimentos Visitados</div>
                    <div className="text-2xl font-bold text-purple-700">{customer.metrics.uniqueEstablishmentsVisited}</div>
                  </div>
                )}
                {customer.metrics.totalPointTransactions !== undefined && (
                  <div className="rounded-lg bg-orange-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">Transacções de Pontos</div>
                    <div className="text-2xl font-bold text-orange-700">{customer.metrics.totalPointTransactions}</div>
                  </div>
                )}
              </div>

              {/* Transfers */}
              {customer.metrics.transfers && (
                <div className="mb-4">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">Transferências</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {customer.metrics.transfers.sent !== undefined && (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="mb-1 text-xs text-gray-500">Enviadas</div>
                        <div className="text-lg font-bold text-gray-900">{customer.metrics.transfers.sent}</div>
                      </div>
                    )}
                    {customer.metrics.transfers.received !== undefined && (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="mb-1 text-xs text-gray-500">Recebidas</div>
                        <div className="text-lg font-bold text-gray-900">{customer.metrics.transfers.received}</div>
                      </div>
                    )}
                    {customer.metrics.transfers.pointsTransferredOut !== undefined && (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="mb-1 text-xs text-gray-500">Pontos Enviados</div>
                        <div className="text-lg font-bold text-gray-900">{customer.metrics.transfers.pointsTransferredOut.toLocaleString("pt-MZ")}</div>
                      </div>
                    )}
                    {customer.metrics.transfers.pointsTransferredIn !== undefined && (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="mb-1 text-xs text-gray-500">Pontos Recebidos</div>
                        <div className="text-lg font-bold text-gray-900">{customer.metrics.transfers.pointsTransferredIn.toLocaleString("pt-MZ")}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rewards */}
              {customer.metrics.rewards && (
                <div className="mb-4">
                  <h3 className="mb-3 text-lg font-semibold text-gray-900">Recompensas</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {customer.metrics.rewards.redeemed !== undefined && (
                      <div className="rounded-lg bg-yellow-50 p-3">
                        <div className="mb-1 text-xs text-gray-500">Recompensas Resgatadas</div>
                        <div className="text-lg font-bold text-yellow-700">{customer.metrics.rewards.redeemed}</div>
                      </div>
                    )}
                    {customer.metrics.rewards.pointsSpent !== undefined && (
                      <div className="rounded-lg bg-yellow-50 p-3">
                        <div className="mb-1 text-xs text-gray-500">Pontos Gastos em Recompensas</div>
                        <div className="text-lg font-bold text-yellow-700">{customer.metrics.rewards.pointsSpent.toLocaleString("pt-MZ")}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activity Status */}
              {customer.metrics.activityStatus && (
                <div className="rounded-lg bg-indigo-50 p-4">
                  <div className="mb-1 text-sm text-gray-500">Status de Actividade</div>
                  <div className="text-lg font-bold capitalize text-indigo-700">
                    {customer.metrics.activityStatus.replace(/_/g, " ")}
                  </div>
                  {customer.metrics.daysSinceRegistration !== undefined && (
                    <div className="mt-2 text-xs text-gray-500">
                      Registado há {customer.metrics.daysSinceRegistration} dia{customer.metrics.daysSinceRegistration !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {((customer.createdAt || customer.created_at) || (customer.updatedAt || customer.updated_at) || customer.lastLogin) && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Datas</h2>
              <div className="grid grid-cols-1 gap-4 text-sm text-gray-500 md:grid-cols-3">
                {(customer.createdAt || customer.created_at) && (
                  <div>
                    <span className="font-semibold">Criado em: </span>
                    {new Date(customer.createdAt || customer.created_at || "").toLocaleDateString("pt-MZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                )}
                {(customer.updatedAt || customer.updated_at) && (
                  <div>
                    <span className="font-semibold">Atualizado em: </span>
                    {new Date(customer.updatedAt || customer.updated_at || "").toLocaleDateString("pt-MZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                )}
                {customer.lastLogin ? (
                  <div>
                    <span className="font-semibold">Último login: </span>
                    {new Date(customer.lastLogin).toLocaleDateString("pt-MZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold">Último login: </span>
                    <span className="text-red-600">Nunca fez login</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}


