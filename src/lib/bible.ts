import { LIBROS, type Libro } from './bibleBooks'

export type Biblia = Record<string, string[][]>

let cache: Biblia | null = null
let loading: Promise<Biblia> | null = null

/** Carga el JSON completo de la Biblia una sola vez y lo cachea en memoria. */
export function cargarBiblia(): Promise<Biblia> {
  if (cache) return Promise.resolve(cache)
  if (loading) return loading

  loading = fetch(`${import.meta.env.BASE_URL}data/biblia-rv1960.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar la Biblia (${res.status})`)
      return res.json() as Promise<Biblia>
    })
    .then((data) => {
      cache = data
      return data
    })
    .catch((error) => {
      loading = null
      throw error
    })

  return loading
}

export function getLibros(testamento?: 'AT' | 'NT'): Libro[] {
  return testamento ? LIBROS.filter((l) => l.testamento === testamento) : LIBROS
}

export function buscarLibro(query: string): Libro[] {
  const q = query.trim().toLowerCase()
  if (!q) return LIBROS
  return LIBROS.filter((l) => l.nombre.toLowerCase().includes(q))
}

export function getCapitulos(biblia: Biblia, libroKey: string): string[][] {
  return biblia[libroKey] ?? []
}

export function getVersiculos(biblia: Biblia, libroKey: string, capitulo: number): string[] {
  return biblia[libroKey]?.[capitulo - 1] ?? []
}

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export type VersiculoDia = {
  libro: string
  libroKey: string
  capitulo: number
  versiculo: number
  texto: string
}

/** Versículo diario: recorre el NT con un paso fijo para variar cada día. */
export async function getVersiculoDelDia(): Promise<VersiculoDia | null> {
  const biblia = await cargarBiblia()
  const librosNT = getLibros('NT')

  let totalVerses = 0
  for (const libro of librosNT) {
    const chapters = biblia[libro.key]
    if (!chapters) continue
    for (const chapter of chapters) totalVerses += chapter.length
  }

  if (totalVerses === 0) return null

  const step = Math.max(1, Math.floor(totalVerses / 366))
  const targetIndex = (getDayOfYear() * step) % totalVerses

  let acc = 0
  for (const libro of librosNT) {
    const chapters = biblia[libro.key]
    if (!chapters) continue
    for (let c = 0; c < chapters.length; c++) {
      const verses = chapters[c]
      for (let v = 0; v < verses.length; v++) {
        if (acc === targetIndex) {
          return {
            libro: libro.nombre,
            libroKey: libro.key,
            capitulo: c + 1,
            versiculo: v + 1,
            texto: verses[v],
          }
        }
        acc++
      }
    }
  }

  return null
}

export function referenciaVersiculo(v: VersiculoDia): string {
  return `${v.libro} ${v.capitulo}:${v.versiculo}`
}
