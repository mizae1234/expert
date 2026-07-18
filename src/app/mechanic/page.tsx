"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Wrench, ClipboardList, LogOut, CheckCircle2, 
  Hourglass, ArrowRight, User, Search
} from 'lucide-react'
import { formatDateShort } from '@/lib/utils'

export default function MechanicDashboardPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchUserAndJobs = async () => {
    try {
      // 1. Fetch current user
      const userRes = await fetch('/api/auth/me')
      const userData = await userRes.json()
      if (userData.user) {
        setUser(userData.user)
      } else {
        router.push('/login')
        return
      }

      // 2. Fetch jobs
      const jobsRes = await fetch('/api/service-orders')
      const jobsData = await jobsRes.json()
      if (Array.isArray(jobsData)) {
        setJobs(jobsData)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserAndJobs()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (err) {
      console.error(err)
    }
  }

  // Filter jobs based on active tab and search query
  const filteredJobs = jobs.filter(job => {
    // If there is a search query, search globally across all jobs
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesOrderNo = job.orderNo?.toLowerCase().includes(q)
      const matchesCustomer = job.customer?.name?.toLowerCase().includes(q)
      const matchesVehicle = job.vehicles?.some((v: any) => 
        v.carPlate?.toLowerCase().includes(q) ||
        v.carVin?.toLowerCase().includes(q) ||
        v.carBrand?.toLowerCase().includes(q) ||
        v.carModel?.toLowerCase().includes(q)
      )
      return matchesOrderNo || matchesCustomer || matchesVehicle
    }

    // Otherwise, filter by active tab
    const matchesTab = activeTab === 'pending'
      ? (job.status === 'PENDING' || job.status === 'IN_PROGRESS')
      : (job.status === 'COMPLETED')

    return matchesTab
  })

  return (
    <div className="min-h-screen bg-[#f8faff] pb-28">
      {/* Mobile Top Navbar */}
      <header className="bg-gradient-to-r from-[#1d4ed8] to-[#1e3a8a] text-white px-4 py-4 relative shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 p-2 rounded-xl">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wide">EXPERT MOBILE</h1>
              <p className="text-[10px] text-blue-200">แผงควบคุมการดำเนินงานช่าง</p>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="text-white hover:bg-white/10 h-9 w-9 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* User Card */}
        {user && (
          <div className="mt-3 flex items-center gap-2.5 bg-white/10 p-2.5 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-blue-100/20 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold leading-tight">{user.name}</p>
              <p className="text-[9px] text-blue-200 uppercase tracking-wider mt-0.5">ช่างซ่อมตัวถังและสี</p>
            </div>
          </div>
        )}

        {/* Search Bar inside Header */}
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหาด้วย เลขตัวถัง (VIN) / ทะเบียน / ลูกค้า..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border-none bg-white/10 text-white placeholder-blue-100/60 text-xs focus:outline-none focus:ring-2 focus:ring-white/20 shadow-inner"
          />
          <Search className="w-3.5 h-3.5 text-blue-100/60 absolute left-3 top-3.5" />
        </div>
      </header>


      {/* Jobs list */}
      <div className="px-4 py-2 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-xs text-gray-400">กำลังโหลดรายการงาน...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed rounded-2xl p-6">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-500">ไม่มีรายการใบงานในหมวดนี้</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const completedVehicles = job.vehicles?.filter((v: any) => v.status === 'COMPLETED').length || 0
            const totalVehicles = job.vehicles?.length || 0

            return (
              <Card 
                key={job.id} 
                className="border-gray-100 hover:border-blue-200 transition-all rounded-2xl overflow-hidden shadow-sm active:scale-[0.99] cursor-pointer"
                onClick={() => router.push(`/mechanic/jobs/${job.id}`)}
              >
                <CardHeader className="bg-white border-b border-gray-50 p-4 pb-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-[#1d4ed8]">{job.orderNo}</span>
                    <Badge className={
                      job.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-none' :
                      job.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-none' :
                      'bg-gray-50 text-gray-500 border-none'
                    }>
                      {job.status === 'COMPLETED' ? 'เสร็จสิ้น' :
                       job.status === 'IN_PROGRESS' ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-3">
                  <div className="text-left">
                    <span className="text-[10px] text-gray-400 block font-semibold uppercase">ชื่อลูกค้า/ผู้สั่งงาน</span>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">{job.customer.name}</p>
                  </div>

                  <div className="flex justify-between text-[11px] text-gray-500 bg-gray-50/50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[9px] text-gray-400 block">วันที่สั่งงาน</span>
                      <span className="font-semibold text-gray-700">{formatDateShort(job.createdAt)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 block">จำนวนรถยนต์</span>
                      <span className="font-bold text-gray-800">{completedVehicles}/{totalVehicles} คันเสร็จ</span>
                    </div>
                  </div>

                  {/* Vehicles plate overview */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-bold block">ทะเบียนรถยนต์ในงาน:</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {job.vehicles?.map((v: any) => (
                        <span 
                          key={v.id} 
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            v.status === 'COMPLETED' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : v.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-600 border-red-200 line-through opacity-60'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {v.carPlate}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <span className="text-[11px] font-bold text-[#1d4ed8] flex items-center gap-1">
                      เข้าทำงาน / ดูข้อมูลรถ
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around py-2.5 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all active:scale-95 ${
            activeTab === 'pending' ? 'text-[#1d4ed8]' : 'text-gray-400'
          }`}
        >
          <Hourglass className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">งานรอทำ ({jobs.filter(j => j.status === 'PENDING' || j.status === 'IN_PROGRESS').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all active:scale-95 ${
            activeTab === 'completed' ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          <CheckCircle2 className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">งานเสร็จแล้ว ({jobs.filter(j => j.status === 'COMPLETED').length})</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 flex-1 py-1 text-red-500 transition-all active:scale-95"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">ออกจากระบบ</span>
        </button>
      </div>
    </div>
  )
}
