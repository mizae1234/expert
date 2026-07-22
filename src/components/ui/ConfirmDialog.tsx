"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, HelpCircle } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary' | 'warning'
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  variant = "primary"
}: ConfirmDialogProps) {
  
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-row items-center gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <DialogTitle className="text-base font-bold text-[#0f172a]">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <DialogDescription className="text-sm text-gray-500">{description}</DialogDescription>
        </div>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onCancel} className="font-semibold">
            {cancelText}
          </Button>
          <Button onClick={onConfirm} className={getConfirmButtonClass()}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
