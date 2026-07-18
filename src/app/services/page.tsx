"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Wrench, Edit3, Trash2, X, Check, Save } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ServicesPage() {
  const [search, setSearch] = useState('')
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE')
  const [selectedService, setSelectedService] = useState<any>(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [isActive, setIsActive] = useState(true)
  
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchServices = () => {
    setLoading(true)
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setServices(data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching services:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleOpenCreate = () => {
    setModalMode('CREATE')
    setSelectedService(null)
    setName('')
    setPrice(0)
    setIsActive(true)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (service: any) => {
    setModalMode('EDIT')
    setSelectedService(service)
    setName(service.name)
    setPrice(service.price)
    setIsActive(service.isActive)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast('⚠️ กรุณากรอกชื่อบริการ')
      return
    }

    setSaving(true)
    try {
      const url = modalMode === 'CREATE' ? '/api/services' : `/api/services/${selectedService.id}`
      const method = modalMode === 'CREATE' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, isActive })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ')

      showToast(modalMode === 'CREATE' ? '✅ เพิ่มบริการใหม่สำเร็จ' : '✅ อัปเดตข้อมูลสำเร็จ')
      setIsModalOpen(false)
      fetchServices()
    } catch (err: any) {
      showToast('❌ ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบรายการบริการนี้ใช่หรือไม่?')) return

    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'ลบข้อมูลไม่สำเร็จ')

      showToast('✅ ลบข้อมูลสำเร็จ')
      fetchServices()
    } catch (err: any) {
      showToast('❌ ' + err.message)
    }
  }

  const filtered = services.filter(s => {
    const q = search.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.serviceCode.toLowerCase().includes(q)
  })

  // Stats
  const totalCount = services.length
  const activeCount = services.filter(s => s.isActive).length
  const avgPrice = totalCount > 0 ? services.reduce((sum, s) => sum + s.price, 0) / totalCount : 0

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0f172a] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm flex items-center gap-2 border border-white/10 animate-slide-in">
          {toast}
        </div>
      )}

      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#1d4ed8]" />
            ข้อมูลงานบริการหลัก (Service Master)
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            จัดการรายการบริการมาตรฐานและตั้งราคากลางไว้ล่วงหน้า เพื่อใช้ในการสร้างใบสั่งงานและดึงข้อมูล Excel
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white">
          <Plus className="w-4 h-4" />
          เพิ่มบริการใหม่
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">บริการทั้งหมด</p>
              <h3 className="text-2xl font-bold text-[#0f172a] mt-1">{totalCount} รายการ</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">เปิดใช้งานอยู่</p>
              <h3 className="text-2xl font-bold text-[#0f172a] mt-1">{activeCount} รายการ</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">ค่าบริการเฉลี่ย</p>
              <h3 className="text-2xl font-bold text-[#0f172a] mt-1">฿{formatCurrency(avgPrice)}</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <span className="font-bold text-lg text-indigo-600">฿</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="ค้นหารหัสบริการ หรือชื่อบริการ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 border-b border-gray-200">
            <TableRow>
              <TableHead className="font-semibold text-gray-600 w-[150px]">รหัสบริการ</TableHead>
              <TableHead className="font-semibold text-gray-600">ชื่อรายการบริการ</TableHead>
              <TableHead className="font-semibold text-gray-600 text-right w-[200px]">ราคากลางเริ่มต้น</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center w-[120px]">สถานะ</TableHead>
              <TableHead className="w-[120px] text-center">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                  กำลังโหลดข้อมูล...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                  ไม่พบข้อมูลรายการงานบริการ
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(service => (
                <TableRow key={service.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-gray-500">{service.serviceCode}</TableCell>
                  <TableCell className="font-medium text-[#0f172a]">{service.name}</TableCell>
                  <TableCell className="text-right font-bold text-[#0f172a]">฿{formatCurrency(service.price)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${service.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'} px-2 py-0.5 border-none shadow-none`}>
                      {service.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(service)} className="h-8 w-8 p-0">
                        <Edit3 className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(service.id)} className="h-8 w-8 p-0 hover:text-red-600">
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden">
            <form onSubmit={handleSave}>
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#1d4ed8]" />
                  {modalMode === 'CREATE' ? 'เพิ่มบริการใหม่' : 'แก้ไขข้อมูลบริการ'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase block">ชื่อรายการบริการ *</label>
                  <input
                    type="text"
                    className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="เช่น พ่นสีทะเบียน, ทำสีกันชนหน้า"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase block">ราคากลางเริ่มต้น (บาท)</label>
                  <input
                    type="number"
                    className="w-full mt-1.5 p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                    value={price || ''}
                    onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="serviceActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded text-[#1d4ed8] focus:ring-[#1d4ed8]"
                  />
                  <label htmlFor="serviceActive" className="text-xs font-semibold text-gray-600 select-none">
                    เปิดใช้งานบริการนี้
                  </label>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setIsModalOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl gap-1.5"
                  disabled={saving}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
