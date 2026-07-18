"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { 
  ArrowLeft, Camera, Upload, Eye, X, User, Calendar, ClipboardCheck
} from 'lucide-react'
import { formatDateShort } from '@/lib/utils'

export default function MechanicJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('')

  // Inline edit state
  const [activeVehicleIdForEdit, setActiveVehicleIdForEdit] = useState<string | null>(null)
  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([])
  const [completionTime, setCompletionTime] = useState('')
  const [completionStatus, setCompletionStatus] = useState('COMPLETED')
  const [uploading, setUploading] = useState(false)
  const [savingVehicleStatus, setSavingVehicleStatus] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/service-orders/${id}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOrder(data)
    } catch (err: any) {
      console.error(err)
      showToast('❌ ไม่สามารถโหลดข้อมูลใบสั่งงานได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetails()
  }, [id])

  const handleStartEditVehicle = (vehicle: any) => {
    setActiveVehicleIdForEdit(vehicle.id)
    setVehiclePhotos(vehicle.photos || [])
    const defaultStatus = (vehicle.status === 'PENDING' || vehicle.status === 'IN_PROGRESS')
      ? 'COMPLETED'
      : vehicle.status
    setCompletionStatus(defaultStatus || 'COMPLETED')
    // Format current date/time to local ISO format for datetime-local input (YYYY-MM-DDTHH:MM)
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
      formData.append('folder', `service-jobs/${id}/vehicles`)

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

  const handleSaveVehicleCompletion = async (e: React.FormEvent, vehicleId: string) => {
    e.preventDefault()
    setSavingVehicleStatus(true)
    try {
      const res = await fetch(`/api/service-orders/${id}/vehicles/${vehicleId}/complete`, {
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

      showToast('✅ บันทึกสถานะรถคันนี้สำเร็จแล้ว')
      setActiveVehicleIdForEdit(null)
      setOrder(data)
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setSavingVehicleStatus(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500 text-xs">กำลังโหลดรายละเอียดงาน...</div>
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-gray-500 text-sm">ไม่พบข้อมูลใบสั่งงานนี้</p>
        <Link href="/mechanic">
          <Button className="bg-[#1d4ed8]">กลับหน้าควบคุม</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8faff] pb-24">
      {/* Mobile Top Navbar */}
      <header className="bg-gradient-to-r from-[#1d4ed8] to-[#1e3a8a] text-white px-4 py-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/mechanic">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="text-left">
            <h1 className="text-sm font-bold tracking-wide">ข้อมูลงาน: {order.orderNo}</h1>
            <p className="text-[10px] text-blue-200">อัปเดตและแนบภาพถ่ายช่างรายคัน</p>
          </div>
        </div>
      </header>

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-[#0f172a] text-white px-4 py-3 rounded-xl shadow-lg text-xs flex items-center justify-center gap-2 border border-white/10 animate-slide-in">
          {toast}
        </div>
      )}

      {/* Main Container */}
      <div className="px-4 py-4 space-y-4">
        {/* Job Info Details Card */}
        <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700">รายละเอียดใบสั่งงาน</span>
              <Badge className={
                order.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-none' :
                order.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-none' :
                'bg-gray-50 text-gray-500 border-none'
              }>
                {order.status === 'COMPLETED' ? 'เสร็จสิ้น' :
                 order.status === 'IN_PROGRESS' ? 'กำลังทำสี' : 'รอดำเนินการ'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase">ลูกค้า/ผู้สั่งงาน</span>
                <span className="font-bold text-gray-800">{order.customer.name}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-400 block font-bold uppercase">วันที่สั่งงาน</span>
                <span className="font-semibold text-gray-700">{formatDateShort(order.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicles list */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-gray-700 px-1">รายการรถยนต์ทั้งหมด ({order.vehicles?.length || 0} คัน)</h2>
            
            {/* Search Input inside Job */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 ค้นหา ทะเบียนรถ / เลขตัวถัง (VIN) ในใบงานนี้..."
                value={vehicleSearchQuery}
                onChange={e => setVehicleSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
          </div>

          {(order.vehicles || [])
            .filter((vehicle: any) => {
              if (!vehicleSearchQuery.trim()) return true
              const q = vehicleSearchQuery.toLowerCase()
              return (
                vehicle.carPlate?.toLowerCase().includes(q) ||
                vehicle.carVin?.toLowerCase().includes(q) ||
                vehicle.carBrand?.toLowerCase().includes(q) ||
                vehicle.carModel?.toLowerCase().includes(q)
              )
            })
            .map((vehicle: any, idx: number) => {
              const isCompleted = vehicle.status === 'COMPLETED';
              const isCancelled = vehicle.status === 'CANCELLED';
              const isEditing = activeVehicleIdForEdit === vehicle.id;

              return (
                <Card key={vehicle.id} className={`border-gray-100 shadow-sm rounded-2xl overflow-hidden ${
                  isCompleted ? 'border-l-4 border-l-green-500' :
                  isCancelled ? 'border-l-4 border-l-red-500 opacity-65' : ''
                }`}>
                  <CardHeader className="bg-gray-50/20 border-b border-gray-100/50 p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800 text-xs">
                          คันที่ {idx + 1}: {vehicle.carPlate} {vehicle.carProvince ? `(${vehicle.carProvince})` : ''}
                        </span>
                        <Badge className={
                          isCompleted ? 'bg-green-50 text-green-700 border-none' :
                          isCancelled ? 'bg-red-50 text-red-700 border-none' :
                          'bg-amber-50 text-amber-700 border-none'
                        }>
                          {isCompleted ? 'เสร็จงานแล้ว' :
                           isCancelled ? 'ยกเลิกแล้ว' :
                           'กำลังดำเนินการ'}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">
                        {vehicle.carBrand} {vehicle.carModel} • <span className="font-mono text-gray-400">VIN: {vehicle.carVin}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Service Items Table */}
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold">
                            <th className="py-2 px-3">รายการสั่งซ่อม/งาน</th>
                            <th className="py-2 px-3 text-center w-14">จำนวน</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicle.items?.map((item: any) => (
                            <tr key={item.id} className="border-b border-gray-50 last:border-0">
                              <td className="py-2 px-3 font-semibold text-gray-700">{item.description}</td>
                              <td className="py-2 px-3 text-center text-gray-600 font-semibold">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Completion status, photos and button */}
                    <div className="space-y-3 pt-2">
                      {/* Completion Gallery */}
                      {vehicle.photos && vehicle.photos.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-gray-400 font-bold block uppercase">
                            {isCompleted ? 'รูปภาพผลงานเสร็จงาน:' : 'รูปภาพการดำเนินงาน/รูปแนบ:'}
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {vehicle.photos.map((url: string, pIdx: number) => (
                              <div key={pIdx} className="relative aspect-video rounded-lg overflow-hidden border bg-white group cursor-pointer" onClick={() => window.open(url, '_blank')}>
                                <img src={url} alt="Completion preview" className="object-cover w-full h-full" />
                                <div className="absolute inset-0 bg-black/35 opacity-0 flex items-center justify-center">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                          {vehicle.completedAt && (
                            <span className="text-[9px] text-gray-400 block pt-0.5">
                              ⏰ เสร็จเมื่อ: {new Date(vehicle.completedAt).toLocaleString('th-TH')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* INLINE EDIT FORM */}
                      {isEditing ? (
                        <form onSubmit={(e) => handleSaveVehicleCompletion(e, vehicle.id)} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4 animate-fade-in text-left text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 block uppercase">สถานะการทำงาน</label>
                            <Select
                              value={completionStatus}
                              onChange={e => setCompletionStatus(e.target.value)}
                              className="w-full bg-white border-gray-200 mt-1"
                              required
                            >
                              <option value="COMPLETED">เสร็จงานแล้ว (COMPLETED)</option>
                              <option value="PENDING">กำลังทำสี / รอดำเนินการ (PENDING)</option>
                              <option value="CANCELLED">ยกเลิกงานคันนี้ (CANCELLED)</option>
                            </Select>
                          </div>

                          {/* Completion Date */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 block uppercase">วันที่และเวลาเสร็จงาน *</label>
                            <Input
                              type="datetime-local"
                              value={completionTime}
                              onChange={e => setCompletionTime(e.target.value)}
                              className="w-full mt-1 text-xs"
                              required={completionStatus === 'COMPLETED'}
                            />
                          </div>

                          {/* Photo Uploader */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 block uppercase">รูปภาพแนบเสร็จงาน</label>
                            
                            {/* Upload Box */}
                            <div className="border border-dashed border-gray-200 hover:border-[#1d4ed8]/40 rounded-xl p-4 bg-white text-center relative cursor-pointer group transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploading}
                              />
                              <div className="flex flex-col items-center justify-center space-y-1.5">
                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#1d4ed8]" />
                                <span className="text-xs font-semibold text-gray-600 group-hover:text-[#1d4ed8]">
                                  {uploading ? 'กำลังอัปโหลด...' : 'กดถ่ายรูปผลงาน / แนบรูปภาพ'}
                                </span>
                                <span className="text-[9px] text-gray-400">อัปโหลดได้หลายรูปภาพจากมือถือ</span>
                              </div>
                            </div>

                            {/* Previews */}
                            {vehiclePhotos.length > 0 && (
                              <div className="grid grid-cols-4 gap-2 pt-2">
                                {vehiclePhotos.map((url, index) => (
                                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-white group">
                                    <img src={url} alt="Upload preview" className="object-cover w-full h-full" />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveUploadedPhoto(index)}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Inline Action Buttons */}
                          <div className="pt-3 flex gap-2 justify-end border-t border-gray-100">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-xl py-3 text-xs"
                              onClick={() => setActiveVehicleIdForEdit(null)}
                            >
                              ยกเลิก
                            </Button>
                            <Button
                              type="submit"
                              disabled={savingVehicleStatus || uploading}
                              className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl py-3 text-xs font-bold"
                            >
                              {savingVehicleStatus ? 'กำลังบันทึก...' : 'บันทึก'}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        /* Big Mobile Button */
                        <Button
                          type="button"
                          className={`w-full py-4 rounded-xl font-bold text-xs gap-1.5 shadow-sm transition-all ${
                            isCompleted 
                              ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' 
                              : 'bg-[#1d4ed8] hover:bg-[#1e40af] text-white'
                          }`}
                          onClick={() => handleStartEditVehicle(vehicle)}
                        >
                          <Camera className="w-4 h-4" />
                          {isCompleted ? 'แก้ไขรูปภาพ / เปลี่ยนสถานะ' : 'ถ่ายรูปส่งงาน / บันทึกเสร็จงาน'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      </div>
    </div>
  )
}
