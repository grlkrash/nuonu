'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'
import { ZkSyncWalletConnect } from './zksync-wallet-connect'

interface WalletModalProps {
  trigger?: React.ReactNode
}

export function WalletModal({ trigger }: WalletModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span>Wallet</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-black border border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Connect Wallet</DialogTitle>
          <DialogDescription className="text-gray-400">
            Connect your zkSync wallet to access exclusive features.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ZkSyncWalletConnect />
        </div>
      </DialogContent>
    </Dialog>
  )
} 