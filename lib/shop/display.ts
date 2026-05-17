export function getSelectedOptionsLabel(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return ''

  return value
    .map((option) => {
      if (!option || typeof option !== 'object') return ''
      const maybeOption = option as { groupLabel?: unknown; valueLabel?: unknown }
      const groupLabel = typeof maybeOption.groupLabel === 'string' ? maybeOption.groupLabel : ''
      const valueLabel = typeof maybeOption.valueLabel === 'string' ? maybeOption.valueLabel : ''

      if (!groupLabel && !valueLabel) return ''
      return groupLabel ? `${groupLabel}: ${valueLabel}` : valueLabel
    })
    .filter(Boolean)
    .join(' / ')
}

export function getShippingAddressLabel(value: unknown) {
  if (!value || typeof value !== 'object') return ''

  const candidate = value as {
    address?: {
      line1?: unknown
      line2?: unknown
      city?: unknown
      state?: unknown
      postal_code?: unknown
      country?: unknown
    } | null
  }
  const address = candidate.address

  if (!address) return ''

  return [
    typeof address.line1 === 'string' ? address.line1 : '',
    typeof address.line2 === 'string' ? address.line2 : '',
    typeof address.city === 'string' ? address.city : '',
    typeof address.state === 'string' ? address.state : '',
    typeof address.postal_code === 'string' ? address.postal_code : '',
    typeof address.country === 'string' ? address.country : '',
  ].filter(Boolean).join(', ')
}
