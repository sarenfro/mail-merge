'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Template } from '@/types'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Pick<Template, 'id' | 'name' | 'subject' | 'updated_at'>[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/templates')
    setTemplates(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function del(id: string) {
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Template deleted')
      setTemplates(t => t.filter(x => x.id !== id))
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Link href="/templates/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-1" /> New template
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : templates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground mb-4">No templates yet.</p>
          <Link href="/templates/new" className={buttonVariants({ size: 'sm' })}>
            Create your first template
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(t => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-md border px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.subject}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(t.updated_at).toLocaleDateString()}
                </span>
                <Link
                  href={`/templates/${t.id}`}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => del(t.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
