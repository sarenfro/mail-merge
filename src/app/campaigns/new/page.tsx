'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Send, Save, Eye, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { mergePlaceholders } from '@/lib/merge'
import type { ContactList } from '@/types'

export default function NewCampaignPage() {
  const router = useRouter()
  const [lists, setLists] = useState<ContactList[]>([])
  const [form, setForm] = useState({
    name: '', subject: '', from_name: '', from_email: '',
    list_id: '', html_content: '<p>Hi {{first_name}},</p><p></p>',
  })
  const [scheduledAt, setScheduledAt] = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch('/api/contacts/lists').then(r => r.json()).then(d => setLists(Array.isArray(d) ? d : []))
  }, [])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function saveDraft() {
    if (!form.name || !form.subject) { toast.error('Name and subject are required'); return }
    setSaving(true)
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      toast.success('Draft saved')
      router.push(`/campaigns/${data.id}`)
    } else toast.error('Failed to save')
  }

  async function send() {
    if (!form.name || !form.subject || !form.from_email || !form.list_id) {
      toast.error('Fill in all required fields and select a contact list'); return
    }
    setSending(true)
    // Save first
    const saveRes = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!saveRes.ok) { toast.error('Failed to save campaign'); setSending(false); return }
    const campaign = await saveRes.json()

    const sendRes = await fetch(`/api/campaigns/${campaign.id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt: scheduledAt || undefined }),
    })
    const result = await sendRes.json()
    setSending(false)

    if (result.errors?.length) toast.warning(`Sent ${result.sent}, ${result.errors.length} failed`)
    else if (scheduledAt) toast.success(`Scheduled for ${new Date(scheduledAt).toLocaleString()}`)
    else toast.success(`Sent to ${result.sent} recipients`)

    router.push(`/campaigns/${campaign.id}`)
  }

  const previewHtml = mergePlaceholders(form.html_content, {
    first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', company: 'Acme'
  })

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Campaign</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveDraft} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> {saving ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button onClick={send} disabled={sending}>
            {showSchedule ? <Clock className="h-4 w-4 mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
            {sending ? 'Sending…' : showSchedule ? 'Schedule' : 'Send Now'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: settings */}
        <div className="space-y-4">
          <div>
            <Label>Campaign name *</Label>
            <Input placeholder="e.g. May Newsletter" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <Label>From name</Label>
            <Input placeholder="Your Name" value={form.from_name} onChange={e => set('from_name', e.target.value)} />
          </div>
          <div>
            <Label>From email *</Label>
            <Input type="email" placeholder="you@uw.edu" value={form.from_email} onChange={e => set('from_email', e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Must be verified in Brevo.</p>
          </div>
          <div>
            <Label>Contact list *</Label>
            <select
              className="w-full h-8 rounded-lg border bg-background px-2.5 text-sm"
              value={form.list_id}
              onChange={e => set('list_id', e.target.value)}
            >
              <option value="">Select a list…</option>
              {lists.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.contact_count ?? 0})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={showSchedule} onChange={e => setShowSchedule(e.target.checked)} />
              Schedule for later
            </label>
            {showSchedule && (
              <Input
                type="datetime-local"
                className="mt-2"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Right: editor */}
        <div className="col-span-2 space-y-3">
          <div>
            <Label>Subject line *</Label>
            <Input
              placeholder="e.g. Hello {{first_name}}, here's your update"
              value={form.subject}
              onChange={e => set('subject', e.target.value)}
            />
          </div>
          <Tabs defaultValue="edit">
            <TabsList>
              <TabsTrigger value="edit">Compose</TabsTrigger>
              <TabsTrigger value="preview"><Eye className="h-3.5 w-3.5 mr-1" />Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="mt-2">
              <RichTextEditor content={form.html_content} onChange={v => set('html_content', v)} />
              <p className="text-xs text-muted-foreground mt-1.5">
                Use <code>{'{{first_name}}'}</code> <code>{'{{last_name}}'}</code> <code>{'{{email}}'}</code> <code>{'{{company}}'}</code> as merge fields.
              </p>
            </TabsContent>
            <TabsContent value="preview" className="mt-2">
              <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-muted/40 border-b text-xs text-muted-foreground">
                  <span className="font-medium">Subject:</span>{' '}
                  {mergePlaceholders(form.subject, { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', company: 'Acme' })}
                </div>
                <div className="p-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
