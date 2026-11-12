import { useCallback, useEffect, useState } from 'react'
import { Heart, Share2 } from 'lucide-react'
import { getVersiculoDelDia, referenciaVersiculo, type VersiculoDia } from '../lib/bible'
import { STORAGE_KEYS, storageGet, storageSet } from '../lib/storage'

type Favorito = { referencia: string; texto: string }

export function VersiculoDelDiaCard({ onReady }: { onReady?: () => void }) {
  const [versiculo, setVersiculo] = useState<VersiculoDia | null>(null)
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    let cancelled = false
    storageGet<Favorito[]>(STORAGE_KEYS.favoritos, []).then((data) => {
      if (!cancelled) setFavoritos(data)
    })
    getVersiculoDelDia()
      .then((v) => {
        if (!cancelled) setVersiculo(v)
      })
      .catch((error) => console.error('[versículo]', error))
      .finally(() => {
        if (!cancelled) onReady?.()
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const referencia = versiculo ? referenciaVersiculo(versiculo) : ''
  const esFavorito = favoritos.some((f) => f.referencia === referencia)

  const toggleFavorito = useCallback(async () => {
    if (!versiculo) return
    const nuevos = esFavorito
      ? favoritos.filter((f) => f.referencia !== referencia)
      : [...favoritos, { referencia, texto: versiculo.texto }]
    setFavoritos(nuevos)
    await storageSet(STORAGE_KEYS.favoritos, nuevos)
  }, [versiculo, favoritos, esFavorito, referencia])

  const compartir = useCallback(async () => {
    if (!versiculo) return
    const texto = `"${versiculo.texto}"\n\n${referencia}`
    if (navigator.share) {
      try {
        await navigator.share({ text: texto, title: 'Versículo del día' })
        return
      } catch {
        /* usuario canceló */
      }
    }
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      console.error('No se pudo copiar')
    }
  }, [versiculo, referencia])

  if (!versiculo) return null

  return (
    <div className="px-4 py-5">
      <div className="relative overflow-hidden rounded-xl border border-purple-900/40 bg-gradient-to-br from-purple-950/80 via-zinc-900 to-black p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-600/20 blur-3xl" />
        <h2 className="relative mb-3 text-2xl font-bold uppercase tracking-wider text-white">Versículo del Día</h2>
        <p className="relative text-[1.125rem] italic leading-7 text-white">&ldquo;{versiculo.texto}&rdquo;</p>
        <div className="relative mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-300">{referencia}</span>
          <div className="flex items-center gap-6">
            <button
              type="button"
              aria-label={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              onClick={toggleFavorito}
              className="transition-transform hover:scale-110"
            >
              <Heart size={20} className={esFavorito ? 'fill-red-500 text-red-500' : 'text-white'} />
            </button>
            <button type="button" aria-label="Compartir" onClick={compartir} className="text-white transition-transform hover:scale-110">
              <Share2 size={20} />
            </button>
          </div>
        </div>
        {copiado && <p className="relative mt-2 text-xs text-green-400">Copiado al portapapeles</p>}
      </div>
    </div>
  )
}
