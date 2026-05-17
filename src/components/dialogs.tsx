'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ShieldAlert } from 'lucide-react'

// ─── Confirm Dialog ───
interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'ยืนยัน', cancelLabel = 'ยกเลิก', variant = 'default', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null
  const isDanger = variant === 'danger'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className={`p-4 border-b flex items-center gap-3 ${isDanger ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="p-6 text-center text-[#475569]">{message}</div>
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
          <Button className={isDanger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#1d4ed8]'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Error Dialog ───
interface ErrorDialogProps {
  message: string | null
  onClose: () => void
}

export function ErrorDialog({ message, onClose }: ErrorDialogProps) {
  if (!message) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center gap-3 bg-red-50 text-red-700">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="font-semibold">ข้อผิดพลาด</h3>
        </div>
        <div className="p-6 text-center text-[#475569]">{message}</div>
        <div className="p-4 border-t flex justify-end bg-gray-50">
          <Button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white w-full">ปิดหน้าต่าง</Button>
        </div>
      </div>
    </div>
  )
}
