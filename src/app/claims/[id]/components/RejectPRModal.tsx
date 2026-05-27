"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { XCircle } from 'lucide-react'

interface RejectPRModalProps {
  isOpen: boolean
  onClose: () => void
  rejectPRId: string | null
  showToast: (msg: string) => void
  setErrorModalMsg: (msg: string | null) => void
  refreshClaim: () => Promise<void>
}

export function RejectPRModal({
  isOpen,
  onClose,
  rejectPRId,
  showToast,
  setErrorModalMsg,
  refreshClaim
}: RejectPRModalProps) {
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (isOpen) {
      setRejectReason('')
    }
  }, [isOpen])

  if (!isOpen || !rejectPRId) return null

  const handleReject = async () => {
    try {
      const res = await fetch(`/api/payment-requests/${rejectPRId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectReason, rejectedBy: 'การเงิน' })
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error)
      }
      showToast('ปฏิเสธคำขอเบิกเงินเรียบร้อย')
      await refreshClaim()
      onClose()
    } catch (err: any) {
      setErrorModalMsg(`เกิดข้อผิดพลาด: ${err.message}`)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            ปฏิเสธคำขอเบิกเงิน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#475569]">เหตุผลที่ปฏิเสธ</label>
            <Input
              className="mt-1"
              placeholder="ระบุเหตุผล..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectReason.trim()}
              onClick={handleReject}
            >
              <XCircle className="w-4 h-4 mr-1" />
              ยืนยันปฏิเสธ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
