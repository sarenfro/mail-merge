import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/brevo'
import { mergePlaceholders } from '@/lib/merge'
import type { Recipient } from '@/types'

export async function POST(req: NextRequest) {
  const { templateId, recipientIds, senderName, senderEmail } = await req.json()

  if (!templateId || !senderEmail) {
    return NextResponse.json({ error: 'templateId and senderEmail are required' }, { status: 400 })
  }

  const { data: template, error: tErr } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single()
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 404 })

  let query = supabase.from('recipients').select('*')
  if (recipientIds?.length) query = query.in('id', recipientIds)
  const { data: recipients, error: rErr } = await query
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })

  const errors: string[] = []
  let sent = 0

  for (const recipient of recipients as Recipient[]) {
    const mergeData: Record<string, string | null> = {
      email: recipient.email,
      first_name: recipient.first_name,
      last_name: recipient.last_name,
      company: recipient.company,
      ...(recipient.custom_fields ?? {}),
    }

    const html = mergePlaceholders(template.html_content, mergeData)
    const subject = mergePlaceholders(template.subject, mergeData)
    const toName = [recipient.first_name, recipient.last_name].filter(Boolean).join(' ') || undefined

    try {
      await sendEmail({
        sender: { name: senderName || 'Mail Merge', email: senderEmail },
        to: [{ email: recipient.email, name: toName }],
        subject,
        htmlContent: html,
      })
      sent++
    } catch (e) {
      errors.push(`${recipient.email}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const status = errors.length === 0 ? 'sent' : sent > 0 ? 'partial' : 'failed'

  await supabase.from('send_logs').insert({
    template_id: templateId,
    template_name: template.name,
    recipient_count: sent,
    sent_at: new Date().toISOString(),
    status,
    errors: errors.length ? errors : null,
  })

  return NextResponse.json({ sent, errors, status })
}
