"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Shield,
  Package,
  CreditCard,
  Receipt,
  Settings,
  Cloud,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: number
  badgeColor?: string // 'red' | 'blue' (default blue)
}

interface NavGroup {
  label: string
  items: NavItem[]
}

import React, { useState, useEffect } from 'react'

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [stats, setStats] = useState({ claims: 0, invoices: 0, payments: 0 })
  const [role, setRole] = useState<string>('STAFF')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setRole(data.user.role)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStats({
            claims: data.claims || 0,
            invoices: data.invoices || 0,
            payments: data.payments || 0
          })
        }
      })
      .catch(console.error)
  }, [])

  const currentNavGroups: NavGroup[] = [
    {
      label: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        { name: 'Claims', href: '/claims', icon: FileText, badge: stats.claims },
        { name: 'Invoices', href: '/invoices', icon: Receipt, badge: stats.invoices, badgeColor: 'red' },
        { name: 'Payments', href: '/payments', icon: CreditCard, badge: stats.payments },
      ],
    },
    {
      label: 'ACCOUNTING',
      items: [
        { name: 'PEAK Sync', href: '/peak', icon: Cloud },
      ],
    },
    {
      label: 'MASTER DATA',
      items: [
        { name: 'Insurances', href: '/insurances', icon: Building2 },
        { name: 'Vendors', href: '/vendors', icon: Users },
        { name: 'Parts Master', href: '/parts-master', icon: Package },
      ],
    },
    {
      label: 'REPORTS',
      items: [
        { name: 'Reports', href: '/reports', icon: BarChart3 },
      ],
    },
    {
      label: 'SETTINGS',
      items: [
        { name: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ]

  const filteredNavGroups = currentNavGroups.map((group) => {
    const items = group.items.filter((item) => {
      if (role === 'STAFF') {
        return !['/invoices', '/payments', '/peak', '/reports', '/settings'].includes(item.href)
      }
      if (role === 'ACCOUNTANT') {
        return !['/claims', '/settings'].includes(item.href)
      }
      return true
    })
    return { ...group, items }
  }).filter((group) => group.items.length > 0)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-[#1d4ed8] to-[#1e3a8a] text-white transition-all duration-300 flex flex-col",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-base font-bold tracking-tight">EXPERT BODY &amp; PAINT</h1>
            <p className="text-[10px] text-blue-200 font-medium">Management System</p>
          </div>
        )}
      </div>

      {/* Navigation — Grouped */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {filteredNavGroups.map((group) => (
          <div key={group.label}>
            {/* Group label */}
            {!collapsed && (
              <div className="px-3 pt-4 pb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[1px] text-white/40">
                  {group.label}
                </span>
              </div>
            )}
            {collapsed && <div className="pt-3 pb-1 border-t border-white/10 mt-2 first:mt-0 first:border-t-0 first:pt-2" />}

            {/* Group items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-blue-100 hover:bg-white/[0.08] hover:text-white"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-blue-200 group-hover:text-white")} />
                    {!collapsed && (
                      <span className="animate-fade-in flex-1">{item.name}</span>
                    )}
                    {!collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full animate-fade-in",
                        item.badgeColor === 'red'
                          ? "bg-red-500 text-white"
                          : "bg-white/25 text-white"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-white/10">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="ml-2 text-sm font-medium">ย่อเมนู</span>}
        </button>
      </div>
    </aside>
  )
}
