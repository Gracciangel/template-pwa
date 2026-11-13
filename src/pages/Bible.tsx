import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Heart, Search, Settings, Share2, Star, Type } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Spinner } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'
import { cargarBiblia, getCapitulos, getLibros, type Biblia } from '../lib/bible'
import type { Libro } from '../lib/bibleBooks'
import {
  DEFAULT_PREFS,
  getHighlightedVerses,
  getHighlights,
  loadPreferences,
  removeHighlight,
  savePreferences,
  toggleHighlight,
  type BibleHighlightRow,
  type BiblePreferences,
} from '../lib/bibleStorage'

type Modo = 'navegar' | 'buscar' | 'config' | 'favoritos'
type Versiculo = { verse: number; text: string }

const COLORES = ['#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

export function BiblePage() {
  const { usuario } = useAuth()
  const [modo, setModo] = useState<Modo>('navegar')
  const [biblia, setBiblia] = useState<Biblia | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [libro, setLibro] = useState<Libro | null>(null)
  const [capitulo, setCapitulo] = useState(0)
  const [totalCapitulos, setTotalCapitulos] = useState(0)
  const [versiculos, setVersiculos] = useState<Versiculo[]>([])
  const [mostrarCapitulos, setMostrarCapitulos] = useState(false)

  const [resaltados, setResaltados] = useState<Set<number>>(new Set())
  const [seleccionado, setSeleccionado] = useState<number | null>(null)

  const [favoritos, setFavoritos] = useState<BibleHighlightRow[]>([])

  const [prefs, setPrefs] = useState<BiblePreferences>(DEFAULT_PREFS)
  const [prefsListas, setPrefsListas] = useState(false)

  useEffect(() => {
    let cancelled = false
    cargarBiblia()
      .then((data) => {
        if (!cancelled) setBiblia(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar la Biblia')
      })
      .finally(() => {
        if (!cancelled) setCargando(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    loadPreferences().then((p) => {
      setPrefs(p)
      setPrefsListas(true)
    })
  }, [])

  useEffect(() => {
    if (!prefsListas) return
    const timer = setTimeout(() => void savePreferences(prefs), 500)
    return () => clearTimeout(timer)
  }, [prefs, prefsListas])

  useEffect(() => {
    if (modo === 'favoritos') void getHighlights().then(setFavoritos)
  }, [modo])

  const abrirCapitulo = useCallback(
    (l: Libro, capIndex: number, b = biblia) => {
      if (!b) return
      const caps = getCapitulos(b, l.key)
      setLibro(l)
      setCapitulo(capIndex)
      setTotalCapitulos(caps.length)
      setVersiculos((caps[capIndex] ?? []).map((text, i) => ({ verse: i + 1, text })))
      setMostrarCapitulos(false)
      setError('')
      void getHighlightedVerses(l.key, capIndex).then(setResaltados)
    },
    [biblia],
  )

  const seleccionarLibro = (l: Libro) => {
    setLibro(l)
    setMostrarCapitulos(true)
    setVersiculos([])
    setError('')
    if (biblia) setTotalCapitulos(getCapitulos(biblia, l.key).length)
  }

  const volverAIndice = () => {
    setVersiculos([])
    setResaltados(new Set())
    setMostrarCapitulos(true)
  }

  const alternarResaltado = async () => {
    if (!libro || seleccionado === null) return
    await toggleHighlight(libro.key, capitulo, seleccionado)
    setResaltados((prev) => {
      const next = new Set(prev)
      if (next.has(seleccionado)) next.delete(seleccionado)
      else next.add(seleccionado)
      return next
    })
  }

  const textoSeleccionado = seleccionado !== null ? versiculos.find((v) => v.verse === seleccionado)?.text ?? '' : ''
  const referencia = libro ? `${libro.nombre} ${capitulo + 1}` : ''

  return (
    <div className="flex min-h-[80vh] flex-col" style={{ backgroundColor: modo === 'navegar' && versiculos.length > 0 ? prefs.bgColor : '#000' }}>
      <div className="px-4">
        <h1 className="mb-4 text-2xl font-bold text-white">Biblia</h1>
        <div className="mb-4 flex rounded-xl bg-zinc-900 p-1">
          <ModeButton active={modo === 'navegar'} onClick={() => setModo('navegar')} label="Navegar" />
          <ModeButton active={modo === 'buscar'} onClick={() => setModo('buscar')} label="Buscar" />
          {usuario && (
            <button
              type="button"
              aria-label="Favoritos"
              onClick={() => setModo('favoritos')}
              className={`flex flex-1 items-center justify-center rounded-lg py-2 ${modo === 'favoritos' ? 'bg-white' : ''}`}
            >
              <Heart size={18} className={modo === 'favoritos' ? 'fill-red-500 text-red-500' : 'text-white'} />
            </button>
          )}
          <button
            type="button"
            aria-label="ConfiguraciÃ³n"
            onClick={() => setModo('config')}
            className={`flex flex-1 items-center justify-center rounded-lg py-2 ${modo === 'config' ? 'bg-blue-500' : ''}`}
          >
            <Settings size={20} className={modo === 'config' ? 'text-white' : 'text-zinc-500'} />
          </button>
        </div>
      </div>

      {cargando && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
          <Spinner size={44} />
          <p className="text-zinc-400">Cargando Biblia...</p>
        </div>
      )}
      {error && <p className="mt-4 text-center text-red-400">{error}</p>}

      {!cargando && biblia && modo === 'buscar' && <Buscador biblia={biblia} onResult={(l, cap, versos) => {
        setLibro(l)
        setCapitulo(cap)
        setTotalCapitulos(getCapitulos(biblia, l.key).length)
        setVersiculos(versos)
        setMostrarCapitulos(false)
        setError('')
        void getHighlightedVerses(l.key, cap).then(setResaltados)
      }} onError={setError} />}

      {!cargando && biblia && modo === 'config' && <ConfigPanel prefs={prefs} setPrefs={setPrefs} />}

      {!cargando && modo === 'favoritos' && (
        <Favoritos
          favoritos={favoritos}
          biblia={biblia}
          onOpen={(h) => {
            const l = getLibros().find((x) => x.key === h.book_key)
            if (!l) return
            setModo('navegar')
            abrirCapitulo(l, h.chapter)
          }}
          onDelete={async (id) => {
            await removeHighlight(id)
            setFavoritos((prev) => prev.filter((f) => f.id !== id))
          }}
        />
      )}

      {!cargando && biblia && modo === 'navegar' && versiculos.length > 0 && libro && (
        <div className="flex flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between px-4">
            <button type="button" disabled={capitulo <= 0} onClick={() => abrirCapitulo(libro, capitulo - 1)} className="disabled:opacity-30">
              <ChevronLeft size={24} color="#fff" />
            </button>
            <button type="button" onClick={volverAIndice} className="font-bold text-white">
              {libro.nombre} {capitulo + 1}
            </button>
            <button type="button" disabled={capitulo >= totalCapitulos - 1} onClick={() => abrirCapitulo(libro, capitulo + 1)} className="disabled:opacity-30">
              <ChevronRight size={24} color="#fff" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {versiculos.map((v) => (
              <VerseRow
                key={v.verse}
                verse={v.verse}
                text={v.text}
                prefs={prefs}
                isHighlighted={resaltados.has(v.verse)}
                onSelect={() => setSeleccionado(v.verse)}
              />
            ))}
          </div>

          <button type="button" onClick={volverAIndice} className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 p-3 text-white">
            <ArrowLeft size={16} /> Volver al Ãndice
          </button>
        </div>
      )}

      {!cargando && biblia && modo === 'navegar' && versiculos.length === 0 && mostrarCapitulos && libro && (
        <ChapterGrid libro={libro} total={totalCapitulos} onSelect={(cap) => abrirCapitulo(libro, cap)} onBack={() => { setLibro(null); setMostrarCapitulos(false) }} />
      )}

      {!cargando && biblia && modo === 'navegar' && versiculos.length === 0 && !mostrarCapitulos && (
        <BookGrid onSelect={seleccionarLibro} />
      )}

      {seleccionado !== null && (
        <Modal
          title={`${referencia}:${seleccionado}`}
          type="info"
          visible
          onClose={{ label: 'Cerrar', action: () => setSeleccionado(null) }}
        >
          <p className="mb-4 text-center text-sm italic text-zinc-300 line-clamp-4">{textoSeleccionado}</p>
          <div className="flex justify-center gap-6">
            <button
              type="button"
              onClick={() => {
                void alternarResaltado()
                setSeleccionado(null)
              }}
              className="flex flex-col items-center gap-1"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                <Star size={20} className={resaltados.has(seleccionado) ? 'fill-yellow-500 text-yellow-500' : 'text-white'} />
              </span>
              <span className="text-xs text-zinc-400">{resaltados.has(seleccionado) ? 'Quitar' : 'Resaltar'}</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                const texto = `"${textoSeleccionado}"\n\n${referencia}:${seleccionado}`
                if (navigator.share) {
                  try {
                    await navigator.share({ text: texto })
                  } catch {
                    /* cancelado */
                  }
                } else {
                  await navigator.clipboard.writeText(texto)
                }
                setSeleccionado(null)
              }}
              className="flex flex-col items-center gap-1"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                <Share2 size={20} className="text-white" />
              </span>
              <span className="text-xs text-zinc-400">Compartir</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex-1 rounded-lg py-2 text-sm ${active ? 'bg-white font-bold text-black' : 'text-gray-400'}`}>
      {label}
    </button>
  )
}

function BookGrid({ onSelect }: { onSelect: (l: Libro) => void }) {
  const OT = getLibros('AT')
  const NT = getLibros('NT')

  const grid = (libros: Libro[]) => (
    <div className="flex flex-wrap gap-2">
      {libros.map((libro) => (
        <button
          key={libro.key}
          type="button"
          onClick={() => onSelect(libro)}
          className="w-[48.5%] rounded-xl bg-zinc-900 p-3 text-center text-sm text-white hover:bg-zinc-800"
        >
          {libro.nombre}
        </button>
      ))}
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      <h2 className="mb-2 mt-4 text-2xl font-bold tracking-widest text-zinc-400">Antiguo Testamento</h2>
      {grid(OT)}
      <h2 className="mb-2 mt-6 text-2xl font-bold tracking-widest text-zinc-400">Nuevo Testamento</h2>
      {grid(NT)}
    </div>
  )
}

function ChapterGrid({ libro, total, onSelect, onBack }: { libro: Libro; total: number; onSelect: (cap: number) => void; onBack: () => void }) {
  const filas = Array.from({ length: Math.ceil(total / 5) }, (_, i) => Array.from({ length: 5 }, (_, j) => i * 5 + j).filter((c) => c < total))

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      <h2 className="mb-6 mt-4 text-center text-2xl font-bold text-white">{libro.nombre}</h2>
      <div className="flex flex-col gap-3">
        {filas.map((fila, idx) => (
          <div key={idx} className="flex gap-3">
            {fila.map((cap) => (
              <button key={cap} type="button" onClick={() => onSelect(cap)} className="flex-1 rounded-xl bg-zinc-900 py-4 text-lg font-semibold text-white hover:bg-zinc-800">
                {cap + 1}
              </button>
            ))}
          </div>
        ))}
      </div>
      <button type="button" onClick={onBack} className="mt-6 w-full rounded-xl bg-zinc-900 p-3 text-center text-white hover:bg-zinc-800">
        Volver a Libros
      </button>
    </div>
  )
}

function VerseRow({
  verse,
  text,
  prefs,
  isHighlighted,
  onSelect,
}: {
  verse: number
  text: string
  prefs: BiblePreferences
  isHighlighted: boolean
  onSelect: () => void
}) {
  const lineas = useMemo(() => text.replace(/\/n/g, '\n').split('\n'), [text])
  const palabra = prefs.resaltar ? prefs.palabraResaltar.trim() : ''

  return (
    <button type="button" onClick={onSelect} className="block w-full rounded-lg px-2 py-1 text-left">
      {lineas.map((linea, idx) => (
        <p
          key={idx}
          style={{
            color: prefs.textColor,
            fontSize: prefs.textSize,
            lineHeight: `${prefs.textSize * 1.6}px`,
            backgroundColor: isHighlighted ? 'rgba(213, 255, 24, 0.57)' : 'transparent',
            textDecoration: isHighlighted ? 'underline dotted #d3ff18' : 'none',
          }}
        >
          {idx === 0 && <span className="font-bold">{verse} </span>}
          {palabra
            ? linea.split(new RegExp(`(${escapeRegex(palabra)})`, 'gi')).map((parte, i) =>
                parte.toLowerCase() === palabra.toLowerCase() ? (
                  <mark key={i} className="bg-amber-400 text-black">
                    {parte}
                  </mark>
                ) : (
                  <span key={i}>{parte}</span>
                ),
              )
            : linea}
        </p>
      ))}
    </button>
  )
}

function Buscador({ biblia, onResult, onError }: { biblia: Biblia; onResult: (l: Libro, cap: number, versos: Versiculo[]) => void; onError: (e: string) => void }) {
  const [busqueda, setBusqueda] = useState('')

  const buscar = () => {
    onError('')
    const match = busqueda.trim().match(/^(.+?)\s+(\d+):(\d+)$/)
    if (!match) {
      onError('Formato invÃ¡lido. Ej: Juan 3:16')
      return
    }
    const [, nombreLibro, cap, ver] = match
    const libro = getLibros().find((l) => l.nombre.toLowerCase() === nombreLibro.toLowerCase())
    if (!libro) {
      onError(`Libro "${nombreLibro}" no encontrado`)
      return
    }
    const capIndex = parseInt(cap, 10) - 1
    const verIndex = parseInt(ver, 10) - 1
    const caps = getCapitulos(biblia, libro.key)
    const versos = caps[capIndex]
    if (!versos || !versos[verIndex]) {
      onError('VersÃ­culo no encontrado')
      return
    }
    onResult(libro, capIndex, [{ verse: verIndex + 1, text: versos[verIndex] }])
  }

  return (
    <div className="mb-4 px-4">
      <div className="flex gap-2">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          placeholder="Ej: Juan 3:16"
          className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500"
        />
        <button type="button" onClick={buscar} aria-label="Buscar" className="flex items-center justify-center rounded-xl bg-white px-4">
          <Search size={20} className="text-black" />
        </button>
      </div>
    </div>
  )
}

function Favoritos({
  favoritos,
  biblia,
  onOpen,
  onDelete,
}: {
  favoritos: BibleHighlightRow[]
  biblia: Biblia | null
  onOpen: (h: BibleHighlightRow) => void
  onDelete: (id: number) => void
}) {
  if (favoritos.length === 0) {
    return <p className="mt-20 text-center text-gray-500">No tenÃ©s versos resaltados</p>
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      {favoritos.map((h) => {
        const libro = getLibros().find((l) => l.key === h.book_key)
        const texto = biblia ? getCapitulos(biblia, h.book_key)[h.chapter]?.[h.verse - 1] ?? '' : ''
        return (
          <div key={h.id} className="mb-2 rounded-xl bg-zinc-900 p-4">
            <button type="button" onClick={() => onOpen(h)} className="w-full text-left">
              <p className="text-sm font-bold text-white">
                {libro?.nombre ?? h.book_key} {h.chapter + 1}:{h.verse}
              </p>
              <p className="mt-1 line-clamp-3 text-sm text-zinc-300">{texto}</p>
              <p className="mt-2 text-xs text-zinc-500">{new Date(h.created_at).toLocaleDateString()}</p>
            </button>
            <button type="button" onClick={() => onDelete(h.id)} className="mt-2 text-xs text-red-400 hover:text-red-300">
              Eliminar
            </button>
          </div>
        )
      })}
    </div>
  )
}

function ConfigPanel({ prefs, setPrefs }: { prefs: BiblePreferences; setPrefs: React.Dispatch<React.SetStateAction<BiblePreferences>> }) {
  const set = <K extends keyof BiblePreferences>(key: K, value: BiblePreferences[K]) => setPrefs((p) => ({ ...p, [key]: value }))

  const colorPicker = (label: string, value: string, onChange: (c: string) => void) => (
    <div className="mb-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-300">
        <Type size={14} className="text-zinc-400" />
        {label}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {COLORES.map((c) => (
          <button key={c} type="button" onClick={() => onChange(c)} className="relative h-10 w-10 rounded-full" style={{ backgroundColor: c }}>
            {value === c && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                <Check size={9} className="text-white" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Apariencia</p>
      <div className="mb-4 rounded-2xl bg-zinc-900/60 p-5">
        {colorPicker('Color de Texto', prefs.textColor, (c) => set('textColor', c))}
        <div className="my-4 h-px bg-zinc-800" />
        {colorPicker('Color de Fondo', prefs.bgColor, (c) => set('bgColor', c))}
      </div>

      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">TamaÃ±o</p>
      <div className="mb-4 rounded-2xl bg-zinc-900/60 p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Fuente</span>
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm font-bold text-blue-400">{prefs.textSize}px</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-zinc-600">A</span>
          <input
            type="range"
            min={12}
            max={32}
            step={1}
            value={prefs.textSize}
            onChange={(e) => set('textSize', Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <span className="text-base text-zinc-400">A</span>
        </div>
      </div>

      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Buscar</p>
      <div className="mb-4 rounded-2xl bg-zinc-900/60 p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-300">
            <Search size={14} className="text-zinc-400" /> Resaltar Palabra
          </span>
          <input
            type="checkbox"
            checked={prefs.resaltar}
            onChange={(e) => set('resaltar', e.target.checked)}
            className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-zinc-700 transition-colors checked:bg-blue-500"
          />
        </div>
        {prefs.resaltar && (
          <input
            value={prefs.palabraResaltar}
            onChange={(e) => set('palabraResaltar', e.target.value)}
            placeholder="EscribÃ­ la palabra..."
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-white outline-none placeholder:text-zinc-600"
          />
        )}
      </div>

      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Vista Previa</p>
      <div className="mb-8 overflow-hidden rounded-2xl" style={{ backgroundColor: prefs.bgColor }}>
        <div className="p-5">
          <p className="mb-2 text-xs text-zinc-500">GÃ©nesis 1:1</p>
          <p style={{ color: prefs.textColor, fontSize: prefs.textSize, lineHeight: `${prefs.textSize * 1.7}px` }}>
            En el principio creÃ³{' '}
            {prefs.resaltar && prefs.palabraResaltar.trim() ? <mark className="bg-amber-400 text-black"> Dios </mark> : ' Dios '}
            los cielos y la tierra. Y la tierra estaba desordenada y vacÃ­a.
          </p>
        </div>
      </div>
    </div>
  )
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
