"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { ClaimStatus } from '@/lib/types'
import { getStatusColor, getStatusLabel } from '@/lib/utils'

interface StatusChangeModalProps {
  isOpen: boolean
  onClose: () => void
  claimId: string
  claimStatus: ClaimStatus
  setClaimStatus: React.Dispatch<React.SetStateAction<ClaimStatus>>
  nextStatus: string | undefined
  showToast: (msg: string) => void
  setErrorModalMsg: (msg: string | null) => void
}

export function StatusChangeModal({
  isOpen,
  onClose,
  claimId,
  claimStatus,
  setClaimStatus,
  nextStatus,
  showToast,
  setErrorModalMsg
}: StatusChangeModalProps) {
  if (!isOpen || !nextStatus) return null

  const handleStatusChangeSubmit = async () => {
    try {
      const res = await fetch(`/api/claims/${claimId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      if (!res.ok) throw new Error()
      setClaimStatus(nextStatus as ClaimStatus)
      showToast(`เปลี่ยนสถานะเป็น "${getStatusLabel(nextStatus)}" แล้ว`)
      onClose()
    } catch (err) {
      setErrorModalMsg('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <Card className="w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="text-lg">เปลี่ยนสถานะ Claim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <span className={`status-badge ${getStatusColor(claimStatus).bg} ${getStatusColor(claimStatus).text}`}>
                {getStatusLabel(claimStatus)}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94a3b8]" />
            <div className="text-center">
              <span className={`status-badge ${getStatusColor(nextStatus as ClaimStatus).bg} ${getStatusColor(nextStatus as ClaimStatus).text}`}>
                {getStatusLabel(nextStatus)}
              </span>
            </div>
          </div>
          <p className="text-sm text-[#475569] text-center">
            ต้องการเปลี่ยนสถานะเป็น &quot;{getStatusLabel(nextStatus)}&quot; ใช่หรือไม่?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button className="bg-[#1d4ed8]" onClick={handleStatusChangeSubmit}>
              ยืนยัน
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
