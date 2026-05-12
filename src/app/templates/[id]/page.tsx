'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Save, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>()
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/templates/${id}`)
      .then(r => r.json())
      .then(data => {
        setName(data.name)
        setSubject(data.subject)
        setHtml(data.html_content)
        setLoaded(true)
      })
  }, [id])

  async function save() {
    if (!name || !subject) { toast.error('Name and subject are required'); return }
    setSaving(true)
    const res = await fetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subject, html_content: html }),
    })
    setSaving(false)
    if (res.ok) toast.success('Saved')
    else toast.error('Failed to save')
  }

  if (!loaded) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit template</h1>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Template name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <Label>Subject line</Label>
          <Input value={subject} onChange={e => setSubject(e.target.value)} />
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
            <code className="text-xs">{'{{company}}'}</code>
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
