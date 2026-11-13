import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { ChordPreview } from '../components/ChordSheet'
import { ChordSelector } from '../components/ChordSelector'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { actualizarCancion, crearCancion, fetchCancion } from '../lib/api'

export function AdminCancionFormPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const id = searchParams.get('id') ?? ''
  const nombre = searchParams.get('nombre') ?? ''
  const editId = searchParams.get('editId')

  const [titulo, setTitulo] = useState('')
  const [autor, setAutor] = useState('')
  const [tono, setTono] = useState('')
  const [contenido, setContenido] = useState('')
  const [cursorPos, setCursorPos] = useState(0)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(!!editId)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editId || !usuario) return
    let cancelled = false
    setCargando(true)
    fetchCancion(Number(editId), usuario.id).then((res) => {
      if (cancelled) return
      if (res.result) {
        setTitulo(res.result.titulo || '')
        setAutor(res.result.autor || '')
        setTono(res.result.tono_original || '')
        setContenido(res.result.contenido || '')
      }
      setCargando(false)
    })
    return () => {
      cancelled = true
    }
  }, [editId, usuario])

  const insertarAcorde = (nota: string) => {
    const chord = `[${nota}]`
    const nuevo = contenido.slice(0, cursorPos) + chord + contenido.slice(cursorPos)
    const nuevaPos = cursorPos + chord.length
    setContenido(nuevo)
    setCursorPos(nuevaPos)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(nuevaPos, nuevaPos)
    })
  }

  const guardar = async () => {
    if (!usuario || !titulo.trim()) return
    setGuardando(true)
    const esEdicion = !!editId
    const res = esEdicion
      ? await actualizarCancion(
          Number(editId),
          titulo.trim(),
          autor.trim(),
          tono.trim(),
          contenido,
          usuario.id,
        )
      : await crearCancion(
          Number(id),
          titulo.trim(),
          autor.trim(),
          tono.trim(),
          contenido,
          usuario.id,
        )
    setGuardando(false)
    if (res.code === 200) navigate(-1)
    else setError(res.msj || `Error al ${esEdicion ? 'guardar' : 'crear'} canciÃ³n`)
  }

  if (cargando) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <Spinner size={72} />
        <p className="text-zinc-400">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="px-6 pb-24 pt-16">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-white"
      >
        <ArrowLeft size={20} />
        <span>Volver</span>
      </button>

      <h1 className="mb-6 text-2xl font-bold text-white">
        {editId ? 'Editar canciÃ³n' : `Nueva canciÃ³n â€” ${nombre}`}
      </h1>

      <label className="mb-1 block text-sm text-zinc-400">TÃ­tulo</label>
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="TÃ­tulo"
        className="mb-3 w-full rounded-xl bg-zinc-800 px-4 py-3 text-white outline-none placeholder:text-zinc-600"
      />

      <label className="mb-1 block text-sm text-zinc-400">Autor</label>
      <input
        value={autor}
        onChange={(e) => setAutor(e.target.value)}
        placeholder="Autor"
        className="mb-3 w-full rounded-xl bg-zinc-800 px-4 py-3 text-white outline-none placeholder:text-zinc-600"
      />

      <label className="mb-1 block text-sm text-zinc-400">Tono original</label>
      <input
        value={tono}
        onChange={(e) => setTono(e.target.value)}
        placeholder="Ej: G"
        className="mb-3 w-full rounded-xl bg-zinc-800 px-4 py-3 text-white outline-none placeholder:text-zinc-600"
      />

      <label className="mb-1 block text-sm text-zinc-400">
        Contenido (formato [acorde]texto)
      </label>
      <ChordSelector onSelect={insertarAcorde} />
      <textarea
        ref={inputRef}
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        onSelect={(e) => setCursorPos(e.currentTarget.selectionStart)}
        onClick={(e) => setCursorPos(e.currentTarget.selectionStart)}
        placeholder="[G]Letra con acordes..."
        className="mb-3 min-h-[180px] w-full resize-y rounded-xl bg-zinc-800 px-4 py-3 text-white outline-none placeholder:text-zinc-600"
      />

      <p className="mb-2 text-xs text-zinc-500">Vista previa:</p>
      <ChordPreview contenido={contenido} />

      <button
        type="button"
        onClick={() => void guardar()}
        disabled={guardando}
        className="mb-10 mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
      >
        {guardando && <Spinner size={20} />}
        {guardando ? 'Guardando...' : editId ? 'Guardar cambios' : 'Crear canciÃ³n'}
      </button>

      {error && (
        <Modal
          title="Error"
          description={error}
          type="error"
          onClose={{ action: () => setError(''), label: 'Cerrar' }}
        />
      )}
    </div>
  )
}
