export type CancionCronograma = { titulo: string }

/** El contenido de un cronograma puede ser un JSON de canciones o texto plano. */
export function parseCanciones(contenido: string): string[] {
  try {
    const parsed = JSON.parse(contenido)
    if (Array.isArray(parsed)) {
      return parsed.map((s: unknown) => (typeof s === 'string' ? s : (s as CancionCronograma)?.titulo ?? '')).filter(Boolean)
    }
  } catch {
    /* texto plano */
  }
  return contenido
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Extrae el nombre del predicador del contenido de un cronograma de prédicas. */
export function parsePredicador(contenido: string): string {
  try {
    const parsed = JSON.parse(contenido)
    return Array.isArray(parsed) ? parsed[0]?.titulo ?? '' : ''
  } catch {
    return ''
  }
}

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function formatearFecha(fecha: string, opciones: Intl.DateTimeFormatOptions = {}): string {
  if (!fecha) return '—'
  const d = new Date(fecha.includes('T') ? fecha : `${fecha}T00:00:00`)
  if (Number.isNaN(d.getTime())) return fecha
  return d.toLocaleDateString('es-ES', opciones)
}

export function capitalizar(texto: string): string {
  return texto.replace(/^\w/, (c) => c.toUpperCase())
}
