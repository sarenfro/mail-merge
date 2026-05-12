'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { read, utils } from 'xlsx'
import { ArrowLeft, Upload, Plus, Trash2, FileSpreadsheet, X } from 'lucide-react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Contact, ContactList } from '@/types'

const ALIASES: Record<string, string> = {
  email: 'email', 'e-mail': 'email', 'email address': 'email',
  first_name: 'first_name', firstname: 'first_name', 'first name': 'first_name', 'given name': 'first_name',
  last_name: 'last_name', lastname: 'last_name', 'last name': 'last_name', surname: 'last_name',
  company: 'company', organization: 'company', organisation: 'company', employer: 'company',
}

export default function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>()
  const [list, setList] = useState<ContactList | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', company: '' })
  const [preview, setPreview] = useState<{ rows: Record<string, string>[]; fileName: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const [listRes, contactsRes] = await Promise.all([
      fetch('/api/contacts/lists').then(r => r.json()),
      fetch(`/api/contacts/lists/${listId}/contacts`).then(r => r.json()),
    ])
    const found = Array.isArray(listRes) ? listRes.find((l: ContactList) => l.id === listId) : null
    setList(found ?? null)
    setContacts(Array.isArray(contactsRes) ? contactsRes : [])
  }

  useEffect(() => { load() }, [listId])

  async function addContact(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email) return
    const res = await fetch(`/api/contacts/lists/${listId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { toast.success('Added'); setForm({ email: '', first_name: '', last_name: '', company: '' }); load() }
    else toast.error('Failed to add (email may already exist in list)')
  }

  async function del(id: string) {
    const res = await fetch(`/api/contacts/lists/${listId}/contacts?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Removed'); setContacts(c => c.filter(x => x.id !== id)) }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const buf = await file.arrayBuffer()
    const wb = read(buf)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
    const rows = raw.map(r =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [ALIASES[k.trim().toLowerCase()] ?? k.trim().toLowerCase(), String(v)]))
    )
    setPreview({ rows, fileName: file.name })
    e.target.value = ''
  }

  async function confirmImport() {
    if (!preview) return
    setImporting(true)
    const res = await fetch(`/api/contacts/lists/${listId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preview.rows.filter(r => r.email)),
    })
    setImporting(false)
    if (res.ok) {
      const data = await res.json()
      toast.success(`Imported ${data.length} contacts`)
      setPreview(null)
      load()
    } else toast.error('Import failed')
  }

  const previewCols = preview ? Array.from(new Set(preview.rows.flatMap(r => Object.keys(r)))).slice(0, 5) : []

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/contacts" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{list?.name ?? 'Loading…'}</h1>
          <p className="text-sm text-muted-foreground">{contacts.length} contacts</p>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Upload XLSX / CSV
        </Button>
      </div>

      {/* Upload preview */}
      {preview && (
        <div className="border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Upload className="h-4 w-4 text-muted-foreground" />
              {preview.fileName}
              <Badge variant="secondary">{preview.rows.length} rows</Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreview(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-x-auto rounded border text-xs">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>{previewCols.map(c => <th key={c} className="px-3 py-2 text-left font-medium text-muted-foreground">{c}</th>)}</tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 4).map((row, i) => (
                  <tr key={i} className="border-t">
                    {previewCols.map(c => <td key={c} className="px-3 py-2 truncate max-w-[120px]">{row[c] ?? ''}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 4 && <p className="px-3 py-2 text-muted-foreground border-t">…and {preview.rows.length - 4} more rows</p>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={confirmImport} disabled={importing}>
              {importing ? 'Importing…' : `Import ${preview.rows.filter(r => r.email).length} contacts`}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPreview(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Add manually */}
      <form onSubmit={addContact} className="grid grid-cols-4 gap-3 items-end">
        <div>
          <Label>Email *</Label>
          <Input type="email" required placeholder="jane@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <Label>First name</Label>
          <Input placeholder="Jane" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
        </div>
        <div>
          <Label>Last name</Label>
          <Input placeholder="Doe" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label>Company</Label>
            <Input placeholder="Acme" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          </div>
          <Button type="submit" className="self-end"><Plus className="h-4 w-4" /></Button>
        </div>
      </form>

      {/* Contact list */}
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No contacts yet. Add one above or upload a spreadsheet.</p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Company</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} className="border-t hover:bg-muted/10">
                  <td className="px-4 py-2.5">{c.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.company || '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
