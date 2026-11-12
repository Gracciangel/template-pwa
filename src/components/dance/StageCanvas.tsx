import { memo, useRef } from 'react'
import { Music } from 'lucide-react'
import { Spinner } from '../ui/Spinner'
import type { PositionUser } from '../../hooks/useDanceMap'

const Y_ESCENARIO = 12

interface PinProps {
  pos: PositionUser
  soyYo: boolean
  onSelect: (user: PositionUser) => void
}

const PinMarker = memo(function PinMarker({ pos, soyYo, onSelect }: PinProps) {
  const iniciales = `${pos.nombre?.[0] ?? ''}${pos.apellido?.[0] ?? ''}`

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect(pos)
      }}
      className="absolute z-10 flex w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center focus:outline-none"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: soyYo ? 15 : 10 }}
    >
      <span
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 text-sm font-bold text-white shadow-lg"
        style={{
          borderColor: soyYo ? '#22c55e' : pos.color ?? '#7F77DD',
          backgroundColor: soyYo ? '#166534' : pos.color ?? '#7F77DD',
        }}
      >
        {pos.avatar_url ? (
          <img src={pos.avatar_url} alt={pos.nombre} className="h-full w-full object-cover" />
        ) : (
          iniciales
        )}
      </span>
      {soyYo && (
        <span className="mt-0.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          Tú
        </span>
      )}
      <span
        className="mt-0.5 max-w-[64px] truncate text-[10px] font-bold text-white"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
      >
        {pos.nombre}
      </span>
    </button>
  )
})

interface Props {
  loading: boolean
  positions: PositionUser[]
  modoMover: string | null
  esMiPosicion: (userId: string) => boolean
  onSelectUser: (user: PositionUser) => void
  onMapPress: (xPct: number, yPct: number) => void
}

export const StageCanvas = memo(function StageCanvas({
  loading,
  positions,
  modoMover,
  esMiPosicion,
  onSelectUser,
  onMapPress,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!modoMover || !mapRef.current) return
    const rect = mapRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onMapPress(x, y)
  }

  return (
    <div className="mx-4 mb-3">
      <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 py-4">
        <Music size={18} className="text-purple-400" />
        <span className="mt-1 text-lg font-bold tracking-[0.35em] text-white">ESCENARIO</span>
      </div>

      <div
        ref={mapRef}
        onClick={handleClick}
        className={`relative mt-2 h-[420px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ${
          modoMover ? 'cursor-crosshair' : ''
        }`}
        style={{ touchAction: 'manipulation' }}
      >
        <div className="absolute inset-x-0 top-0 bg-zinc-800/40" style={{ height: `${Y_ESCENARIO}%` }} />

        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size={56} />
          </div>
        ) : (
          <>
            {positions.map((pos) => (
              <PinMarker
                key={pos.user_id}
                pos={pos}
                soyYo={esMiPosicion(pos.user_id)}
                onSelect={onSelectUser}
              />
            ))}

            {modoMover && (
              <div className="pointer-events-none absolute inset-x-4 top-2 z-20">
                <div className="rounded-lg bg-purple-600/80 py-3 text-center text-sm font-bold text-white">
                  Tocá en la posición deseada
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})

export { Y_ESCENARIO }
