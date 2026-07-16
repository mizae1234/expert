"use client"

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Eye, Cloud, Wrench, Calendar, DollarSign, CheckCircle2 } from 'lucide-react'
import { getServiceStatusColor, getServiceStatusLabel, formatCurrency, formatDateShort } from '@/lib/utils'

export default function ServiceJobsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = () => {
    setLoading(true)
    fetch('/api/service-orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching service jobs:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const filtered = useMemo(() => {
    let list = [...jobs]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(j =>
        j.orderNo?.toLowerCase().includes(s) ||
        j.customer?.name?.toLowerCase().includes(s) ||
        j.vehicles?.some((v: any) =>
          v.carPlate?.toLowerCase().includes(s) ||
          v.carVin?.toLowerCase().includes(s) ||
          v.carModel?.toLowerCase().includes(s)
        )
      )
    }
    if (statusFilter) {
      list = list.filter(j => j.status === statusFilter)
    }
    return list
  }, [jobs, search, statusFilter])

  // Stats calculations
  const stats = useMemo(() => {
    const active = jobs.filter(j => ['PENDING', 'IN_PROGRESS'].includes(j.status)).length
    const completed = jobs.filter(j => j.status === 'COMPLETED').length
    const totalRevenue = jobs
      .filter(j => j.status !== 'CANCELLED')
      .reduce((sum, j) => sum + (j.grandTotal || 0), 0)
    return { active, completed, totalRevenue }
  }, [jobs])

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#1d4ed8]" />
            งานบริการทั่วไป (Service Jobs)
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            จัดการงานบริการพ่นสี/ทำสีทั่วไป และลูกค้านอกระบบเคลม ({jobs.length} รายการ)
          </p>
        </div>
        <Link href="/service-jobs/new">
          <Button className="gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white">
            <Plus className="w-4 h-4" />
            สร้างใบสั่งงานบริการ
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">งานที่กำลังดำเนินการ</p>
              <h3 className="text-2xl font-bold text-[#0f172a] mt-1">{stats.active} งาน</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">งานที่เสร็จสิ้น</p>
              <h3 className="text-2xl font-bold text-[#0f172a] mt-1">{stats.completed} งาน</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">รายได้ทั้งหมด (ไม่รวมยกเลิก)</p>
              <h3 className="text-2xl font-bold text-[#0f172a] mt-1">฿{formatCurrency(stats.totalRevenue)}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="ค้นหาด้วย เลขที่สั่งงาน, ทะเบียนรถ, VIN, หรือชื่อลูกค้า..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full md:w-[180px] bg-white border-gray-200"
            >
              <option value="">ทุกสถานะ</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="IN_PROGRESS">กำลังทำสี</option>
              <option value="COMPLETED">เสร็จสิ้น/ออกบิล</option>
              <option value="CANCELLED">ยกเลิก</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 border-b border-gray-200">
            <TableRow>
              <TableHead className="font-semibold text-gray-600">เลขที่สั่งงาน</TableHead>
              <TableHead className="font-semibold text-gray-600">วันที่สร้าง</TableHead>
              <TableHead className="font-semibold text-gray-600">ลูกค้า</TableHead>
              <TableHead className="font-semibold text-gray-600">จำนวนรถยนต์</TableHead>
              <TableHead className="font-semibold text-gray-600">ทะเบียนรถ</TableHead>
              <TableHead className="font-semibold text-gray-600">ยี่ห้อ / รุ่น (ตัวอย่าง)</TableHead>
              <TableHead className="font-semibold text-gray-600 text-right">ยอดรวมสุทธิ</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">สถานะ</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">เลขที่ใบเสร็จ</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">PEAK Sync</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-gray-400">
                  กำลังโหลดข้อมูล...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-gray-400">
                  ไม่พบรายการงานบริการทั่วไป
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(job => {
                const statusColor = getServiceStatusColor(job.status)
                const vehicleCount = job.vehicles?.length || 0
                const firstVehicle = job.vehicles?.[0]
                const plateText = firstVehicle 
                  ? `${firstVehicle.carPlate}${vehicleCount > 1 ? ` (+ ${vehicleCount - 1} คัน)` : ''}`
                  : '-'
                const brandModelText = firstVehicle
                  ? `${firstVehicle.carBrand} ${firstVehicle.carModel}`
                  : '-'

                return (
                  <TableRow key={job.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-mono font-medium text-[#1d4ed8]">{job.orderNo}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatDateShort(job.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-[#0f172a]">{job.customer?.name}</TableCell>
                    <TableCell className="text-sm font-semibold text-gray-700 text-center">
                      <Badge className="bg-gray-100 text-gray-700 px-2 py-0.5 border-none shadow-none">
                        {vehicleCount} คัน
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-700">
                      {plateText}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {brandModelText}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-[#0f172a]">
                      ฿{formatCurrency(job.grandTotal)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${statusColor.bg} ${statusColor.text} px-2.5 py-0.5 border-none shadow-none`}>
                        {getServiceStatusLabel(job.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm font-mono font-medium text-gray-700">
                      {job.invoiceNo || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Cloud className={`w-5 h-5 ${job.isSynced ? 'text-green-500 fill-green-500/10' : 'text-gray-300'}`} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/service-jobs/${job.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
