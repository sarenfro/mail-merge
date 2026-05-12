'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mergePlaceholders } from '@/lib/merge'
import type { Recipient, Template } from '@/types'

type TemplateStub = Pick<Template, 'id' | 'name' | 'subject'>

export default function SendPage() {
  const [templates, setTemplates] = useState<TemplateStub[]>([])
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [senderName, setSenderName] = useState('Mail Merge')
  const [senderEmail, setSenderEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [previewRecipient, setPreviewRecipient] = useState<Recipient | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/templates').then(r => r.json()),
      fetch('/api/recipients').then(r => r.json()),
    ]).then(([t, r]) => {
      setTemplates(t)
      setRecipients(r)
      if (r.length) setPreviewRecipient(r[0])
    })
  }, [])

  async function loadTemplate(id: string) {
    const res = await fetch(`/api/templates/${id}`)
    const data = await res.json()
    setSelectedTemplate(data)
  }

  function toggleRecipient(id: string) {
    setSelectedIds(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() { setSelectedIds(new Set(recipients.map(r => r.id))) }
  function clearAll() { setSelectedIds(new Set()) }

  async function send() {
    if (!selectedTemplate) { toast.error('Pick a template'); return }
    if (!senderEmail) { toast.error('Sender email is required'); return }
    if (selectedIds.size === 0) { toast.error('Select at least one recipient'); return }

    setSending(true)
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: selectedTemplate.id,
        recipientIds: [...selectedIds],
        senderName,
        senderEmail,
      }),
    })
    const data = await res.json()
    setSending(false)

    if (data.errors?.length) {
      toast.warning(`Sent ${data.sent}, ${data.errors.length} failed`)
    } else {
      toast.success(`Sent to ${data.sent} recipients`)
    }
  }

  const previewHtml = selectedTemplate && previewRecipient
    ? mergePlaceholders(selectedTemplate.html_content, {
        email: previewRecipient.email,
        first_name: previewRecipient.first_name,
        last_name: previewRecipient.last_name,
        company: previewRecipient.company,
      })
    : selectedTemplate?.html_content ?? ''

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Send campaign</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: config */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-semibold">Sender</h2>
            <div>
              <Label>Display name</Label>
              <Input value={senderName} onChange={e => setSenderName(e.target.value)} />
            </div>
            <div>
              <Label>From email *</Label>
              <Input
                type="email"
                placeholder="you@uw.edu"
                value={senderEmail}
                onChange={e => setSenderEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must be verified in your Brevo account.
              </p>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="text-sm font-semibold">Template</h2>
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No templates — create one first.</p>
            ) : (
              <div className="space-y-2">
                {templates.map(t => (
                  <label
                    key={t.id}
                    className={`flex items-start gap-3 rounded-md border px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                      selectedTemplate?.id === t.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      className="mt-0.5"
                      onChange={() => loadTemplate(t.id)}
                    />
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.subject}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Recipients{' '}
                <Badge variant="secondary">{selectedIds.size} selected</Badge>
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>All</Button>
                <Button variant="ghost" size="sm" onClick={clearAll}>None</Button>
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1">
              {recipients.map(r => (
                <label
                  key={r.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleRecipient(r.id)}
                  />
                  <span className="flex-1 truncate">
                    {[r.first_name, r.last_name].filter(Boolean).join(' ') || r.email}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">{r.email}</span>
                </label>
              ))}
            </div>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={send}
            disabled={sending || !selectedTemplate || selectedIds.size === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending…' : `Send to ${selectedIds.size} recipient${selectedIds.size !== 1 ? 's' : ''}`}
          </Button>
        </div>

        {/* Right: preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Preview</h2>
            {recipients.length > 0 && (
              <select
                className="h-7 rounded border bg-background px-2 text-xs"
                onChange={e => setPreviewRecipient(recipients.find(r => r.id === e.target.value) ?? null)}
              >
                {recipients.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.email}
                  </option>
                ))}
              </select>
            )}
          </div>
          {selectedTemplate ? (
            <div className="border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-muted/40 border-b text-xs text-muted-foreground">
                <span className="font-medium">Subject:</span>{' '}
                {previewRecipient
                  ? mergePlaceholders(selectedTemplate.subject, {
                      email: previewRecipient.email,
                      first_name: previewRecipient.first_name,
                      last_name: previewRecipient.last_name,
                      company: previewRecipient.company,
                    })
                  : selectedTemplate.subject}
              </div>
              <div
                className="p-6 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          ) : (
            <div className="border border-dashed rounded-lg h-64 flex items-center justify-center text-sm text-muted-foreground">
              Select a template to preview
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
