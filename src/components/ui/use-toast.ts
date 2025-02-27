// Simplified version of the toast hook
import { useState, useEffect } from 'react'

type ToastProps = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

type ToastState = {
  open: boolean
  data: ToastProps | null
}

export function useToast() {
  const [state, setState] = useState<ToastState>({
    open: false,
    data: null,
  })

  const toast = (props: ToastProps) => {
    setState({
      open: true,
      data: props,
    })

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setState((prev) => ({ ...prev, open: false }))
    }, 5000)
  }

  const dismiss = () => {
    setState((prev) => ({ ...prev, open: false }))
  }

  return {
    toast,
    dismiss,
    ...state,
  }
} 