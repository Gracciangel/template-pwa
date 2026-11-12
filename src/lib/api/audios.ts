import type { IAudio } from '../types'
import { supabase } from '../supabase'

export async function fetchAudios(type?: 'M' | 'P'): Promise<IAudio[]> {
  let query = supabase.from('audios').select('*')
  if (type) query = query.eq('type', type)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) {
    console.error('[audios] error:', error.message)
    return []
  }

  return (data as IAudio[]).map((audio) => ({
    ...audio,
    audio_url: supabase.storage.from('audios').getPublicUrl(audio.audio_url).data.publicUrl,
  }))
}
