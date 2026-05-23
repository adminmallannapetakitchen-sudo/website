// India-focused phone normalization to E.164 format (+91XXXXXXXXXX)

export function normalizePhoneToE164(input: string, defaultCountryCode = '+91'): string {
  if (!input) throw new Error('Phone required');
  const cleaned = input.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    if (cleaned.length < 10) throw new Error('Invalid phone');
    return cleaned;
  }
  // strip leading 0
  const digits = cleaned.replace(/^0+/, '');
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  throw new Error('Invalid phone format');
}

export function isValidIndianPhone(phoneE164: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(phoneE164);
}
