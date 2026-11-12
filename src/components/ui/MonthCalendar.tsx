import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DIAS, MESES } from '../../lib/cronograma'

/** Calendario mensual simple para elegir fechas (reemplaza react-native-calendar-picker). */
export function MonthCalendar({
  onSelect,
  minDate,
  className = '',
}: {
  onSelect: (fecha: Date) => void
  minDate?: Date
  className?: string
}) {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())

  const primerDia = new Date(anio, mes, 1)
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const offset = primerDia.getDay()

  const celdas: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)]

  const mover = (delta: number) => {
    const d = new Date(anio, mes + delta, 1)
    setMes(d.getMonth())
    setAnio(d.getFullYear())
  }

  const esPasado = (dia: number) => {
    if (!minDate) return false
    const fecha = new Date(anio, mes, dia)
    fecha.setHours(0, 0, 0, 0)
    const min = new Date(minDate)
    min.setHours(0, 0, 0, 0)
    return fecha <= min
  }

  return (
    <div className={`rounded-xl bg-zinc-900 p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" aria-label="Mes anterior" onClick={() => mover(-1)} className="rounded-full p-2 text-white hover:bg-zinc-800">
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-white">
          {MESES[mes]} {anio}
        </span>
        <button type="button" aria-label="Mes siguiente" onClick={() => mover(1)} className="rounded-full p-2 text-white hover:bg-zinc-800">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {DIAS.map((d) => (
          <span key={d} className="py-1 text-center text-xs text-zinc-500">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celdas.map((dia, i) =>
          dia === null ? (
            <span key={`v-${i}`} />
          ) : (
            <button
              key={dia}
              type="button"
              disabled={esPasado(dia)}
              onClick={() => onSelect(new Date(anio, mes, dia))}
              className="rounded-lg py-2 text-center text-sm text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:text-zinc-700 disabled:hover:bg-transparent"
            >
              {dia}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
