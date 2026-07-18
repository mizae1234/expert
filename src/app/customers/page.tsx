"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Search, Eye, Users, FileText, CheckCircle2, Cloud } from 'lucide-react'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCustomers(data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching customers:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filtered = customers.filter(cust => {
    const s = search.toLowerCase()
    return (
      search === '' ||
      cust.name.toLowerCase().includes(s) ||
      (cust.taxId && cust.taxId.includes(s)) ||
      (cust.phone && cust.phone.includes(s))
    )
  })

  // Calculations for stats
  const totalCount = customers.length
  const vatRegisteredCount = customers.filter(c => c.isVatRegistered).length
  const totalServiceJobs = customers.reduce((sum, c) => sum + (c._count?.serviceOrders || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1d4ed8]" />
            รายชื่อลูกค้า (Customers)
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            จัดการข้อมูลหลักของลูกค้าทั่วไปและคู่ค้าในระบบ ({totalCount} รายการ)
          </p>
        </div>
        <Link href="/customers/new">
          <Button className="gap-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white">
            <Plus className="w-4 h-4" />
            เพิ่มลูกค้าใหม่
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">ลูกค้าทั้งหมด</p>
              <h3 className="text-2xl font-bold text-[#0f172a] mt-1">{totalCount} ราย</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">จดทะเบียนภาษีมูลค่าเพิ่ม</p>
              <h3 className="text-2xl font-bold text-[#0f172a] mt-1">{vatRegisteredCount} ราย</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">จำนวนใบสั่งงานรวม</p>
              <h3 className="text-2xl font-bold text-[#0f172a] mt-1">{totalServiceJobs} รายการ</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="ค้นหาด้วย ชื่อลูกค้า, เบอร์โทร, หรือเลขประจำตัวผู้เสียภาษี..."
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
              <TableHead className="font-semibold text-gray-600 w-[120px]">รหัสลูกค้า</TableHead>
              <TableHead className="font-semibold text-gray-600">ชื่อลูกค้า/บริษัท</TableHead>
              <TableHead className="font-semibold text-gray-600">เบอร์โทรศัพท์</TableHead>
              <TableHead className="font-semibold text-gray-600">เลขผู้เสียภาษี</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">สาขา</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">จด VAT</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">PEAK ID</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">จำนวนใบสั่งงาน</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                  กำลังโหลดข้อมูล...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                  ไม่พบข้อมูลลูกค้า
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(cust => (
                <TableRow key={cust.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-gray-500">{cust.id}</TableCell>
                  <TableCell className="font-medium text-[#0f172a]">{cust.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{cust.phone || '-'}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">{cust.taxId || '-'}</TableCell>
                  <TableCell className="text-center font-mono text-xs text-gray-600">{cust.branchCode || '00000'}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${cust.isVatRegistered ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'} px-2 py-0.5 border-none shadow-none`}>
                      {cust.isVatRegistered ? 'จดทะเบียน' : 'ไม่จด'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {cust.peakCustomerId ? (
                      <Badge variant="outline" className="font-mono text-xs text-indigo-600 border-indigo-200 bg-indigo-50/30">
                        {cust.peakCustomerId}
                      </Badge>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-[#0f172a]">
                    {cust._count?.serviceOrders || 0} รายการ
                  </TableCell>
                  <TableCell className="text-center">
                    <Link href={`/customers/${cust.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
