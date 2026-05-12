'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mail, Users, FileText, Send, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/recipients', label: 'Recipients', icon: Users },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/send', label: 'Send', icon: Send },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r bg-muted/30 flex flex-col min-h-screen">
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <Mail className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm tracking-tight">Mail Merge</span>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
