import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    // Executa logout e redireciona para login
    logout();
    router.replace("/login");
  }, [logout, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="rounded-lg bg-white px-6 py-4 shadow">
        <p className="text-sm text-gray-700">Terminando sessão...</p>
      </div>
    </div>
  );
}












