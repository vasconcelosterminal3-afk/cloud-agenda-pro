export function cleanDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Máscara dinâmica de telefone em tempo real para inputs.
 * Conforme o usuário digita apenas números, formata automaticamente com DDD e traço.
 * - Aceita tanto fixo (10 dígitos: (XX) XXXX-XXXX)
 * - Quanto celular (11 dígitos: (XX) XXXXX-XXXX)
 */
export function maskPhoneInput(value: string): string {
  if (!value) return '';

  // Se o usuário digitou prefixo internacional '+' explicitamente, mantém
  if (value.startsWith('+')) {
    const digits = value.replace(/\D/g, '').slice(0, 15);
    return '+' + digits;
  }

  // Remove caracteres não numéricos e limita ao máximo de 11 dígitos
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    // Telefone Fixo (10 dígitos) ou Celular incompleto: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Telefone Celular com 9 dígitos (11 dígitos no total): (XX) XXXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Formata número de telefone para exibição elegante no padrão brasileiro ou internacional
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = cleanDigits(phone);
  
  // Telefone brasileiro com DDI (55)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (rest.length === 9) {
      return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    } else if (rest.length === 8) {
      return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
  }

  // Telefone brasileiro sem DDI
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  // Formato internacional pré-formatado
  if (phone.startsWith('+')) {
    return phone;
  }
  
  return phone;
}

/**
 * Retorna dígitos prontos para link do WhatsApp, garantindo DDI 55
 */
export function getWhatsAppNumber(phone: string): string {
  let digits = cleanDigits(phone);
  if (!digits) return '';
  
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  
  // Se 10 ou 11 dígitos, adiciona DDI Brasil (55)
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  
  return digits;
}

export function getWhatsAppUrl(phone: string, text?: string): string {
  const num = getWhatsAppNumber(phone);
  if (!num) return '#';
  const baseUrl = `https://wa.me/${num}`;
  if (text) {
    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  }
  return baseUrl;
}

export function getTelUrl(phone: string): string {
  const digits = cleanDigits(phone);
  return digits ? `tel:${phone.startsWith('+') ? '+' + digits : digits}` : '#';
}

export function getSmsUrl(phone: string): string {
  const digits = cleanDigits(phone);
  return digits ? `sms:${digits}` : '#';
}
