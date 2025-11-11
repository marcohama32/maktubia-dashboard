import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

// Rotas que requerem admin
const ADMIN_ROUTES = [
  "/admin/merchants",
  "/admin/users",
  "/admin/campaigns",
  "/admin/friends",
];

// Rotas que requerem merchant
const MERCHANT_ROUTES = [
  "/merchant/dashboard",
  "/merchant/campaigns",
];

// Rotas que permitem admin e merchant
const SHARED_ROUTES = [
  "/admin/customers",
  "/admin/redemptions",
  "/admin/points",
  "/admin/transfers",
  "/admin/documentation",
  "/admin/purchases",
  "/admin/establishments",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Permitir rotas públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar token no cookie ou header
  const token = request.cookies.get("auth_token")?.value || 
                request.headers.get("authorization")?.replace("Bearer ", "");

  // Se não tem token, redirecionar para login
  if (!token || token === "undefined" || token.trim() === "") {
    if (!pathname.startsWith("/login")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Verificar role do usuário (precisamos buscar do token ou cookie)
  // Por enquanto, vamos deixar o cliente verificar e redirecionar
  // O middleware só verifica se tem token, a verificação de role fica no cliente
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

