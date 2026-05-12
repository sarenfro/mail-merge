export interface Recipient {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  company: string | null
  custom_fields: Record<string, string> | null
  created_at: string
}

export interface Template {
  id: string
  name: string
  subject: string
  html_content: string
  created_at: string
  updated_at: string
}

export interface SendLog {
  id: string
  template_id: string
  template_name: string
  recipient_count: number
  sent_at: string
  status: 'sent' | 'failed' | 'partial'
  errors: string[] | null
}

export type MergeField = keyof Omit<Recipient, 'id' | 'created_at' | 'custom_fields'>
