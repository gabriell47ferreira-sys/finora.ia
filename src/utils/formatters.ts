/**
 * Utility functions for currency, dates, and number formatting.
 * All monetary amounts inside Finora AI are strictly represented in integer cents.
 */

// Converts an integer cents value (e.g. 15050) into formatted BRL currency: "R$ 150,50"
export function formatCurrency(cents: number): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const reals = absCents / 100;

  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reals);

  return isNegative ? `-${formatted}` : formatted;
}

// Converts float/reals or user string input into integer cents
export function toCents(value: number | string): number {
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }

  // Clean string (e.g. "R$ 1.250,50" -> "1250.50")
  const cleaned = value
    .replace(/[^\d,-]/g, '')
    .replace(',', '.');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
}

// Converts cents to float number (e.g. 15050 -> 150.5)
export function fromCents(cents: number): number {
  return cents / 100;
}

// Formats a date string 'YYYY-MM-DD' into '19 de nov.' or '19/11/2026'
export function formatDate(dateStr: string, style: 'short' | 'medium' | 'full' = 'medium'): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);

  if (style === 'short') {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
  }

  if (style === 'full') {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  // medium
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

// Returns human friendly grouping label: "HOJE", "ONTEM", or formatted date
export function getDateGroupLabel(dateStr: string): string {
  const today = new Date();
  const target = new Date(dateStr + 'T00:00:00');
  
  const todayStr = today.toISOString().split('T')[0];
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) {
    return 'HOJE';
  }
  if (dateStr === yesterdayStr) {
    return 'ONTEM';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
  }).format(target).toUpperCase();
}

// Get current year and month in YYYY-MM format
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Get relative month string (offset = -1 for previous month, 1 for next month)
export function getRelativeYearMonth(offset: number, baseYearMonth?: string): string {
  const [y, m] = (baseYearMonth || getCurrentYearMonth()).split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Formats 'YYYY-MM' to readable month name e.g. "Novembro 2026" or "Nov"
export function formatMonthYear(yearMonth: string, short: boolean = false): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('pt-BR', {
    month: short ? 'short' : 'long',
    year: 'numeric',
  }).format(d);
}

// Formats percentage e.g. 4.2 -> "+4.2%" or "-1.5%"
export function formatPercentage(val: number): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}
