export function cleanDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Formats phone number into Brazilian standard or readable international format
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = cleanDigits(phone);
  
  // Brazilian phone with DDI (55)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (rest.length === 9) {
      return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    } else if (rest.length === 8) {
      return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
  }

  // Brazilian phone without DDI
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

  // International format
  if (phone.startsWith('+')) {
    return phone;
  }
  
  return phone;
}

/**
 * Returns digits for WhatsApp link, ensuring DDI 55 if Brazilian standard DDD
 */
export function getWhatsAppNumber(phone: string): string {
  let digits = cleanDigits(phone);
  if (!digits) return '';
  
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  
  // If 10 or 11 digits, assume Brazil (+55)
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
