"use client"

import { usePathname } from 'next/navigation'
import { Bell, Search, User } from 'lucide-react'

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/claims': 'Claims',
  '/claims/new': 'รับ Claim ใหม่',
  '/vendors': 'Vendors',
  '/insurances': 'Insurances',
  '/reports': 'Reports',
  '/invoices': 'Invoices (AR)',
  '/settings': 'ตั้งค่าระบบ',
}

export default function Topbar() {
  const pathname = usePathname()

  const getBreadcrumbs = () => {
    if (!pathname) return ['Dashboard']
    const parts = pathname.split('/').filter(Boolean)
    const crumbs: string[] = []

    let path = ''
    for (const part of parts) {
      path += `/${part}`
      if (breadcrumbMap[path]) {
        crumbs.push(breadcrumbMap[path])
      } else if (part.startsWith('claim-') || part.length > 10) {
        crumbs.push('รายละเอียด')
      }
    }

    return crumbs.length > 0 ? crumbs : ['Dashboard']
  }

  const crumbs = getBreadcrumbs()

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-gray-300">/</span>}
            <span className={i === crumbs.length - 1 ? "text-[#0f172a] font-semibold" : "text-[#94a3b8]"}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหา Claim..."
            className="w-64 h-9 pl-9 pr-4 rounded-lg border border-gray-200 bg-[#f8faff] text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 ml-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-[#0f172a]">Admin</p>
            <p className="text-[11px] text-[#94a3b8]">ผู้ดูแลระบบ</p>
          </div>
        </div>
      </div>
    </header>
  )
}
