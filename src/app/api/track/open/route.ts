import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 1x1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export async function GET(req: NextRequest) {
  const rid = new URL(req.url).searchParams.get('rid')
  if (rid) {
    const { data: recipient } = await supabase
      .from('campaign_recipients')
      .select('campaign_id, email')
      .eq('id', rid)
      .single()

    if (recipient) {
      await supabase.from('email_events').insert({
        campaign_id: recipient.campaign_id,
        recipient_id: rid,
        email: recipient.email,
        event_type: 'open',
      })
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
