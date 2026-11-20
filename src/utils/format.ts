export function formatCurrency(amount: number | null | undefined, currency = 'FCFA'): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
  return `${formatted} ${currency}`;
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(isoString));
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString));
}

export function formatFullName(firstname: string, lastname: string): string {
  return `${firstname} ${lastname}`.trim();
}

export function formatInitials(firstname: string, lastname: string): string {
  return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
}
