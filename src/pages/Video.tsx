import { Video } from 'lucide-react'

export function VideoPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
      <Video size={64} className="mb-3 text-red-500" />
      <h1 className="text-2xl font-bold text-white">Próximamente</h1>
    </div>
  )
}
