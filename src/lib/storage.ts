import { get, set, del, keys } from 'idb-keyval'

/** Wrapper chico sobre IndexedDB para reemplazar AsyncStorage / SQLite. */

export async function storageGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await get<T>(key)
    return value === undefined ? fallback : value
  } catch {
    return fallback
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value)
  } catch (error) {
    console.error('[storage] no se pudo guardar', key, error)
  }
}

export async function storageRemove(key: string): Promise<void> {
  try {
    await del(key)
  } catch (error) {
    console.error('[storage] no se pudo borrar', key, error)
  }
}

export async function storageKeys(prefix?: string): Promise<string[]> {
  const all = (await keys()) as string[]
  return prefix ? all.filter((k) => typeof k === 'string' && k.startsWith(prefix)) : all
}

export const STORAGE_KEYS = {
  favoritos: 'versiculos_favoritos',
  notas: 'tdg_notas',
  resaltados: 'tdg_resaltados',
  preferencias: 'tdg_preferencias',
  ultimaPestana: 'tdg_ultima_pestana',
} as const
