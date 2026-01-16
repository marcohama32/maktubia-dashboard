import { useState, useEffect } from "react";
import { browserNotificationService } from "@/services/browserNotification.service";

export function NotificationPermissionBanner() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Verificar permissão inicial
    const checkPermission = () => {
      if (browserNotificationService.isNotificationSupported()) {
        const currentPermission = browserNotificationService.getPermission();
        setPermission(currentPermission);
        
        // Mostrar banner apenas se:
        // 1. Permissão está negada
        // 2. Não foi dispensado pelo usuário
        // 3. Não está em localStorage que foi dispensado permanentemente
        const dismissedPermanently = localStorage.getItem('notification_banner_dismissed') === 'true';
        if (currentPermission === 'denied' && !isDismissed && !dismissedPermanently) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }
    };

    checkPermission();

    // Verificar periodicamente (caso o usuário permita manualmente) - a cada 5 segundos para não sobrecarregar
    const interval = setInterval(checkPermission, 5000);

    return () => clearInterval(interval);
  }, [isDismissed]);

  const handleRequestPermission = async () => {
    console.log('🔔 [NotificationPermissionBanner] Usuário clicou para solicitar permissão');
    const newPermission = await browserNotificationService.requestPermission();
    setPermission(newPermission);
    
    if (newPermission === 'granted') {
      setIsVisible(false);
      alert('✅ Permissão concedida! Você receberá notificações mesmo quando a página não estiver em foco.');
    } else if (newPermission === 'denied') {
      alert('⚠️ Permissão ainda negada. Por favor, permita manualmente:\n\n1. Clique no ícone de cadeado 🔒 na barra de endereço\n2. Selecione "Permitir" em Notificações\n3. Recarregue a página');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    // Salvar no localStorage para não mostrar novamente nesta sessão
    localStorage.setItem('notification_banner_dismissed', 'true');
  };

  if (!isVisible || permission === 'granted') {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 max-w-md"
      style={{
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 text-2xl">🔔</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-orange-900 mb-1">
              Notificações Bloqueadas
            </h3>
            <p className="text-xs text-orange-800 mb-3">
              Para receber notificações quando campanhas forem criadas, permita notificações do navegador.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleRequestPermission}
                className="w-full text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded transition-colors"
              >
                Tentar Ativar Novamente
              </button>
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleDismiss}
                  className="text-xs text-orange-600 hover:text-orange-800"
                >
                  Não mostrar novamente
                </button>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('📋 Instruções:\n\n1. Clique no ícone de cadeado 🔒 na barra de endereço (à esquerda da URL)\n2. Encontre "Notificações" na lista\n3. Selecione "Permitir"\n4. Recarregue esta página (F5)\n\nOu vá em:\nConfigurações do navegador → Privacidade e segurança → Notificações do site');
                  }}
                  className="text-xs text-orange-600 hover:text-orange-800 underline"
                >
                  Ver instruções detalhadas
                </a>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-orange-400 hover:text-orange-600"
            title="Fechar"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

