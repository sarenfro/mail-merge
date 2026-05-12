export function mergePlaceholders(html: string, fields: Record<string, string | null>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => fields[key] ?? `{{${key}}}`)
}

export function injectTracking(html: string, recipientId: string, baseUrl: string): string {
  // Rewrite links for click tracking
  const withClicks = html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_, url) =>
      `href="${baseUrl}/api/track/click?rid=${recipientId}&url=${encodeURIComponent(url)}"`
  )
  // Append open tracking pixel
  return withClicks + `<img src="${baseUrl}/api/track/open?rid=${recipientId}" width="1" height="1" style="display:none" alt="">`
}
