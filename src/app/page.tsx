'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, Send, Clock, CheckCircle, AlertCircle, FileEdit, Trash2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Campaign } from '@/types'

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'bg-muted text-muted-foreground',  icon: FileEdit },
  scheduled: { label: 'Scheduled', color: 'bg-yellow-100 text-yellow-800',   icon: Clock },
  sending:   { label: 'Sending',   color: 'bg-blue-100 text-blue-800',       icon: Send },
  sent:      { label: 'Sent',      color: 'bg-green-100 text-green-800',     icon: CheckCircle },
  failed:    { label: 'Failed',    color: 'bg-red-100 text-red-800',         icon: AlertCircle },
}

export default function CampaignsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<Record<string, { opens: number; clicks: number }>>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/campaigns')
    const data = await res.json()
    setCampaigns(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function del(id: string) {
    const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); setCampaigns(c => c.filter(x => x.id !== id)) }
    else toast.error('Failed to delete')
  }

  const sent = campaigns.filter(c => c.status === 'sent').length
  const drafted = campaigns.filter(c => c.status === 'draft').length
  const totalSent = campaigns.reduce((a, c) => a + (c.total_sent ?? 0), 0)

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {campaigns.length} total · {sent} sent · {totalSent} emails delivered
          </p>
        </div>
        <Link href="/campaigns/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-1.5" /> New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-12 text-center">Loading…</div>
      ) : campaigns.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 text-center space-y-3">
          <Send className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground font-medium">No campaigns yet</p>
          <Link href="/campaigns/new" className={buttonVariants({ size: 'sm' })}>
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Campaign</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Sent</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Opens</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Clicks</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => {
                const cfg = STATUS_CONFIG[c.status]
                const Icon = cfg.icon
                return (
                  <tr key={c.id} className={cn('border-b last:border-0 hover:bg-muted/20 transition-colors', i % 2 === 0 ? '' : 'bg-muted/5')}>
                    <td className="px-4 py-3">
                      <Link href={`/campaigns/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{c.subject}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full', cfg.color)}>
                        <Icon className="h-3 w-3" /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.total_sent ?? 0}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {c.sent_at ? new Date(c.sent_at).toLocaleDateString() : c.scheduled_at ? `Scheduled ${new Date(c.scheduled_at).toLocaleDateString()}` : new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/campaigns/${c.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7')}>
                          <FileEdit className="h-3.5 w-3.5" />
                        </Link>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
