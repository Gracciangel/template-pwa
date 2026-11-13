import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAudios } from '../lib/api'
import type { IAudio } from '../lib/types'

export function useAudioPlayer(type: 'M' | 'P') {
  const [audios, setAudios] = useState<IAudio[]>([])
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    void fetchAudios(type).then(setAudios)

    return () => {
      const el = audioRef.current
      if (el) {
        el.pause()
        el.src = ''
        audioRef.current = null
      }
    }
  }, [type])

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current

    const el = new Audio()
    el.preload = 'metadata'
    el.addEventListener('timeupdate', () => setPosition(el.currentTime))
    el.addEventListener('loadedmetadata', () => setDuration(Number.isFinite(el.duration) ? el.duration : 0))
    el.addEventListener('durationchange', () => setDuration(Number.isFinite(el.duration) ? el.duration : 0))
    el.addEventListener('play', () => setIsPlaying(true))
    el.addEventListener('pause', () => setIsPlaying(false))
    el.addEventListener('ended', () => setIsPlaying(false))
    el.addEventListener('error', () =>
      setError('Error al reproducir el audio. Verificá que el bucket sea público en Supabase.'),
    )
    audioRef.current = el
    return el
  }, [])

  const handleSelectTrack = useCallback(
    async (audio: IAudio) => {
      const el = ensureAudio()
      el.pause()
      el.src = audio.audio_url
      el.currentTime = 0
      setCurrentId(audio.id)
      setPosition(0)
      setDuration(0)
      setIsLiked(false)
      setError(null)
      setShowPlayer(true)
      try {
        await el.play()
      } catch {
        setError('No se pudo iniciar la reproducción. Tocá play para reintentar.')
      }
    },
    [ensureAudio],
  )

  const handlePlayPause = useCallback(async () => {
    const el = audioRef.current
    if (!el) return
    try {
      if (el.paused) await el.play()
      else el.pause()
    } catch {
      setError('No se pudo reproducir el audio.')
    }
  }, [])

  const handleSeek = useCallback((segundos: number) => {
    const el = audioRef.current
    if (!el) return
    el.currentTime = segundos
    setPosition(segundos)
  }, [])

  const handleClose = useCallback(() => setShowPlayer(false), [])
  const handleLike = useCallback(() => setIsLiked((prev) => !prev), [])

  const currentAudio = audios.find((audio) => audio.id === currentId)

  return {
    audios,
    currentId,
    isPlaying,
    position,
    duration,
    isLiked,
    showPlayer,
    error,
    setError,
    currentAudio,
    handleSelectTrack,
    handlePlayPause,
    handleSeek,
    handleClose,
    handleLike,
  }
}
