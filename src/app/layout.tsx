import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({ variable: '--font-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MailMerge',
  description: 'GMass-style mail merge with tracking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex h-full bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
