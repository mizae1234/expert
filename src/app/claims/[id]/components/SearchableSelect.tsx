"use client"

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  className
}: {
  options: SearchableSelectOption[]
  value: string
  onChange: (val: string) => void
  placeholder: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.value === value)

  const filtered = options.filter(o => {
    const s = search.toLowerCase()
    return o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s)
  })

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open)
          setSearch('')
        }}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left mt-1"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="text-gray-400 text-xs ml-2">▼</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 text-slate-900 shadow-md outline-none">
          <div className="p-1">
            <input
              type="text"
              placeholder="ค้นหา..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mb-1"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-gray-500 outline-none">
                ไม่พบผลลัพธ์
              </div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 text-left",
                    opt.value === value && "bg-slate-100 font-medium"
                  )}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
