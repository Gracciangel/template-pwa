import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Modal } from '../components/ui/Modal'

function FacebookIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
    </svg>
  )
}

function InstagramIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none" />
    </svg>
  )
}

function YouTubeIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z" />
    </svg>
  )
}

function WhatsAppIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.6-1.2.1-.2 0-.4 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-.9 1.6-.6 2.7.5 1.6 1.6 3 3.2 4 2 1.3 3.3 1.4 4.3 1.2.6-.1 1.5-.6 1.7-1.3.2-.6.2-1.2.1-1.3-.1-.2-.3-.3-.5-.4z" />
    </svg>
  )
}

function TikTokIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M16.6 5.8a5.6 5.6 0 0 1-1.2-3.3h-3.2v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.1a5.8 5.8 0 1 0 5 5.7V8.9a8.7 8.7 0 0 0 5 1.6V7.3a5.6 5.6 0 0 1-3.8-1.5z" />
    </svg>
  )
}

const socialLinks = [
  { name: 'Facebook', icon: FacebookIcon, color: '#1877F2', url: '' },
  { name: 'Instagram', icon: InstagramIcon, color: '#E4405F', url: '' },
  { name: 'YouTube', icon: YouTubeIcon, color: '#FF0000', url: '' },
  { name: 'WhatsApp', icon: WhatsAppIcon, color: '#25D366', url: '' },
  { name: 'TikTok', icon: TikTokIcon, color: '#ffffff', url: '' },
]

export function SocialPage() {
  const [showModal, setShowModal] = useState(false)
  const [social, setSocial] = useState('')

  return (
    <div className="px-6 pb-8 pt-12">
      <h1 className="mb-2 text-2xl font-bold text-white">Redes Sociales</h1>
      <p className="mb-8 text-zinc-400">Seguinos en nuestras redes</p>

      <div className="flex flex-col gap-4">
        {socialLinks.map(({ name, icon: Icon, color, url }) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              if (url) window.open(url, '_blank', 'noopener')
              else {
                setSocial(name)
                setShowModal(true)
              }
            }}
            className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-left transition-colors hover:bg-zinc-800"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
              <Icon color={color} />
            </span>
            <span className="ml-4 flex-1 text-base font-semibold text-white">{name}</span>
            <ChevronRight size={20} className="text-zinc-500" />
          </button>
        ))}
      </div>

      {showModal && (
        <Modal
          type="info"
          title="Próximamente"
          description={`Próximamente estará disponible el enlace a ${social}.`}
          onClose={{ action: () => setShowModal(false), label: 'Cerrar' }}
        />
      )}
    </div>
  )
}
