"use client"

import { usePathname, useRouter } from 'next/navigation'
import { Bell, Search, User as UserIcon, LogOut, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

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
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; role: string; username: string } | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'ผู้ดูแลระบบ'
      case 'ACCOUNTANT': return 'ฝ่ายบัญชี'
      case 'STAFF': return 'เจ้าหน้าที่ทั่วไป'
      default: return 'ผู้ใช้ทั่วไป'
    }
  }

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

        {/* User Dropdown */}
        <div className="relative ml-2" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-left hover:bg-slate-50 p-1.5 rounded-xl transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] flex items-center justify-center shadow-inner">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-[#0f172a] leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-[11px] text-[#94a3b8]">{getRoleLabel(user?.role)}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block ml-1" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-50 sm:hidden">
                <p className="text-sm font-medium text-[#0f172a]">{user?.name || 'Admin'}</p>
                <p className="text-xs text-[#94a3b8]">{getRoleLabel(user?.role)}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

