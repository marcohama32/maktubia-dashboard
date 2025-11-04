import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Verificar se é um erro causado por extensão do navegador
    const isBrowserExtensionError = 
      error.message?.includes("Breaking Browser Locker") ||
      error.message?.includes("Browser Locker Behavior") ||
      error.stack?.includes("chrome-extension://") ||
      error.stack?.includes("moz-extension://");

    // Se for erro de extensão, não mostrar o erro
    if (isBrowserExtensionError) {
      console.warn("Erro ignorado (causado por extensão do navegador):", error.message);
      return { hasError: false, error: null };
    }

    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Verificar se é erro de extensão
    const isBrowserExtensionError = 
      error.message?.includes("Breaking Browser Locker") ||
      error.message?.includes("Browser Locker Behavior") ||
      error.stack?.includes("chrome-extension://") ||
      error.stack?.includes("moz-extension://");

    if (!isBrowserExtensionError) {
      console.error("Erro não capturado:", error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">Algo deu errado</h1>
            <p className="mb-4 text-gray-600">{this.state.error.message}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

