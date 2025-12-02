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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-gray-100">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/images/logo2.png"
              alt="Maktubia Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
              sizes="120px"
            />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Entre com suas credenciais para acessar o painel
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="mb-1 block text-sm font-medium text-gray-700">
                Usuário
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 10a4 4 0 100-8 4 4 0 000 8z" />
                    <path fillRule="evenodd" d="M2 18a8 8 0 0116 0H2z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  disabled={loading || !!cooldownEnd}
                  className="block w-full appearance-none rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-60"
                  placeholder="seu usuário / telefone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
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
                  className="block w-full appearance-none rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-60"
                  placeholder="Digite 4 dígitos"
                  value={password}
                  onChange={(e) => {
                    // Permitir apenas números
                    const value = e.target.value.replace(/\D/g, '');
                    // Limitar a 4 dígitos
                    if (value.length <= 4) {
                      setPassword(value);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || !!cooldownEnd}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
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
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-500">
              {error}
            </div>
          )}

          {timeLeft && (
            <div className="rounded-lg bg-yellow-50 p-3 text-center text-sm text-yellow-700">
              Bloqueado por muitas tentativas. Tente novamente daqui a {timeLeft}.
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !!cooldownEnd}
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 ease-in-out hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                {loading ? (
                  <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-500 group-hover:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              {loading ? "A entrar..." : "Entrar no Sistema"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}