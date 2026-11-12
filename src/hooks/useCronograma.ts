import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import {
  actualizarCronograma,
  crearCronograma,
  eliminarPosicionesPorCronograma,
  fetchCronogramas,
} from '../lib/api'
import type { CronogramaEntry } from '../lib/types'
import { parseCanciones } from '../lib/cronograma'

const MAX_POR_SEMANA = 2

function getSemanaRange(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const lunes = new Date(d.setDate(diff))
  lunes.setHours(0, 0, 0, 0)
  const domingo = new Date(lunes)
  domingo.setDate(domingo.getDate() + 6)
  domingo.setHours(23, 59, 59, 999)
  return { inicio: lunes, fin: domingo }
}

export function useCronograma(ministerioId: number) {
  const { usuario, ministerios } = useAuth()

  const esLiderDeEsteMinisterio = ministerios.some(
    (m) => Number(m.id) === ministerioId && m.es_lider,
  )

  const [selectedDate, setSelectedDate] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [canciones, setCanciones] = useState<string[]>([])
  const [inputCancion, setInputCancion] = useState('')
  const [mostrandoInput, setMostrandoInput] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cronogramas, setCronogramas] = useState<CronogramaEntry[]>([])
  const [cargandoLista, setCargandoLista] = useState(true)
  const [editandoCronograma, setEditandoCronograma] = useState<CronogramaEntry | null>(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState<CronogramaEntry | null>(null)
  const [reemplazoInfo, setReemplazoInfo] = useState<{
    visible: boolean
    reemplazado: CronogramaEntry | null
  }>({ visible: false, reemplazado: null })

  const cargarCronogramas = useCallback(async () => {
    if (!ministerioId) {
      setCargandoLista(false)
      return
    }
    setCargandoLista(true)
    const res = await fetchCronogramas(ministerioId)
    if (res.code === 200 && res.result) setCronogramas(res.result)
    setCargandoLista(false)
  }, [ministerioId])

  useEffect(() => {
    void cargarCronogramas()
  }, [cargarCronogramas])

  const abrirModalCrear = useCallback((dateStr: string) => {
    setSelectedDate(dateStr)
    setCanciones([])
    setInputCancion('')
    setMostrandoInput(false)
    setEditandoCronograma(null)
    setMostrarModal(true)
  }, [])

  const abrirModalEditar = useCallback((cronograma: CronogramaEntry) => {
    setSelectedDate(cronograma.fecha_evento)
    setCanciones(parseCanciones(cronograma.contenido))
    setInputCancion('')
    setMostrandoInput(false)
    setEditandoCronograma(cronograma)
    setMostrarModal(true)
  }, [])

  const ejecutarGuardar = useCallback(
    async (
      dateStr: string,
      songs: string[],
      cronogramaAReemplazar?: CronogramaEntry,
      cronogramaEditando?: CronogramaEntry | null,
    ) => {
      setGuardando(true)
      const contenido = JSON.stringify(songs.map((titulo) => ({ titulo })))
      const informante = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ') || ''
      let res
      if (cronogramaEditando && !cronogramaAReemplazar) {
        res = await actualizarCronograma(cronogramaEditando.id, informante, dateStr, contenido)
      } else if (cronogramaAReemplazar) {
        await eliminarPosicionesPorCronograma(cronogramaAReemplazar.id)
        res = await actualizarCronograma(cronogramaAReemplazar.id, informante, dateStr, contenido)
      } else {
        res = await crearCronograma(ministerioId, informante, dateStr, contenido)
      }
      setGuardando(false)
      if (res.code === 200) {
        setMostrarModal(false)
        setCanciones([])
        setEditandoCronograma(null)
        void cargarCronogramas()
      }
      return res
    },
    [ministerioId, usuario, cargarCronogramas],
  )

  const agregarCancion = useCallback(() => {
    const titulo = inputCancion.trim()
    if (!titulo) return
    setCanciones((prev) => [...prev, titulo])
    setInputCancion('')
    setMostrandoInput(false)
  }, [inputCancion])

  const quitarCancion = useCallback((index: number) => {
    setCanciones((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleGuardar = useCallback(async () => {
    if (canciones.length === 0) return { code: 400, msj: 'Agregá al menos una canción.' }

    if (editandoCronograma) {
      return ejecutarGuardar(
        editandoCronograma.fecha_evento,
        canciones,
        undefined,
        editandoCronograma,
      )
    }

    const fechaEvento = new Date(`${selectedDate}T00:00:00`)
    const { inicio, fin } = getSemanaRange(fechaEvento)
    const enMismaSemana = cronogramas.filter((c) => {
      const cDate = new Date(`${c.fecha_evento}T00:00:00`)
      return cDate >= inicio && cDate <= fin
    })

    if (enMismaSemana.length >= MAX_POR_SEMANA) {
      enMismaSemana.sort(
        (a, b) => new Date(a.fecha_evento).getTime() - new Date(b.fecha_evento).getTime(),
      )
      setReemplazoInfo({ visible: true, reemplazado: enMismaSemana[0] })
      return { code: 300, msj: '' }
    }

    return ejecutarGuardar(selectedDate, canciones)
  }, [canciones, selectedDate, cronogramas, editandoCronograma, ejecutarGuardar])

  return {
    esLiderDeEsteMinisterio,
    cronogramas,
    cargandoLista,
    selectedDate,
    mostrarModal,
    setMostrarModal,
    canciones,
    editandoCronograma,
    setEditandoCronograma,
    inputCancion,
    setInputCancion,
    mostrandoInput,
    setMostrandoInput,
    guardando,
    confirmarEliminar,
    setConfirmarEliminar,
    reemplazoInfo,
    setReemplazoInfo,
    abrirModalCrear,
    abrirModalEditar,
    agregarCancion,
    quitarCancion,
    handleGuardar,
    ejecutarGuardar,
    cargarCronogramas,
  }
}
