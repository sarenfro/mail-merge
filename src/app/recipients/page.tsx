'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Recipient } from '@/types'

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', company: '' })
  const [csvText, setCsvText] = useState('')
  const [showCsv, setShowCsv] = useState(false)

  async function load() {
    const res = await fetch('/api/recipients')
    setRecipients(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addRecipient(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email) return
    const res = await fetch('/api/recipients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Recipient added')
      setForm({ email: '', first_name: '', last_name: '', company: '' })
      load()
    } else {
      toast.error('Failed to add recipient')
    }
  }

  async function deleteRecipient(id: string) {
    const res = await fetch(`/api/recipients?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Deleted')
      setRecipients(r => r.filter(x => x.id !== id))
    }
  }

  async function importCsv() {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',')
      return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() ?? '']))
    })
    let ok = 0
    for (const row of rows) {
      if (!row.email) continue
      const res = await fetch('/api/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      })
      if (res.ok) ok++
    }
    toast.success(`Imported ${ok} recipients`)
    setCsvText('')
    setShowCsv(false)
    load()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recipients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCsv(v => !v)}>
          <Upload className="h-4 w-4 mr-1" /> Import CSV
        </Button>
      </div>

      {showCsv && (
        <Card className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste CSV with headers: <code>email, first_name, last_name, company</code>
          </p>
          <textarea
            className="w-full font-mono text-xs border rounded p-2 h-32 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="email,first_name,last_name,company&#10;jane@example.com,Jane,Doe,Acme"
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
          />
          <Button size="sm" onClick={importCsv} disabled={!csvText.trim()}>
            Import
          </Button>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-4">Add recipient</h2>
        <form onSubmit={addRecipient} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={form.company}
              onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            />
          </div>
          <div className="col-span-2">
            <Button type="submit">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : recipients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recipients yet.</p>
        ) : (
          recipients.map(r => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-md border px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium">
                  {[r.first_name, r.last_name].filter(Boolean).join(' ') || r.email}
                </div>
                <div className="text-xs text-muted-foreground">{r.email}</div>
              </div>
              <div className="flex items-center gap-3">
                {r.company && (
                  <Badge variant="secondary" className="text-xs">{r.company}</Badge>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => deleteRecipient(r.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
