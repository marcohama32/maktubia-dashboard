/**
 * Utilitários de validação para padrões moçambicanos
 */

export type DocumentType = "BI" | "Passaporte" | "Carta de Condução" | "NUIT" | "Outro";

export interface DocumentValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Valida telefone moçambicano
 * Formatos aceitos:
 * - Internacional: +258XXXXXXXX ou +258XXXXXXXXX (8 ou 9 dígitos após +258)
 * - Local: 8XXXXXXXX ou 8XXXXXXXXX (8 ou 9 dígitos começando com 8)
 * - Operadoras válidas: 82, 83, 84, 85, 86, 87, 88
 */
export function validateMozambiquePhone(phone: string): DocumentValidation {
  if (!phone || phone.trim() === "") {
    return { isValid: true }; // Telefone é opcional
  }

  // Remove espaços e caracteres especiais
  const cleaned = phone.replace(/\s+/g, "").replace(/[-\s()]/g, "");

  // Formato internacional: +258 seguido de 8 ou 9 dígitos
  const internationalPattern = /^\+258[2-8]\d{7,8}$/;
  
  // Formato local: 8 seguido de 1 dígito (operadora) e 7 ou 8 dígitos
  const localPattern = /^8[2-8]\d{7,8}$/;

  if (internationalPattern.test(cleaned)) {
    return { isValid: true };
  }

  if (localPattern.test(cleaned)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: "Formato de telefone inválido. Use: +258XXXXXXXX ou 8XXXXXXXX (operadoras: 82-88)",
  };
}

/**
 * Formata telefone moçambicano para exibição
 */
export function formatMozambiquePhone(phone: string): string {
  if (!phone) return "";
  
  const cleaned = phone.replace(/\s+/g, "").replace(/[-\s()]/g, "");
  
  // Se começa com +258, manter formato internacional
  if (cleaned.startsWith("+258")) {
    return cleaned;
  }
  
  // Se começa com 8 e tem 9 ou 10 dígitos, formatar como local
  if (cleaned.startsWith("8") && (cleaned.length === 9 || cleaned.length === 10)) {
    return cleaned;
  }
  
  return cleaned;
}

/**
 * Valida número de BI (Bilhete de Identidade) moçambicano
 * Formato: 13 dígitos numéricos
 */
export function validateBI(bi: string): DocumentValidation {
  if (!bi || bi.trim() === "") {
    return { isValid: true }; // BI é opcional
  }

  const cleaned = bi.replace(/\s+/g, "").replace(/[-\s]/g, "");

  // BI deve ter exatamente 13 dígitos numéricos
  const biPattern = /^\d{13}$/;

  if (biPattern.test(cleaned)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: "BI inválido. Deve conter exatamente 13 dígitos numéricos.",
  };
}

/**
 * Valida número de Passaporte moçambicano
 * Formato: Geralmente letras e números, varia entre 6-9 caracteres
 */
export function validatePassport(passport: string): DocumentValidation {
  if (!passport || passport.trim() === "") {
    return { isValid: true }; // Passaporte é opcional
  }

  const cleaned = passport.replace(/\s+/g, "").toUpperCase();

  // Passaporte geralmente tem formato: letras e números, 6-9 caracteres
  const passportPattern = /^[A-Z0-9]{6,9}$/;

  if (passportPattern.test(cleaned)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: "Passaporte inválido. Deve conter 6-9 caracteres alfanuméricos.",
  };
}

/**
 * Valida número de Carta de Condução moçambicana
 * Formato: Geralmente números, pode ter letras, 8-10 caracteres
 */
export function validateDrivingLicense(license: string): DocumentValidation {
  if (!license || license.trim() === "") {
    return { isValid: true }; // Carta de Condução é opcional
  }

  const cleaned = license.replace(/\s+/g, "").toUpperCase();

  // Carta de Condução geralmente tem formato alfanumérico, 8-10 caracteres
  const licensePattern = /^[A-Z0-9]{8,10}$/;

  if (licensePattern.test(cleaned)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: "Carta de Condução inválida. Deve conter 8-10 caracteres alfanuméricos.",
  };
}

/**
 * Valida número de NUIT (Número Único de Identificação Tributária)
 * Formato: 9 dígitos numéricos
 */
export function validateNUIT(nuit: string): DocumentValidation {
  if (!nuit || nuit.trim() === "") {
    return { isValid: true }; // NUIT é opcional
  }

  const cleaned = nuit.replace(/\s+/g, "").replace(/[-\s]/g, "");

  // NUIT deve ter exatamente 9 dígitos numéricos
  const nuitPattern = /^\d{9}$/;

  if (nuitPattern.test(cleaned)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: "NUIT inválido. Deve conter exatamente 9 dígitos numéricos.",
  };
}

/**
 * Valida número de documento baseado no tipo
 */
export function validateDocumentNumber(documentType: DocumentType, documentNumber: string): DocumentValidation {
  if (!documentNumber || documentNumber.trim() === "") {
    return { isValid: true }; // Documento é opcional
  }

  switch (documentType) {
    case "BI":
      return validateBI(documentNumber);
    case "Passaporte":
      return validatePassport(documentNumber);
    case "Carta de Condução":
      return validateDrivingLicense(documentNumber);
    case "NUIT":
      return validateNUIT(documentNumber);
    case "Outro":
      // Para "Outro", aceitar qualquer formato (validação mínima)
      if (documentNumber.trim().length >= 3) {
        return { isValid: true };
      }
      return {
        isValid: false,
        error: "Número de documento deve ter pelo menos 3 caracteres.",
      };
    default:
      return { isValid: true };
  }
}

/**
 * Formata número de documento baseado no tipo
 */
export function formatDocumentNumber(documentType: DocumentType, documentNumber: string): string {
  if (!documentNumber) return "";

  const cleaned = documentNumber.replace(/\s+/g, "").replace(/[-\s]/g, "");

  switch (documentType) {
    case "BI":
      // BI: 13 dígitos, pode formatar como XXX XXX XXX XXX X
      if (cleaned.length === 13 && /^\d+$/.test(cleaned)) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 12)} ${cleaned.slice(12)}`;
      }
      return cleaned;
    case "NUIT":
      // NUIT: 9 dígitos, pode formatar como XXX XXX XXX
      if (cleaned.length === 9 && /^\d+$/.test(cleaned)) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
      }
      return cleaned;
    case "Passaporte":
    case "Carta de Condução":
      return cleaned.toUpperCase();
    default:
      return cleaned;
  }
}

/**
 * Lista de tipos de documentos moçambicanos
 */
export const MOZAMBIQUE_DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "BI", label: "Bilhete de Identidade (BI)" },
  { value: "Passaporte", label: "Passaporte" },
  { value: "Carta de Condução", label: "Carta de Condução" },
  { value: "NUIT", label: "NUIT (Número Único de Identificação Tributária)" },
  { value: "Outro", label: "Outro" },
];




