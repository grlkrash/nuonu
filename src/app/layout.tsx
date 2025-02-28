import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { SessionRecovery } from '@/components/blockchain/session-recovery'
import { SessionMonitor } from '@/components/blockchain/session-monitor'
import { ZkSyncAuthManager } from '@/components/blockchain/zksync-auth-manager'
import { ZkSyncDebug } from '@/components/blockchain/zksync-debug'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nuonu',
  description: 'Nuonu - AI-powered content creation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Only show debug component in development
  const isDev = process.env.NODE_ENV === 'development'
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div id="nprogress-container" />
          <SessionRecovery />
          <SessionMonitor />
          <ZkSyncAuthManager />
          <main>{children}</main>
          <Toaster />
          {isDev && <ZkSyncDebug />}
        </ThemeProvider>
      </body>
    </html>
  )
} 