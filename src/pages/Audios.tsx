import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronDown,
  Download,
  Heart,
  Mic2,
  Music2,
  Pause,
  Play,
  Share2,
  X,
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import type { IAudio } from '../lib/types'

const COVER_COLORS = [
  ['#8B5CF6', '#6D28D9'],
  ['#EC4899', '#BE185D'],
  ['#3B82F6', '#1D4ED8'],
  ['#10B981', '#047857'],
  ['#F59E0B', '#B45309'],
  ['#EF4444', '#B91C1C'],
  ['#14B8A6', '#0F766E'],
  ['#F97316', '#C2410C'],
]

function coverGradient(index: number) {
  const [from, to] = COVER_COLORS[index % COVER_COLORS.length]
  return `linear-gradient(135deg, ${from}, ${to})`
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function AudioItem({
  item,
  index,
  isCurrent,
  isPlaying,
  onPress,
}: {
  item: IAudio
  index: number
  isCurrent: boolean
  isPlaying: boolean
  onPress: (item: IAudio) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onPress(item)}
      className={`mb-2 flex w-full items-center rounded-xl p-3 text-left transition-colors ${
        isCurrent ? 'bg-zinc-800' : 'bg-zinc-900 hover:bg-zinc-800/70'
      }`}
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ background: coverGradient(index) }}
      >
        <Music2 size={22} />
      </span>
      <span className="ml-4 min-w-0 flex-1">
        <span
          className={`block truncate text-base font-semibold ${
            isCurrent ? 'text-purple-400' : 'text-white'
          }`}
        >
          {item.titulo}
        </span>
      </span>
      {isCurrent && isPlaying ? (
        <Pause size={32} className="shrink-0 text-purple-500" />
      ) : (
        <Play size={32} className={isCurrent ? 'shrink-0 text-purple-500' : 'shrink-0 text-zinc-600'} />
      )}
    </button>
  )
}

function AudioScreen({ type, title }: { type: 'M' | 'P'; title: string }) {
  const navigate = useNavigate()
  const a = useAudioPlayer(type)
  const [feedback, setFeedback] = useState<string | null>(null)

  const Icon = type === 'P' ? Mic2 : Music2

  const handleShare = useCallback(async (audio: IAudio) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: audio.titulo, url: audio.audio_url })
      } else {
        await navigator.clipboard.writeText(audio.audio_url)
        setFeedback('Enlace copiado al portapapeles')
        setTimeout(() => setFeedback(null), 2000)
      }
    } catch {
      /* el usuario cancelÃ³ el share */
    }
  }, [])

  const coverIndex = a.currentAudio ? a.audios.findIndex((x) => x.id === a.currentAudio?.id) : 0

  return (
    <div className="pb-24">
      {a.error && (
        <Modal
          title="Error"
          description={a.error}
          type="error"
          onClose={{ action: () => a.setError(null), label: 'Cerrar' }}
        />
      )}

      {feedback && (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-full bg-zinc-800 px-4 py-2 text-sm text-white shadow-lg">
          {feedback}
        </div>
      )}

      {a.showPlayer && a.currentAudio ? (
        <div className="flex min-h-[75vh] flex-col px-6 pb-8 pt-8">
          <div className="mb-8 flex items-center justify-between">
            <button
              type="button"
              aria-label="Cerrar reproductor"
              onClick={a.handleClose}
              className="text-white"
            >
              <ChevronDown size={22} />
            </button>
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Reproduciendo
            </span>
            <span className="w-5" />
          </div>

          <div className="mb-8 flex justify-center">
            <div
              className="flex h-44 w-44 items-center justify-center rounded-full border-[10px] border-black/40 shadow-2xl"
              style={{ background: coverGradient(coverIndex) }}
            >
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full bg-black/30 ${
                  a.isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
                }`}
              >
                <Icon size={36} className="text-white/80" />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h1 className="truncate text-2xl font-bold text-white">{a.currentAudio.titulo}</h1>
            <p className="mt-1 text-base text-zinc-400">{type === 'M' ? 'Música' : 'Predicas'}</p>
          </div>

          <div className="mb-6">
            <input
              type="range"
              min={0}
              max={a.duration || 1}
              step={0.1}
              value={Math.min(a.position, a.duration || 0)}
              onChange={(e) => a.handleSeek(Number(e.target.value))}
              aria-label="Progreso del audio"
              className="w-full accent-white"
            />
            <div className="flex justify-between text-xs text-zinc-400">
              <span>{formatTime(a.position)}</span>
              <span>{formatTime(a.duration)}</span>
            </div>
          </div>

          <div className="mb-8 flex items-center justify-center gap-8">
            <button
              type="button"
              aria-label={a.isLiked ? 'Quitar me gusta' : 'Me gusta'}
              onClick={a.handleLike}
              className={a.isLiked ? 'text-green-500' : 'text-white'}
            >
              <Heart size={28} fill={a.isLiked ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              aria-label={a.isPlaying ? 'Pausar' : 'Reproducir'}
              onClick={() => void a.handlePlayPause()}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200"
            >
              {a.isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </button>
            <button
              type="button"
              aria-label="Compartir"
              onClick={() => void handleShare(a.currentAudio!)}
              className="text-white"
            >
              <Share2 size={26} />
            </button>
          </div>

          <div className="flex justify-center">
            <a
              href={a.currentAudio.audio_url}
              download={`${a.currentAudio.titulo}.mp3`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full bg-zinc-800 px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              <Download size={18} />
              Descargar Audio
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center px-4 py-3">
            <button
              type="button"
              aria-label="Volver"
              onClick={() => navigate(-1)}
              className="text-white"
            >
              <X size={20} />
            </button>
            <h1 className="ml-4 text-xl font-bold text-white">{title}</h1>
          </div>

          {a.audios.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
              <Icon size={64} className="text-purple-500" />
              <p className="mt-4 text-center text-lg text-zinc-500">
                No hay {title.toLowerCase()} disponibles
              </p>
            </div>
          ) : (
            <div className="px-4">
              {a.audios.map((item, index) => (
                <AudioItem
                  key={item.id}
                  item={item}
                  index={index}
                  isCurrent={a.currentId === item.id}
                  isPlaying={a.isPlaying}
                  onPress={(audio) => void a.handleSelectTrack(audio)}
                />
              ))}
            </div>
          )}

          {a.currentAudio && (
            <div className="fixed inset-x-0 bottom-16 z-20 flex items-center border-t border-zinc-800 bg-zinc-900 px-4 py-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ background: coverGradient(coverIndex) }}
              >
                <Music2 size={18} />
              </span>
              <button
                type="button"
                onClick={() => a.handleClose()}
                className="ml-3 min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm font-semibold text-white">
                  {a.currentAudio.titulo}
                </span>
                <span className="block text-xs text-zinc-500">{title}</span>
              </button>
              <button
                type="button"
                aria-label={a.isPlaying ? 'Pausar' : 'Reproducir'}
                onClick={() => void a.handlePlayPause()}
                className="ml-2 text-purple-500"
              >
                {a.isPlaying ? <Pause size={36} /> : <Play size={36} />}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function AudiosPage() {
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') === 'M' ? 'M' : 'P'
  return <AudioScreen type={type} title={type === 'M' ? 'Música' : 'Predicas'} />
}

export function MusicaPage() {
  return <AudioScreen type="M" title="Música" />
}
