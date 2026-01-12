/**
 * Utilitários para verificação de roles de usuário
 */

export interface User {
  role?: string | { id?: number; name?: string; description?: string; [key: string]: any };
  role_name?: string;
  user_role?: string;
  [key: string]: any;
}

/**
 * Normaliza o role de um usuário para string
 */
export function normalizeRole(roleValue: any): string {
  if (!roleValue) return "";
  
  // Se é string, retorna diretamente
  if (typeof roleValue === "string") {
    return roleValue.toLowerCase().trim();
  }
  
  // Se é objeto, extrai o name
  if (typeof roleValue === "object" && roleValue !== null) {
    const name = roleValue.name || roleValue.role_name || roleValue.role || "";
    return String(name).toLowerCase().trim();
  }
  
  return String(roleValue).toLowerCase().trim();
}

/**
 * Obtém o role normalizado de um usuário
 */
export function getUserRole(user: User | null): string {
  if (!user) return "";
  
  // Tentar múltiplos campos possíveis
  const roleName = normalizeRole(user.role) || 
                  normalizeRole(user.role_name) || 
                  normalizeRole(user.user_role) ||
                  normalizeRole((user as any).role?.name) ||
                  normalizeRole((user as any).role_name) ||
                  normalizeRole((user as any).user_role);
  
  // Debug: logar o role encontrado
  if (typeof window !== "undefined" && roleName) {
    console.log("🔍 [ROLE] Role detectado:", {
      roleRaw: user.role,
      roleName: user.role_name,
      userRole: user.user_role,
      roleNameNormalized: roleName,
    });
  }
  
  return roleName;
}

/**
 * Verifica se o usuário é admin
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  
  const roleName = getUserRole(user);
  const adminVariations = ["admin", "administrator", "administrador", "adm"];
  
  return adminVariations.includes(roleName);
}

/**
 * Verifica se o usuário é merchant
 */
export function isMerchant(user: User | null): boolean {
  if (!user) return false;
  
  const roleName = getUserRole(user);
  const merchantVariations = ["merchant", "merchante", "comerciante", "merchant_user"];
  
  // Debug: logar verificação de merchant
  if (typeof window !== "undefined") {
    console.log("🔍 [ROLE] Verificando se é merchant:", {
      roleName,
      isMerchant: merchantVariations.includes(roleName),
    });
  }
  
  return merchantVariations.includes(roleName);
}

/**
 * Verifica se o usuário é user (cliente comum)
 */
export function isUser(user: User | null): boolean {
  if (!user) return false;
  
  const roleName = getUserRole(user);
  const userVariations = ["user", "usuário", "usuario", "cliente", "customer"];
  
  return userVariations.includes(roleName);
}

/**
 * Verifica se o usuário tem acesso (admin ou merchant)
 */
export function hasAccess(user: User | null): boolean {
  return isAdmin(user) || isMerchant(user);
}


