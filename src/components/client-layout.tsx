"use client"

import Sidebar from "@/components/sidebar"
import Topbar from "@/components/topbar"
import { ToastProvider } from "@/components/toast-provider"
import { usePathname } from "next/navigation"

import { useState } from "react"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Full-screen pages (no sidebar)
  if (pathname === '/' || pathname === '/login' || (pathname && (pathname.includes('/pdf') || pathname.includes('/print-')))) {
    return <ToastProvider>{children}</ToastProvider>
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#f8faff]">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'}`}>
          <Topbar />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
