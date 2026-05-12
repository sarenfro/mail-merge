import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ data: campaign }, { data: recipients }, { data: events }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', id).single(),
    supabase.from('campaign_recipients').select('*').eq('campaign_id', id).order('sent_at', { ascending: false }),
    supabase.from('email_events').select('*').eq('campaign_id', id).order('occurred_at', { ascending: false }),
  ])
  if (!campaign) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ campaign, recipients: recipients ?? [], events: events ?? [] })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabase
    .from('campaigns')
    .update(body)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
