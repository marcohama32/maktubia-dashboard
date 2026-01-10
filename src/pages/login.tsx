import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant } from "@/utils/roleUtils";
import { authService } from "@/services/auth.service";

// mark this page to skip the dashboard layout
export const noAuth = true;

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  
  const authContext = useAuth();
  const { login } = authContext;
  const COOLDOWN_KEY = "login_cooldown_end";

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown for cooldownEnd - MUST BE BEFORE ANY CONDITIONAL RETURN
  useEffect(() => {
    // Verifica se está no cliente antes de acessar localStorage
    if (typeof window === "undefined") return;

    // read persisted cooldown from localStorage once
    try {
      const stored = localStorage.getItem(COOLDOWN_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (!isNaN(n) && n > Date.now()) {
          setCooldownEnd(n);
        } else {
          localStorage.removeItem(COOLDOWN_KEY);
        }
      }
    } catch {}

    if (!cooldownEnd) {
      setTimeLeft(null);
      return;
    }
    const tick = () => {
      const diff = cooldownEnd - Date.now();
      if (diff <= 0) {
        setCooldownEnd(null);
        try { 
          if (typeof window !== "undefined") {
            localStorage.removeItem(COOLDOWN_KEY);
          }
        } catch {}
        setTimeLeft(null);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}m ${secs}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [cooldownEnd]);
  
  // Show loading while mounting on client
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-gray-100">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) {
      return;
    }
    if (cooldownEnd && Date.now() < cooldownEnd) {
      setError("Bloqueado por muitas tentativas. Aguarde antes de tentar novamente.");
      return;
    }

    // Validar que a senha tenha exatamente 4 dígitos numéricos
    if (!password || password.trim().length !== 4 || !/^\d{4}$/.test(password)) {
      setError("A senha deve conter exatamente 4 dígitos");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Fazer login diretamente pelo serviço para obter o usuário antes de atualizar o contexto
      const loginResponse = await authService.login({ identifier, password });
      
      // Verificar se o usuário tem role permitida (apenas admin ou merchant)
      if (loginResponse.user && !isAdmin(loginResponse.user) && !isMerchant(loginResponse.user)) {
        // Se não for admin nem merchant, não fazer login e mostrar erro
        setError("Acesso negado. Apenas administradores e comerciantes podem acessar o sistema.");
        setLoading(false);
        return;
      }
      
      // Se passou na validação, fazer login no contexto
      await login(identifier, password);
      
      // Verificar se há uma URL de redirecionamento salva (vindo de notificação)
      const redirectUrl = typeof window !== "undefined" 
        ? localStorage.getItem("redirectAfterLogin") 
        : null;
      
      if (redirectUrl) {
        // Remover a URL de redirecionamento após usar
        localStorage.removeItem("redirectAfterLogin");
        router.push(redirectUrl);
      } else {
        // Redirecionamento padrão
        router.push("/");
      }
    } catch (err: any) {
      // err may be an Error with attached status
      const message = err?.message || "Erro ao fazer login";
      setError(message);

      // Clear only the password so the user can retry quickly, and focus it
      setPassword("");
      setTimeout(() => passwordRef.current?.focus(), 50);

      // Prefer explicit retryAfter provided by authService (ms) or header
      const retryMs = err?.retryAfter || err?.response?.data?.retryAfter || err?.response?.headers?.["retry-after"];
      if (retryMs && typeof retryMs === "number") {
        const end = Date.now() + retryMs;
        setCooldownEnd(end);
        try { 
          if (typeof window !== "undefined") {
            localStorage.setItem(COOLDOWN_KEY, String(end));
          }
        } catch {}
      } else {
        // If backend status is 429 but no header, parse message for minutes/hours
        const status = err?.status || err?.response?.status;
        if (status === 429) {
          const match = /([0-9]{1,3})\s*min/i.exec(message) || /([0-9]{1,3})\s*minutos/i.exec(message) || /([0-9]{1,3})\s*h/i.exec(message);
          let ms = 15 * 60 * 1000; // default 15 minutes
          if (match) {
            const n = parseInt(match[1], 10);
            const isHour = /h/i.test(match[0]) || /hora/i.test(message);
            ms = isHour ? n * 60 * 60 * 1000 : n * 60 * 1000;
          }
          const end = Date.now() + ms;
          setCooldownEnd(end);
          try { 
            if (typeof window !== "undefined") {
              localStorage.setItem(COOLDOWN_KEY, String(end));
            }
          } catch {}
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-md">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/images/logo2.png"
              alt="Maktubia Logo"
              width={80}
              height={80}
              className="object-contain"
              priority
              sizes="80px"
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Entrar
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="mb-1 block text-sm text-gray-700">
              Usuário
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              disabled={loading || !!cooldownEnd}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Usuário ou telefone"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-gray-700">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]{4}"
                required
                minLength={4}
                maxLength={4}
                disabled={loading || !!cooldownEnd}
                ref={passwordRef}
                className="w-full rounded border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="4 dígitos"
                value={password}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 4) {
                    setPassword(value);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading || !!cooldownEnd}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title={showPassword ? "Ocultar" : "Mostrar"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {timeLeft && (
            <div className="rounded bg-yellow-50 p-2 text-sm text-yellow-700">
              Aguarde {timeLeft} antes de tentar novamente
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!cooldownEnd}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}