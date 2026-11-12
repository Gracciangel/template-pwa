import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Camera, LogOut, Mail, Tag, Users, X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from './ui/Avatar'
import { Modal } from './ui/Modal'
import { Spinner } from './ui/Spinner'
import { updateAvatarRPC, uploadToCloudinary } from '../lib/api'

interface ProfileMenuProps {
  open: boolean
  onClose: () => void
}

export function ProfileMenu({ open, onClose }: ProfileMenuProps) {
  const { usuario, esLider, ministerios, grupos, cerrarSesion, actualizarAvatar } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [verImagen, setVerImagen] = useState(false)
  const [alerta, setAlerta] = useState<{ title: string; description: string; type?: 'info' | 'warning' | 'error' | 'success' } | null>(null)

  useEffect(() => {
    if (!open) setCerrando(false)
  }, [open])

  if (!usuario) return null

  const initials = `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`.toUpperCase()
  const nombre = `${usuario.nombre?.[0]?.toUpperCase() ?? ''}${usuario.nombre?.slice(1) ?? ''}`
  const apellido = `${usuario.apellido?.[0]?.toUpperCase() ?? ''}${usuario.apellido?.slice(1) ?? ''}`

  const esMinisterio = (id: number | string) => ministerios.some((m) => String(m.id) === String(id))
  const liderazgos = [...ministerios.filter((m) => m.es_lider), ...grupos.filter((g) => g.es_lider)]
  const pertenencias = [...ministerios.filter((m) => !m.es_lider), ...grupos.filter((g) => !g.es_lider)]

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setSubiendo(true)
    try {
      const upload = await uploadToCloudinary(file)
      if (upload.code !== 200 || !upload.result) {
        setAlerta({ title: 'Error', description: upload.msj || 'Error al subir la imagen', type: 'error' })
        return
      }
      const rpc = await updateAvatarRPC(usuario.id, upload.result)
      if (rpc.code !== 200) {
        setAlerta({ title: 'Error', description: rpc.msj || 'Error al guardar el avatar', type: 'error' })
        return
      }
      await actualizarAvatar(upload.result)
    } catch {
      setAlerta({ title: 'Error', description: 'Ocurrió un error al cambiar la foto de perfil', type: 'error' })
    } finally {
      setSubiendo(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleLogout = async () => {
    setCerrando(true)
    await cerrarSesion()
    onClose()
    navigate('/', { replace: true })
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className={`absolute bottom-0 left-0 right-0 max-h-[80%] overflow-y-auto rounded-t-3xl bg-zinc-900 px-6 pb-8 pt-6 transition-transform duration-300 ${
            open ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-zinc-600" />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="mb-5 flex items-center">
            <div className="relative">
              <button type="button" onClick={() => setVerImagen(true)} disabled={subiendo} className="block">
                <Avatar uri={usuario.avatar_url} size={80} initials={initials} />
              </button>
              <button
                type="button"
                aria-label="Cambiar foto"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 rounded-full border border-zinc-500 bg-black/70 p-1.5 text-white hover:bg-black"
              >
                <Camera size={13} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              {subiendo && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                  <Spinner size={26} />
                </div>
              )}
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <p className="truncate text-[22px] font-bold text-white">{`${nombre} ${apellido}`.trim()}</p>
              <p className="mt-0.5 truncate text-[15px] text-gray-400">@{usuario.nombre_usuario}</p>
              <span className="mt-1.5 inline-flex items-center gap-1 self-start rounded-full bg-zinc-800 px-2.5 py-0.5">
                <Tag size={12} className="text-white" />
                <span className={`text-[13px] ${esLider ? 'text-green-400' : 'text-yellow-400'}`}>{esLider ? 'Líder' : 'Miembro'}</span>
              </span>
            </div>
          </div>

          {esLider && liderazgos.length > 0 && (
            <div className="mb-3 rounded-xl bg-zinc-800 p-4">
              <p className="mb-2 text-[15px] font-bold text-white">Lidera en:</p>
              {liderazgos.map((l) => {
                const isMin = esMinisterio(l.id)
                const Icon = isMin ? Building2 : Users
                return (
                  <div
                    key={`lider-${l.id}`}
                    className={`mb-1.5 flex items-center gap-2 rounded-lg px-3 py-2 ${isMin ? 'bg-green-900/20' : 'bg-blue-900/20'}`}
                  >
                    <Icon size={13} className={isMin ? 'text-green-500' : 'text-blue-500'} />
                    <span className={`flex-1 text-[13px] ${isMin ? 'text-green-400' : 'text-blue-400'}`}>
                      {isMin ? 'Ministerio' : 'Grupo'}: {l.nombre}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mb-4 rounded-xl bg-zinc-800 p-4">
            <p className="mb-2 text-[15px] font-bold text-white">Pertenece a:</p>
            {pertenencias.length > 0 ? (
              pertenencias.map((p) => {
                const isMin = esMinisterio(p.id)
                const Icon = isMin ? Building2 : Users
                return (
                  <div key={`pertenece-${p.id}`} className="mb-1.5 flex items-center gap-2 rounded-lg bg-yellow-900/20 px-3 py-2">
                    <Icon size={13} className="text-yellow-500" />
                    <span className="flex-1 text-[13px] text-yellow-400">
                      {isMin ? 'Ministerio' : 'Grupo'}: {p.nombre}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="text-[15px] italic text-gray-500">No estás asignado a ningún grupo o ministerio</p>
            )}
          </div>

          <div className="mb-4 flex items-center rounded-xl bg-zinc-800 px-4 py-3">
            <Mail size={15} className="text-gray-500" />
            <div className="ml-3 min-w-0">
              <p className="text-[11px] uppercase text-gray-500">Email</p>
              <p className="mt-0.5 truncate text-[15px] text-white">{usuario.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-red-900/30 py-3.5 text-[15px] font-semibold text-red-400 hover:bg-red-900/50"
          >
            <LogOut size={19} />
            Cerrar sesión
          </button>
        </div>
      </div>

      {verImagen && usuario.avatar_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6" onClick={() => setVerImagen(false)}>
          <button type="button" aria-label="Cerrar" className="absolute right-5 top-5 text-white">
            <X size={28} />
          </button>
          <img src={usuario.avatar_url} alt="Avatar" className="max-h-[80vh] max-w-full rounded-xl object-contain" />
        </div>
      )}

      {alerta && (
        <Modal
          title={alerta.title}
          description={alerta.description}
          type={alerta.type ?? 'info'}
          onClose={{ label: 'OK', action: () => setAlerta(null) }}
        />
      )}

      {cerrando && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur">
          <Spinner size={44} />
          <p className="text-zinc-300">Cerrando sesión...</p>
        </div>
      )}
    </>
  )
}
