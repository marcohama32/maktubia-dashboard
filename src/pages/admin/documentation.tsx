import { useState } from "react";
import Image from "next/image";
import Head from "next/head";

export default function DocumentationPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <>
      <Head>
        <title>Guia de Uso - Maktubia Points Management</title>
      </Head>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Header */}
        <div className="rounded-lg border-l-4 border-blue-500 bg-white p-8 shadow-md">
          <div className="mb-4 flex items-center gap-4">
            <div className="relative h-16 w-16">
            <Image
              src="/images/logo2.png"
              alt="Maktubia Logo"
              fill
              className="object-contain"
              priority
              sizes="64px"
            />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Guia de Uso do Sistema</h1>
              <p className="mt-2 text-gray-600">Maktubia Points Management - Manual Completo</p>
            </div>
          </div>
        </div>

      {/* Introdução */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">📋 Sobre o Sistema</h2>
        <p className="leading-relaxed text-gray-700">
          O <strong>Maktubia Points Management</strong> é um sistema completo de gestão de pontos e recompensas 
          para clientes e estabelecimentos comerciais em Moçambique. Este sistema permite gerenciar estabelecimentos, 
          clientes, compras, pontos, transferências entre amigos e muito mais.
        </p>
      </div>

      {/* Índice */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">📑 Índice</h2>
        <ul className="space-y-2 text-gray-700">
          <li><a href="#inicio-rapido" className="text-blue-600 hover:underline">1. Início Rápido</a></li>
          <li><a href="#login" className="text-blue-600 hover:underline">2. Login e Autenticação</a></li>
          <li><a href="#dashboard" className="text-blue-600 hover:underline">3. Dashboard</a></li>
          <li><a href="#estabelecimentos" className="text-blue-600 hover:underline">4. Gerenciar Estabelecimentos</a></li>
          <li><a href="#usuarios" className="text-blue-600 hover:underline">5. Gerenciar Usuários</a></li>
          <li><a href="#clientes" className="text-blue-600 hover:underline">6. Gerenciar Clientes</a></li>
          <li><a href="#compras" className="text-blue-600 hover:underline">7. Gerenciar Compras</a></li>
          <li><a href="#amigos" className="text-blue-600 hover:underline">8. Maktubia Friends</a></li>
          <li><a href="#transferencias" className="text-blue-600 hover:underline">9. Transferências</a></li>
          <li><a href="#notificacoes" className="text-blue-600 hover:underline">10. Notificações</a></li>
        </ul>
      </div>

      {/* Seção 1: Início Rápido */}
      <div id="inicio-rapido" className="rounded-lg bg-white p-6 shadow-md">
        <h2 
          className="mb-4 flex cursor-pointer items-center justify-between text-2xl font-bold text-gray-900"
          onClick={() => toggleSection("inicio-rapido")}
        >
          <span>1. 🚀 Início Rápido</span>
          <svg 
            className={`h-6 w-6 transition-transform${expandedSection === "inicio-rapido" ? "rotate-180" : ""}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </h2>
        {expandedSection === "inicio-rapido" && (
          <div className="mt-4 space-y-4 text-gray-700">
            <p className="leading-relaxed">
              Bem-vindo ao sistema Maktubia Points Management! Este guia irá ajudá-lo a usar todas as funcionalidades 
              do sistema passo a passo.
            </p>
            <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-4">
              <p className="mb-2 font-semibold text-blue-900">✨ Funcionalidades Principais:</p>
              <ul className="list-inside list-disc space-y-1 text-blue-800">
                <li>Gestão completa de estabelecimentos comerciais</li>
                <li>Cadastro e gerenciamento de clientes e usuários</li>
                <li>Controle de compras e validação de recibos</li>
                <li>Sistema de pontos e recompensas</li>
                <li>Transferências entre amigos (Maktubia Friends)</li>
                <li>Dashboard com métricas e gráficos</li>
                <li>Notificações em tempo real</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Seção 2: Login */}
      <div id="login" className="rounded-lg bg-white p-6 shadow-md">
        <h2 
          className="mb-4 flex cursor-pointer items-center justify-between text-2xl font-bold text-gray-900"
          onClick={() => toggleSection("login")}
        >
          <span>2. 🔐 Login e Autenticação</span>
          <svg 
            className={`h-6 w-6 transition-transform${expandedSection === "login" ? "rotate-180" : ""}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </h2>
        {expandedSection === "login" && (
          <div className="mt-4 space-y-4 text-gray-700">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">1</span>
                <div>
                  <p className="font-semibold">Acesse a página de Login</p>
                  <p className="text-sm text-gray-600">Digite o endereço do sistema no navegador. Você será redirecionado automaticamente para a página de login se não estiver autenticado.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">2</span>
                <div>
                  <p className="font-semibold">Insira suas credenciais</p>
                  <p className="text-sm text-gray-600">Informe seu <strong>nome de usuário ou email</strong> e sua <strong>senha</strong> nos campos apropriados.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">3</span>
                <div>
                  <p className="font-semibold">Clique em "Entrar"</p>
                  <p className="text-sm text-gray-600">Após inserir suas credenciais, clique no botão "Entrar" para acessar o sistema.</p>
                </div>
              </div>
              <div className="mt-4 rounded border-l-4 border-yellow-500 bg-yellow-50 p-4">
                <p className="mb-1 font-semibold text-yellow-900">⚠️ Importante:</p>
                <p className="text-sm text-yellow-800">Se você esquecer sua senha ou tiver problemas de acesso, entre em contato com o administrador do sistema.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção 3: Dashboard */}
      <div id="dashboard" className="rounded-lg bg-white p-6 shadow-md">
        <h2 
          className="mb-4 flex cursor-pointer items-center justify-between text-2xl font-bold text-gray-900"
          onClick={() => toggleSection("dashboard")}
        >
          <span>3. 📊 Dashboard</span>
          <svg 
            className={`h-6 w-6 transition-transform${expandedSection === "dashboard" ? "rotate-180" : ""}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </h2>
        {expandedSection === "dashboard" && (
          <div className="mt-4 space-y-4 text-gray-700">
            <p className="leading-relaxed">
              O Dashboard é a primeira página que você vê após fazer login. Ele fornece uma visão geral completa 
              das atividades e métricas do sistema.
            </p>
            <div className="space-y-3">
              <div>
                <p className="mb-2 font-semibold">📈 Métricas Principais:</p>
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm">
                  <li><strong>Pontos Disponíveis:</strong> Mostra o saldo atual de pontos</li>
                  <li><strong>Total de Compras:</strong> Quantidade de compras realizadas</li>
                  <li><strong>Transferências:</strong> Estatísticas de transferências enviadas e recebidas</li>
                  <li><strong>Amigos:</strong> Número de amigos cadastrados</li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">📊 Gráficos e Visualizações:</p>
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm">
                  <li><strong>Evolução de Pontos:</strong> Gráfico de linha mostrando ganhos, gastos e saldo líquido</li>
                  <li><strong>Evolução de Compras:</strong> Gráfico de barras com quantidade e valor das compras</li>
                  <li><strong>Compras por Status:</strong> Gráfico de pizza mostrando distribuição (confirmadas, pendentes, rejeitadas)</li>
                  <li><strong>Top Estabelecimentos:</strong> Estabelecimentos mais visitados</li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">🔍 Selecionar Período:</p>
                <p className="text-sm">Use o seletor no topo do dashboard para visualizar dados dos últimos 7 dias, 30 dias ou 90 dias.</p>
              </div>
              <div>
                <p className="mb-2 font-semibold">📋 Atividades Recentes:</p>
                <p className="text-sm">A seção inferior mostra as últimas atividades realizadas no sistema (compras, transferências, etc.).</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção 4: Estabelecimentos */}
      <div id="estabelecimentos" className="rounded-lg bg-white p-6 shadow-md">
        <h2 
          className="mb-4 flex cursor-pointer items-center justify-between text-2xl font-bold text-gray-900"
          onClick={() => toggleSection("estabelecimentos")}
        >
          <span>4. 🏪 Gerenciar Estabelecimentos</span>
          <svg 
            className={`h-6 w-6 transition-transform${expandedSection === "estabelecimentos" ? "rotate-180" : ""}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </h2>
        {expandedSection === "estabelecimentos" && (
          <div className="mt-4 space-y-4 text-gray-700">
            <p className="leading-relaxed">
              A seção de Estabelecimentos permite cadastrar e gerenciar todos os estabelecimentos comerciais 
              parceiros do sistema.
            </p>
            <div className="space-y-4">
              <div>
                <p className="mb-2 font-semibold">➕ Criar Novo Estabelecimento:</p>
                <ol className="ml-4 list-inside list-decimal space-y-2 text-sm">
                  <li>Clique no botão <strong>"Novo Estabelecimento"</strong> na página de listagem</li>
                  <li>Preencha os campos obrigatórios:
                    <ul className="ml-6 mt-1 list-inside list-disc">
                      <li>Nome do estabelecimento</li>
                      <li>Tipo de estabelecimento</li>
                      <li>Endereço</li>
                      <li>Telefone e/ou email</li>
                    </ul>
                  </li>
                  <li>Faça upload de imagens do estabelecimento (opcional)</li>
                  <li>Configure o status (ativo/inativo)</li>
                  <li>Clique em <strong>"Salvar"</strong> para criar o estabelecimento</li>
                </ol>
              </div>
              <div>
                <p className="mb-2 font-semibold">📋 Listar Estabelecimentos:</p>
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm">
                  <li>Use a barra de pesquisa para encontrar estabelecimentos específicos</li>
                  <li>Navegue pelas páginas usando a paginação no rodapé</li>
                  <li>Cada card mostra nome, tipo, status e foto do estabelecimento</li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">👁️ Ver Detalhes:</p>
                <ol className="ml-4 list-inside list-decimal space-y-1 text-sm">
                  <li>Clique no botão <strong>"Ver Detalhes"</strong> em qualquer card de estabelecimento</li>
                  <li>Visualize todas as informações, incluindo:
                    <ul className="ml-6 mt-1 list-inside list-disc">
                      <li>Dados completos do estabelecimento</li>
                      <li>QR Code para download</li>
                      <li>Métricas e estatísticas</li>
                      <li>Galeria de imagens com carrossel</li>
                    </ul>
                  </li>
                </ol>
              </div>
              <div>
                <p className="mb-2 font-semibold">✏️ Editar Estabelecimento:</p>
                <ol className="ml-4 list-inside list-decimal space-y-1 text-sm">
                  <li>Na página de detalhes, clique em <strong>"Editar"</strong></li>
                  <li>Modifique os campos desejados</li>
                  <li>Salve as alterações</li>
                </ol>
              </div>
              <div>
                <p className="mb-2 font-semibold">🗑️ Excluir Estabelecimento:</p>
                <p className="ml-4 text-sm">Clique em <strong>"Eliminar"</strong> na página de detalhes e confirme a exclusão.</p>
              </div>
              <div>
                <p className="mb-2 font-semibold">📱 QR Code:</p>
                <p className="ml-4 text-sm">Cada estabelecimento possui um QR Code único que pode ser baixado e impresso para clientes escanearem ao fazer compras.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção 5: Usuários */}
      <div id="usuarios" className="rounded-lg bg-white p-6 shadow-md">
        <h2 
          className="mb-4 flex cursor-pointer items-center justify-between text-2xl font-bold text-gray-900"
          onClick={() => toggleSection("usuarios")}
        >
          <span>5. 👥 Gerenciar Usuários</span>
          <svg 
            className={`h-6 w-6 transition-transform${expandedSection === "usuarios" ? "rotate-180" : ""}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </h2>
        {expandedSection === "usuarios" && (
          <div className="mt-4 space-y-4 text-gray-700">
            <p className="leading-relaxed">
              A seção de Usuários permite gerenciar funcionários e administradores do sistema com diferentes níveis de permissão.
            </p>
            <div className="space-y-3">
              <div>
                <p className="mb-2 font-semibold">➕ Criar Novo Usuário:</p>
                <ol className="ml-4 list-inside list-decimal space-y-1 text-sm">
                  <li>Clique em <strong>"Novo Usuário"</strong></li>
                  <li>Preencha nome, sobrenome, email, telefone, BI (Bilhete de Identidade)</li>
                  <li>Defina o papel (role) do usuário (admin, manager, employee)</li>
                  <li>Configure o status (ativo/inativo)</li>
                  <li>Salve o usuário</li>
                </ol>
              </div>
              <div>
                <p className="mb-2 font-semibold">📊 Visualizar Usuários:</p>
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm">
                  <li>A tabela mostra todos os usuários cadastrados</li>
                  <li>Use a pesquisa para filtrar por nome, email ou telefone</li>
                  <li>Navegue pelas páginas usando a paginação</li>
                  <li>Clique em <strong>"Ver Detalhes"</strong> para ver informações completas</li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">✏️ Editar Usuário:</p>
                <p className="ml-4 text-sm">Na página de detalhes, clique em <strong>"Editar"</strong> para modificar informações do usuário.</p>
              </div>
              <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-4">
                <p className="mb-1 font-semibold text-blue-900">💡 Dica:</p>
                <p className="text-sm text-blue-800">Diferentes roles têm diferentes permissões. Administradores têm acesso completo, enquanto funcionários podem ter permissões limitadas.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção 6: Clientes */}
      <div id="clientes" className="rounded-lg bg-white p-6 shadow-md">
        <h2 
          className="mb-4 flex cursor-pointer items-center justify-between text-2xl font-bold text-gray-900"
          onClick={() => toggleSection("clientes")}
        >
          <span>6. 🛒 Gerenciar Clientes</span>
          <svg 
            className={`h-6 w-6 transition-transform${expandedSection === "clientes" ? "rotate-180" : ""}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </h2>
        {expandedSection === "clientes" && (
          <div className="mt-4 space-y-4 text-gray-700">
            <p className="leading-relaxed">
              A seção de Clientes permite gerenciar todos os clientes que participam do programa de pontos.
            </p>
            <div className="space-y-3">
              <div>
                <p className="mb-2 font-semibold">➕ Cadastrar Novo Cliente:</p>
                <ol className="ml-4 list-inside list-decimal space-y-1 text-sm">
                  <li>Clique em <strong>"Novo Cliente"</strong></li>
                  <li>Preencha os dados pessoais (nome, email, telefone, BI)</li>
                  <li>O sistema automaticamente define o cliente com role de usuário</li>
                  <li>Cliente recebe saldo inicial de 0 pontos</li>
                  <li>Salve o cliente</li>
                </ol>
              </div>
              <div>
                <p className="mb-2 font-semibold">📊 Visualizar Clientes:</p>
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm">
                  <li>A tabela mostra todos os clientes com suas informações principais</li>
                  <li>Pesquise por nome, email ou telefone</li>
                  <li>Veja saldo de pontos, status e último login</li>
                  <li>Acesse detalhes completos clicando em <strong>"Ver Detalhes"</strong></li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">📈 Métricas do Cliente:</p>
                <p className="ml-4 text-sm">Na página de detalhes, você pode ver:
                  <ul className="ml-6 mt-1 list-inside list-disc">
                    <li>Total de compras realizadas</li>
                    <li>Valor total gasto</li>
                    <li>Pontos ganhos e gastos</li>
                    <li>Transferências enviadas e recebidas</li>
                    <li>Estabelecimentos visitados</li>
                  </ul>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção 7: Compras */}
      <div id="compras" className="rounded-lg bg-white p-6 shadow-md">
        <h2 
          className="mb-4 flex cursor-pointer items-center justify-between text-2xl font-bold text-gray-900"
          onClick={() => toggleSection("compras")}
        >
          <span>7. 🛍️ Gerenciar Compras</span>
          <svg 
            className={`h-6 w-6 transition-transform${expandedSection === "compras" ? "rotate-180" : ""}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </h2>
        {expandedSection === "compras" && (
          <div className="mt-4 space-y-4 text-gray-700">
            <p className="leading-relaxed">
              A seção de Compras permite visualizar, validar e gerenciar todas as compras realizadas pelos clientes.
            </p>
            <div className="space-y-4">
              <div>
                <p className="mb-2 font-semibold">📋 Visualizar Compras:</p>
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm">
                  <li>A tabela mostra todas as compras com status (Confirmada, Pendente, Rejeitada)</li>
                  <li>Filtre por status usando os cards no topo (Confirmadas, Pendentes, Rejeitadas)</li>
                  <li>Pesquise por cliente, estabelecimento ou código da compra</li>
                  <li>Veja valor da compra, pontos ganhos e data</li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">✅ Validar Compras Pendentes:</p>
                <ol className="ml-4 list-inside list-decimal space-y-2 text-sm">
                  <li>Localize uma compra com status <strong>"Pendente"</strong></li>
                  <li>Clique em <strong>"Ver Detalhes"</strong> para abrir a página de detalhes</li>
                  <li>Visualize o recibo/prova de compra anexado</li>
                  <li>Verifique se o recibo corresponde ao valor e estabelecimento informados</li>
                  <li>Clique em <strong>"Confirmar Compra"</strong> para aprovar ou <strong>"Rejeitar Compra"</strong> para recusar</li>
                  <li>Se confirmada, os pontos são creditados automaticamente na conta do cliente</li>
                </ol>
              </div>
              <div>
                <p className="mb-2 font-semibold">👁️ Ver Detalhes da Compra:</p>
                <p className="ml-4 text-sm">Na página de detalhes, você pode ver:
                  <ul className="ml-6 mt-1 list-inside list-disc">
                    <li>Informações completas da compra</li>
                    <li>Dados do cliente e estabelecimento</li>
                    <li>Recibo/prova de compra (se anexado)</li>
                    <li>Valor da compra e pontos calculados</li>
                    <li>Status e histórico</li>
                  </ul>
                </p>
              </div>
              <div>
                <p className="mb-2 font-semibold">📊 Métricas de Compras:</p>
                <p className="ml-4 text-sm">O dashboard de compras mostra estatísticas importantes:
                  <ul className="ml-6 mt-1 list-inside list-disc">
                    <li>Total de compras</li>
                    <li>Valor total movimentado</li>
                    <li>Total de pontos distribuídos</li>
                    <li>Clientes únicos</li>
                    <li>Estabelecimentos únicos</li>
                  </ul>
                </p>
              </div>
              <div className="rounded border-l-4 border-green-500 bg-green-50 p-4">
                <p className="mb-1 font-semibold text-green-900">💡 Como Funciona:</p>
                <p className="text-sm text-green-800">
                  O cliente escaneia o QR Code do estabelecimento, faz a compra, e anexa o recibo. 
                  A compra fica pendente até ser validada por um administrador. Após validação, 
                  os pontos são creditados na conta do cliente.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção 8: Maktubia Friends */}
      <div id="amigos" className="rounded-lg bg-white p-6 shadow-md">
        <h2 
          className="mb-4 flex cursor-pointer items-center justify-between text-2xl font-bold text-gray-900"
          onClick={() => toggleSection("amigos")}
        >
          <span>8. 👫 Maktubia Friends</span>
          <svg 
            className={`h-6 w-6 transition-transform${expandedSection === "amigos" ? "rotate-180" : ""}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </h2>
        {expandedSection === "amigos" && (
          <div className="mt-4 space-y-4 text-gray-700">
            <p className="leading-relaxed">
              O Maktubia Friends é um sistema de gestão de relacionamentos entre clientes, permitindo 
              que administradores vejam e gerenciem as conexões entre clientes.
            </p>
            <div className="space-y-3">
              <div>
                <p className="mb-2 font-semibold">📋 Visualizar Amizades:</p>
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm">
                  <li>A aba <strong>"Amigos"</strong> mostra todas as amizades estabelecidas entre clientes</li>
                  <li>Veja quais clientes são amigos</li>
                  <li>Número de interações entre amigos</li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">📨 Pedidos de Amizade:</p>
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm">
                  <li>A aba <strong>"Pedidos"</strong> mostra pedidos de amizade pendentes</li>
                  <li>Você pode ver quem enviou e quem recebeu cada pedido</li>
                  <li>Gerencie pedidos pendentes</li>
                </ul>
              </div>
              <div className="rounded border-l-4 border-purple-500 bg-purple-50 p-4">
                <p className="mb-1 font-semibold text-purple-900">💡 Nota:</p>
                <p className="text-sm text-purple-800">
                  Esta é uma plataforma de gestão. O sistema Maktubia Friends permite que administradores 
                  visualizem e gerenciem as conexões entre clientes, mas os pedidos de amizade são feitos 
                  pelos próprios clientes através de outros canais (app mobile, etc.).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção 9: Transferências */}
      <div id="transferencias" className="rounded-lg bg-white p-6 shadow-md">
        <h2 
          className="mb-4 flex cursor-pointer items-center justify-between text-2xl font-bold text-gray-900"
          onClick={() => toggleSection("transferencias")}
        >
          <span>9. 💸 Transferências</span>
          <svg 
            className={`h-6 w-6 transition-transform${expandedSection === "transferencias" ? "rotate-180" : ""}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </h2>
        {expandedSection === "transferencias" && (
          <div className="mt-4 space-y-4 text-gray-700">
            <p className="leading-relaxed">
              A seção de Transferências permite visualizar e gerenciar todas as transferências de pontos 
              realizadas entre clientes amigos.
            </p>
            <div className="space-y-3">
              <div>
                <p className="mb-2 font-semibold">📋 Visualizar Transferências:</p>
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm">
                  <li>A tabela mostra todas as transferências realizadas</li>
                  <li>Filtre por tipo: <strong>Enviadas</strong>, <strong>Recebidas</strong> ou <strong>Todas</strong></li>
                  <li>Veja quem enviou e quem recebeu os pontos</li>
                  <li>Valor transferido e data/hora</li>
                  <li>Status da transferência</li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">🔍 Pesquisar Transferências:</p>
                <p className="ml-4 text-sm">Use a barra de pesquisa para encontrar transferências específicas por cliente, código ou valor.</p>
              </div>
              <div>
                <p className="mb-2 font-semibold">📊 Estatísticas:</p>
                <p className="ml-4 text-sm">O dashboard de transferências mostra:
                  <ul className="ml-6 mt-1 list-inside list-disc">
                    <li>Total de transferências</li>
                    <li>Pontos enviados e recebidos</li>
                    <li>Média por transferência</li>
                    <li>Top clientes por volume de transferências</li>
                  </ul>
                </p>
              </div>
              <div className="rounded border-l-4 border-yellow-500 bg-yellow-50 p-4">
                <p className="mb-1 font-semibold text-yellow-900">⚠️ Importante:</p>
                <p className="text-sm text-yellow-800">
                  As transferências são realizadas pelos próprios clientes através do app mobile. 
                  Esta plataforma permite apenas visualizar e gerenciar essas transferências.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção 10: Notificações */}
      <div id="notificacoes" className="rounded-lg bg-white p-6 shadow-md">
        <h2 
          className="mb-4 flex cursor-pointer items-center justify-between text-2xl font-bold text-gray-900"
          onClick={() => toggleSection("notificacoes")}
        >
          <span>10. 🔔 Notificações</span>
          <svg 
            className={`h-6 w-6 transition-transform${expandedSection === "notificacoes" ? "rotate-180" : ""}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </h2>
        {expandedSection === "notificacoes" && (
          <div className="mt-4 space-y-4 text-gray-700">
            <p className="leading-relaxed">
              O sistema possui um sistema completo de notificações em tempo real que mantém você informado 
              sobre atividades importantes.
            </p>
            <div className="space-y-3">
              <div>
                <p className="mb-2 font-semibold">🔔 Como Funcionam as Notificações:</p>
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm">
                  <li><strong>Notificações Desktop:</strong> Aparecem como pop-ups na tela do computador</li>
                  <li><strong>Notificações Push:</strong> Funcionam mesmo quando o navegador está fechado</li>
                  <li><strong>Sino de Notificações:</strong> Ícone no topo da página mostra número de notificações não lidas</li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">📬 Quando Você Recebe Notificações:</p>
                <ul className="ml-4 list-inside list-disc space-y-1 text-sm">
                  <li>Nova compra pendente de validação</li>
                  <li>Compra confirmada ou rejeitada</li>
                  <li>Nova transferência entre clientes</li>
                  <li>Atualizações importantes do sistema</li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold">⚙️ Configurar Notificações:</p>
                <ol className="ml-4 list-inside list-decimal space-y-1 text-sm">
                  <li>Quando você acessa o sistema pela primeira vez, o navegador pedirá permissão para mostrar notificações</li>
                  <li>Clique em <strong>"Permitir"</strong> para ativar as notificações</li>
                  <li>Se você negar a permissão, pode ativá-la depois nas configurações do navegador</li>
                </ol>
              </div>
              <div>
                <p className="mb-2 font-semibold">🖱️ Ao Clicar em uma Notificação:</p>
                <p className="ml-4 text-sm">
                  Se você clicar em uma notificação, será redirecionado automaticamente para a página de compras 
                  ou a página relevante. Se não estiver logado, será redirecionado para o login e, após fazer login, 
                  será levado para a página correta.
                </p>
              </div>
              <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-4">
                <p className="mb-1 font-semibold text-blue-900">💡 Dica:</p>
                <p className="text-sm text-blue-800">
                  Mantenha as notificações ativadas para não perder nenhuma compra pendente de validação. 
                  Isso ajuda a processar compras mais rapidamente e melhorar a experiência dos clientes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dicas Finais */}
      <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white shadow-md">
        <h2 className="mb-4 text-3xl font-bold">💡 Dicas Finais</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="mb-2 font-semibold">🔐 Segurança</p>
            <p className="text-sm">Sempre faça logout quando terminar de usar o sistema, especialmente em computadores compartilhados.</p>
          </div>
          <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="mb-2 font-semibold">🔄 Atualizações</p>
            <p className="text-sm">O sistema é atualizado automaticamente. Recarregue a página se algo não estiver funcionando corretamente.</p>
          </div>
          <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="mb-2 font-semibold">📞 Suporte</p>
            <p className="text-sm">Em caso de dúvidas ou problemas, entre em contato com o administrador do sistema.</p>
          </div>
          <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="mb-2 font-semibold">📚 Aprenda Mais</p>
            <p className="text-sm">Explore todas as funcionalidades do sistema para aproveitar ao máximo suas capacidades.</p>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="py-6 text-center text-gray-600">
        <p className="text-sm">
          © {new Date().getFullYear()} Maktubia Points Management. Todos os direitos reservados.
        </p>
        <p className="mt-2 text-xs">
          Versão 1.0.0 - Sistema de Gestão de Pontos e Recompensas
        </p>
      </div>
    </div>
    </>
  );
}
