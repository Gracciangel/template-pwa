export const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const NOTAS_b = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

function idxNota(nota: string): number {
  const i = NOTAS.indexOf(nota)
  if (i !== -1) return i
  return NOTAS_b.indexOf(nota)
}

function notaDesdeIdx(idx: number): string {
  return NOTAS[((idx % 12) + 12) % 12]
}

function transpNota(nota: string, semitonos: number): string {
  const i = idxNota(nota)
  if (i === -1) return nota
  return notaDesdeIdx(i + semitonos)
}

function transpAcorde(acorde: string, semitonos: number): string {
  const partes = acorde.split('/')
  const principal = partes[0]
  const bajo = partes[1]

  const m = principal.match(/^([A-G])(#|b)?(.*)$/)
  if (!m) return acorde
  const raiz = transpNota(m[1] + (m[2] || ''), semitonos)
  const sufijo = m[3] || ''

  let transpBajo = ''
  if (bajo) {
    const bm = bajo.match(/^([A-G])(#|b)?(.*)$/)
    transpBajo = bm ? '/' + transpNota(bm[1] + (bm[2] || ''), semitonos) + (bm[3] || '') : '/' + bajo
  }

  return raiz + sufijo + transpBajo
}

export function transponerContenido(contenido: string, semitonos: number): string {
  return contenido.replace(/\[([^\]]+)\]/g, (_, acorde: string) => '[' + transpAcorde(acorde, semitonos) + ']')
}

export function transponerTono(tono: string, semitonos: number): string {
  return transpNota(tono, semitonos)
}
