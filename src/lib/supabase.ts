import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { IResponse } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_ANON_KEY

if (!SUPABASE_URL || !ANON_KEY) {
  // Falla ruidosa y clara en vez de requests rotos silenciosos
  console.error(
    '[supabase] Faltan variables de entorno. Copiá .env.example a .env y completá VITE_SUPABASE_URL y VITE_ANON_KEY.',
  )
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'tdg-auth',
  },
})

export function getSupabase(): SupabaseClient {
  return supabase
}

export const DEFAULT_TIMEOUT = 30000

export function handleError<T = unknown>(error: unknown): IResponse<T> {
  return {
    code: 500,
    msj: error instanceof Error ? error.message : 'Error de conexión',
    title: 'Error',
  }
}

export function buildRange(params?: { page?: number; pageSize?: number }): {
  limit: number
  offset: number
} {
  const pageSize = params?.pageSize ?? 50
  const page = params?.page ?? 0
  return { limit: pageSize, offset: page * pageSize }
}

/** fetch con timeout, para llamadas externas (Cloudinary, etc.) */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  ms = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}
