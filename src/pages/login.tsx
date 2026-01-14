import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMerchant } from "@/utils/roleUtils";
import { authService } from "@/services/auth.service";
import { userService, CreateUserDTO } from "@/services/user.service";
import {
  validateMozambiquePhone,
  validateDocumentNumber,
  formatDocumentNumber,
  formatMozambiquePhone,
  MOZAMBIQUE_DOCUMENT_TYPES,
  DocumentType,
} from "@/utils/mozambiqueValidators";

// mark this page to skip the dashboard layout
export const noAuth = true;

export default function Login() {
  // Toggle entre Login e Cadastro
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Estados do Login
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  
  // Estados do Cadastro
  const [registerData, setRegisterData] = useState<{
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [registerErrors, setRegisterErrors] = useState<{
    phone?: string;
    general?: string;
  }>({});
  const [registerLoading, setRegisterLoading] = useState(false);
  
  // Estados da Recuperação de Senha
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"request" | "verify" | "reset">("request");
  const [forgotPasswordData, setForgotPasswordData] = useState<{
    email: string;
    phone: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }>({
    email: "",
    phone: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotPasswordErrors, setForgotPasswordErrors] = useState<{
    email?: string;
    phone?: string;
    code?: string;
    password?: string;
    general?: string;
  }>({});
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  
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
      
      // Permitir login para todas as roles (admin, merchant, cliente, etc.)
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

  // Handler para cadastro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterErrors({});
    setError("");

    // Validações
    if (!registerData.firstName?.trim() && !registerData.lastName?.trim()) {
      setRegisterErrors({ general: "Nome (primeiro nome ou último nome) é obrigatório" });
      return;
    }

    if (!registerData.username?.trim()) {
      setRegisterErrors({ general: "Username é obrigatório" });
      return;
    }

    if (!registerData.email?.trim()) {
      setRegisterErrors({ general: "Email é obrigatório" });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      setRegisterErrors({ general: "Email inválido" });
      return;
    }

    // Validar senha (4 dígitos)
    if (!registerData.password || registerData.password.trim().length !== 4 || !/^\d{4}$/.test(registerData.password)) {
      setRegisterErrors({ general: "A senha deve conter exatamente 4 dígitos" });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterErrors({ general: "As senhas não coincidem" });
      return;
    }

    // Validar telefone
    if (registerData.phone) {
      const phoneValidation = validateMozambiquePhone(registerData.phone);
      if (!phoneValidation.isValid) {
        setRegisterErrors({ phone: phoneValidation.error || "Telefone inválido" });
        return;
      }
    }

    try {
      setRegisterLoading(true);

      // Preparar dados para envio - apenas role "user" (cliente)
      const userData: CreateUserDTO = {
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        username: registerData.username,
        email: registerData.email,
        phone: registerData.phone ? formatMozambiquePhone(registerData.phone) : undefined,
        password: registerData.password,
        role: "user", // Apenas role "user" (cliente) pode se cadastrar
        isActive: true,
      };

      // Remover campos undefined
      Object.keys(userData).forEach((key) => {
        const value = userData[key as keyof typeof userData];
        if (value === undefined) {
          delete userData[key as keyof typeof userData];
        }
      });

      const createdUser = await userService.create(userData);

      // Após cadastro bem-sucedido, fazer login automático
      setError("");
      setRegisterErrors({ general: "Cadastro realizado com sucesso! Fazendo login..." });
      
      try {
        // Fazer login automaticamente com as credenciais cadastradas
        await login(registerData.username, registerData.password);
        
        // Redirecionar para o dashboard
        router.push("/");
      } catch (loginError: any) {
        // Se o login automático falhar, mostrar mensagem e alternar para modo de login
        setRegisterErrors({ 
          general: "Cadastro realizado com sucesso! Por favor, faça login manualmente." 
        });
        
        // Limpar formulário
        setRegisterData({
          firstName: "",
          lastName: "",
          username: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });

        // Alternar para modo de login após 2 segundos
        setTimeout(() => {
          setIsRegisterMode(false);
          setRegisterErrors({});
        }, 2000);
      }
    } catch (err: any) {
      const message = err?.message || "Erro ao realizar cadastro";
      setRegisterErrors({ general: message });
    } finally {
      setRegisterLoading(false);
    }
  };

  // Handler para solicitar recuperação de senha
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordErrors({});

    if (!forgotPasswordData.email && !forgotPasswordData.phone) {
      setForgotPasswordErrors({ general: "Por favor, informe seu email ou telefone" });
      return;
    }

    try {
      setForgotPasswordLoading(true);
      await authService.forgotPassword({
        email: forgotPasswordData.email || undefined,
        phone: forgotPasswordData.phone || undefined,
      });

      // Se informou telefone, avançar para etapa de verificação
      if (forgotPasswordData.phone) {
        setForgotPasswordStep("verify");
        setForgotPasswordErrors({ general: "Código OTP enviado para seu telefone. Verifique sua mensagem SMS." });
      } else {
        setForgotPasswordErrors({ general: "Se o usuário existir e tiver telefone cadastrado, um código OTP será enviado." });
      }
    } catch (err: any) {
      setForgotPasswordErrors({ general: err.message || "Erro ao solicitar recuperação de senha" });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Handler para verificar código OTP e redefinir senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordErrors({});

    if (!forgotPasswordData.code) {
      setForgotPasswordErrors({ code: "Código OTP é obrigatório" });
      return;
    }

    if (!forgotPasswordData.newPassword || forgotPasswordData.newPassword.trim().length !== 4 || !/^\d{4}$/.test(forgotPasswordData.newPassword)) {
      setForgotPasswordErrors({ password: "A senha deve conter exatamente 4 dígitos" });
      return;
    }

    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setForgotPasswordErrors({ password: "As senhas não coincidem" });
      return;
    }

    if (!forgotPasswordData.phone) {
      setForgotPasswordErrors({ general: "Telefone não informado" });
      return;
    }

    try {
      setForgotPasswordLoading(true);
      await authService.resetPassword(
        forgotPasswordData.phone,
        forgotPasswordData.code,
        forgotPasswordData.newPassword
      );

      // Sucesso - fechar modal e mostrar mensagem
      setShowForgotPassword(false);
      setError("");
      setForgotPasswordStep("request");
      setForgotPasswordData({ email: "", phone: "", code: "", newPassword: "", confirmPassword: "" });
      setForgotPasswordErrors({});
      
      // Mostrar mensagem de sucesso
      alert("Senha alterada com sucesso! Faça login com sua nova senha.");
    } catch (err: any) {
      setForgotPasswordErrors({ general: err.message || "Erro ao redefinir senha" });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card principal com sombra elegante */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-gray-200/50">
          <div className="mb-8 text-center">
            {/* Logos lado a lado */}
            <div className="mb-6 flex justify-center items-center gap-6">
              <Image
                src="/images/logo1.png"
                alt="Maktubia Logo 1"
                width={150}
                height={150}
                className="object-contain"
                priority
                sizes="150px"
              />
              <Image
                src="/images/logo3.png"
                alt="Maktubia Logo 3"
                width={150}
                height={150}
                className="object-contain"
                priority
                sizes="150px"
              />
            </div>
            
            {/* Tabs modernos para alternar entre Login e Cadastro */}
            <div className="mb-6 flex rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setError("");
                  setRegisterErrors({});
                }}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  !isRegisterMode
                    ? "bg-white text-blue-600 shadow-md ring-2 ring-blue-500/20"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setError("");
                  setRegisterErrors({});
                }}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isRegisterMode
                    ? "bg-white text-blue-600 shadow-md ring-2 ring-blue-500/20"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Cadastrar
              </button>
            </div>

            <h2 className="text-3xl font-bold text-gray-900">
              {isRegisterMode ? "Criar Conta" : "Bem-vindo"}
            </h2>
            {isRegisterMode ? (
              <p className="mt-2 text-sm text-gray-500">
                Cadastre-se como cliente para começar
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                Entre na sua conta para continuar
              </p>
            )}
          </div>
        
        {!isRegisterMode ? (
          // Formulário de Login
          <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-gray-700">
              Usuário
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                autoComplete="username"
                disabled={loading || !!cooldownEnd}
                className="w-full rounded-xl border border-gray-300 bg-gray-50/50 pl-10 pr-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Usuário ou telefone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
              Senha
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
                autoComplete="current-password"
                disabled={loading || !!cooldownEnd}
                ref={passwordRef}
                className="w-full rounded-xl border border-gray-300 bg-gray-50/50 pl-10 pr-12 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
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
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {timeLeft && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Aguarde {timeLeft} antes de tentar novamente</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!cooldownEnd}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                A entrar...
              </span>
            ) : (
              "Login"
            )}
          </button>

          {/* Link para recuperação de senha */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(true);
                setForgotPasswordStep("request");
                setForgotPasswordData({ email: "", phone: "", code: "", newPassword: "", confirmPassword: "" });
                setForgotPasswordErrors({});
              }}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>
        </form>
        ) : (
          // Formulário de Cadastro
          <form onSubmit={handleRegister} className="space-y-5 max-h-[600px] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-gray-700">
                  Primeiro Nome
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  disabled={registerLoading}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Primeiro nome"
                  value={registerData.firstName}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-gray-700">
                  Último Nome
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  disabled={registerLoading}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Último nome"
                  value={registerData.lastName}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-gray-700">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  disabled={registerLoading}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50/50 pl-10 pr-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Nome de usuário"
                  value={registerData.username}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, username: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={registerLoading}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50/50 pl-10 pr-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="seu@email.com"
                  value={registerData.email}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  disabled={registerLoading}
                  className={`w-full rounded-xl border bg-gray-50/50 pl-10 pr-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    registerErrors.phone
                      ? "border-red-300 focus:border-red-500 focus:bg-white focus:ring-red-500/20"
                      : "border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-blue-500/20"
                  }`}
                placeholder="+258841234567 ou 841234567"
                value={registerData.phone}
                onChange={(e) => {
                  setRegisterData({ ...registerData, phone: e.target.value });
                  setRegisterErrors({ ...registerErrors, phone: undefined });
                }}
                onBlur={() => {
                  if (registerData.phone) {
                    const validation = validateMozambiquePhone(registerData.phone);
                    if (!validation.isValid) {
                      setRegisterErrors({
                        ...registerErrors,
                        phone: validation.error || "Telefone inválido",
                      });
                    } else {
                      setRegisterData({
                        ...registerData,
                        phone: formatMozambiquePhone(registerData.phone),
                      });
                    }
                  }
                }}
              />
              </div>
              {registerErrors.phone && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {registerErrors.phone}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="registerPassword" className="mb-2 block text-sm font-medium text-gray-700">
                Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="registerPassword"
                  name="registerPassword"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  required
                  minLength={4}
                  maxLength={4}
                  disabled={registerLoading}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50/50 pl-10 pr-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="4 dígitos"
                  value={registerData.password}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 4) {
                      setRegisterData({ ...registerData, password: value });
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                Confirmar Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  required
                  minLength={4}
                  maxLength={4}
                  disabled={registerLoading}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50/50 pl-10 pr-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="4 dígitos"
                  value={registerData.confirmPassword}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 4) {
                      setRegisterData({ ...registerData, confirmPassword: value });
                    }
                  }}
                />
              </div>
            </div>

            {registerErrors.general && (
              <div
                className={`rounded-xl border p-3 text-sm flex items-start gap-2 ${
                  registerErrors.general.includes("sucesso")
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {registerErrors.general.includes("sucesso") ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <span>{registerErrors.general}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={registerLoading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
            >
              {registerLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  A cadastrar...
                </span>
              ) : (
                "Cadastrar"
              )}
            </button>
          </form>
        )}

        {/* Modal de Recuperação de Senha */}
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
              <div className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {forgotPasswordStep === "request" && "Recuperar Senha"}
                    {forgotPasswordStep === "verify" && "Verificar Código"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordStep("request");
                      setForgotPasswordData({ email: "", phone: "", code: "", newPassword: "", confirmPassword: "" });
                      setForgotPasswordErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  {forgotPasswordStep === "request" && "Informe seu email ou telefone para receber um código de recuperação"}
                  {forgotPasswordStep === "verify" && "Digite o código OTP recebido por SMS e sua nova senha"}
                </p>
              </div>

              {forgotPasswordStep === "request" ? (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-5">
                  <div>
                    <label htmlFor="forgotEmail" className="mb-2 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        id="forgotEmail"
                        type="email"
                        disabled={forgotPasswordLoading}
                        className="w-full rounded-xl border border-gray-300 bg-gray-50/50 pl-10 pr-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="seu@email.com"
                        value={forgotPasswordData.email}
                        onChange={(e) => {
                          setForgotPasswordData({ ...forgotPasswordData, email: e.target.value });
                          setForgotPasswordErrors({ ...forgotPasswordErrors, email: undefined });
                        }}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">ou</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="forgotPhone" className="mb-2 block text-sm font-medium text-gray-700">
                      Telefone
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        id="forgotPhone"
                        type="tel"
                        disabled={forgotPasswordLoading}
                        className="w-full rounded-xl border border-gray-300 bg-gray-50/50 pl-10 pr-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="+258841234567 ou 841234567"
                        value={forgotPasswordData.phone}
                        onChange={(e) => {
                          setForgotPasswordData({ ...forgotPasswordData, phone: e.target.value });
                          setForgotPasswordErrors({ ...forgotPasswordErrors, phone: undefined });
                        }}
                        onBlur={() => {
                          if (forgotPasswordData.phone) {
                            const validation = validateMozambiquePhone(forgotPasswordData.phone);
                            if (!validation.isValid) {
                              setForgotPasswordErrors({
                                ...forgotPasswordErrors,
                                phone: validation.error || "Telefone inválido",
                              });
                            } else {
                              setForgotPasswordData({
                                ...forgotPasswordData,
                                phone: formatMozambiquePhone(forgotPasswordData.phone),
                              });
                            }
                          }
                        }}
                      />
                    </div>
                    {forgotPasswordErrors.phone && (
                      <p className="mt-1.5 text-xs text-red-600">{forgotPasswordErrors.phone}</p>
                    )}
                  </div>

                  {forgotPasswordErrors.general && (
                    <div
                      className={`rounded-xl border p-3 text-sm flex items-start gap-2 ${
                        forgotPasswordErrors.general.includes("enviado") || forgotPasswordErrors.general.includes("OTP")
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-red-50 border-red-200 text-red-700"
                      }`}
                    >
                      <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {forgotPasswordErrors.general.includes("enviado") || forgotPasswordErrors.general.includes("OTP") ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                      <span>{forgotPasswordErrors.general}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordStep("request");
                        setForgotPasswordData({ email: "", phone: "", code: "", newPassword: "", confirmPassword: "" });
                        setForgotPasswordErrors({});
                      }}
                      className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={forgotPasswordLoading}
                      className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {forgotPasswordLoading ? "Enviando..." : "Enviar Código"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label htmlFor="otpCode" className="mb-2 block text-sm font-medium text-gray-700">
                      Código OTP <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="otpCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      disabled={forgotPasswordLoading}
                      className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm text-center text-lg tracking-widest transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="000000"
                      value={forgotPasswordData.code}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setForgotPasswordData({ ...forgotPasswordData, code: value });
                        setForgotPasswordErrors({ ...forgotPasswordErrors, code: undefined });
                      }}
                    />
                    {forgotPasswordErrors.code && (
                      <p className="mt-1.5 text-xs text-red-600">{forgotPasswordErrors.code}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-700">
                      Nova Senha <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]{4}"
                      required
                      minLength={4}
                      maxLength={4}
                      disabled={forgotPasswordLoading}
                      className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="4 dígitos"
                      value={forgotPasswordData.newPassword}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setForgotPasswordData({ ...forgotPasswordData, newPassword: value });
                        setForgotPasswordErrors({ ...forgotPasswordErrors, password: undefined });
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmNewPassword" className="mb-2 block text-sm font-medium text-gray-700">
                      Confirmar Nova Senha <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="confirmNewPassword"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]{4}"
                      required
                      minLength={4}
                      maxLength={4}
                      disabled={forgotPasswordLoading}
                      className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="4 dígitos"
                      value={forgotPasswordData.confirmPassword}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setForgotPasswordData({ ...forgotPasswordData, confirmPassword: value });
                        setForgotPasswordErrors({ ...forgotPasswordErrors, password: undefined });
                      }}
                    />
                    {forgotPasswordErrors.password && (
                      <p className="mt-1.5 text-xs text-red-600">{forgotPasswordErrors.password}</p>
                    )}
                  </div>

                  {forgotPasswordErrors.general && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
                      <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{forgotPasswordErrors.general}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordStep("request")}
                      className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={forgotPasswordLoading}
                      className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {forgotPasswordLoading ? "Redefinindo..." : "Redefinir Senha"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}