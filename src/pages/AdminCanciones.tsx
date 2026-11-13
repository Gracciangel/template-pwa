import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Modal } from '../components/ui/Modal'
import { eliminarCancion, fetchCanciones } from '../lib/api'
import type { ICancion } from '../lib/types'

export function AdminCancionesPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { usuario, ministerios } = useAuth()

  const id = searchParams.get('id') ?? ''
  const nombre =
    searchParams.get('nombre') ??
    ministerios.find((m) => String(m.id) === id)?.nombre ??
    ''

  const [canciones, setCanciones] = useState<ICancion[]>([])
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<ICancion | null>(null)

  const cargar = useCallback(async () => {
    if (!usuario || !id) return
    const res = await fetchCanciones(Number(id), usuario.id)
    if (res.result) setCanciones(res.result)
  }, [id, usuario])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const confirmarEliminar = async () => {
    if (!usuario || !confirmDelete) return
    const res = await eliminarCancion(confirmDelete.id, usuario.id)
    setConfirmDelete(null)
    if (res.code === 200) {
      void cargar()
    } else {
      setError(res.msj || 'Error al eliminar')
    }
  }

  const queryBase = `id=${encodeURIComponent(id)}&nombre=${encodeURIComponent(nombre)}`

  return (
    <div className="px-6 pb-24 pt-16">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white"
        >
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>
        <Link
          to={`/admin/cancion-form?${queryBase}`}
          className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-500"
        >
          + Nueva
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-white">Admin: {nombre}</h1>

      {canciones.length === 0 ? (
        <p className="mt-10 text-center text-gray-400">No hay canciones</p>
      ) : (
        canciones.map((c) => (
          <div
            key={c.id}
            className="mb-3 flex w-full items-center rounded-2xl border border-zinc-700/50 bg-zinc-500/80 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white">{c.titulo}</p>
              <p className="text-sm text-zinc-400">
                {c.autor} · {c.tono_original}
              </p>
            </div>
            <Link
              to={`/admin/cancion-form?${queryBase}&editId=${c.id}`}
              aria-label={`Editar ${c.titulo}`}
              className="mr-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-500"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              aria-label={`Eliminar ${c.titulo}`}
              onClick={() => setConfirmDelete(c)}
              className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))
      )}

      {confirmDelete && (
        <Modal
          title="Eliminar"
          description={`¿Eliminar "${confirmDelete.titulo}"?`}
          type="warning"
          onClose={{ action: () => setConfirmDelete(null), label: 'Cancelar' }}
          onConfirm={{ action: () => void confirmarEliminar(), label: 'Eliminar', destructive: true }}
        />
      )}

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
