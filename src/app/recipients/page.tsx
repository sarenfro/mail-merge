'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Plus, Upload, FileSpreadsheet, X } from 'lucide-react'
import { read, utils } from 'xlsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Recipient } from '@/types'

// Normalise common column name variations to our field names
const FIELD_ALIASES: Record<string, string> = {
  email: 'email',
  'e-mail': 'email',
  'email address': 'email',
  first_name: 'first_name',
  firstname: 'first_name',
  'first name': 'first_name',
  given_name: 'first_name',
  'given name': 'first_name',
  last_name: 'last_name',
  lastname: 'last_name',
  'last name': 'last_name',
  surname: 'last_name',
  family_name: 'last_name',
  'family name': 'last_name',
  company: 'company',
  organization: 'company',
  organisation: 'company',
  employer: 'company',
}

function normaliseHeader(h: string) {
  return FIELD_ALIASES[h.trim().toLowerCase()] ?? h.trim().toLowerCase()
}

async function importRows(rows: Record<string, string>[]) {
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
  return ok
}

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', company: '' })
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<{ rows: Record<string, string>[]; fileName: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const buf = await file.arrayBuffer()
    const wb = read(buf)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

    const rows = raw.map(r =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [normaliseHeader(String(k)), String(v)])
      )
    )

    setPreview({ rows, fileName: file.name })
    // reset so re-uploading same file works
    e.target.value = ''
  }

  async function confirmImport() {
    if (!preview) return
    setImporting(true)
    const ok = await importRows(preview.rows)
    setImporting(false)
    toast.success(`Imported ${ok} of ${preview.rows.length} rows`)
    setPreview(null)
    load()
  }

  const previewCols = preview
    ? Array.from(new Set(preview.rows.flatMap(r => Object.keys(r)))).slice(0, 6)
    : []

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recipients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFile}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Upload XLSX / CSV
          </Button>
        </div>
      </div>

      {/* File preview & confirm */}
      {preview && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{preview.fileName}</span>
              <Badge variant="secondary">{preview.rows.length} rows</Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreview(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Column mapping notice */}
          <p className="text-xs text-muted-foreground">
            Detected columns: {previewCols.join(', ')}. Columns named{' '}
            <code>email</code>, <code>first_name</code>, <code>last_name</code>, <code>company</code>{' '}
            (and common variants) map automatically. Anything else is ignored.
          </p>

          {/* Mini table preview */}
          <div className="overflow-x-auto rounded border text-xs">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {previewCols.map(c => (
                    <th key={c} className="px-3 py-2 text-left font-medium text-muted-foreground">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t">
                    {previewCols.map(c => (
                      <td key={c} className="px-3 py-2 truncate max-w-[140px]">
                        {row[c] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 5 && (
              <p className="px-3 py-2 text-muted-foreground border-t">
                …and {preview.rows.length - 5} more rows
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={confirmImport} disabled={importing}>
              {importing ? 'Importing…' : `Import ${preview.rows.length} recipients`}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPreview(null)}>
              Cancel
            </Button>
          </div>
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
