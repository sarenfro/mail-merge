'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, Users, Trash2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ContactList } from '@/types'

export default function ContactsPage() {
  const [lists, setLists] = useState<ContactList[]>([])
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const res = await fetch('/api/contacts/lists')
    setLists(await res.json())
  }

  useEffect(() => { load() }, [])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    const res = await fetch('/api/contacts/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setCreating(false)
    if (res.ok) { toast.success('List created'); setNewName(''); setShowForm(false); load() }
    else toast.error('Failed to create')
  }

  async function del(id: string, e: React.MouseEvent) {
    e.preventDefault()
    const res = await fetch(`/api/contacts/lists?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); setLists(l => l.filter(x => x.id !== id)) }
    else toast.error('Failed to delete')
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{lists.length} list{lists.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)}>
          <Plus className="h-4 w-4 mr-1.5" /> New List
        </Button>
      </div>

      {showForm && (
        <form onSubmit={create} className="flex gap-2">
          <Input
            autoFocus
            placeholder="List name, e.g. All Subscribers"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <Button type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create'}</Button>
          <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
        </form>
      )}

      {lists.length === 0 ? (
        <div className="border border-dashed rounded-xl py-16 text-center space-y-3">
          <Users className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground font-medium">No contact lists yet</p>
          <Button size="sm" onClick={() => setShowForm(true)}>Create your first list</Button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden divide-y">
          {lists.map(l => (
            <Link
              key={l.id}
              href={`/contacts/${l.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.contact_count ?? 0} contacts</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100"
                  onClick={e => del(l.id, e)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
