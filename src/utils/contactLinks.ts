export const normalizeCongoPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('242')) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `242${digits.slice(1)}`;
  if (digits.length === 9) return `242${digits}`;
  return digits;
};

export const getTelephoneUrl = (phone: string): string | null => {
  const normalized = normalizeCongoPhone(phone);
  return normalized ? `tel:+${normalized}` : null;
};

export const getWhatsAppUrl = (phone: string, message: string): string | null => {
  const normalized = normalizeCongoPhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
};

export const getMapsDirectionsUrl = (destination: string): string | null => {
  const normalizedDestination = destination.trim();
  if (!normalizedDestination) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(normalizedDestination)}`;
};
