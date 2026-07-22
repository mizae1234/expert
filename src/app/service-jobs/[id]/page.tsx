"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { 
  ArrowLeft, Wrench, Calendar, User, FileText, Cloud, 
  Printer, Trash2, CheckCircle2, AlertTriangle, Play, Check, Edit3, Camera, Upload, Eye, X, ClipboardCheck
} from 'lucide-react'
import { 
  getServiceStatusColor, getServiceStatusLabel, 
  formatCurrency, formatDateShort 
} from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function ServiceJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'primary' | 'warning';
    onConfirm: () => void;
  } | null>(null)

  // Vehicle completion modal state
  const [completingVehicle, setCompletingVehicle] = useState<any>(null)
  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([])
  const [completionTime, setCompletionTime] = useState('')
  const [completionStatus, setCompletionStatus] = useState('COMPLETED')
  const [uploading, setUploading] = useState(false)
  const [savingVehicleStatus, setSavingVehicleStatus] = useState(false)

  const handleOpenCompletionModal = (vehicle: any) => {
    setCompletingVehicle(vehicle)
    setVehiclePhotos(vehicle.photos || [])
    const defaultStatus = (vehicle.status === 'PENDING' || vehicle.status === 'IN_PROGRESS')
      ? 'COMPLETED'
      : vehicle.status;
    setCompletionStatus(defaultStatus || 'COMPLETED')
    // Format current date/time to local ISO format (YYYY-MM-DDTHH:MM)
    const now = new Date(vehicle.completedAt || new Date())
    const offset = now.getTimezoneOffset() * 60000
    const localISO = new Date(now.getTime() - offset).toISOString().substring(0, 16)
    setCompletionTime(localISO)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newPhotos = [...vehiclePhotos]

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('file', file)
      
      const yyyymm = order?.orderNo ? order.orderNo.substring(4, 10) : 'general'
      const orderNo = order?.orderNo || id
      formData.append('folder', `JobService/${yyyymm}/${orderNo}`)

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        const data = await res.json()
        if (data.publicUrl) {
          newPhotos.push(data.publicUrl)
        }
      } catch (uploadErr) {
        console.error('Error uploading file:', uploadErr)
      }
    }

    setVehiclePhotos(newPhotos)
    setUploading(false)
  }

  const handleRemoveUploadedPhoto = (index: number) => {
    setVehiclePhotos(vehiclePhotos.filter((_, idx) => idx !== index))
  }

  const handleSaveVehicleCompletion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!completingVehicle) return

    setSavingVehicleStatus(true)
    try {
      const res = await fetch(`/api/service-orders/${id}/vehicles/${completingVehicle.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: completionStatus,
          photos: vehiclePhotos,
          completedAt: completionStatus === 'COMPLETED' ? completionTime : null
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'บันทึกสถานะไม่สำเร็จ')

      showToast('✅ บันทึกสถานะรถคันนี้สำเร็จ')
      setCompletingVehicle(null)
      setOrder(data)
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setSavingVehicleStatus(false)
    }
  }

  const handleBatchComplete = () => {
    if (selectedVehicleIds.length === 0) return
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันเสร็จงานรถที่เลือก',
      description: `คุณแน่ใจว่าต้องการบันทึกเสร็จงานรถที่เลือกจำนวน ${selectedVehicleIds.length} คันใช่หรือไม่?`,
      variant: 'primary',
      onConfirm: async () => {
        setUpdating(true)
        try {
          const res = await fetch(`/api/service-orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicleIds: selectedVehicleIds,
              action: 'COMPLETE'
            })
          })

          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ')

          showToast('✅ บันทึกเสร็จงานรถที่เลือกสำเร็จเรียบร้อยแล้ว')
          setSelectedVehicleIds([])
          setOrder(data)
        } catch (err: any) {
          showToast('❌ ' + err.message)
        } finally {
          setUpdating(false)
        }
      }
    })
  }

  const handleBatchCancel = () => {
    if (selectedVehicleIds.length === 0) return
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันยกเลิกรายการรถที่เลือก',
      description: `คุณแน่ใจว่าต้องการยกเลิกงานรถที่เลือกจำนวน ${selectedVehicleIds.length} คันใช่หรือไม่?`,
      variant: 'danger',
      onConfirm: async () => {
        setUpdating(true)
        try {
          const res = await fetch(`/api/service-orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicleIds: selectedVehicleIds,
              action: 'CANCEL'
            })
          })

          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ')

          showToast('✅ ยกเลิกงานรถที่เลือกสำเร็จเรียบร้อยแล้ว')
          setSelectedVehicleIds([])
          setOrder(data)
        } catch (err: any) {
          showToast('❌ ' + err.message)
        } finally {
          setUpdating(false)
        }
      }
    })
  }

  const handleCancelSingleVehicle = (vehicle: any) => {
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันยกเลิกงานรถยนต์คันนี้',
      description: `คุณแน่ใจว่าต้องการยกเลิกงานรถยนต์ทะเบียน ${vehicle.carPlate} ใช่หรือไม่?`,
      variant: 'danger',
      onConfirm: async () => {
        setUpdating(true)
        try {
          const res = await fetch(`/api/service-orders/${id}/vehicles/${vehicle.id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'CANCELLED',
              photos: vehicle.photos || [],
              completedAt: null
            })
          })

          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'ยกเลิกไม่สำเร็จ')

          showToast('✅ ยกเลิกงานรถยนต์คันนี้สำเร็จ')
          setOrder(data)
        } catch (err: any) {
          showToast('❌ ' + err.message)
        } finally {
          setUpdating(false)
        }
      }
    })
  }

  const toggleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleIds(prev =>
      prev.includes(vehicleId)
        ? prev.filter(vid => vid !== vehicleId)
        : [...prev, vehicleId]
    )
  }

  const toggleSelectAll = () => {
    const activeVehicles = order?.vehicles?.filter((v: any) => v.status === 'PENDING' || v.status === 'IN_PROGRESS') || []
    const activeIds = activeVehicles.map((v: any) => v.id)
    const allSelected = activeIds.length > 0 && activeIds.every((id: string) => selectedVehicleIds.includes(id))

    if (allSelected) {
      setSelectedVehicleIds(prev => prev.filter(id => !activeIds.includes(id)))
    } else {
      setSelectedVehicleIds(prev => {
        const newIds = [...prev]
        activeIds.forEach((id: string) => {
          if (!newIds.includes(id)) newIds.push(id)
        })
        return newIds
      })
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/service-orders/${id}`)
      if (!res.ok) throw new Error('Order not found')
      const data = await res.json()
      setOrder(data)
    } catch (err: any) {
      console.error(err)
      showToast('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchOrder()
    }
  }, [id])

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'CANCELLED') {
      setConfirmConfig({
        isOpen: true,
        title: 'ยืนยันยกเลิกใบสั่งงานบริการ',
        description: 'คุณแน่ใจว่าต้องการยกเลิกใบสั่งงานนี้และรถทุกคันในใบงานใช่หรือไม่?',
        variant: 'danger',
        onConfirm: () => executeStatusChange(newStatus)
      })
    } else if (newStatus === 'COMPLETED') {
      setConfirmConfig({
        isOpen: true,
        title: 'ยืนยันเสร็จงานทั้งใบงาน',
        description: 'คุณแน่ใจว่าต้องการบันทึกเสร็จงานสำหรับรถทุกคันในใบงานใช่หรือไม่?',
        variant: 'primary',
        onConfirm: () => executeStatusChange(newStatus)
      })
    } else {
      executeStatusChange(newStatus)
    }
  }

  const executeStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/service-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      const updated = await res.json()
      setOrder(updated)
      showToast('✅ อัปเดตสถานะสำเร็จ')
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleGenerateInvoice = async () => {
    const incomplete = order.vehicles?.filter((v: any) => v.status !== 'COMPLETED' && v.status !== 'CANCELLED') || []
    if (incomplete.length > 0) {
      showToast('❌ ไม่สามารถออกใบวางบิลได้ เนื่องจากยังมีรถยนต์กำลังดำเนินการอยู่ (ต้องกดยกเลิกหรือเสร็จงานครบทุกคัน)')
      return
    }

    setUpdating(true)
    try {
      const res = await fetch(`/api/service-orders/${id}/invoice`, {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate invoice')
      setOrder(data)
      showToast('✅ ออกใบวางบิล/ใบเสร็จสำเร็จ')
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleExportPEAK = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/peak/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ar', ids: [order.id] })
      })
      if (!res.ok) throw new Error('Failed to export AR')
      const data = await res.json()

      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(data.rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "AR_Invoice")
      XLSX.writeFile(wb, `AR_Service_${order.invoiceNo}.xlsx`)

      showToast('✅ Export Excel สำหรับ PEAK สำเร็จ')
      fetchOrder() // Reload to show synced status
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'ยืนยันลบใบสั่งงานบริการ',
      description: 'คุณต้องการลบใบสั่งงานบริการนี้ใช่หรือไม่? ข้อมูลทั้งหมดจะไม่สามารถกู้คืนได้',
      variant: 'danger',
      onConfirm: async () => {
        setUpdating(true)
        try {
          const res = await fetch(`/api/service-orders/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Failed to delete order')
          router.push('/service-jobs')
        } catch (err: any) {
          showToast('❌ ' + err.message)
          setUpdating(false)
        }
      }
    })
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">กำลังโหลดรายละเอียดใบสั่งงาน...</div>
  }

  if (!order) {
    return <div className="p-8 text-center text-red-500">ไม่พบข้อมูลใบสั่งงานบริการ</div>
  }

  const statusColor = getServiceStatusColor(order.status)



  // STANDARD DETAIL VIEW
  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0f172a] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm flex items-center gap-2 border border-white/10 animate-slide-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/service-jobs">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-gray-200 hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#0f172a]">{order.orderNo}</h1>
              <Badge className={`${statusColor.bg} ${statusColor.text} px-2.5 py-0.5 border-none shadow-none`}>
                {getServiceStatusLabel(order.status)}
              </Badge>
            </div>
            <p className="text-sm text-[#94a3b8] mt-0.5">
              สร้างเมื่อ {formatDateShort(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Actions */}
          {order.status !== 'CANCELLED' && (
            <Button 
              variant="outline"
              className="border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50 gap-1.5 font-bold animate-fade-in"
              onClick={() => handleStatusChange('CANCELLED')}
              disabled={updating}
            >
              <X className="w-4 h-4" />
              ยกเลิกใบงาน
            </Button>
          )}

          <Button 
            variant="outline" 
            className="gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={() => window.open(`/service-jobs/${order.id}/pdf`, '_blank')}
          >
            <Printer className="w-4 h-4" />
            พิมพ์ใบสั่งงาน
          </Button>

          {order.invoiceNo && (
            <Button 
              variant="outline" 
              className="gap-1.5 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-50"
              onClick={() => window.open(`/service-jobs/${order.id}/pdf?type=invoice`, '_blank')}
            >
              <Printer className="w-4 h-4" />
              พิมพ์ใบวางบิล
            </Button>
          )}

          {!order.invoiceNo && (
            <Link href={`/service-jobs/${order.id}/edit`}>
              <Button variant="outline" className="gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50">
                <Edit3 className="w-4 h-4" />
                แก้ไขใบสั่งงาน
              </Button>
            </Link>
          )}

          {!order.invoiceNo && (
            <Button 
              className="bg-[#1d4ed8] hover:bg-[#1e40af] gap-1.5 text-white font-bold"
              onClick={handleGenerateInvoice}
              disabled={updating}
            >
              <FileText className="w-4 h-4" />
              ออกใบวางบิล
            </Button>
          )}


          {order.status !== 'COMPLETED' && (
            <>
              <Button 
                className="bg-green-600 hover:bg-green-700 gap-1.5 text-white font-bold"
                onClick={handleBatchComplete}
                disabled={updating || selectedVehicleIds.length === 0}
              >
                <Check className="w-4 h-4" />
                เสร็จงาน
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 gap-1.5 text-white font-bold"
                onClick={handleBatchCancel}
                disabled={updating || selectedVehicleIds.length === 0}
              >
                <X className="w-4 h-4" />
                ยกเลิกรายการ
              </Button>
            </>
          )}

          {order.invoiceNo && !order.isSynced && (
            <Button 
              className="bg-green-600 hover:bg-green-700 gap-1.5 text-white"
              onClick={handleExportPEAK}
              disabled={syncing}
            >
              <Cloud className="w-4 h-4" />
              {syncing ? 'กำลังส่ง...' : 'Export Excel สำหรับ PEAK'}
            </Button>
          )}

          <Button 
            variant="ghost" 
            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2.5"
            onClick={handleDelete}
            disabled={updating}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Center Details (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* List of Vehicles Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0f172a]">รายการรถยนต์ ({order.vehicles?.length || 0} คัน)</h2>
              {order.vehicles?.some((v: any) => v.status === 'PENDING' || v.status === 'IN_PROGRESS') && (
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                  <input 
                    id="select-all-vehicles"
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={
                      (() => {
                        const active = order.vehicles.filter((v: any) => v.status === 'PENDING' || v.status === 'IN_PROGRESS')
                        return active.length > 0 && active.every((v: any) => selectedVehicleIds.includes(v.id))
                      })()
                    }
                    onChange={toggleSelectAll}
                  />
                  <label htmlFor="select-all-vehicles" className="text-xs font-semibold text-gray-500 cursor-pointer select-none">เลือกทั้งหมดที่กำลังดำเนินการ</label>
                </div>
              )}
            </div>
            
            {order.vehicles?.map((vehicle: any, idx: number) => {
              const isCompleted = vehicle.status === 'COMPLETED';
              const isCancelled = vehicle.status === 'CANCELLED';
              return (
                <Card key={vehicle.id} className={`shadow-sm border-gray-200 overflow-hidden ${
                  isCompleted ? 'border-l-4 border-l-green-500' :
                  isCancelled ? 'border-l-4 border-l-red-500 opacity-65' : ''
                }`}>
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isCompleted && !isCancelled && (
                          <input 
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mr-1"
                            checked={selectedVehicleIds.includes(vehicle.id)}
                            onChange={() => toggleSelectVehicle(vehicle.id)}
                          />
                        )}
                        <span className="font-bold text-[#0f172a] text-sm">
                          คันที่ {idx + 1}: {vehicle.carPlate} {vehicle.carProvince ? `(${vehicle.carProvince})` : ''} - {vehicle.carBrand} {vehicle.carModel}
                        </span>
                        <Badge className={`${
                          isCompleted ? 'bg-green-50 text-green-700' :
                          isCancelled ? 'bg-red-50 text-red-700' :
                          'bg-amber-50 text-amber-700'
                        } px-2 py-0.5 border-none shadow-none text-[10px]`}>
                          {isCompleted ? 'เสร็จงานแล้ว' :
                           isCancelled ? 'ยกเลิกแล้ว' :
                           'กำลังดำเนินการ'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border">
                          VIN: {vehicle.carVin}
                        </span>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 gap-1 font-semibold"
                          onClick={() => handleOpenCompletionModal(vehicle)}
                        >
                          {isCompleted ? 'แก้ไขรูปภาพ/สถานะ' : 'เสร็จงานรายคัน'}
                        </Button>

                        {!isCompleted && !isCancelled && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-red-200 text-red-700 bg-red-50 hover:bg-red-100 gap-1 font-semibold"
                            onClick={() => handleCancelSingleVehicle(vehicle)}
                          >
                            ยกเลิกรายคัน
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead>รายการสั่งงาน</TableHead>
                          <TableHead className="w-20 text-center">จำนวน</TableHead>
                          <TableHead className="w-32 text-right">ราคาต่อหน่วย</TableHead>
                          <TableHead className="w-32 text-right">ราคารวม</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehicle.items?.map((item: any, iIdx: number) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-center text-gray-400 text-xs">{iIdx + 1}</TableCell>
                            <TableCell className="font-semibold text-gray-700 text-sm">{item.description}</TableCell>
                            <TableCell className="text-center text-gray-600 text-sm">{item.quantity}</TableCell>
                            <TableCell className="text-right text-gray-600 text-sm">฿{formatCurrency(item.priceUnit)}</TableCell>
                            <TableCell className="text-right font-bold text-gray-800 text-sm">฿{formatCurrency(item.totalPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
 
                     {/* Completion Photos Gallery */}
                     {vehicle.photos && vehicle.photos.length > 0 && (
                      <div className="p-4 bg-gray-50/50 border-t border-gray-100 space-y-2">
                        <span className="text-xs font-bold text-gray-600 block">{isCompleted ? 'รูปภาพผลงานเสร็จงาน:' : 'รูปภาพแนบการดำเนินงาน/รูปแนบ:'}</span>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {vehicle.photos.map((url: string, pIdx: number) => {
                            const isImg = /\.(jpg|jpeg|png|gif|webp|svg)/i.test(url) || url.startsWith('data:image/')
                            return (
                              <div key={pIdx} className="relative aspect-video rounded-lg overflow-hidden border bg-white group cursor-pointer" onClick={() => window.open(url, '_blank')}>
                                {isImg ? (
                                  <img src={url} alt="Completion preview" className="object-cover w-full h-full" />
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full w-full bg-blue-50/50 p-2">
                                    <FileText className="w-6 h-6 text-blue-500" />
                                    <span className="text-[10px] font-semibold text-blue-700 mt-1 truncate max-w-full">
                                      {url.substring(url.lastIndexOf('/') + 1).substring(9) || 'เอกสารแนบ'}
                                    </span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {vehicle.completedAt && (
                          <span className="text-[10px] text-gray-400 block pt-1">
                            ⏰ บันทึกเสร็จงานเมื่อ: {new Date(vehicle.completedAt).toLocaleString('th-TH')}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Details (1 Column) */}
        <div className="space-y-6">
          {/* Status & Billing Status */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-base font-bold text-[#0f172a]">การจัดการสถานะ &amp; บิล</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase">เปลี่ยนสถานะงาน</span>
                <Select
                  value={order.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  disabled={updating}
                  className="w-full bg-white border-gray-200 mt-1"
                >
                  <option value="PENDING">รอดำเนินการ</option>
                  <option value="IN_PROGRESS">กำลังทำสี</option>
                  <option value="COMPLETED">เสร็จสิ้น/ออกบิล</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </Select>
              </div>

              {/* Pricing Summary */}
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm font-medium text-gray-700">
                <div className="flex justify-between w-full">
                  <span className="text-gray-400">ราคารวมสินค้า:</span>
                  <span>฿{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between w-full text-gray-500 text-xs">
                  <span>ภาษีมูลค่าเพิ่ม (7%):</span>
                  <span>฿{formatCurrency(order.vatAmount)}</span>
                </div>
                <div className="flex justify-between w-full text-base font-bold text-[#0f172a] border-t border-gray-100 pt-2 mt-1">
                  <span>ยอดสุทธิทั้งหมด:</span>
                  <span>฿{formatCurrency(order.grandTotal)}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">เอกสารใบวางบิล</span>
                {order.invoiceNo ? (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 mt-1 font-mono text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">เลขใบวางบิล:</span>
                      <span className="font-bold text-[#0f172a]">{order.invoiceNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">วันที่ออกบิล:</span>
                      <span className="text-gray-600">{formatDateShort(order.invoiceDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">วันกำหนดชำระ:</span>
                      <span className="text-gray-600">{formatDateShort(order.dueDate)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50/50 rounded-xl border border-yellow-100 mt-1 text-xs text-yellow-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    ยังไม่ได้ออกใบวางบิลเพื่อเรียกชำระเงิน
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase block">การซิงค์ข้อมูลบัญชี PEAK</span>
                {order.isSynced ? (
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-xs text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div>
                      <strong>ซิงค์เรียบร้อยแล้ว</strong>
                      <span className="block text-[10px] text-green-600/75 mt-0.5">
                        เมื่อ {formatDateShort(order.syncedAt)}
                      </span>
                    </div>
                  </div>
                ) : order.invoiceNo ? (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    พร้อมสำหรับส่งออกเพื่ออัปโหลดเข้าระบบ PEAK
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ต้องออกใบวางบิลก่อน จึงจะซิงค์ข้อมูลได้
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Info Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                ข้อมูลผู้ว่าจ้าง / ลูกค้า
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-sm space-y-3.5">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">ชื่อลูกค้า/บริษัท</span>
                <p className="font-semibold text-gray-900 mt-0.5">{order.customer.name}</p>
              </div>

              {order.customer.taxId && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">เลขประจำตัวผู้เสียภาษี</span>
                  <p className="text-gray-800 mt-0.5">{order.customer.taxId}</p>
                </div>
              )}

              {order.customer.phone && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">เบอร์โทรศัพท์</span>
                  <p className="text-gray-800 mt-0.5">{order.customer.phone}</p>
                </div>
              )}

              {order.customer.address && (
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase">ที่อยู่</span>
                  <p className="text-gray-700 mt-0.5 text-xs leading-relaxed">{order.customer.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity History Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-gray-500" />
                ประวัติการดำเนินงาน ({order.logs?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 max-h-[350px] overflow-y-auto space-y-4">
              {order.logs && order.logs.length > 0 ? (
                <div className="relative border-l border-gray-200 pl-4 ml-2 space-y-4">
                  {order.logs.map((log: any) => {
                    let actionBadgeColor = 'bg-gray-100 text-gray-700'
                    let actionText = log.action
                    if (log.action === 'COMPLETE_VEHICLE' || log.action === 'BATCH_COMPLETE' || log.action === 'COMPLETE_ALL') {
                      actionBadgeColor = 'bg-green-50 text-green-700 border border-green-200'
                      actionText = 'เสร็จงาน'
                    } else if (log.action === 'CANCEL_VEHICLE' || log.action === 'BATCH_CANCEL') {
                      actionBadgeColor = 'bg-red-50 text-red-700 border border-red-200'
                      actionText = 'ยกเลิกรายการ'
                    } else if (log.action === 'EDIT_ORDER') {
                      actionBadgeColor = 'bg-blue-50 text-blue-700 border border-blue-200'
                      actionText = 'แก้ไขใบสั่งงาน'
                    } else if (log.action === 'UPDATE_STATUS') {
                      actionBadgeColor = 'bg-amber-50 text-amber-700 border border-amber-200'
                      actionText = 'เปลี่ยนสถานะ'
                    }

                    return (
                      <div key={log.id} className="relative group text-xs">
                        {/* Dot indicator */}
                        <div className="absolute -left-[21px] top-1 bg-white border-2 border-blue-500 rounded-full h-2 w-2 group-hover:bg-blue-500 transition-colors" />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${actionBadgeColor}`}>
                            {actionText}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(log.createdAt).toLocaleString('th-TH', {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-1 font-semibold leading-relaxed">{log.details}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">ดำเนินการโดย: <span className="font-bold text-gray-600">{log.changedBy}</span></p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-gray-400">
                  ไม่มีประวัติการดำเนินงานสำหรับใบสั่งงานนี้
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mechanic Completion Modal */}
      {completingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#1d4ed8]" />
                บันทึกสถานะงานรายคัน
              </h3>
              <button
                type="button"
                onClick={() => setCompletingVehicle(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveVehicleCompletion} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  คันที่ต้องการบันทึก: <span className="text-[#1d4ed8]">{completingVehicle.carPlate} - {completingVehicle.carBrand} {completingVehicle.carModel}</span>
                </p>
              </div>

              {/* Status Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 block">สถานะการทำงาน</label>
                <Select
                  value={completionStatus}
                  onChange={e => setCompletionStatus(e.target.value)}
                  className="w-full bg-white border-gray-200 mt-1"
                  required
                >
                  <option value="COMPLETED">เสร็จงานแล้ว (COMPLETED)</option>
                  <option value="PENDING">กำลังดำเนินการ / รอดำเนินการ (PENDING)</option>
                  <option value="CANCELLED">ยกเลิกงานคันนี้ (CANCELLED)</option>
                </Select>
              </div>

              {/* Completion Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 block">วันที่และเวลาเสร็จงาน *</label>
                <Input
                  type="datetime-local"
                  value={completionTime}
                  onChange={e => setCompletionTime(e.target.value)}
                  className="w-full mt-1"
                  required={completionStatus === 'COMPLETED'}
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 block">แนบรูปภาพผลงานเสร็จงาน (R2 Cloud)</label>
                
                {/* Upload box */}
                <div className="border border-dashed border-gray-200 hover:border-[#1d4ed8]/40 rounded-xl p-4 bg-gray-50/50 text-center relative cursor-pointer group transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#1d4ed8]" />
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-[#1d4ed8]">
                      {uploading ? 'กำลังอัปโหลด...' : 'กดเพื่อเลือกรูปภาพหรือไฟล์เอกสาร'}
                    </span>
                    <span className="text-[10px] text-gray-400">รองรับ: รูปภาพ, PDF, Word, Excel (หลายไฟล์พร้อมกัน)</span>
                  </div>
                </div>

                {/* Previews grid */}
                {vehiclePhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {vehiclePhotos.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-white group">
                        <img src={url} alt="Upload preview" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => handleRemoveUploadedPhoto(index)}
                          className="absolute top-1 right-1 bg-[#dc2626] text-white rounded-full p-0.5 shadow hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-2 justify-end border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setCompletingVehicle(null)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={savingVehicleStatus || uploading}
                  className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl"
                >
                  {savingVehicleStatus ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmConfig && (
        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          description={confirmConfig.description}
          variant={confirmConfig.variant}
          onConfirm={() => {
            confirmConfig.onConfirm()
            setConfirmConfig(null)
          }}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  )
}
