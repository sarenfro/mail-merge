'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Send, Users, LayoutDashboard, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'Campaigns', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-52 shrink-0 border-r bg-muted/20 flex flex-col min-h-screen">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b">
        <div className="bg-primary rounded-md p-1.5">
          <Send className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-sm tracking-tight">MailMerge</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href || (href !== '/' && pathname.startsWith(href))
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
