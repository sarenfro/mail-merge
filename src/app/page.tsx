import { supabase } from '@/lib/supabase'
import { FileText, Users, Send } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { SendLog } from '@/types'

async function getStats() {
  const [{ count: recipientCount }, { count: templateCount }, { data: logs }] = await Promise.all([
    supabase.from('recipients').select('*', { count: 'exact', head: true }),
    supabase.from('templates').select('*', { count: 'exact', head: true }),
    supabase.from('send_logs').select('*').order('sent_at', { ascending: false }).limit(5),
  ])
  return {
    recipientCount: recipientCount ?? 0,
    templateCount: templateCount ?? 0,
    logs: (logs ?? []) as SendLog[],
  }
}

export default async function Dashboard() {
  const { recipientCount, templateCount, logs } = await getStats()

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your mail merge campaigns</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <Users className="h-8 w-8 text-muted-foreground" />
          <div>
            <div className="text-2xl font-bold">{recipientCount}</div>
            <div className="text-xs text-muted-foreground">Recipients</div>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <div>
            <div className="text-2xl font-bold">{templateCount}</div>
            <div className="text-xs text-muted-foreground">Templates</div>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <Send className="h-8 w-8 text-muted-foreground" />
          <div>
            <div className="text-2xl font-bold">
              {logs.length ? logs[0].recipient_count : 0}
            </div>
            <div className="text-xs text-muted-foreground">Last send</div>
          </div>
        </Card>
      </div>

      <div className="flex gap-3">
        <Link href="/templates/new" className={buttonVariants()}>New template</Link>
        <Link href="/send" className={buttonVariants({ variant: 'outline' })}>Send campaign</Link>
      </div>

      {logs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
            Recent sends
          </h2>
          <div className="space-y-2">
            {logs.map(log => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-md border px-4 py-3 text-sm"
              >
                <span className="font-medium">{log.template_name}</span>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{log.recipient_count} recipients</span>
                  <span className="capitalize">{log.status}</span>
                  <span>{new Date(log.sent_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
