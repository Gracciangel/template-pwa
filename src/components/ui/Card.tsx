import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type Variant = 'default' | 'grupo'

interface CardProps {
  icon?: LucideIcon
  label: string
  onClick?: () => void
  variant?: Variant
  children?: ReactNode
}

const BG: Record<Variant, string> = {
  default: 'bg-purple-600/80 hover:bg-purple-600',
  grupo: 'bg-teal-600/60 hover:bg-teal-600/80',
}

export function Card({ icon: Icon, label, onClick, variant = 'default', children }: CardProps) {
  const content = (
    <div
      className={`flex w-full flex-row items-center justify-center gap-6 rounded-2xl border border-zinc-700/50 px-5 py-4 text-left ${BG[variant]}`}
    >
      {Icon && <Icon size={32} className="shrink-0 text-white" />}
      {children ?? <span className="text-xl font-bold leading-snug text-white">{label}</span>}
    </div>
  )

  if (!onClick) return content
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  )
}
