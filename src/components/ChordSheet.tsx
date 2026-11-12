import { useMemo } from 'react'

interface Segmento {
  chord?: string
  text: string
}

interface Seccion {
  titulo: string
  lineas: Segmento[][]
}

function parsearLinea(linea: string): Segmento[] {
  const segs: Segmento[] = []
  let resto = linea
  while (resto.length > 0) {
    const c = resto.match(/^\[([^\]]+)\]/)
    if (c) {
      const chord = c[1]
      resto = resto.slice(c[0].length)
      const t = resto.match(/^[^[]*/)
      const text = t ? t[0] : ''
      segs.push({ chord, text })
      resto = resto.slice(text.length)
    } else {
      const t = resto.match(/^[^[]*/)
      const text = t ? t[0] : ''
      if (text) segs.push({ text })
      resto = resto.slice(text.length)
    }
  }
  return segs
}

const patronSeccion = /^(Verso|Coro|Puente|Instrumental|Final|Intro|Pre[-\s]?Coro)/i
const esTituloSeccion = (l: string) => patronSeccion.test(l.trim()) && !l.includes('[')

function agruparSecciones(lineas: string[]): Seccion[] {
  const secciones: Seccion[] = []
  let actual: Seccion | null = null

  for (const rawLinea of lineas) {
    const trim = rawLinea.trim()
    if (!trim) {
      if (actual) actual.lineas.push([])
      continue
    }

    if (esTituloSeccion(rawLinea)) {
      actual = { titulo: trim, lineas: [] }
      secciones.push(actual)
    } else if (actual) {
      actual.lineas.push(parsearLinea(trim))
    }
  }

  return secciones
}

const COLORES: Record<string, string> = {
  verso: '#3b82f6',
  coro: '#22c55e',
  puente: '#a855f7',
  instrumental: '#f59e0b',
  final: '#ef4444',
  intro: '#06b6d4',
}

function colorPara(titulo: string): string {
  for (const [key, color] of Object.entries(COLORES)) {
    if (titulo.toLowerCase().startsWith(key)) return color
  }
  return '#6366f1'
}

export function ChordSheet({ contenido }: { contenido: string }) {
  const secciones = useMemo(() => agruparSecciones(contenido.split('\n')), [contenido])

  return (
    <div>
      {secciones.map((sec, idx) => {
        if (!sec.lineas.some((l) => l.length > 0)) return null
        const color = colorPara(sec.titulo)

        return (
          <div key={idx} className="mb-5 rounded-2xl border border-zinc-700/50 bg-zinc-800/60 px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm font-bold uppercase tracking-wider text-white">{sec.titulo}</span>
            </div>

            {sec.lineas.map((segmentos, li) =>
              segmentos.length === 0 ? (
                <div key={li} className="h-2" />
              ) : (
                <div key={li} className="mb-2 flex flex-wrap">
                  {segmentos.map((seg, si) => (
                    <span key={si} className="inline-flex flex-col align-top">
                      <span className="text-sm font-bold leading-4 text-green-400">{seg.chord ?? '\u00a0'}</span>
                      <span className="whitespace-pre text-base leading-6 text-white">{seg.text || '\u00a0'}</span>
                    </span>
                  ))}
                </div>
              ),
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ChordPreview({ contenido }: { contenido: string }) {
  return (
    <div className="min-h-[80px] rounded-xl bg-zinc-800/40 px-4 py-3">
      {contenido.split('\n').map((linea, i) => {
        const segmentos = parsearLinea(linea)
        if (segmentos.length === 0) return <div key={i} className="h-4" />
        return (
          <div key={i} className="mb-1 flex flex-wrap">
            {segmentos.map((seg, si) => (
              <span key={si} className="inline-flex">
                {seg.chord && <span className="font-bold text-green-400">{`[${seg.chord}]`}</span>}
                <span className="text-zinc-300">{seg.text}</span>
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}
