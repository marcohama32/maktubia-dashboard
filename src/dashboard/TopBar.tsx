import { useDashboardContext } from "./Provider";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";

export function TopBar() {
  const { toggleSidebar } = useDashboardContext();
  const { logout } = useAuth();
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contacts, setContacts] = useState<string[]>([]);
  const shareRef = useRef<HTMLDivElement | null>(null);
  const smsModalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
      if (smsModalRef.current && !smsModalRef.current.contains(e.target as Node)) {
        setSmsModalOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSMSShare = () => {
    setShareOpen(false);
    setSmsModalOpen(true);
  };

  const addContact = () => {
    if (!phoneNumber.trim()) {
      alert("Por favor, insira um número de telefone");
      return;
    }
    
    // Remove caracteres não numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length === 0) {
      alert("Número de telefone inválido");
      return;
    }

    // Adiciona à lista se não existir
    if (!contacts.includes(cleanNumber)) {
      setContacts([...contacts, cleanNumber]);
      setPhoneNumber("");
    } else {
      alert("Este contacto já foi adicionado");
    }
  };

  const removeContact = (number: string) => {
    setContacts(contacts.filter(c => c !== number));
  };

  const sendSMS = () => {
    if (contacts.length === 0) {
      alert("Por favor, adicione pelo menos um contacto");
      return;
    }

    const currentUrl = window.location.href;
    const message = encodeURIComponent(`Veja esta página: ${currentUrl}`);
    
    // Para múltiplos contactos, usa vírgula para separar
    const numbers = contacts.join(',');
    
    // Abre o aplicativo de SMS com os números e mensagem
    window.location.href = `sms:${numbers}?body=${message}`;
    setSmsModalOpen(false);
    setPhoneNumber("");
    setContacts([]);
  };

  const selectContact = async () => {
    try {
      // Tenta usar a API de contactos (se disponível)
      if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
        const selectedContacts = await (navigator as any).contacts.select(['tel']);
        if (selectedContacts && selectedContacts.length > 0) {
          selectedContacts.forEach((contact: any) => {
            if (contact.tel && contact.tel.length > 0) {
              const cleanNumber = contact.tel[0].value.replace(/\D/g, '');
              if (cleanNumber && !contacts.includes(cleanNumber)) {
                setContacts(prev => [...prev, cleanNumber]);
              }
            }
          });
        }
      } else {
        // Fallback: usa input de tipo tel que pode abrir o seletor de contactos em mobile
        const input = document.createElement('input');
        input.type = 'tel';
        input.style.position = 'fixed';
        input.style.opacity = '0';
        input.style.pointerEvents = 'none';
        document.body.appendChild(input);
        input.focus();
        input.click();
        setTimeout(() => {
          document.body.removeChild(input);
        }, 100);
      }
    } catch (err) {
      console.log("Seleção de contactos não disponível:", err);
    }
  };
  return (
    <header className="relative z-10 h-16 w-full items-center bg-white shadow md:h-20 lg:rounded-2xl">
      <div className="relative mx-auto flex h-full flex-col justify-center px-3">
        <div className="relative flex w-full items-center pl-1 sm:ml-0 sm:pr-2">
          <div className="relative left-0 flex h-full w-3/4">
            <div className="group relative flex h-full w-12 items-center">
              <button
                type="button"
                aria-expanded="false"
                aria-label="Toggle sidenav"
                className="text-4xl text-gray-500 focus:outline-none"
                onClick={toggleSidebar}
              >
                &#8801;
              </button>
            </div>
            <div className="group relative flex h-full w-36 items-center lg:w-64">
              <div className="absolute flex h-10 w-auto cursor-pointer items-center justify-center p-3 pr-2 text-sm uppercase text-gray-500 sm:hidden">
                <svg
                  fill="none"
                  className="relative h-5 w-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <svg
                className="pointer-events-none absolute left-0 ml-4 hidden h-4 w-4 fill-current text-gray-500 group-hover:text-gray-400 sm:block"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" />
              </svg>
              <input
                type="text"
                className="block w-full rounded-2xl bg-gray-100 py-1.5 pl-10 pr-4 leading-normal text-gray-400 opacity-90 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search"
              />
              <div className="absolute right-0 mr-2 hidden h-auto rounded-2xl border border-gray-300 px-2 py-1 text-xs text-gray-400 md:block">
                +
              </div>
            </div>
          </div>
          <div className="relative ml-5 flex w-1/4 items-center justify-end gap-2 p-1 sm:right-auto sm:mr-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => setShareOpen((v) => !v)}
              className="relative rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Partilhar
              {shareOpen && (
                <div
                  ref={shareRef}
                  className="absolute right-0 top-10 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50"
                >
                  <div className="py-1 text-sm text-gray-700">
                    <button
                      className="block w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        setShareOpen(false);
                        if (typeof window !== "undefined") {
                          const currentUrl = window.location.href;
                          const subject = encodeURIComponent("Partilha - Maktubia Points");
                          const body = encodeURIComponent(`Veja esta página: ${currentUrl}`);
                          window.location.href = `mailto:?subject=${subject}&body=${body}`;
                        }
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </button>
                    <button
                      className="block w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      onClick={handleSMSShare}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      SMS
                    </button>
                    <button
                      className="block w-full px-4 py-2 text-left hover:bg-gray-50"
                      onClick={async () => {
                        setShareOpen(false);
                        try {
                          if (navigator.share) {
                            await navigator.share({ title: "Maktubia Points", url: window.location.href });
                          } else if (navigator.clipboard) {
                            await navigator.clipboard.writeText(window.location.href);
                            alert("Link copiado para a área de transferência");
                          }
                        } catch {
                          // ignore cancel/errors
                        }
                      }}
                    >
                      Copiar link
                    </button>
                  </div>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Modal de SMS */}
      {smsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            ref={smsModalRef}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enviar SMS</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-2">
                  Adicionar Contacto
                </label>
                <div className="flex gap-2">
                  <input
                    id="phone-number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addContact();
                      }
                    }}
                    placeholder="+258 84 123 4567"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={selectContact}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    title="Selecionar contacto"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={addContact}
                    className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
                    title="Adicionar contacto"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Insira o número ou selecione um contacto e clique em + para adicionar</p>
              </div>

              {contacts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contactos ({contacts.length})
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
                    {contacts.map((contact, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-gray-700">{contact}</span>
                        <button
                          type="button"
                          onClick={() => removeContact(contact)}
                          className="text-red-600 hover:text-red-800"
                          title="Remover contacto"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSmsModalOpen(false);
                    setPhoneNumber("");
                    setContacts([]);
                  }}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={sendSMS}
                  disabled={contacts.length === 0}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar SMS ({contacts.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
