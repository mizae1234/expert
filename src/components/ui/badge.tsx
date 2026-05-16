import * as React from "react"
import { cn } from "@/lib/utils"

function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }) {
  const variants: Record<string, string> = {
    default: 'bg-[#1d4ed8] text-white',
    secondary: 'bg-[#eff6ff] text-[#1d4ed8]',
    destructive: 'bg-red-100 text-red-700',
    outline: 'border border-gray-300 text-gray-700',
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
