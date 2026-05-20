"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Clock, DollarSign, TrendingUp, ArrowUpRight, ArrowRight } from 'lucide-react'
import { formatCurrency, getStatusColor, getStatusLabel, formatDate } from '@/lib/utils'
import { DashboardSummary, ClaimsByStatus, RevenueByInsurance } from '@/lib/types'
import { Skeleton, SkeletonKPICard, SkeletonBarRow, SkeletonRevenueRow, SkeletonTableRows } from '@/components/ui/skeleton'
import Link from 'next/link'

const COLORS = ['#1d4ed8', '#3b82f6', '#60a5fa', '#93bbfd', '#bfdbfe', '#dbeafe', '#2563eb', '#1e40af']

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [byStatus, setByStatus] = useState<ClaimsByStatus[]>([])
  const [byInsurance, setByInsurance] = useState<RevenueByInsurance[]>([])
  const [recentClaims, setRecentClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(res => res.json()).then(data => {
      setSummary(data.summary)
      setByStatus(data.byStatus)
      setByInsurance(data.byInsurance)
      setRecentClaims(data.recentClaims)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* KPI skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)}
      </div>
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonBarRow key={i} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRevenueRow key={i} />)}
          </CardContent>
        </Card>
      </div>
      {/* Table skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f1f5f9]">
                {['Claim No.', 'ทะเบียน', 'บ.ประกัน', 'อู่', 'วันที่', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-[#94a3b8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRows rows={5} cols={6} />
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )

  const kpis = [
    { label: 'Claim ทั้งหมด', value: summary!.totalClaims, icon: FileText, color: 'from-blue-500 to-blue-600', change: '+12%' },
    { label: 'รอดำเนินการ', value: summary!.pendingClaims, icon: Clock, color: 'from-amber-500 to-orange-500', change: '-3%' },
    { label: 'รายได้รวม', value: `฿${formatCurrency(summary!.totalRevenue)}`, icon: DollarSign, color: 'from-emerald-500 to-green-600', change: '+8%' },
    { label: 'Margin เฉลี่ย', value: `${summary!.avgMargin.toFixed(1)}%`, icon: TrendingUp, color: 'from-violet-500 to-purple-600', change: '+2%' },
  ]

  const maxStatusCount = Math.max(...byStatus.map(s => s.count), 1)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Dashboard</h1>
          <p className="text-sm text-[#94a3b8] mt-1">ภาพรวมระบบจัดการ Claim</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#475569] font-medium">{kpi.label}</p>
                  <p className="text-2xl font-bold text-[#0f172a] mt-2">{kpi.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600">{kpi.change}</span>
                    <span className="text-xs text-[#94a3b8] ml-1">vs เดือนก่อน</span>
                  </div>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims by Status */}
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Claims by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byStatus.map((item) => {
                const { bg, text } = getStatusColor(item.status)
                const pct = (item.count / maxStatusCount) * 100
                return (
                  <div key={item.status} className="flex items-center gap-3">
                    <div className="w-28 text-xs font-medium text-[#475569] truncate">
                      {getStatusLabel(item.status)}
                    </div>
                    <div className="flex-1 h-7 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bg} rounded-full flex items-center justify-end pr-2 transition-all duration-700`}
                        style={{ width: `${Math.max(pct, 12)}%` }}
                      >
                        <span className={`text-[10px] font-bold ${text}`}>{item.count}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Insurance */}
        <Card className="hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">รายได้ตามบ.ประกัน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {byInsurance.map((item, i) => {
                const maxRev = Math.max(...byInsurance.map(b => b.totalRevenue), 1)
                const pct = (item.totalRevenue / maxRev) * 100
                return (
                  <div key={item.insuranceId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#0f172a] truncate">{item.insuranceName}</span>
                      <span className="text-[#475569] font-semibold">฿{formatCurrency(item.totalRevenue)}</span>
                    </div>
                    <div className="h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(pct, 5)}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-[#94a3b8]">{item.claimCount} claims</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Claims Table */}
      <Card className="hover:shadow-md transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Claims ล่าสุด</CardTitle>
          <Link href="/claims" className="flex items-center gap-1 text-sm text-[#1d4ed8] hover:text-[#1e40af] font-medium transition-colors">
            ดูทั้งหมด <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim No.</TableHead>
                <TableHead>ทะเบียน</TableHead>
                <TableHead>บ.ประกัน</TableHead>
                <TableHead>อู่</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentClaims.map((claim) => {
                const { bg, text } = getStatusColor(claim.status)
                return (
                  <TableRow key={claim.id}>
                    <TableCell>
                      <Link href={`/claims/${claim.id}`} className="text-[#1d4ed8] hover:underline font-medium">
                        {claim.claimNo}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{claim.carPlate}</TableCell>
                    <TableCell className="text-[#475569]">{claim.insurance?.name}</TableCell>
                    <TableCell className="text-[#475569]">{claim.garage?.name}</TableCell>
                    <TableCell className="text-[#475569] text-sm">
                      {formatDate(claim.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${bg} ${text}`}>
                        {getStatusLabel(claim.status)}
                      </span>
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
