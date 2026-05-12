'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function NewTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('<p>Hello {{first_name}},</p><p></p>')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name || !subject) { toast.error('Name and subject are required'); return }
    setSaving(true)
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subject, html_content: html }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      toast.success('Template saved')
      router.push(`/templates/${data.id}`)
    } else {
      toast.error('Failed to save template')
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New template</h1>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Template name</Label>
          <Input
            placeholder="e.g. Welcome email"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <Label>Subject line</Label>
          <Input
            placeholder="e.g. Hello {{first_name}}!"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-3.5 w-3.5 mr-1" /> Preview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-3">
          <RichTextEditor content={html} onChange={setHtml} />
          <p className="text-xs text-muted-foreground mt-2">
            Use merge fields like <code className="text-xs">{'{{first_name}}'}</code>{' '}
            <code className="text-xs">{'{{last_name}}'}</code>{' '}
            <code className="text-xs">{'{{email}}'}</code>{' '}
            <code className="text-xs">{'{{company}}'}</code> — they will be replaced per recipient.
          </p>
        </TabsContent>
        <TabsContent value="preview" className="mt-3">
          <div
            className="border rounded-lg p-6 prose prose-sm max-w-none min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
