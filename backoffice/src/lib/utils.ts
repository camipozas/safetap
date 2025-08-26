import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency = 'CLP') {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getStatusColor(status: string) {
  const colors = {
    // Payment statuses
    PENDING: 'bg-yellow-100 text-yellow-800',
    VERIFIED: 'bg-green-100 text-green-800',
    TRANSFER_PAYMENT: 'bg-blue-100 text-blue-800',
    TRANSFERRED: 'bg-green-100 text-green-800',

    // Order workflow statuses (in logical progression order)
    ORDERED: 'bg-slate-100 text-slate-800', // Inicial - gris neutro
    PAID: 'bg-emerald-100 text-emerald-800', // Pagada - verde éxito
    PRINTING: 'bg-amber-100 text-amber-800', // Imprimiendo - amarillo proceso
    SHIPPED: 'bg-blue-100 text-blue-800', // Enviada - azul en tránsito
    ACTIVE: 'bg-green-100 text-green-800', // Activa - verde final
    LOST: 'bg-red-100 text-red-800', // Perdida - rojo error
    REJECTED: 'bg-orange-100 text-orange-800', // Rechazada - naranja
    CANCELLED: 'bg-gray-100 text-gray-800', // Cancelada - gris neutro
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

export function calculateGrowthPercentage(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}
