export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateLong(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateShort(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  });
}
