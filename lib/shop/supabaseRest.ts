export class SupabaseRestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

interface SupabaseRequestOptions {
  method?: string
  body?: unknown
  prefer?: string
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) return null

  return {
    url: url.replace(/\/$/, ''),
    serviceRoleKey,
  }
}

function getErrorMessage(data: unknown) {
  if (!data || typeof data !== 'object') return null
  if ('message' in data && typeof data.message === 'string') return data.message
  if ('hint' in data && typeof data.hint === 'string') return data.hint
  return null
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseConfig())
}

export async function supabaseRequest<T>(
  path: string,
  options: SupabaseRequestOptions = {}
): Promise<T> {
  const config = getSupabaseConfig()

  if (!config) {
    throw new SupabaseRestError('Supabase is not configured.', 500)
  }

  const headers = new Headers({
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    'Content-Type': 'application/json',
  })

  if (options.prefer) {
    headers.set('Prefer', options.prefer)
  }

  const response = await fetch(`${config.url}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => null) as unknown

  if (!response.ok) {
    throw new SupabaseRestError(
      getErrorMessage(data) ?? 'Supabase request failed.',
      response.status
    )
  }

  return data as T
}
