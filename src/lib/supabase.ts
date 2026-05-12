import { createClient } from '@supabase/supabase-js'
import type { Recipient, Template, SendLog } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      recipients: { Row: Recipient }
      templates: { Row: Template }
      send_logs: { Row: SendLog }
    }
  }
}
