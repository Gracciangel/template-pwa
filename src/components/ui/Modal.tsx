import { useEffect, type ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, type LucideIcon } from 'lucide-react'

type ModalType = 'info' | 'warning' | 'error' | 'success'

interface Action {
  label: string
  action: () => void
  destructive?: boolean
}

interface ModalProps {
  title: string
  description?: string
  children?: ReactNode
  type?: ModalType
  onClose?: Action
  onConfirm?: Action
  wide?: boolean
  visible?: boolean
  dismissible?: boolean
}

const TYPE_COLOR: Record<ModalType, string> = {
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  success: 'text-green-500',
}

const TYPE_ICON: Record<ModalType, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle2,
}

export function Modal({
  title,
  description,
  children,
  type = 'info',
  onClose,
  onConfirm,
  wide = false,
  visible = true,
  dismissible = true,
}: ModalProps) {
  useEffect(() => {
    if (!visible || !dismissible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (onClose?.action ?? onConfirm?.action)?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, dismissible, onClose, onConfirm])

  if (!visible) return null

  const Icon = TYPE_ICON[type]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) (onClose?.action ?? onConfirm?.action)?.()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-fade-in max-h-[85%] w-full overflow-y-auto rounded-2xl bg-zinc-900 p-6 ${
          wide ? 'max-w-lg' : 'max-w-sm'
        }`}
      >
        <div className="relative mb-2 flex items-center justify-center gap-2 pr-6">
          <Icon size={22} className={TYPE_COLOR[type]} />
          <h2 className="text-center text-lg font-bold text-white">{title}</h2>
          {dismissible && (onClose || onConfirm) && (
            <button
              type="button"
              aria-label="Cerrar"
              onClick={(onClose ?? onConfirm)?.action}
              className="absolute -right-1 -top-1 rounded-full p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {children ?? <p className="mt-2 text-center text-zinc-400">{description}</p>}

        {(onClose || onConfirm) && (
          <div className="mt-5 flex gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose.action}
                className={`flex-1 rounded-lg px-4 py-3 font-semibold text-white ${
                  onConfirm || onClose.destructive ? 'bg-red-600' : 'bg-blue-600'
                }`}
              >
                {onClose.label}
              </button>
            )}
            {onConfirm && (
              <button
                type="button"
                onClick={onConfirm.action}
                className={`flex-1 rounded-lg px-4 py-3 font-semibold text-white ${
                  onClose ? 'bg-green-600' : onConfirm.destructive ? 'bg-red-600' : 'bg-blue-600'
                }`}
              >
                {onConfirm.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
