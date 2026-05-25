"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Search, Eye, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function InsurancesPage() {
  const [search, setSearch] = useState('')
  const [insurances, setInsurances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/insurances').then(res => res.json()).then(data => {
      setInsurances(data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const filtered = insurances.filter(ins => search === '' || ins.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">บริษัทประกัน</h1>
          <p className="text-sm text-[#94a3b8] mt-1">จัดการข้อมูลบริษัทประกันภัย ({insurances.length} บริษัท)</p>
        </div>
        <Link href="/insurances/new"><Button><Plus className="w-4 h-4 mr-2" />เพิ่มบริษัทประกัน</Button></Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="ค้นหาชื่อบริษัทประกัน..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-4 text-center py-8 text-[#94a3b8]">กำลังโหลดข้อมูล...</div>
        ) : insurances.map(ins => {
          const claims = ins.claims || []
          const revenue = claims.filter((c: any) => c.insuranceInvoice).reduce((s: number, c: any) => s + (c.insuranceInvoice?.grandTotal || 0), 0)
          return (
            <Card key={ins.id} className="hover:shadow-md transition-all duration-300 cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-mono bg-[#f1f5f9] text-[#475569] px-1.5 py-0.5 rounded font-semibold shrink-0">{ins.id}</span>
                      <p className="text-sm font-semibold text-[#0f172a] truncate">{ins.name}</p>
                    </div>
                    <p className="text-xs text-[#94a3b8]">{ins.branch}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#475569]">{claims.length} claims</span>
                  <span className="font-semibold text-[#0f172a]">฿{formatCurrency(revenue)}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อบริษัท</TableHead>
                <TableHead>สาขา</TableHead>
                <TableHead>เลขผู้เสียภาษี</TableHead>
                <TableHead>ผู้ติดต่อ</TableHead>
                <TableHead>PEAK ID</TableHead>
                <TableHead className="text-center">จำนวน Claim</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-[#94a3b8]">กำลังโหลดข้อมูล...</TableCell></TableRow>
              ) : filtered.map(ins => {
                const claimCount = ins.claims?.length || 0
                return (
                  <TableRow key={ins.id}>
                    <TableCell className="font-mono text-xs font-semibold text-[#475569]">{ins.id}</TableCell>
                    <TableCell className="font-semibold">{ins.name}</TableCell>
                    <TableCell>{ins.branch}</TableCell>
                    <TableCell className="font-mono text-xs">{ins.taxId}</TableCell>
                    <TableCell>{ins.contactPerson}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{ins.peakCustomerId}</Badge></TableCell>
                    <TableCell className="text-center font-semibold">{claimCount}</TableCell>
                    <TableCell className="text-center">
                      <Link href={`/insurances/${ins.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button></Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
