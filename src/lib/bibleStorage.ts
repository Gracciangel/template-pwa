import { storageGet, storageSet } from './storage'

export type BibleHighlightRow = {
  id: number
  book_key: string
  chapter: number
  verse: number
  created_at: string
}

export type BiblePreferences = {
  textColor: string
  bgColor: string
  textSize: number
  resaltar: boolean
  palabraResaltar: string
}

const HIGHLIGHTS_KEY = 'biblia_resaltados'
const PREFS_KEY = 'biblia_preferencias'

export const DEFAULT_PREFS: BiblePreferences = {
  textColor: '#ffffff',
  bgColor: '#000000',
  textSize: 18,
  resaltar: false,
  palabraResaltar: '',
}

export async function getHighlights(): Promise<BibleHighlightRow[]> {
  return storageGet<BibleHighlightRow[]>(HIGHLIGHTS_KEY, [])
}

export async function getHighlightedVerses(bookKey: string, chapter: number): Promise<Set<number>> {
  const all = await getHighlights()
  return new Set(all.filter((h) => h.book_key === bookKey && h.chapter === chapter).map((h) => h.verse))
}

export async function toggleHighlight(bookKey: string, chapter: number, verse: number): Promise<void> {
  const all = await getHighlights()
  const exists = all.some((h) => h.book_key === bookKey && h.chapter === chapter && h.verse === verse)
  const next = exists
    ? all.filter((h) => !(h.book_key === bookKey && h.chapter === chapter && h.verse === verse))
    : [...all, { id: Date.now(), book_key: bookKey, chapter, verse, created_at: new Date().toISOString() }]
  await storageSet(HIGHLIGHTS_KEY, next)
}

export async function removeHighlight(id: number): Promise<void> {
  const all = await getHighlights()
  await storageSet(
    HIGHLIGHTS_KEY,
    all.filter((h) => h.id !== id),
  )
}

export async function loadPreferences(): Promise<BiblePreferences> {
  return storageGet<BiblePreferences>(PREFS_KEY, DEFAULT_PREFS)
}

export async function savePreferences(prefs: BiblePreferences): Promise<void> {
  await storageSet(PREFS_KEY, prefs)
}
