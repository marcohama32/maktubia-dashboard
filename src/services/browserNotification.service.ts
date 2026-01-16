/**
 * Serviço para gerenciar notificações do navegador (Browser Notifications)
 * Permite mostrar notificações mesmo quando a página não está em foco
 */

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

class BrowserNotificationService {
  private permission: NotificationPermission = 'default';
  private isSupported: boolean = false;

  constructor() {
    console.log('🔧 [BrowserNotification] Inicializando serviço de notificações do navegador...');
    if (typeof window !== 'undefined') {
      // Verificar suporte: 'Notification' in window
      this.isSupported = 'Notification' in window;
      console.log('🔧 [BrowserNotification] Suporte a notificações:', this.isSupported);
      
      if (this.isSupported) {
        this.permission = Notification.permission;
        console.log('🔧 [BrowserNotification] Permissão inicial:', this.permission);
        
        // Verificar se está em HTTPS (recomendado para notificações)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          console.warn('⚠️ [BrowserNotification] Notificações funcionam melhor em HTTPS. Ambiente atual:', window.location.protocol);
        }
      } else {
        console.warn('⚠️ [BrowserNotification] Notificações não são suportadas neste navegador');
      }
    } else {
      console.log('🔧 [BrowserNotification] Executando no servidor (SSR), notificações não disponíveis');
    }
  }

  /**
   * Verificar se notificações do navegador são suportadas
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Obter status da permissão atual
   */
  getPermission(): NotificationPermission {
    if (typeof window !== 'undefined' && this.isSupported) {
      // Sempre obter o valor atual do navegador
      this.permission = Notification.permission;
    }
    return this.permission;
  }

  /**
   * Solicitar permissão para notificações
   */
  async requestPermission(): Promise<NotificationPermission> {
    console.log('🚀 [BrowserNotification] requestPermission() chamado');
    console.log('🚀 [BrowserNotification] this.isSupported:', this.isSupported);
    console.log('🚀 [BrowserNotification] typeof window:', typeof window);
    
    if (!this.isSupported) {
      console.warn('⚠️ [BrowserNotification] Notificações do navegador não são suportadas neste navegador');
      return 'denied';
    }

    if (typeof window === 'undefined') {
      console.warn('⚠️ [BrowserNotification] window não está disponível (SSR)');
      return 'denied';
    }

    // Sempre verificar o estado atual do navegador
    console.log('🔍 [BrowserNotification] Verificando Notification.permission...');
    const currentPermission = Notification.permission;
    console.log('🔍 [BrowserNotification] Notification.permission atual:', currentPermission);
    console.log('🔍 [BrowserNotification] this.permission (anterior):', this.permission);
    this.permission = currentPermission;

    if (currentPermission === 'granted') {
      console.log('✅ [BrowserNotification] Permissão de notificações já concedida');
      return 'granted';
    }

    if (currentPermission === 'denied') {
      console.warn('⚠️ [BrowserNotification] Permissão de notificações foi negada pelo usuário');
      console.warn('💡 [BrowserNotification] Não é possível solicitar novamente programaticamente');
      console.warn('💡 [BrowserNotification] O usuário precisa permitir manualmente nas configurações do navegador');
      return 'denied';
    }

    // Se está em 'default', solicitar permissão automaticamente
    // Seguindo o padrão recomendado: Notification.requestPermission().then(...)
    console.log('🔔 [BrowserNotification] Permissão está em "default", solicitando permissão...');
    
    try {
      // Padrão recomendado: Notification.requestPermission() retorna uma Promise
      // Usar .then() como no exemplo fornecido
      let permission: NotificationPermission;
      
      if (typeof Notification.requestPermission === 'function') {
        const result = Notification.requestPermission();
        
        // Verificar se retorna Promise (padrão moderno) ou valor direto (navegadores antigos)
        if (result instanceof Promise) {
          // Padrão moderno: usar Promise
          permission = await result;
        } else {
          // Navegadores antigos: resultado direto
          permission = result;
        }
      } else {
        // Fallback para navegadores muito antigos que usam callback
        permission = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission(resolve);
        });
      }
      
      console.log('🔔 [BrowserNotification] Permissão final obtida:', permission);
      this.permission = permission;
      
      if (permission === 'granted') {
        console.log('✅ [BrowserNotification] ✅✅✅ PERMISSÃO CONCEDIDA! ✅✅✅');
      } else if (permission === 'denied') {
        console.warn('⚠️ [BrowserNotification] ⚠️⚠️⚠️ PERMISSÃO NEGADA ⚠️⚠️⚠️');
      } else {
        console.warn('⚠️ [BrowserNotification] Permissão permanece como default');
      }
      
      return permission;
    } catch (error) {
      console.error('❌ [BrowserNotification] ❌❌❌ ERRO ao solicitar permissão ❌❌❌');
      console.error('❌ [BrowserNotification] Tipo do erro:', error?.constructor?.name);
      console.error('❌ [BrowserNotification] Mensagem do erro:', error?.message);
      console.error('❌ [BrowserNotification] Stack do erro:', error?.stack);
      console.error('❌ [BrowserNotification] Erro completo:', error);
      return 'denied';
    }
  }

  /**
   * Verificar se tem permissão para mostrar notificações
   */
  hasPermission(): boolean {
    return this.getPermission() === 'granted';
  }

  /**
   * Mostrar notificação do navegador
   */
  async showNotification(options: BrowserNotificationOptions): Promise<Notification | null> {
    console.log('🚀 [BrowserNotification] showNotification() chamado');
    console.log('🚀 [BrowserNotification] Opções:', options);
    
    if (!this.isSupported) {
      console.warn('⚠️ [BrowserNotification] Notificações do navegador não são suportadas');
      return null;
    }

    console.log('🔍 [BrowserNotification] Verificando permissão...');
    const hasPermission = this.hasPermission();
    console.log('🔍 [BrowserNotification] hasPermission():', hasPermission);
    
    // Verificar permissão
    if (!hasPermission) {
      console.warn('⚠️ [BrowserNotification] Sem permissão para mostrar notificações. Solicitando permissão...');
      const permission = await this.requestPermission();
      console.log('🔍 [BrowserNotification] Resultado da solicitação:', permission);
      if (permission !== 'granted') {
        console.warn('⚠️ [BrowserNotification] Permissão negada. Não é possível mostrar notificação.');
        return null;
      }
    }

    console.log('✅ [BrowserNotification] Tem permissão, criando notificação...');

    try {
      // Seguindo o padrão recomendado: new Notification(title, options)
      // Melhorar estilo visual com opções aprimoradas
      // Usar caminho absoluto para o ícone para garantir que funcione
      // IMPORTANTE: Para notificações, o ícone deve ter pelo menos 192x192 pixels para aparecer grande
      // Usar URL absoluta completa para garantir que o navegador carregue o ícone corretamente
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const iconPath = options.icon || '/images/logo3.PNG';
      const badgePath = options.badge || '/images/logo3.PNG';
      
      // Construir URL absoluta para o ícone
      const absoluteIconPath = iconPath.startsWith('http') ? iconPath : `${baseUrl}${iconPath}`;
      const absoluteBadgePath = badgePath.startsWith('http') ? badgePath : `${baseUrl}${badgePath}`;
      
      console.log('🖼️ [BrowserNotification] Caminho do ícone:', iconPath);
      console.log('🖼️ [BrowserNotification] Caminho absoluto do ícone:', absoluteIconPath);
      console.log('🖼️ [BrowserNotification] Caminho do badge:', badgePath);
      console.log('💡 [BrowserNotification] DICA: Para ícone maior, use uma imagem de pelo menos 192x192 pixels');
      
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: absoluteIconPath, // Logo da empresa (ícone principal) - URL absoluta para melhor carregamento
        badge: absoluteBadgePath, // Badge pequeno (canto superior direito)
        tag: options.tag || `notification-${Date.now()}`, // Tag única para agrupar notificações
        data: options.data,
        requireInteraction: false, // Sempre false para não bloquear o fechamento automático
        silent: false, // Sempre tocar som para garantir que o usuário perceba
        // Opções de estilo visual
        dir: 'ltr', // Direção do texto (ltr = left-to-right)
        lang: 'pt-BR', // Idioma
        // Vibrar (se suportado pelo dispositivo) - remover se causar problemas
        // vibrate: [200, 100, 200], // Padrão de vibração: vibrar 200ms, pausar 100ms, vibrar 200ms
      };

      console.log('🔔 [BrowserNotification] Criando notificação com opções:', notificationOptions);
      
      // Verificar permissão antes de criar (como no exemplo: if (Notification.permission === 'granted'))
      if (Notification.permission !== 'granted') {
        console.warn('⚠️ [BrowserNotification] Permissão não é "granted", mas tentando criar mesmo assim...');
      }
      
      // Verificar se a página está em foco
      const isPageVisible = typeof document !== 'undefined' && !document.hidden;
      console.log('🔍 [BrowserNotification] Página está visível?', isPageVisible);
      
      // Criar notificação seguindo o padrão: new Notification('Título', { body, icon })
      const notification = new Notification(options.title, notificationOptions);
      console.log('✅ [BrowserNotification] ✅✅✅ NOTIFICAÇÃO CRIADA COM SUCESSO! ✅✅✅');
      console.log('✅ [BrowserNotification] Título:', options.title);
      console.log('✅ [BrowserNotification] Mensagem:', options.body);
      console.log('✅ [BrowserNotification] Objeto Notification criado:', notification);

      // Verificar se a notificação foi realmente exibida
      // Alguns navegadores podem criar o objeto mas não exibir quando a página está em foco
      if (isPageVisible) {
        console.log('💡 [BrowserNotification] Página está em foco - a notificação pode aparecer na área de notificações do Windows');
        console.log('💡 [BrowserNotification] Se não aparecer, verifique as configurações de notificações do Windows');
      } else {
        console.log('✅ [BrowserNotification] Página não está em foco - notificação deve aparecer normalmente');
      }

      // Handler para quando a notificação é exibida
      notification.onshow = function() {
        console.log('✅✅✅ [BrowserNotification] NOTIFICAÇÃO EXIBIDA COM SUCESSO! ✅✅✅');
        console.log('✅✅✅ [BrowserNotification] A notificação deve estar visível agora! ✅✅✅');
        
        // Verificar se a notificação está realmente visível
        // Alguns navegadores podem disparar onshow mesmo que a notificação não apareça visualmente
        if (isPageVisible) {
          console.log('💡 [BrowserNotification] DICA: Se você não vê a notificação, verifique:');
          console.log('💡 [BrowserNotification] 1. Configurações do Windows > Sistema > Notificações');
          console.log('💡 [BrowserNotification] 2. Configurações do navegador > Notificações');
          console.log('💡 [BrowserNotification] 3. Tente minimizar a janela do navegador');
        }
      };

      // Handler para quando a notificação é fechada
      notification.onclose = function() {
        console.log('🔔 [BrowserNotification] Notificação fechada');
      };

      // Handler para erros na notificação
      notification.onerror = function(error) {
        console.error('❌ [BrowserNotification] Erro na notificação:', error);
        console.error('❌ [BrowserNotification] Detalhes do erro:', {
          message: error?.message,
          name: error?.name,
          stack: error?.stack
        });
      };

      // Fechar automaticamente após 15 segundos (tempo suficiente para o usuário ver)
      // Aumentar o tempo para garantir que a notificação seja vista
      setTimeout(() => {
        try {
          notification.close();
          console.log('⏰ [BrowserNotification] Notificação fechada automaticamente após 15 segundos');
        } catch (error) {
          console.warn('⚠️ [BrowserNotification] Erro ao fechar notificação:', error);
        }
      }, 15000); // 15 segundos para dar mais tempo

      // Handler para quando a notificação é clicada (como no exemplo: notification.onclick)
      notification.onclick = function(event) {
        console.log('🖱️ [BrowserNotification] Notificação clicada!');
        event.preventDefault();
        notification.close();
        
        // Focar na janela
        if (window) {
          window.focus();
        }
        
        // Navegar para URL específica (como no exemplo: window.open ou window.location.href)
        if (options.data?.url) {
          window.location.href = options.data.url;
        } else if (options.data?.campaign?.id) {
          // Navegar para a página da campanha
          window.location.href = `/admin/campaigns/${options.data.campaign.id}`;
        } else if (options.data?.campaign_id) {
          // Navegar para a página da campanha usando campaign_id direto
          window.location.href = `/admin/campaigns/${options.data.campaign_id}`;
        }
      };

      return notification;
    } catch (error) {
      console.error('❌ Erro ao mostrar notificação do navegador:', error);
      return null;
    }
  }

  /**
   * Fechar todas as notificações com uma tag específica
   */
  closeNotificationsByTag(tag: string): void {
    // As notificações são fechadas automaticamente, mas podemos manter referências
    // se necessário no futuro
  }

  /**
   * Obter ícone baseado no tipo de notificação
   * IMPORTANTE: Para notificações, recomenda-se usar uma imagem de pelo menos 192x192 pixels
   * para que apareça em tamanho adequado. O navegador redimensiona automaticamente.
   */
  getNotificationIcon(type: string): string {
    // Retornar logo da empresa
    // DICA: Se o ícone aparecer pequeno, verifique se a imagem tem pelo menos 192x192 pixels
    return '/images/logo3.PNG';
  }
}

// Singleton
export const browserNotificationService = new BrowserNotificationService();

