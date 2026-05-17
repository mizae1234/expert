"use client"

import * as React from "react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DropdownProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Utility to format Date to BE string (e.g. 17 พ.ค. 2569)
export function formatThaiDate(date: Date | null): string {
  if (!date) return ""
  const d = new Date(date)
  const beYear = d.getFullYear() + 543
  return format(d, "d MMM", { locale: th }) + " " + beYear
}

export type ThaiDatePickerProps = {
  value?: Date | string
  onChange?: (date: string) => void // Returns ISO string YYYY-MM-DD
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ThaiDatePicker({
  value,
  onChange,
  placeholder = "เลือกวันที่",
  className,
  disabled = false
}: ThaiDatePickerProps) {
  // Parse incoming string to Date
  const parsedDate = React.useMemo(() => {
    if (!value) return undefined
    const d = new Date(value)
    return isNaN(d.getTime()) ? undefined : d
  }, [value])

  const [date, setDate] = React.useState<Date | undefined>(parsedDate)
  const [open, setOpen] = React.useState(false)

  // Sync internal state with external value
  React.useEffect(() => {
    setDate(parsedDate)
  }, [parsedDate])

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate && onChange) {
      // Convert back to YYYY-MM-DD (CE) for standard data handling
      const iso = format(selectedDate, "yyyy-MM-dd")
      onChange(iso)
    } else if (!selectedDate && onChange) {
      onChange("")
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal bg-white",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatThaiDate(date) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="single"
          selected={date}
          onSelect={handleSelect}
          locale={th}
          showOutsideDays
          className="p-3"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center border border-gray-200 rounded-md"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            ),
            day_selected:
              "bg-[#1d4ed8] text-white hover:bg-[#1e3a8a] hover:text-white focus:bg-[#1d4ed8] focus:text-white",
            day_today: "bg-slate-100 text-slate-900 font-semibold",
            day_outside: "text-slate-400 opacity-50",
            day_disabled: "text-slate-400 opacity-50",
            day_range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900",
            day_hidden: "invisible",
          }}
          components={{
            IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
            IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
          }}
          // Customize the year display to BE (+543)
          formatters={{
            formatCaption: (date, options) => {
              const y = date.getFullYear() + 543
              const m = format(date, "LLLL", { locale: th })
              return `${m} ${y}`
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
