'use client'

import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Strikethrough, Link2, AlignLeft, AlignCenter,
  AlignRight, Highlighter, List, ListOrdered, Heading2, Undo, Redo, Variable,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

const FONTS = ['Default', 'Arial', 'Georgia', 'Verdana', 'Times New Roman', 'Courier New', 'Trebuchet MS']
const SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px']
const MERGE_FIELDS = ['first_name', 'last_name', 'email', 'company']

interface Props { editor: Editor | null }

export function EditorToolbar({ editor }: Props) {
  const textColorRef = useRef<HTMLInputElement>(null)
  const highlightColorRef = useRef<HTMLInputElement>(null)

  if (!editor) return null

  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <Button
      type="button"
      size="icon"
      variant={active ? 'secondary' : 'ghost'}
      className="h-7 w-7"
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  )

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/40">
      {/* Undo / Redo */}
      {btn(false, () => editor.chain().focus().undo().run(), 'Undo', <Undo className="h-3.5 w-3.5" />)}
      {btn(false, () => editor.chain().focus().redo().run(), 'Redo', <Redo className="h-3.5 w-3.5" />)}

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Font family */}
      <select
        className="h-7 rounded border bg-background px-1.5 text-xs"
        title="Font family"
        defaultValue="Default"
        onChange={e => {
          if (e.target.value === 'Default') {
            editor.chain().focus().unsetFontFamily().run()
          } else {
            editor.chain().focus().setFontFamily(e.target.value).run()
          }
        }}
      >
        {FONTS.map(f => <option key={f}>{f}</option>)}
      </select>

      {/* Font size via inline style */}
      <select
        className="h-7 w-20 rounded border bg-background px-1.5 text-xs"
        title="Font size"
        defaultValue="16px"
        onChange={e => {
          editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run()
        }}
      >
        {SIZES.map(s => <option key={s}>{s}</option>)}
      </select>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Bold / Italic / Underline / Strike */}
      {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold', <Bold className="h-3.5 w-3.5" />)}
      {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic', <Italic className="h-3.5 w-3.5" />)}
      {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'Underline', <Underline className="h-3.5 w-3.5" />)}
      {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'Strikethrough', <Strikethrough className="h-3.5 w-3.5" />)}

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Text color */}
      <div className="relative h-7 w-7 flex items-center justify-center">
        <input
          ref={textColorRef}
          type="color"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          title="Text color"
          onChange={e => editor.chain().focus().setColor(e.target.value).run()}
        />
        <div className="flex flex-col items-center pointer-events-none">
          <span className="text-[11px] font-bold leading-none">A</span>
          <div
            className="h-1 w-4 rounded-sm mt-0.5"
            style={{ backgroundColor: editor.getAttributes('textStyle').color ?? '#000000' }}
          />
        </div>
      </div>

      {/* Highlight color */}
      <div className="relative h-7 w-7 flex items-center justify-center" title="Highlight color">
        <input
          ref={highlightColorRef}
          type="color"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          defaultValue="#FFFF00"
          onChange={e => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
        />
        <Highlighter className="h-3.5 w-3.5 pointer-events-none" />
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Heading */}
      {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading 2', <Heading2 className="h-3.5 w-3.5" />)}

      {/* Lists */}
      {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet list', <List className="h-3.5 w-3.5" />)}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Numbered list', <ListOrdered className="h-3.5 w-3.5" />)}

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Alignment */}
      {btn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), 'Align left', <AlignLeft className="h-3.5 w-3.5" />)}
      {btn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), 'Align center', <AlignCenter className="h-3.5 w-3.5" />)}
      {btn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), 'Align right', <AlignRight className="h-3.5 w-3.5" />)}

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Link */}
      {btn(editor.isActive('link'), () => {
        if (editor.isActive('link')) {
          editor.chain().focus().unsetLink().run()
        } else {
          const url = window.prompt('Enter URL:')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }
      }, 'Insert link', <Link2 className="h-3.5 w-3.5" />)}

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Merge fields */}
      <select
        className={cn('h-7 rounded border bg-background px-1.5 text-xs', 'text-muted-foreground')}
        title="Insert merge field"
        value=""
        onChange={e => {
          if (e.target.value) {
            editor.chain().focus().insertContent(`{{${e.target.value}}}`).run()
            e.target.value = ''
          }
        }}
      >
        <option value="" disabled>
          Insert field…
        </option>
        {MERGE_FIELDS.map(f => (
          <option key={f} value={f}>{`{{${f}}}`}</option>
        ))}
      </select>
    </div>
  )
}
