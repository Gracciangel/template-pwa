import { useCallback, useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { STORAGE_KEYS, storageGet, storageSet } from '../lib/storage'

type Note = {
  id: number
  title: string
  content: string
  dateCreate: string
  houreCreate: string
}

function getFecha() {
  const now = new Date()
  return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
}

function getHora() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function NotesPage() {
  const [notas, setNotas] = useState<Note[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editando, setEditando] = useState<Note | null>(null)
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const cargarNotas = useCallback(async () => {
    const guardadas = await storageGet<Note[]>(STORAGE_KEYS.notas, [])
    setNotas([...guardadas].sort((a, b) => b.id - a.id))
  }, [])

  useEffect(() => {
    void cargarNotas()
  }, [cargarNotas])

  const persistir = useCallback(
    async (next: Note[]) => {
      setNotas(next)
      await storageSet(
        STORAGE_KEYS.notas,
        [...next].sort((a, b) => b.id - a.id),
      )
    },
    [],
  )

  const abrirNueva = () => {
    setEditando(null)
    setTitulo('')
    setContenido('')
    setModalVisible(true)
  }

  const abrirEditar = (nota: Note) => {
    setEditando(nota)
    setTitulo(nota.title)
    setContenido(nota.content)
    setModalVisible(true)
  }

  const cerrarModal = () => {
    setModalVisible(false)
    setTitulo('')
    setContenido('')
    setEditando(null)
  }

  const guardarNota = async () => {
    if (!titulo.trim()) return
    if (editando) {
      await persistir(
        notas.map((n) =>
          n.id === editando.id ? { ...n, title: titulo.trim(), content: contenido } : n,
        ),
      )
    } else {
      await persistir([
        ...notas,
        {
          id: Date.now(),
          title: titulo.trim(),
          content: contenido,
          dateCreate: getFecha(),
          houreCreate: getHora(),
        },
      ])
    }
    cerrarModal()
  }

  const confirmarEliminar = async () => {
    if (deleteConfirm === null) return
    await persistir(notas.filter((n) => n.id !== deleteConfirm))
    setDeleteConfirm(null)
  }

  return (
    <div className="pt-safe flex min-h-[75vh] flex-col pb-24">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 pb-3 pt-4">
        <h1 className="text-2xl font-bold text-white">Mi cuaderno</h1>
        <button
          type="button"
          onClick={abrirNueva}
          className="flex items-center gap-3 rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-600"
        >
          <Plus size={16} />
          Nueva
        </button>
      </div>

      {notas.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <p className="whitespace-pre-line text-center text-xl leading-7 text-zinc-500">
            No tenés notas todavía.{'\n'}¡Creá una!
          </p>
        </div>
      ) : (
        <div className="px-4 pt-3">
          {notas.map((nota) => (
            <div
              key={nota.id}
              role="button"
              tabIndex={0}
              onClick={() => abrirEditar(nota)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') abrirEditar(nota)
              }}
              className="mb-3 cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <h2 className="min-w-0 flex-1 truncate text-base font-bold text-white">
                  {nota.title}
                </h2>
                <button
                  type="button"
                  aria-label={`Eliminar ${nota.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteConfirm(nota.id)
                  }}
                  className="text-zinc-600 hover:text-red-400"
                >
                  <X size={16} />
                </button>
              </div>
              {nota.content && (
                <p className="mb-2 line-clamp-2 text-sm leading-5 text-zinc-400">{nota.content}</p>
              )}
              <p className="text-xs text-zinc-600">
                {nota.dateCreate} {nota.houreCreate}
              </p>
            </div>
          ))}
        </div>
      )}

      {modalVisible && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 pb-3 pt-4">
            <button type="button" onClick={cerrarModal} className="text-base text-zinc-500">
              Cancelar
            </button>
            <span className="text-base font-bold text-white">
              {editando ? 'Editar nota' : 'Nueva nota'}
            </span>
            <button
              type="button"
              onClick={() => void guardarNota()}
              className="text-base font-bold text-blue-500"
            >
              Guardar
            </button>
          </div>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título"
            maxLength={100}
            className="border-b border-zinc-800 bg-transparent px-5 py-4 text-xl font-bold text-white outline-none placeholder:text-zinc-600"
          />
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Escribí tu nota..."
            className="flex-1 resize-none bg-transparent p-5 text-base leading-7 text-white outline-none placeholder:text-zinc-600"
          />
        </div>
      )}

      {deleteConfirm !== null && (
        <Modal
          title="Eliminar nota"
          description="¿Seguro que querés eliminarla?"
          type="warning"
          onClose={{ action: () => setDeleteConfirm(null), label: 'Cancelar' }}
          onConfirm={{ action: () => void confirmarEliminar(), label: 'Eliminar', destructive: true }}
        />
      )}
    </div>
  )
}
