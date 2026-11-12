export interface IResponse<T = unknown> {
  msj: string
  code: number
  title: string
  result?: T
}

export interface IUser {
  id: string
  nombre: string
  apellido: string
  nombre_usuario: string
  email: string
  role_id: number
  avatar_url: string | null
}

export interface IAuth {
  email: string
  pass: string
}

export interface IRegisterForm extends IAuth {
  nombre: string
  apellido: string
  nombre_usuario: string
  role?: number
}

export interface IMinisterio {
  id: string
  nombre: string
  descripcion?: string
  created_at?: string
  es_lider?: boolean
  activo?: boolean
}

export interface IGrupo {
  id: string
  nombre: string
  descripcion?: string
  ministerio_id?: string
  created_at?: string
  es_lider?: boolean
  activo?: boolean
}

export interface ICancion {
  id: number
  titulo: string
  autor: string
  tono_original: string
  contenido: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface IEntidadesUsuario {
  ministerios: IMinisterio[]
  grupos: IGrupo[]
}

export interface INoticia {
  id: number
  titulo: string
  descripcion?: string
  contenido?: string
  imagen_url?: string | null
  created_at: string
  activo?: boolean
}

export interface IEvento {
  id: number
  nombre_evento?: string
  descripcion?: string
  fecha_evento: string
  hora_evento?: string
  lugar?: string
  precio_evento?: number
  imagen_url?: string | null
  activo?: boolean
}

export interface IAudio {
  id: number
  created_at: string
  titulo: string
  audio_url: string
  type: 'M' | 'P'
}

export type CronogramaEntry = {
  id: number
  created_at: string
  informante: string
  fecha_evento: string
  nombre_evento: string | null
  contenido: string
  ministerio_id: number | null
  grupo_id?: number | null
  observaciones?: string | null
}

export type MiembroGrupo = {
  id: string
  nombre: string
  apellido: string
  avatar_url: string | null
  role_id?: number
  role?: string
}

export type PaginationParams = {
  page?: number
  pageSize?: number
}
