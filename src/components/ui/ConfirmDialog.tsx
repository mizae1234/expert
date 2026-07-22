"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, HelpCircle } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: React.ReactNode
  onConfirm: (inputValue?: string) => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary' | 'warning'
  showInput?: boolean
  inputPlaceholder?: string
  inputRequired?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  variant = "primary",
  showInput = false,
  inputPlaceholder = "ระบุเหตุผล...",
  inputRequired = false
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("")

  // Reset input when dialog state changes
  useEffect(() => {
    if (isOpen) {
      setInputValue("")
    }
  }, [isOpen])

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertTriangle className="h-6 w-6 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-amber-500" />
      default:
        return <HelpCircle className="h-6 w-6 text-[#1d4ed8]" />
    }
  }

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white font-bold"
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 text-white font-bold"
      default:
        return "bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold"
    }
  }

  const handleConfirm = () => {
    if (showInput && inputRequired && !inputValue.trim()) {
      return
    }
    onConfirm(inputValue)
  }

  const isConfirmDisabled = showInput && inputRequired && !inputValue.trim()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-row items-center gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <DialogTitle className="text-base font-bold text-[#0f172a]">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <DialogDescription className="text-sm text-gray-500">{description}</DialogDescription>
          {showInput && (
            <div className="space-y-1 pt-1">
              <Input
                type="text"
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-white border-gray-200"
                autoFocus
              />
              {inputRequired && !inputValue.trim() && (
                <p className="text-[10px] text-red-500">* จำเป็นต้องระบุเหตุผล</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onCancel} className="font-semibold">
            {cancelText}
          </Button>
          <Button 
            onClick={handleConfirm} 
            className={getConfirmButtonClass()}
            disabled={isConfirmDisabled}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
