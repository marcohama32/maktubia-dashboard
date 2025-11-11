import {
  validateMozambiquePhone,
  validateDocumentNumber,
  formatDocumentNumber,
  formatMozambiquePhone,
  MOZAMBIQUE_DOCUMENT_TYPES,
  DocumentType,
} from "@/utils/mozambiqueValidators";

interface MozambiqueFieldsProps {
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  onPhoneChange: (phone: string) => void;
  onDocumentTypeChange: (type: DocumentType) => void;
  onDocumentNumberChange: (number: string) => void;
  phoneError?: string;
  documentError?: string;
  onPhoneError?: (error: string) => void;
  onDocumentError?: (error: string) => void;
}

export function MozambiqueFields({
  phone,
  documentType,
  documentNumber,
  onPhoneChange,
  onDocumentTypeChange,
  onDocumentNumberChange,
  phoneError,
  documentError,
  onPhoneError,
  onDocumentError,
}: MozambiqueFieldsProps) {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onPhoneChange(value);
    if (onPhoneError) {
      onPhoneError("");
    }
  };

  const handlePhoneBlur = () => {
    if (phone) {
      const validation = validateMozambiquePhone(phone);
      if (!validation.isValid) {
        if (onPhoneError) {
          onPhoneError(validation.error || "Telefone inválido");
        }
      } else {
        // Formatar telefone quando válido
        onPhoneChange(formatMozambiquePhone(phone));
      }
    }
  };

  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as DocumentType;
    onDocumentTypeChange(value);
    onDocumentNumberChange(""); // Limpar número quando mudar tipo
    if (onDocumentError) {
      onDocumentError("");
    }
  };

  const handleDocumentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onDocumentNumberChange(value);
    if (onDocumentError) {
      onDocumentError("");
    }
  };

  const handleDocumentBlur = () => {
    if (documentNumber) {
      const validation = validateDocumentNumber(documentType, documentNumber);
      if (!validation.isValid) {
        if (onDocumentError) {
          onDocumentError(validation.error || "Documento inválido");
        }
      } else {
        // Formatar documento quando válido
        onDocumentNumberChange(formatDocumentNumber(documentType, documentNumber));
      }
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Telefone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone || ""}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            placeholder="+258841234567 ou 841234567"
            className={`mt-1 block w-full rounded-md border ${
              phoneError ? "border-red-300" : "border-gray-300"
            } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
          />
          {phoneError && (
            <p className="mt-1 text-xs text-red-600">{phoneError}</p>
          )}
          {!phoneError && phone && (
            <p className="mt-1 text-xs text-gray-500">
              Formato: +258XXXXXXXX ou 8XXXXXXXX (operadoras: 82-88)
            </p>
          )}
        </div>

        <div>
          <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
            Tipo de Documento
          </label>
          <select
            id="documentType"
            name="documentType"
            value={documentType}
            onChange={handleDocumentTypeChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            {MOZAMBIQUE_DOCUMENT_TYPES.map((docType) => (
              <option key={docType.value} value={docType.value}>
                {docType.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="documentNumber" className="block text-sm font-medium text-gray-700">
          Número do Documento
        </label>
        <input
          type="text"
          id="documentNumber"
          name="documentNumber"
          value={documentNumber || ""}
          onChange={handleDocumentNumberChange}
          onBlur={handleDocumentBlur}
          placeholder={
            documentType === "BI"
              ? "13 dígitos (ex: 1234567890123)"
              : documentType === "NUIT"
              ? "9 dígitos (ex: 123456789)"
              : documentType === "Passaporte"
              ? "6-9 caracteres alfanuméricos"
              : documentType === "Carta de Condução"
              ? "8-10 caracteres alfanuméricos"
              : "Número do documento"
          }
          className={`mt-1 block w-full rounded-md border ${
            documentError ? "border-red-300" : "border-gray-300"
          } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
        />
        {documentError && (
          <p className="mt-1 text-xs text-red-600">{documentError}</p>
        )}
        {!documentError && documentType && (
          <p className="mt-1 text-xs text-gray-500">
            {documentType === "BI"
              ? "BI: 13 dígitos numéricos"
              : documentType === "NUIT"
              ? "NUIT: 9 dígitos numéricos"
              : documentType === "Passaporte"
              ? "Passaporte: 6-9 caracteres alfanuméricos"
              : documentType === "Carta de Condução"
              ? "Carta de Condução: 8-10 caracteres alfanuméricos"
              : "Digite o número do documento"}
          </p>
        )}
      </div>
    </>
  );
}




