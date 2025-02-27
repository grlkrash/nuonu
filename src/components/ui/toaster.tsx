"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { open, data } = useToast()

  return (
    <ToastProvider>
      {open && data && (
        <Toast>
          <div className="grid gap-1">
            {data.title && <ToastTitle>{data.title}</ToastTitle>}
            {data.description && (
              <ToastDescription>{data.description}</ToastDescription>
            )}
          </div>
          <ToastClose />
        </Toast>
      )}
      <ToastViewport />
    </ToastProvider>
  )
} 