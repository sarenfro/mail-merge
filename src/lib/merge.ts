export function mergePlaceholders(html: string, recipient: Record<string, string | null>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => recipient[key] ?? `{{${key}}}`)
}
