const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export interface BrevoEmailPayload {
  sender: { name: string; email: string }
  to: { email: string; name?: string }[]
  subject: string
  htmlContent: string
}

export async function sendEmail(payload: BrevoEmailPayload): Promise<{ messageId?: string }> {
  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Brevo error ${res.status}: ${err}`)
  }

  return res.json()
}

export { mergePlaceholders } from './merge'
