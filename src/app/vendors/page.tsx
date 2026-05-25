"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Search, Eye, Package, Wrench, X } from 'lucide-react'
import { SkeletonTableRows } from '@/components/ui/skeleton'

export default function VendorsPage() {
  const [search, setSearch] = useState('')
  const [showMissingPeakOnly, setShowMissingPeakOnly] = useState(false)
  const [mockVendors, setMockVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVendors = () => {
    fetch('/api/vendors').then(res => res.json()).then(data => {
      setMockVendors(data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchVendors()
  }, [])
  
  const filterVendor = (v: any) => {
    if (search !== '' && !v.name.toLowerCase().includes(search.toLowerCase())) return false
    if (showMissingPeakOnly && v.peakVendorCode) return false
    return true
  }

  const partsVendors = mockVendors.filter(v => v.vendorType === 'PARTS' && filterVendor(v))
  const garageVendors = mockVendors.filter(v => v.vendorType === 'GARAGE' && filterVendor(v))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Vendors</h1>
          <p className="text-sm text-[#94a3b8] mt-1">จัดการผู้จำหน่ายอะไหล่และอู่ ({mockVendors.length} ราย)</p>
        </div>
        <Link href="/vendors/new"><Button><Plus className="w-4 h-4 mr-2" />เพิ่ม Vendor</Button></Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="ค้นหาชื่อ Vendor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <label className="flex items-center gap-2 text-sm text-[#475569] cursor-pointer bg-white border px-3 py-2 rounded-md hover:bg-gray-50">
          <input type="checkbox" checked={showMissingPeakOnly} onChange={e => setShowMissingPeakOnly(e.target.checked)} className="rounded border-gray-300 text-[#1d4ed8]" />
          แสดงเฉพาะที่ยังไม่มี PEAK Code ⚠️
        </label>
      </div>

      <Tabs defaultValue="parts">
        <TabsList>
          <TabsTrigger value="parts" className="gap-2"><Package className="w-4 h-4" />ผู้จำหน่ายอะไหล่ ({partsVendors.length})</TabsTrigger>
          <TabsTrigger value="garage" className="gap-2"><Wrench className="w-4 h-4" />อู่ ({garageVendors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="parts">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>เลขผู้เสียภาษี</TableHead>
                    <TableHead>โซน</TableHead>
                    <TableHead>จังหวัด</TableHead>
                    <TableHead>โทร</TableHead>
                    <TableHead>PEAK</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <SkeletonTableRows rows={6} cols={9} />
                  ) : partsVendors.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs font-semibold text-[#475569]">{v.id}</TableCell>
                      <TableCell className="font-semibold">{v.name}</TableCell>
                      <TableCell className="font-mono text-xs">{v.taxId}</TableCell>
                      <TableCell>{v.zone}</TableCell>
                      <TableCell>{v.province}</TableCell>
                      <TableCell>{v.phone}</TableCell>
                      <TableCell>
                        {v.peakVendorCode ? <span title={v.peakVendorCode}>✅</span> : <span title="Missing">⚠️</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {v.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Link href={`/vendors/${v.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button></Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="garage">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>เลขผู้เสียภาษี</TableHead>
                    <TableHead>โซน</TableHead>
                    <TableHead>จังหวัด</TableHead>
                    <TableHead>โทร</TableHead>
                    <TableHead>PEAK</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <SkeletonTableRows rows={6} cols={9} />
                  ) : garageVendors.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs font-semibold text-[#475569]">{v.id}</TableCell>
                      <TableCell className="font-semibold">{v.name}</TableCell>
                      <TableCell className="font-mono text-xs">{v.taxId}</TableCell>
                      <TableCell>{v.zone}</TableCell>
                      <TableCell>{v.province}</TableCell>
                      <TableCell>{v.phone}</TableCell>
                      <TableCell>
                        {v.peakVendorCode ? <span title={v.peakVendorCode}>✅</span> : <span title="Missing">⚠️</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {v.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Link href={`/vendors/${v.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button></Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
