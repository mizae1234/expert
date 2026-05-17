import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Date formatting — use lib/date.ts as single source of truth
// Re-export here for backward compatibility
export { formatDate, formatDateTime } from './date'

export function formatDateShort(date: string | Date): string {
  const d = new Date(date)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear() + 543).slice(-2)
  return `${dd}/${mm}/${yy}`
}

export function getStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    RECEIVED: { bg: 'bg-blue-100', text: 'text-blue-700' },
    PARTS_CHECK: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    PO_ISSUED: { bg: 'bg-orange-100', text: 'text-orange-700' },
    GOODS_RECEIVED: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    INVOICE_SENT: { bg: 'bg-purple-100', text: 'text-purple-700' },
    AP_PAID: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    AR_RECEIVED: { bg: 'bg-green-100', text: 'text-green-700' },
    CLOSED: { bg: 'bg-gray-100', text: 'text-gray-600' },
  }
  return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-600' }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    RECEIVED: 'รับเข้า',
    PARTS_CHECK: 'ตรวจสอบอะไหล่',
    PO_ISSUED: 'ออก PO แล้ว',
    GOODS_RECEIVED: 'รับของแล้ว',
    INVOICE_SENT: 'วางบิลแล้ว',
    AP_PAID: 'จ่ายแล้ว',
    AR_RECEIVED: 'รับชำระแล้ว',
    CLOSED: 'ปิดงาน',
  }
  return labels[status] || status
}

export function getPOStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'ร่าง',
    SENT: 'ส่งแล้ว',
    RECEIVED: 'รับของแล้ว',
    CANCELLED: 'ยกเลิก',
  }
  return labels[status] || status
}
