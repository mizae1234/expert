import React from 'react'
import { cn } from '@/lib/utils'

// Base skeleton block
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        'skeleton-shimmer rounded-md',
        className
      )}
      style={style}
    />
  )
}

// Skeleton for a table row with configurable column count
export function SkeletonTableRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-[#f1f5f9]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 ${i === 0 ? 'w-28' : i === cols - 1 ? 'w-16 mx-auto' : 'w-full'}`} />
        </td>
      ))}
    </tr>
  )
}

// Skeleton for multiple table rows
export function SkeletonTableRows({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </>
  )
}

// Skeleton KPI card
export function SkeletonKPICard() {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-20 mt-2" />
          <Skeleton className="h-3 w-32 mt-2" />
        </div>
        <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      </div>
    </div>
  )
}

// Skeleton for a simple status pill / filter badge
export function SkeletonStatusPill() {
  return (
    <div className="p-2.5 rounded-xl border border-gray-200 bg-white text-center space-y-1.5">
      <Skeleton className="h-6 w-8 mx-auto" />
      <Skeleton className="h-2.5 w-14 mx-auto" />
    </div>
  )
}

// Skeleton bar chart row (for dashboard byStatus)
export function SkeletonBarRow() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-3.5 w-28 flex-shrink-0" />
      <Skeleton className="flex-1 h-7 rounded-full" />
    </div>
  )
}

// Skeleton revenue/insurance item
export function SkeletonRevenueRow() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-2.5 w-full rounded-full" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

// Skeleton for a card with icon (insurance summary card)
export function SkeletonSummaryCard() {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    </div>
  )
}
