import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | string): string {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, ''), 10) : value;
  if (isNaN(num)) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseNumber(value: string): number {
  if (!value) return 0;
  const cleanValue = value.replace(/\./g, '');
  const num = parseInt(cleanValue, 10);
  return isNaN(num) ? 0 : num;
}
