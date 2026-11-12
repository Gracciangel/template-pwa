import { useEffect, useState } from 'react'

interface TimeLeft {
  dias: number
  horas: number
  minutos: number
  segundos: number
}

function getNextSunday19(): Date {
  const now = new Date()
  const target = new Date(now)
  const day = now.getDay()

  let daysUntilSunday = (7 - day) % 7

  if (daysUntilSunday === 0) {
    const todayAt19 = new Date(now)
    todayAt19.setHours(19, 0, 0, 0)
    const todayAt21 = new Date(now)
    todayAt21.setHours(21, 0, 0, 0)

    if (now >= todayAt19 && now < todayAt21) return todayAt19
    if (now >= todayAt21) daysUntilSunday = 7
  }

  target.setDate(now.getDate() + daysUntilSunday)
  target.setHours(19, 0, 0, 0)
  return target
}

function calcTimeLeft(): TimeLeft {
  const diff = getNextSunday19().getTime() - new Date().getTime()
  if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0 }
  return {
    dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutos: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    segundos: Math.floor((diff % (1000 * 60)) / 1000),
  }
}

function UnitBox({ value, label, colorClass, glow }: { value: number; label: string; colorClass: string; glow?: string }) {
  return (
    <div className="flex min-w-[4.2rem] flex-col items-center rounded-xl bg-zinc-800/60 px-3 py-3">
      <span className={`text-4xl font-bold sm:text-5xl ${colorClass}`} style={glow ? { textShadow: glow } : undefined}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-xs text-zinc-400">{label}</span>
    </div>
  )
}

const GLOW_GREEN = '0 0 30px rgba(74, 222, 128, 0.9)'
const GLOW_YELLOW = '0 0 20px rgba(250, 204, 21, 0.6)'
const GLOW_RED = '0 0 20px rgba(248, 113, 113, 0.6)'

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft)

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(calcTimeLeft()), 1000)
    return () => clearInterval(interval)
  }, [])

  const totalMsToEvent = getNextSunday19().getTime() - new Date().getTime()
  const totalHoursToEvent = totalMsToEvent / (1000 * 60 * 60)

  let colorClass = 'text-white'
  let glow: string | undefined
  let label = 'Nos vemos de nuevo en :'

  if (totalMsToEvent <= 0) {
    colorClass = 'text-green-400'
    glow = GLOW_GREEN
    label = 'Estamos en culto :'
  } else if (totalHoursToEvent < 3) {
    colorClass = 'text-red-400'
    glow = GLOW_RED
  } else if (totalHoursToEvent < 5) {
    colorClass = 'text-yellow-400'
    glow = GLOW_YELLOW
  }

  return (
    <div className="mt-3 flex flex-col items-center py-6">
      <p className="mb-4 text-xl text-zinc-200">{label}</p>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        <UnitBox value={timeLeft.dias} label="días" colorClass={colorClass} glow={glow} />
        <UnitBox value={timeLeft.horas} label="horas" colorClass={colorClass} glow={glow} />
        <UnitBox value={timeLeft.minutos} label="minutos" colorClass={colorClass} glow={glow} />
        <UnitBox value={timeLeft.segundos} label="segundos" colorClass={colorClass} glow={glow} />
      </div>
    </div>
  )
}
