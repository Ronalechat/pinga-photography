/** Converts a display label to a URL-safe slug: "Street Photography" → "street-photography" */
export function toSlug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-')
}
