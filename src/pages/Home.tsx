import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Countdown } from '../components/Countdown'
import { VersiculoDelDiaCard } from '../components/VersiculoDelDia'
import { QuickAccessGrid } from '../components/QuickAccessGrid'
import { NoticiasList } from '../components/Noticias'
import { Spinner } from '../components/ui/Spinner'

export function HomePage() {
  const { usuario } = useAuth()
  const [readyCount, setReadyCount] = useState(0)
  const [timeoutDone, setTimeoutDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTimeoutDone(true), 4000)
    return () => clearTimeout(t)
  }, [])

  const cargando = readyCount < 2 && !timeoutDone

  if (cargando) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner size={48} />
      </div>
    )
  }

  const nombre = usuario ? usuario.nombre.charAt(0).toUpperCase() + usuario.nombre.slice(1).toLowerCase() : ''

  return (
    <div className="animate-fade-in pt-safe">
      <div className="px-6 pt-6">
        {usuario && <h1 className="text-2xl font-bold text-white">Te damos la bienvenida, {nombre}</h1>}
        <Countdown />
      </div>

      <VersiculoDelDiaCard onReady={() => setReadyCount((p) => p + 1)} />
      {usuario && <QuickAccessGrid />}
      <div className="mt-6">
        <NoticiasList onReady={() => setReadyCount((p) => p + 1)} />
      </div>
    </div>
  )
}
