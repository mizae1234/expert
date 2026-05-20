"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, Package, AlertTriangle, ArrowRight, History, Settings2 } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { PartMaster } from '@/lib/types'
import { SkeletonTableRows } from '@/components/ui/skeleton'

export default function PartsMasterPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterSource, setFilterSource] = useState<'ALL' | 'AUTO' | 'MANUAL'>('ALL')
  const [parts, setParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalParts, setTotalParts] = useState(0)
  const itemsPerPage = 50

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch data with pagination
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(itemsPerPage),
    })
    if (debouncedSearch) params.set('search', debouncedSearch)
    
    fetch(`/api/parts-master?${params}`).then(res => res.json()).then(data => {
      setParts(data.data || [])
      setTotalParts(data.total || 0)
      setTotalPages(data.totalPages || 1)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [currentPage, debouncedSearch])

  const filteredParts = filterSource === 'ALL' ? parts : parts.filter(p => p.source === filterSource)

  // Stats from current page (approximate)
  const autoParts = parts.filter(p => p.source === 'AUTO').length
  const missingPrice = parts.filter(p => !p.standardPrice).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Parts Master</h1>
          <p className="text-sm text-[#94a3b8] mt-1">ฐานข้อมูลอะไหล่กลาง สร้างอัตโนมัติจากประวัติการเคลม</p>
        </div>
        <Button className="bg-[#1d4ed8] hover:bg-[#1e40af]">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มอะไหล่ใหม่
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-[#1d4ed8]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#475569]">อะไหล่ทั้งหมด</p>
              <h3 className="text-2xl font-bold text-[#0f172a]">{totalParts} <span className="text-sm font-normal text-[#94a3b8]">รายการ</span></h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Settings2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#475569]">สร้างจาก Claim อัตโนมัติ</p>
              <h3 className="text-2xl font-bold text-[#0f172a]">{autoParts} <span className="text-sm font-normal text-[#94a3b8]">รายการ</span></h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#475569]">ยังไม่มีราคากลาง</p>
              <h3 className="text-2xl font-bold text-[#0f172a]">{missingPrice} <span className="text-sm font-normal text-[#94a3b8]">รายการ</span></h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-white rounded-t-xl">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="ค้นหารหัส หรือ ชื่ออะไหล่..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-gray-50 border-transparent focus:bg-white transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant={filterSource === 'ALL' ? 'default' : 'outline'} onClick={() => setFilterSource('ALL')} className={cn("h-9", filterSource === 'ALL' ? "bg-[#1d4ed8]" : "")}>ทั้งหมด</Button>
              <Button variant={filterSource === 'AUTO' ? 'default' : 'outline'} onClick={() => setFilterSource('AUTO')} className={cn("h-9", filterSource === 'AUTO' ? "bg-emerald-600 hover:bg-emerald-700" : "")}>สร้างออโต้</Button>
              <Button variant={filterSource === 'MANUAL' ? 'default' : 'outline'} onClick={() => setFilterSource('MANUAL')} className={cn("h-9", filterSource === 'MANUAL' ? "bg-gray-600 hover:bg-gray-700" : "")}>คีย์มือ</Button>
            </div>
            <Button variant="outline" className="ml-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filter เพิ่มเติม
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[#f8faff]">
                  <th className="text-left p-4 font-semibold text-[#475569]">Part No.</th>
                  <th className="text-left p-4 font-semibold text-[#475569]">ชื่ออะไหล่</th>
                  <th className="text-left p-4 font-semibold text-[#475569]">หมวดหมู่</th>
                  <th className="text-right p-4 font-semibold text-[#475569]">ราคากลาง</th>
                  <th className="text-center p-4 font-semibold text-[#475569]">Vendor (ราคา)</th>
                  <th className="text-center p-4 font-semibold text-[#475569]">ใช้ไป (Claim)</th>
                  <th className="text-center p-4 font-semibold text-[#475569]">Source</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonTableRows rows={10} cols={8} />
                ) : filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#94a3b8]">ไม่พบข้อมูลอะไหล่ที่ค้นหา</td>
                  </tr>
                ) : (
                  filteredParts.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-[#f8faff] transition-colors group cursor-pointer">
                      <td className="p-4 font-mono text-[#0f172a]">{p.partNo}</td>
                      <td className="p-4">
                        <div className="font-medium text-[#0f172a]">{p.partName}</div>
                        {p.partNameAlt.length > 0 && (
                          <div className="text-xs text-[#94a3b8] mt-0.5 line-clamp-1">
                            สะกดอื่น: {p.partNameAlt.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-[#475569]">{p.category || '-'}</td>
                      <td className="p-4 text-right">
                        {p.standardPrice ? (
                          <span className="font-semibold text-[#0f172a]">{formatCurrency(p.standardPrice)}</span>
                        ) : (
                          <span className="text-amber-500 text-xs flex items-center justify-end gap-1"><AlertTriangle className="w-3 h-3"/> ยังไม่มี</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="bg-white">
                          {p.vendorPrices?.length || 0} เจ้า
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[#0f172a]">
                          <History className="w-3.5 h-3.5 text-[#94a3b8]" />
                          {p.usageCount}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {p.source === 'AUTO' ? (
                          <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none shadow-none text-[10px]">AUTO</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-none shadow-none text-[10px]">MANUAL</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="w-4 h-4 text-[#1d4ed8]" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {parts.length > 0 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-[#475569] bg-white rounded-b-xl">
              <div>แสดงหน้า {currentPage} จาก {totalPages} ({totalParts} รายการ)</div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>ก่อนหน้า</Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button key={pageNum} variant="outline" size="sm" className={currentPage === pageNum ? 'bg-[#f8faff] text-[#1d4ed8] border-[#1d4ed8]' : ''} onClick={() => setCurrentPage(pageNum)}>{pageNum}</Button>
                  )
                })}
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>ถัดไป</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
